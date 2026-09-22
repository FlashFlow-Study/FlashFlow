import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const join_code = (body?.join_code || '').toString().trim().toUpperCase();
    const display_name = (body?.display_name || '').toString().trim();
    if (!join_code) return Response.json({ error: 'Enter a join code' }, { status: 400 });
    if (!display_name) return Response.json({ error: 'Enter a display name' }, { status: 400 });
    if (display_name.length > 30) return Response.json({ error: 'Display name must be 30 characters or fewer' }, { status: 400 });

    const games = await base44.asServiceRole.entities.LiveGame.filter({ join_code }, undefined, 10);
    const game = games.find(g => g.status !== 'ended');
    if (!game) return Response.json({ error: 'No active game with that code' }, { status: 404 });
    if (game.status !== 'lobby') return Response.json({ error: 'That game has already started' }, { status: 400 });

    const players = await base44.asServiceRole.entities.LivePlayer.filter({ game_id: game.id }, undefined, 100);
    if (players.some(p => p.display_name.toLowerCase() === display_name.toLowerCase())) {
      return Response.json({ error: 'That name is taken in this game — pick another' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const player = await base44.asServiceRole.entities.LivePlayer.create({
      game_id: game.id,
      display_name,
      team_number: 0,
      score: 0,
      cards_answered: 0,
      cards_correct: 0,
      joined_at: now,
      last_seen: now,
      current_index: 0,
      current_card_started_at: ''
    });

    return Response.json({ game_id: game.id, player_id: player.id, join_code, mode: game.mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}