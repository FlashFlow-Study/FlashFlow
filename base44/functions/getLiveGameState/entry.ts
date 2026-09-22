import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const game_id = (body?.game_id || '').toString();
    const player_id = (body?.player_id || '').toString();
    if (!game_id) return Response.json({ error: 'game_id required' }, { status: 400 });

    const game = await base44.asServiceRole.entities.LiveGame.get(game_id).catch(() => null);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });

    const players = await base44.asServiceRole.entities.LivePlayer.filter({ game_id }, 'joined_at', 200);
    const cards = game.card_order.length
      ? await base44.asServiceRole.entities.Card.filter({ deck_id: game.deck_id }, 'order', 200)
      : [];
    const cardMap = {};
    cards.forEach(c => { cardMap[c.id] = c; });
    const totalRounds = game.card_order.length;

    // The requesting player's current card (and whether they already answered it).
    let myCard = null;
    let alreadyAnswered = false;
    if (game.status === 'in_progress' && player_id) {
      const me = players.find(p => p.id === player_id);
      if (me) {
        const myCardId = game.mode === 'race' ? game.current_card_id : (game.card_order[me.current_index] || '');
        if (myCardId) {
          myCard = cardMap[myCardId] || null;
          const ans = await base44.asServiceRole.entities.LiveAnswer.filter({ game_id, player_id, card_id: myCardId }, undefined, 5);
          alreadyAnswered = ans.length > 0;
        }
      }
    }

    // Host projector current card (race mode).
    let hostCard = null;
    if (game.status === 'in_progress' && game.mode === 'race' && game.current_card_id) {
      hostCard = cardMap[game.current_card_id] || null;
    }

    // Team aggregation (team mode).
    const teams = {};
    players.forEach(p => {
      const t = p.team_number || 0;
      if (!teams[t]) teams[t] = { team_number: t, score: 0, correct: 0, answered: 0, members: 0 };
      teams[t].score += p.score || 0;
      teams[t].correct += p.cards_correct || 0;
      teams[t].answered += p.cards_answered || 0;
      teams[t].members += 1;
    });
    const teamList = Object.values(teams).map(t => ({
      team_number: t.team_number,
      score: t.score,
      correct: t.correct,
      answered: t.answered,
      members: t.members,
      progress: totalRounds ? Math.min(1, t.correct / totalRounds) : 0
    })).sort((a, b) => b.correct - a.correct || b.score - a.score);

    const playersOut = players.map(p => ({
      id: p.id,
      display_name: p.display_name,
      team_number: p.team_number || 0,
      score: p.score || 0,
      cards_answered: p.cards_answered || 0,
      cards_correct: p.cards_correct || 0,
      current_index: p.current_index || 0,
      progress: game.mode === 'race'
        ? (totalRounds ? Math.min(1, (p.cards_correct || 0) / totalRounds) : 0)
        : (totalRounds ? Math.min(1, (p.current_index || 0) / totalRounds) : 0)
    })).sort((a, b) => b.score - a.score);

    return Response.json({
      game: {
        id: game.id,
        deck_id: game.deck_id,
        deck_title: game.deck_title,
        join_code: game.join_code,
        mode: game.mode,
        status: game.status,
        host_user_id: game.host_user_id,
        current_card_id: game.current_card_id,
        current_round: game.current_round || 0,
        card_started_at: game.card_started_at,
        total_rounds: totalRounds,
        race_progress: game.mode === 'race' && totalRounds ? Math.min(1, (game.current_round || 0) / totalRounds) : 0,
        winning_team: game.winning_team || 0
      },
      players: playersOut,
      teams: teamList,
      my_card: myCard ? { id: myCard.id, front: myCard.front, back: myCard.back } : null,
      already_answered: alreadyAnswered,
      host_card: hostCard ? { id: hostCard.id, front: hostCard.front, back: hostCard.back } : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}