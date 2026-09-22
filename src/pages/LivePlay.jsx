import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Zap, Check, X, Trophy, Crown, Loader } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLiveGame } from "@/hooks/useLiveGame";
import SpecialCharToolbar from "@/components/SpecialCharToolbar";

function Center({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

export default function LivePlay() {
  const { gameId, playerId } = useParams();
  const { state, loading, error } = useLiveGame(gameId, playerId);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef(null);
  const activeInputRef = useRef(null);
  const lastCardRef = useRef(null);

  const { game, players, teams, my_card, already_answered } = state || {};
  const me = players?.find((p) => p.id === playerId) || null;

  // Clear feedback when the current card changes.
  useEffect(() => {
    const cardId = my_card?.id || null;
    if (cardId !== lastCardRef.current) {
      lastCardRef.current = cardId;
      setResult(null);
      setAnswer("");
      setSubmitError("");
    }
  }, [my_card?.id]);

  const submit = async (e) => {
    e?.preventDefault();
    setSubmitError("");
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitLiveAnswer", {
        game_id: gameId,
        player_id: playerId,
        answer: answer.trim()
      });
      setResult(res.data);
      if (res.data.is_correct) setAnswer("");
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err?.message || "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Center>Connecting…</Center>;
  if (error) return <Center>{error}</Center>;
  if (!state) return <Center>No game found.</Center>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span className="font-body text-sm text-foreground truncate">{game.deck_title}</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
            {game.status === "lobby" ? "Lobby" : game.mode === "race" ? "Race" : "Team"}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8">
        {game.status === "lobby" && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-5 py-3 border border-dashed border-primary rounded-lg">
              <span className="font-mono text-2xl tracking-[0.3em] text-primary font-bold">{game.join_code}</span>
            </div>
            <h2 className="mt-6 font-display text-2xl text-foreground">Waiting for the host to start</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              You're in, {me?.display_name || "player"}. Hang tight — the game begins soon.
            </p>
          </div>
        )}

        {game.status === "in_progress" && (
          <PlayActive
            game={game}
            my_card={my_card}
            already_answered={already_answered}
            me={me}
            answer={answer}
            setAnswer={setAnswer}
            inputRef={inputRef}
            activeInputRef={activeInputRef}
            submit={submit}
            submitting={submitting}
            result={result}
            submitError={submitError}
          />
        )}

        {game.status === "ended" && (
          <Results game={game} me={me} players={players} teams={teams} />
        )}
      </main>
    </div>
  );
}

function PlayActive(props) {
  const { game, my_card, already_answered, me, answer, setAnswer, inputRef, activeInputRef, submit, submitting, result, submitError } = props;

  const finished = game.mode === "team" && me && me.current_index >= game.total_rounds;

  if (finished) {
    return (
      <div className="text-center py-12">
        <Check className="w-10 h-10 text-positive mx-auto" />
        <h2 className="mt-3 font-display text-2xl text-foreground">You finished your cards!</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">Waiting for your team to complete the deck.</p>
        <p className="mt-4 font-mono text-sm text-primary">Score: {me?.score || 0}</p>
      </div>
    );
  }

  if (game.mode === "race" && already_answered) {
    return (
      <div className="text-center py-12">
        {result && (
          result.is_correct
            ? <Check className="w-10 h-10 text-positive mx-auto" />
            : <X className="w-10 h-10 text-destructive mx-auto" />
        )}
        <h2 className="mt-3 font-display text-2xl text-foreground">
          {result ? (result.is_correct ? `Correct! +${result.earned}` : "Not quite") : "Answer locked"}
        </h2>
        {result && !result.is_correct && (
          <p className="mt-2 font-body text-sm text-muted-foreground">Answer: {result.correct_answer}</p>
        )}
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Waiting for the host to advance…</p>
      </div>
    );
  }

  if (!my_card) {
    return <Center><Loader className="w-5 h-5 animate-spin" /></Center>;
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {game.mode === "race" ? `Round ${Math.min(game.current_round + 1, game.total_rounds)} / ${game.total_rounds}` : `Card ${(me?.current_index || 0) + 1} / ${game.total_rounds}`}
      </p>
      <div className="mt-3 p-8 border-2 border-primary rounded-lg bg-card text-center">
        <p className="font-display text-3xl text-foreground">{my_card.front}</p>
      </div>

      <form onSubmit={submit} className="mt-5">
        <input
          ref={(el) => { inputRef.current = el; activeInputRef.current = el ? { element: el, onChange: setAnswer } : null; }}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
          placeholder="Type your answer…"
        />
        <div className="mt-3">
          <SpecialCharToolbar activeInputRef={activeInputRef} />
        </div>
        {submitError && <p className="mt-3 font-body text-sm text-destructive">{submitError}</p>}
        {result && (
          <div className={`mt-3 p-3 border rounded-md flex items-center gap-2 ${result.is_correct ? "border-positive bg-positive/5" : "border-destructive bg-destructive/5"}`}>
            {result.is_correct ? <Check className="w-4 h-4 text-positive" /> : <X className="w-4 h-4 text-destructive" />}
            <p className="font-body text-sm text-foreground">
              {result.is_correct ? `Correct! +${result.earned} points` : `Not quite — try again`}
              {!result.is_correct && result.game_mode === "team" && ""}
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || !answer.trim()}
          className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </form>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Your score: <span className="text-primary">{me?.score || 0}</span></p>
    </div>
  );
}

function Results({ game, me, players, teams }) {
  const ranked = [...(players || [])].sort((a, b) => b.score - a.score);
  const myRank = me ? ranked.findIndex((p) => p.id === me.id) + 1 : 0;

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="font-display text-3xl text-foreground mt-2">Game over</h2>
        {me && (
          <p className="mt-2 font-body text-sm text-muted-foreground">
            {game.mode === "race"
              ? `You finished ${myRank === 1 ? "1st" : myRank === 2 ? "2nd" : myRank === 3 ? "3rd" : myRank + "th"} with ${me.score} points`
              : game.winning_team === me.team_number
                ? `Your team (Team ${me.team_number}) won! 🎉`
                : `Team ${game.winning_team} won. Better luck next time.`}
          </p>
        )}
      </div>

      {game.mode === "race" ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Leaderboard</p>
          <div className="space-y-2">
            {ranked.map((p, i) => (
              <div key={p.id} className={`p-3 border rounded-md flex items-center gap-3 ${p.id === me?.id ? "border-primary" : "border-border bg-card"}`}>
                <span className="w-8 flex justify-center">{i === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>}</span>
                <span className="font-body text-sm text-foreground flex-1 truncate">{p.display_name}{p.id === me?.id ? " (you)" : ""}</span>
                <span className="font-mono text-sm text-primary">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Final standings</p>
          <div className="space-y-2">
            {(teams || []).map((t, i) => (
              <div key={t.team_number} className={`p-4 border rounded-md ${game.winning_team === t.team_number ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-card"} ${me?.team_number === t.team_number ? "ring-1 ring-primary" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 flex justify-center">{game.winning_team === t.team_number ? <Crown className="w-4 h-4 text-amber-500" /> : <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>}</span>
                  <span className="font-display text-lg text-foreground flex-1">Team {t.team_number}{me?.team_number === t.team_number ? " (yours)" : ""}</span>
                  <span className="font-mono text-sm text-primary">{t.score}</span>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t.correct} / {game.total_rounds} correct</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/live" className="mt-8 inline-flex items-center gap-2 px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary rounded-md">
        ← Join another
      </Link>
    </div>
  );
}