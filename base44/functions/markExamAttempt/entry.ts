import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Normalise an answer for short-answer comparison: trim, lowercase, strip
// punctuation, collapse whitespace.
function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortAnswerCorrect(answer, correct) {
  const a = normalize(answer);
  const c = normalize(correct);
  if (!a || !c) return false;
  if (a === c) return true;
  // Whole-word containment: correct answer appears as a discrete word/phrase.
  const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`, "i").test(a);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const deckId = body?.deck_id;
    const answers = Array.isArray(body?.answers) ? body.answers : [];
    if (!deckId) return Response.json({ error: 'deck_id is required' }, { status: 400 });
    if (!answers.length) return Response.json({ error: 'answers are required' }, { status: 400 });

    const questionIds = answers.map((a) => a.question_id).filter(Boolean);
    // Load the referenced questions via service role so marking is reliable
    // regardless of read rules; scope tightly by deck + ids.
    const fetched = await base44.asServiceRole.entities.ExamQuestion.filter(
      { deck_id: deckId, id: { $in: questionIds } },
      "order",
      100
    );
    const list = Array.isArray(fetched) ? fetched : (fetched?.items || []);
    const byId = new Map(list.map((q) => [q.id, q]));

    // Mark objective questions in code — no AI.
    const results = answers.map((a) => {
      const q = byId.get(a.question_id);
      if (!q) return null;
      const answerText = String(a.answer_text || "").trim();
      let awarded = 0;
      if (q.question_type === "multiple_choice") {
        if (answerText && answerText === q.correct_answer) awarded = q.marks || 1;
      } else if (q.question_type === "short_answer") {
        if (shortAnswerCorrect(answerText, q.correct_answer)) awarded = q.marks || 1;
      }
      return {
        question_id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer || "",
        mark_scheme: q.mark_scheme || "",
        marks: q.marks,
        answer_text: answerText,
        awarded_marks: awarded,
        max_marks: q.marks,
        feedback: "",
      };
    }).filter(Boolean);

    // Batch ALL extended questions in this attempt into a single LLM call.
    const extendedIndexes = results
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.question_type === "extended")
      .map(({ idx }) => idx);

    let aiMarked = false;
    if (extendedIndexes.length) {
      const prompt = `You are an experienced UK exam marker marking extended-response practice questions.
Mark each answer strictly against its mark scheme. Award credit only where the student's answer hits a mark-scheme point. For each answer return "awarded_marks" (an integer from 0 up to the question's marks) and "feedback" (2 or 3 sentences pointing at which mark-scheme points were and were not hit, and how to improve).

Return one result per answer, in the order given, in the "results" array.

Answers to mark:
${extendedIndexes.map((idx, i) => `--- Answer ${i + 1} ---
Question (worth ${results[idx].marks} marks): ${results[idx].question_text}
Mark scheme:
${results[idx].mark_scheme}
Student's answer:
${results[idx].answer_text || "(no answer provided)"}`).join("\n\n")}`;

      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  awarded_marks: { type: "number" },
                  feedback: { type: "string" },
                },
                required: ["awarded_marks", "feedback"],
              },
            },
          },
          required: ["results"],
        },
      });

      const llmResults = llm?.results || [];
      extendedIndexes.forEach((idx, i) => {
        const lr = llmResults[i] || {};
        const cap = results[idx].marks;
        let awarded = Math.round(Number(lr.awarded_marks) || 0);
        if (awarded < 0) awarded = 0;
        if (awarded > cap) awarded = cap;
        results[idx].awarded_marks = awarded;
        results[idx].feedback = (lr.feedback || "").trim() || "No feedback was returned for this answer.";
      });
      aiMarked = true;
    }

    const score = results.reduce((s, r) => s + (r.awarded_marks || 0), 0);
    const totalMarks = results.reduce((s, r) => s + (r.max_marks || 0), 0);

    const attempt = await base44.entities.ExamAttempt.create({
      deck_id: deckId,
      answers: results.map((r) => ({
        question_id: r.question_id,
        answer_text: r.answer_text,
        awarded_marks: r.awarded_marks,
        max_marks: r.max_marks,
        feedback: r.feedback,
      })),
      score,
      total_marks: totalMarks,
      completed_date: new Date().toISOString().slice(0, 10),
      ai_marked: aiMarked,
    });

    return Response.json({
      attempt_id: attempt.id,
      score,
      total_marks: totalMarks,
      questions: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}