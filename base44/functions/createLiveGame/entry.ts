import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { genCode } from '../../shared/liveGame.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to host a game' }, { status: 401 });

    const body = await req.json();
    const deck_id = (body?.deck_id || '').toString().trim();
    const mode = (body?.mode || '').toString();
    if (!deck_id) return Response.json({ error: 'Pick a deck' }, { status: 400 });
    if (mode !== 'race' && mode !== 'team') return Response.json({ error: 'Pick a game mode' }, { status: 400 });

    const deck = await base44.asServiceRole.entities.Deck.get(deck_id).catch(() => null);
    if (!deck) return Response.json({ error: 'Deck not found' }, { status: 404 });

    let join_code = '';
    for (let i = 0; i < 12; i++) {
      const candidate = genCode(5);
      const existing = await base44.asServiceRole.entities.LiveGame.filter({ join_code: candidate }, undefined, 20);
      if (!existing.some(g => g.status !== 'ended')) {
        join_code = candidate;
        break;
      }
    }
    if (!join_code) return Response.json({ error: 'Could not generate a unique code, try again' }, { status: 500 });

    const game = await base44.asServiceRole.entities.LiveGame.create({
      deck_id,
      deck_title: deck.title || '',
      join_code,
      mode,
      status: 'lobby',
      host_user_id: user.id,
      current_card_id: '',
      current_round: 0,
      card_order: [],
      started_at: '',
      card_started_at: '',
      winning_team: 0
    });

    return Response.json({ game_id: game.id, join_code, mode, deck_title: deck.title || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}