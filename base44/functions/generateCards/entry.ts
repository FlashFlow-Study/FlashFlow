import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const notes = (body?.notes || '').trim();
    const title = (body?.title || '').trim();
    const count = Math.min(Math.max(parseInt(body?.count) || 12, 1), 30);

    if (notes.length < 10) {
      return Response.json({ error: 'Please provide at least a few sentences of study notes.' }, { status: 400 });
    }

    const prompt = `You are a study assistant that turns study notes into flashcards.
Based on the notes below, generate up to ${count} concise flashcards as a JSON array.
Each flashcard is an object with "front" (a clear term, question, or prompt) and "back" (a short, accurate definition or answer, max ~25 words).
Topic/title for context: ${title || 'unspecified'}.

Return ONLY a JSON array, no commentary. Example: [{"front":"Mitochondria","back":"The powerhouse of the cell, producing ATP energy."}]

Study notes:
"""
${notes.slice(0, 4000)}
"""`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" }
              },
              required: ["front", "back"]
            }
          }
        },
        required: ["cards"]
      }
    });

    const cards = (result?.cards || []).filter((c) => c.front && c.back).slice(0, count);
    return Response.json({ cards });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}