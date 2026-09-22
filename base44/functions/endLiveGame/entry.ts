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
    if (game.host_user_id !== user.id) return Response.json({ error: 'Only the host can end the game' }, { status: 403 });

    await base44.asServiceRole.entities.LiveGame.update(game_id, { status: 'ended' });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}