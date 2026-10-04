import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ProgressGauge from "./ProgressGauge";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(tenths) {
  return (tenths / 10).toFixed(1) + "s";
}

const ROWS_CLASS = { 1: "grid-rows-1", 2: "grid-rows-2", 3: "grid-rows-3", 4: "grid-rows-4" };

// Grid: a term/definition matching game. Picks up to 8 cards from the deck,
// shuffles all 16 text tiles into a 4x4 grid, and times how long the user
// takes to match every pair. The final time is the score, saved to a public
// per-deck leaderboard (GridScore). Text-only — card photos are ignored.
//
// The timer is wall-clock based (Date.now() deltas from the moment the
// countdown ends to completion) rather than accumulated ticks, so switching
// browser tabs can't undercount it — background-tab throttled intervals
// recompute from the real timestamp on return. The grid is sized to fill the
// available viewport height so the whole board + timer stay visible without
// scrolling during play.
export default function GridMode({ cards, onExit, onComplete, deck }) {
  const { user } = useAuth();
  const [tiles, setTiles] = useState([]);
  const [pairCount, setPairCount] = useState(0);
  const [phase, setPhase] = useState("countdown"); // countdown | playing | done
  const [countdown, setCountdown] = useState(3);
  const [now, setNow] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [scores, setScores] = useState([]);
  const [savedTimeMs, setSavedTimeMs] = useState(0);
  const [isPB, setIsPB] = useState(false);
  const lockRef = useRef(false);
  const startTimeRef = useRef(null);

  const startNew = () => {
    const pool = shuffle(cards).slice(0, Math.min(8, cards.length));
    const built = pool.flatMap((c) => [
      { tileId: c.id + "-t", cardId: c.id, text: c.prompt, side: "term" },
      { tileId: c.id + "-d", cardId: c.id, text: c.answer, side: "def" },
    ]);
    setTiles(shuffle(built));
    setPairCount(pool.length);
    setPhase("countdown");
    setCountdown(3);
    setNow(0);
    startTimeRef.current = null;
    setSelectedId(null);
    setWrongIds([]);
    setMatchedCount(0);
    setScores([]);
    setSavedTimeMs(0);
    setIsPB(false);
    lockRef.current = false;
  };

  useEffect(() => {
    startNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown: 3, 2, 1 — the wall-clock timer starts the instant it hits 0.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    startTimeRef.current = Date.now();
    setNow(Date.now());
    setPhase("playing");
  }, [phase, countdown]);

  // Wall-clock timer: recompute elapsed from Date.now() each tick so it stays
  // accurate when the tab is backgrounded and resumed (no accumulated drift).
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 100);
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", tick);
    };
  }, [phase]);

  const elapsedTenths = startTimeRef.current ? Math.floor((now - startTimeRef.current) / 100) : 0;
  const allMatched = pairCount > 0 && matchedCount === pairCount;

  // Completion: stop, save score, load top 5 for this deck.
  useEffect(() => {
    if (!allMatched) return;
    const finalMs = Date.now() - startTimeRef.current;
    setSavedTimeMs(finalMs);
    setPhase("done");
    onComplete?.({ cards_studied: pairCount, score: finalMs });
    (async () => {
      const name = user?.display_name || user?.full_name || user?.email || "Anonymous";
      try {
        // Only persist a new best: find this user's existing entries for the
        // deck and update the fastest one if the new time beats it. If none
        // exist yet, create the first entry. A non-PB run leaves the
        // leaderboard unchanged.
        const mine = await base44.entities.GridScore.filter({
          deck_id: deck?.id,
          user_id: user?.id,
        }, "time_ms", 1);
        if (mine.length === 0) {
          await base44.entities.GridScore.create({
            deck_id: deck?.id,
            time_ms: finalMs,
            display_name: name,
            user_id: user?.id,
          });
          setIsPB(true);
        } else if (finalMs < mine[0].time_ms) {
          await base44.entities.GridScore.update(mine[0].id, {
            time_ms: finalMs,
            display_name: name,
          });
          setIsPB(true);
        }
      } catch {
        /* ignore */
      }
      try {
        const top = await base44.entities.GridScore.filter({ deck_id: deck?.id }, "time_ms", 5);
        setScores(top);
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  const handleSelect = (tile) => {
    if (phase !== "playing") return;
    if (tile.matched) return;
    if (lockRef.current || wrongIds.length) return;
    if (selectedId === tile.tileId) {
      setSelectedId(null);
      return;
    }
    if (!selectedId) {
      setSelectedId(tile.tileId);
      return;
    }
    const a = tiles.find((t) => t.tileId === selectedId);
    const b = tile;
    if (a.cardId === b.cardId && a.side !== b.side) {
      setTiles((ts) =>
        ts.map((t) =>
          t.tileId === a.tileId || t.tileId === b.tileId ? { ...t, matched: true } : t
        )
      );
      setMatchedCount((m) => m + 1);
      setSelectedId(null);
    } else {
      setWrongIds([a.tileId, b.tileId]);
      lockRef.current = true;
      setTimeout(() => {
        setWrongIds([]);
        setSelectedId(null);
        lockRef.current = false;
      }, 500);
    }
  };

  if (cards.length < 2) {
    return (
      <div className="text-center max-w-md mx-auto">
        <h2 className="font-display text-3xl text-foreground mb-2">Not enough cards</h2>
        <p className="font-mono text-sm text-muted-foreground mb-6">
          This deck needs at least 2 cards for Grid.
        </p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="font-display text-4xl text-foreground mb-2">Grid complete!</h2>
        <p className="font-mono text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
          Your time: <span className="text-foreground font-medium">{fmt(savedTimeMs / 100)}</span>
          {isPB && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive/10 border border-positive/40 text-positive font-mono text-[10px] uppercase tracking-widest">
              New PB!
            </span>
          )}
        </p>
        <div className="mt-6 text-left">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Top 5 best times
          </p>
          <div className="divide-y divide-border border border-border rounded-md">
            {scores.length === 0 ? (
              <p className="p-4 font-body text-sm text-muted-foreground">No times yet.</p>
            ) : (
              scores.map((s, i) => {
                const isMe = s.user_id === user?.id && savedTimeMs === s.time_ms;
                return (
                  <div
                    key={s.id}
                    className={`p-3 flex items-center gap-3 ${isMe ? "bg-primary/5" : ""}`}
                  >
                    <span className="font-mono text-xs text-muted-foreground w-6">{i + 1}.</span>
                    <span className="flex-1 font-body text-sm text-foreground truncate">
                      {s.display_name || "Anonymous"}
                    </span>
                    <span className="font-mono text-sm text-foreground">{fmt(s.time_ms / 100)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={startNew}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            Play again
          </button>
          <button
            onClick={onExit}
            className="px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
          >
            Back to deck
          </button>
        </div>
      </div>
    );
  }

  const rowCount = Math.ceil(tiles.length / 4);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl h-[calc(100dvh-10rem)]">
      <div className="w-full mb-4 flex items-center justify-between gap-3 shrink-0">
        <ProgressGauge current={matchedCount} total={pairCount} label="Matched" />
        <span className="font-mono text-lg text-primary tabular-nums">{fmt(elapsedTenths)}</span>
        <button
          onClick={onExit}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="relative w-full flex-1 min-h-0">
        <div className={`grid grid-cols-4 ${ROWS_CLASS[rowCount]} gap-1 sm:gap-2 h-full`}>
          {tiles.map((tile) => {
            const isSel = selectedId === tile.tileId;
            const isWrong = wrongIds.includes(tile.tileId);
            return (
              <motion.button
                key={tile.tileId}
                type="button"
                onClick={() => handleSelect(tile)}
                animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`h-full w-full p-1.5 sm:p-2.5 border-2 rounded-md flex items-center justify-center text-center font-body text-[10px] sm:text-xs md:text-sm leading-tight overflow-hidden transition-colors ${
                  tile.matched
                    ? "opacity-20 border-border bg-muted pointer-events-none"
                    : isWrong
                    ? "border-destructive bg-destructive/5"
                    : isSel
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/60"
                }`}
              >
                <span
                  className={`block line-clamp-2 sm:line-clamp-4 ${
                    tile.matched ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {tile.text}
                </span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {phase === "countdown" && countdown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-md"
            >
              <motion.span
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="font-display text-7xl text-primary"
              >
                {countdown}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}