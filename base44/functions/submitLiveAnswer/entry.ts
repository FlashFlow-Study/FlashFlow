import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isAnswerCorrect, speedBonus } from '../../shared/liveGame.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const game_id = (body?.game_id || '').toString();
    const player_id = (body?.player_id || '').toString();
    const answer = (body?.answer || '').toString();
    if (!game_id || !player_id) return Response.json({ error: 'Missing game or player' }, { status: 400 });

    const game = await base44.asServiceRole.entities.LiveGame.get(game_id).catch(() => null);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.status !== 'in_progress') return Response.json({ error: 'Game not in progress' }, { status: 400 });

    const player = await base44.asServiceRole.entities.LivePlayer.get(player_id).catch(() => null);
    if (!player || player.game_id !== game_id) return Response.json({ error: 'Player not found' }, { status: 404 });
    if (!answer) return Response.json({ error: 'Enter an answer' }, { status: 400 });

    // Determine the player's current card.
    let card_id;
    if (game.mode === 'race') {
      card_id = game.current_card_id;
    } else {
      card_id = game.card_order[player.current_index] || '';
    }
    if (!card_id) return Response.json({ error: 'No current card' }, { status: 400 });

    // A correct answer for this card locks it. In race mode any answer locks the round.
    const existing = await base44.asServiceRole.entities.LiveAnswer.filter({ game_id, player_id, card_id }, undefined, 5);
    if (game.mode === 'race' && existing.length) {
      return Response.json({ error: 'Already answered this round' }, { status: 409 });
    }
    if (existing.some(a => a.is_correct)) {
      return Response.json({ error: 'Already answered' }, { status: 409 });
    }

    const card = await base44.asServiceRole.entities.Card.get(card_id).catch(() => null);
    if (!card) return Response.json({ error: 'Card not found' }, { status: 404 });
    const deck = await base44.asServiceRole.entities.Deck.get(game.deck_id).catch(() => ({}));
    const isTwoLanguages = !!(deck && deck.is_two_languages);

    const correctAnswer = card.back;
    const correct = isAnswerCorrect(answer, correctAnswer, isTwoLanguages);
    const now = new Date().toISOString();

    let earned = 0;
    let newScore = player.score;
    let newAnswered = player.cards_answered;
    let newCorrect = player.cards_correct;
    let newIndex = player.current_index;
    let newCardStarted = player.current_card_started_at;

    if (correct) {
      const bonus = game.mode === 'race' ? speedBonus(game.card_started_at) : speedBonus(player.current_card_started_at);
      earned = 100 + bonus;
      newScore = player.score + earned;
      newAnswered = player.cards_answered + 1;
      newCorrect = player.cards_correct + 1;
      if (game.mode === 'team') {
        newIndex = player.current_index + 1;
        newCardStarted = now;
      }
      await base44.asServiceRole.entities.LiveAnswer.create({
        game_id, card_id, player_id, is_correct: true, earned, answered_at: now
      });
    } else if (game.mode === 'race') {
      // Lock the round so the player can't re-answer; team mode leaves the card open to retry.
      await base44.asServiceRole.entities.LiveAnswer.create({
        game_id, card_id, player_id, is_correct: false, earned: 0, answered_at: now
      });
    }

    await base44.asServiceRole.entities.LivePlayer.update(player_id, {
      score: newScore,
      cards_answered: newAnswered,
      cards_correct: newCorrect,
      current_index: newIndex,
      current_card_started_at: newCardStarted,
      last_seen: now
    });

    // Team win check: first team to collectively answer the whole deck correctly.
    let gameEnded = false;
    let winning_team = 0;
    if (game.mode === 'team' && correct) {
      const teamPlayers = await base44.asServiceRole.entities.LivePlayer.filter({ game_id, team_number: player.team_number }, undefined, 200);
      const teamCorrect = teamPlayers.reduce((s, p) => s + (p.id === player_id ? newCorrect : (p.cards_correct || 0)), 0);
      if (teamCorrect >= game.card_order.length) {
        winning_team = player.team_number;
        gameEnded = true;
      }
    }
    if (gameEnded) {
      await base44.asServiceRole.entities.LiveGame.update(game_id, { status: 'ended', winning_team });
    }

    return Response.json({
      is_correct: correct,
      earned,
      correct_answer: correctAnswer,
      prompt: card.front,
      score: newScore,
      cards_correct: newCorrect,
      game_ended: gameEnded,
      winning_team
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}