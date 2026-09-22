import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { shuffle } from '../../shared/liveGame.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const game_id = (body?.game_id || '').toString();
    const game = await base44.asServiceRole.entities.LiveGame.get(game_id).catch(() => null);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.host_user_id !== user.id) return Response.json({ error: 'Only the host can start the game' }, { status: 403 });
    if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });

    const players = await base44.asServiceRole.entities.LivePlayer.filter({ game_id }, undefined, 200);
    if (!players.length) return Response.json({ error: 'No players have joined yet' }, { status: 400 });

    const cards = await base44.asServiceRole.entities.Card.filter({ deck_id: game.deck_id }, 'order', 200);
    if (!cards.length) return Response.json({ error: 'This deck has no cards' }, { status: 400 });
    const card_order = shuffle(cards.map(c => c.id));
    const total = card_order.length;
    const now = new Date().toISOString();

    if (game.mode === 'team') {
      // Auto-split into 2 balanced teams (Quizlet-Live style).
      const order = shuffle(players);
      await Promise.all(order.map((p, i) =>
        base44.asServiceRole.entities.LivePlayer.update(p.id, {
          team_number: (i % 2) + 1,
          current_index: 0,
          current_card_started_at: now
        })
      ));
    }

    await base44.asServiceRole.entities.LiveGame.update(game_id, {
      status: 'in_progress',
      card_order,
      current_card_id: card_order[0] || '',
      current_round: 0,
      started_at: now,
      card_started_at: now,
      winning_team: 0
    });

    return Response.json({ ok: true, total_rounds: total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}