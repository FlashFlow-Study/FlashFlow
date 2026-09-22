import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Zap, Copy, Check, Play, ArrowRight, Trophy, Crown, Users, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLiveGame } from "@/hooks/useLiveGame";

const MODE_LABEL = { race: "Race", team: "Team" };

function Bar({ value }) {
  return (
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.round((value || 0) * 100)}%` }} />
    </div>
  );
}

function Center({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

export default function LiveHost() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { state, loading, error } = useLiveGame(gameId);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);

  const call = async (name, payload) => {
    setBusy(name);
    try {
      const res = await base44.functions.invoke(name, payload);
      return res.data;
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Something went wrong");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <Center>Preparing projector…</Center>;
  if (error) return <Center>{error}</Center>;
  if (!state) return <Center>No game found.</Center>;

  const { game, players, teams, host_card } = state;

  if (user && game.host_user_id && game.host_user_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="font-body text-sm text-muted-foreground">This isn't your game to host.</p>
        <Link to="/live/create" className="font-mono text-xs uppercase tracking-widest text-primary hover:underline">← Host your own</Link>
      </div>
    );
  }

  const copy = () => {
    navigator.clipboard?.writeText(game.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-5 h-5 text-primary shrink-0" />
            <span className="font-display text-xl text-foreground truncate">{game.deck_title || "Live game"}</span>
            <span className="ml-2 shrink-0 font-mono text-[10px] uppercase tracking-widest text-primary border border-blue-200 dark:border-blue-800 rounded px-2 py-0.5">
              {MODE_LABEL[game.mode]}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">{game.status}</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {game.status === "lobby" && (
          <div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Players scan or enter the code at</p>
              <p className="font-body text-sm text-foreground">flashflowstudy.base44.app/live</p>
              <div className="mt-4 inline-flex items-center gap-3 px-6 py-4 border-2 border-dashed border-primary rounded-lg">
                <span className="font-mono text-6xl tracking-[0.3em] text-primary font-bold">{game.join_code}</span>
                <button onClick={copy} className="text-muted-foreground hover:text-primary" title="Copy code">
                  {copied ? <Check className="w-5 h-5 text-positive" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> {players.length} player{players.length === 1 ? "" : "s"} joined
              </p>
            </div>

            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">In the lobby</p>
              {players.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">Waiting for players to join…</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {players.map((p) => (
                    <div key={p.id} className="p-3 border border-border bg-card rounded-md font-body text-sm text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-positive" /> {p.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => call("startLiveGame", { game_id: gameId })}
              disabled={busy === "startLiveGame" || players.length === 0}
              className="mt-8 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-60"
            >
              <Play className="w-4 h-4" /> {busy === "startLiveGame" ? "Starting…" : "Start game"}
            </button>
          </div>
        )}

        {game.status === "in_progress" && game.mode === "race" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Round {Math.min(game.current_round + 1, game.total_rounds)} / {game.total_rounds}
              </p>
              <button
                onClick={() => call("endLiveGame", { game_id: gameId })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 font-mono text-[10px] uppercase tracking-widest text-destructive hover:border-destructive rounded-md"
              >
                <Square className="w-3 h-3" /> End
              </button>
            </div>
            <Bar value={game.race_progress} />

            {host_card && (
              <div className="mt-6 p-8 border-2 border-primary rounded-lg text-center bg-card">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current card</p>
                <p className="mt-3 font-display text-4xl text-foreground">{host_card.front}</p>
              </div>
            )}

            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Scores</p>
              <div className="space-y-2">
                {players.map((p, i) => (
                  <div key={p.id} className="p-3 border border-border bg-card rounded-md flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-6">{i + 1}</span>
                    <span className="font-body text-sm text-foreground flex-1 truncate">{p.display_name}</span>
                    <div className="w-32"><Bar value={p.progress} /></div>
                    <span className="font-mono text-sm text-primary w-16 text-right">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => call("advanceLiveCard", { game_id: gameId })}
              disabled={busy === "advanceLiveCard"}
              className="mt-8 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-60"
            >
              {busy === "advanceLiveCard" ? "Advancing…" : "Next card"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {game.status === "in_progress" && game.mode === "team" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">First team to complete the deck wins</p>
              <button
                onClick={() => call("endLiveGame", { game_id: gameId })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 font-mono text-[10px] uppercase tracking-widest text-destructive hover:border-destructive rounded-md"
              >
                <Square className="w-3 h-3" /> End
              </button>
            </div>
            <div className="space-y-4">
              {teams.map((t) => (
                <div key={t.team_number} className="p-4 border border-border bg-card rounded-md">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-display text-xl text-foreground">Team {t.team_number}</span>
                    <span className="font-mono text-sm text-primary">{t.score} pts</span>
                  </div>
                  <Bar value={t.progress} />
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t.correct} / {game.total_rounds} correct · {t.members} members
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {players.filter((p) => p.team_number === t.team_number).map((p) => (
                      <span key={p.id} className="px-2 py-1 border border-border rounded font-body text-xs text-foreground">
                        {p.display_name} · {p.score}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {game.status === "ended" && (
          <div>
            <div className="text-center mb-8">
              <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="font-display text-3xl text-foreground mt-2">Game over</h2>
            </div>

            {game.mode === "race" ? (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Leaderboard</p>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={p.id} className={`p-3 border rounded-md flex items-center gap-3 ${i === 0 ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                      <span className="w-8 flex justify-center">{i === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>}</span>
                      <span className="font-body text-sm text-foreground flex-1 truncate">{p.display_name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.cards_correct}/{game.total_rounds}</span>
                      <span className="font-mono text-sm text-primary w-16 text-right">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Final standings</p>
                <div className="space-y-2">
                  {teams.map((t, i) => (
                    <div key={t.team_number} className={`p-4 border rounded-md ${game.winning_team === t.team_number ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-8 flex justify-center">{game.winning_team === t.team_number ? <Crown className="w-4 h-4 text-amber-500" /> : <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>}</span>
                        <span className="font-display text-xl text-foreground flex-1">Team {t.team_number}</span>
                        <span className="font-mono text-sm text-primary">{t.score} pts</span>
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t.correct} / {game.total_rounds} correct</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <Link to="/live/create" className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 rounded-md">
                <Zap className="w-4 h-4" /> New game
              </Link>
              <Link to="/" className="px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary rounded-md">
                Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}