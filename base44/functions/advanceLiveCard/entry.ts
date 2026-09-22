import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const game_id = (body?.game_id || '').toString();
    const game = await base44.asServiceRole.entities.LiveGame.get(game_id).catch(() => null);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.host_user_id !== user.id) return Response.json({ error: 'Only the host can advance' }, { status: 403 });
    if (game.status !== 'in_progress') return Response.json({ error: 'Game not in progress' }, { status: 400 });
    if (game.mode !== 'race') return Response.json({ error: 'Advancing cards is for race mode' }, { status: 400 });

    const nextRound = (game.current_round || 0) + 1;
    if (nextRound >= game.card_order.length) {
      await base44.asServiceRole.entities.LiveGame.update(game_id, { status: 'ended' });
      return Response.json({ ok: true, ended: true });
    }

    const nextCardId = game.card_order[nextRound];
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.LiveGame.update(game_id, {
      current_round: nextRound,
      current_card_id: nextCardId,
      card_started_at: now
    });

    return Response.json({ ok: true, ended: false, current_round: nextRound, total_rounds: game.card_order.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}