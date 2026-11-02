import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const deckId = body?.deck_id;
    const count = Math.min(Math.max(parseInt(body?.count) || 10, 1), 15);
    if (!deckId) return Response.json({ error: 'deck_id is required' }, { status: 400 });

    // Only the deck owner may generate questions for it.
    const deck = await base44.entities.Deck.get(deckId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!deck) return Response.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.created_by_id !== user.id) {
      return Response.json({ error: 'Only the deck owner can generate exam questions' }, { status: 403 });
    }

    // Read up to 40 cards with the service role so it works regardless of card
    // read rules. Only card text is sent to the LLM — never names, emails or ids.
    const fetched = await base44.asServiceRole.entities.Card.filter({ deck_id: deckId }, "order", 40);
    const cards = Array.isArray(fetched) ? fetched : (fetched?.items || []);
    if (!cards.length) {
      return Response.json({ error: 'This deck has no cards to build questions from.' }, { status: 400 });
    }

    const cardContent = cards
      .map((c) => `Term: ${c.front}\nDefinition: ${c.back}`)
      .join("\n\n")
      .slice(0, 6000);

    const extendedCount = count >= 12 ? 2 : 1;
    const objectiveCount = count - extendedCount;

    const prompt = `You are an experienced UK exam writer creating original practice questions in the style of GCSE and A-level past papers.
Using ONLY the study material below, write ${count} exam-style questions. Do NOT copy real past-paper questions — write fresh ones derived from this material.

Requirements:
- ${objectiveCount} objective questions, split between "multiple_choice" (exactly 4 options, one correct) and "short_answer" (a concise correct_answer a student could type).
- ${extendedCount} "extended" response questions, each worth between 4 and 6 marks, each with a "mark_scheme" listing the distinct points a marker awards marks for (one short line per point).
- For multiple_choice, "correct_answer" must exactly equal one of the strings in "options".
- Base every question on the study material; do not introduce facts not supported by it.
- "question_text" should be a clear, exam-style question.

Study material:
"""
${cardContent}
"""`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_type: { type: "string", enum: ["multiple_choice", "short_answer", "extended"] },
                question_text: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_answer: { type: "string" },
                mark_scheme: { type: "string" },
                marks: { type: "number" }
              },
              required: ["question_type", "question_text", "marks"]
            }
          }
        },
        required: ["questions"]
      }
    });

    const cleaned = (result?.questions || [])
      .filter((q) => q.question_text)
      .slice(0, count)
      .map((q, i) => {
        const type = q.question_type === "extended" ? "extended" : (q.question_type === "short_answer" ? "short_answer" : "multiple_choice");
        let marks = Number(q.marks);
        if (type === "extended") {
          if (!marks || marks < 4) marks = 5;
          if (marks > 6) marks = 6;
        } else {
          marks = 1;
        }
        const options = type === "multiple_choice"
          ? (Array.isArray(q.options) ? q.options : []).filter(Boolean).slice(0, 4)
          : undefined;
        let correct = q.correct_answer || "";
        if (type === "multiple_choice" && options && options.length && !options.includes(correct)) {
          correct = options[0];
        }
        return {
          question_type: type,
          question_text: q.question_text,
          options,
          correct_answer: type === "extended" ? "" : correct,
          mark_scheme: type === "extended" ? (q.mark_scheme || "") : "",
          marks,
          order: i,
        };
      });

    if (!cleaned.length) {
      return Response.json({ error: 'Could not generate questions from this deck. Try again.' }, { status: 500 });
    }

    // Create the records (user-scoped so created_by_id is the owner) and
    // backfill the denormalised deck visibility fields so read rules mirror
    // the Card entity.
    const created = await base44.entities.ExamQuestion.bulkCreate(
      cleaned.map((q) => ({
        deck_id: deckId,
        ...q,
        deck_is_public: !!deck.is_public,
        deck_classroom_members: Array.isArray(deck.classroom_members) ? deck.classroom_members : [],
      }))
    );

    return Response.json({ questions: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}