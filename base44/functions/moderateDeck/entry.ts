import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Number of pending/upheld moderation flags on a user's decks that triggers
// an automatic account suspension pending admin review.
const AUTO_SUSPEND_THRESHOLD = 3;

// Content moderation gate for decks going public/unlisted. Scans the deck's
// title, description, all card fronts/backs, and any attached card images
// (term + definition photos) via InvokeLLM for inappropriate material and
// copyrighted content. If flagged, records a ModerationFlag (admin-only
// entity, written through the service role so users can't tamper) and, when
// the user accumulates enough flags, auto-suspends their account pending
// review by creating a Ban with status "pending_review".
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const deckId = body?.deck_id;
    if (!deckId) return Response.json({ error: 'deck_id required' }, { status: 400 });

    // Load the deck (user-scoped enforces ownership/visibility), then verify
    // the caller actually owns it before scanning — only the owner triggers
    // a publish, and we don't want to scan on behalf of other users.
    const deck = await base44.entities.Deck.get(deckId);
    if (!deck) return Response.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.created_by_id !== user.id) {
      return Response.json({ error: 'Only the deck owner can request moderation' }, { status: 403 });
    }

    const cards = await base44.entities.Card.filter({ deck_id: deckId }, 'order', 200);

    // Assemble the text content for the model.
    const lines: string[] = [];
    lines.push(`TITLE: ${deck.title || ''}`);
    if (deck.description) lines.push(`DESCRIPTION: ${deck.description}`);
    cards.forEach((c: any, i: number) => {
      lines.push(`CARD ${i + 1} FRONT (term): ${c.front || ''}`);
      lines.push(`CARD ${i + 1} BACK (definition): ${c.back || ''}`);
    });
    const content = lines.join('\n');

    // Collect image URLs from card media so the vision-capable model can scan
    // the photos too.
    const imageUrls: string[] = [];
    cards.forEach((c: any) => {
      if (c.term_image_url) imageUrls.push(c.term_image_url);
      if (c.definition_image_url) imageUrls.push(c.definition_image_url);
    });

    const prompt = `You are a content moderation system for FlashFlow, a flashcard study app used by students and teachers. A user is about to publish a deck publicly. Review the deck content below for policy violations.

Flag ONLY for:
1. INAPPROPRIATE MATERIAL — sexual or explicit content, graphic violence or gore, hate speech or slurs, harassment or bullying of real people, promotion of illegal drugs or weapons, or other content unsuitable for a general educational audience.
2. COPYRIGHTED MATERIAL — verbatim reproduction of substantial copyrighted text (book chapters, song lyrics, movie/TV scripts, full articles), pirated material, or trade secrets.

Do NOT flag: ordinary educational vocabulary, facts, definitions, user-authored summaries, short quotations used for study, common knowledge, or public-domain material.

Deck content:
${content}

Return a strict verdict. If the content is acceptable, set flagged=false and category="none". If flagged, name the single most relevant category and explain concisely (one sentence) which part of the content triggered it.`;

    const svc = base44.asServiceRole;
    const result: any = await svc.integrations.Core.InvokeLLM({
      prompt,
      file_urls: imageUrls.length ? imageUrls : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          flagged: { type: 'boolean' },
          category: { type: 'string', enum: ['inappropriate', 'copyright', 'none'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          reason: { type: 'string' }
        },
        required: ['flagged', 'category', 'severity', 'reason']
      },
    });

    const verdict = result || {};
    const flagged = !!verdict.flagged;
    const category = verdict.category && verdict.category !== 'none' ? verdict.category : null;

    if (!flagged || !category) {
      return Response.json({ flagged: false, deck_id: deckId });
    }

    // Record the flag via the service role (ModerationFlag is admin-only, so
    // a user-scoped create would be rejected by RLS).
    await svc.entities.ModerationFlag.create({
      deck_id: deckId,
      deck_title: deck.title || '',
      user_id: user.id,
      category,
      severity: verdict.severity || 'medium',
      reason: verdict.reason || '',
      status: 'pending',
      scanned_at: new Date().toISOString(),
      image_urls: imageUrls,
    });

    // Auto-suspend if the user has accumulated too many pending flags. Only
    // suspend if there isn't already a ban (pending or final) on the account.
    const userFlags = await svc.entities.ModerationFlag.filter({ user_id: user.id, status: 'pending' });
    const pendingCount = userFlags.length;
    const existingBans = await svc.entities.Ban.filter({ user_id: user.id });
    let suspended = false;
    if (pendingCount >= AUTO_SUSPEND_THRESHOLD && existingBans.length === 0) {
      await svc.entities.Ban.create({
        user_id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        reason: `Auto-suspended pending review: ${pendingCount} content moderation flags on your decks.`,
        banned_date: new Date().toISOString(),
        status: 'pending_review',
        flag_count: pendingCount,
        source: 'auto_moderation',
      });
      suspended = true;
    }

    return Response.json({
      flagged: true,
      category,
      severity: verdict.severity || 'medium',
      reason: verdict.reason || '',
      suspended,
      pendingCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}