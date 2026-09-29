import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Polls getLiveGameState and re-renders. No WebSockets.
// Requests never overlap, polling pauses while the tab is hidden, and after a
// failure (e.g. rate limit) it backs off exponentially instead of hammering the
// API — the last good state stays on screen meanwhile.
export function useLiveGame(gameId, playerId, intervalMs = 3000) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);
  const hasStateRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    hasStateRef.current = false;
    setState(null);
    setLoading(true);
    setError("");

    let timer = null;
    let failures = 0;

    const schedule = () => {
      if (!aliveRef.current) return;
      const delay = failures
        ? Math.min(20000, intervalMs * 2 ** failures)
        : intervalMs;
      timer = setTimeout(run, delay + Math.random() * 400);
    };

    const run = async () => {
      if (!aliveRef.current) return;
      if (document.hidden) { schedule(); return; }
      try {
        const res = await base44.functions.invoke("getLiveGameState", {
          game_id: gameId,
          player_id: playerId || ""
        });
        failures = 0;
        if (aliveRef.current) {
          hasStateRef.current = true;
          setState(res.data);
          setError("");
          setLoading(false);
        }
      } catch (e) {
        failures += 1;
        if (aliveRef.current) {
          // Only surface the error if we have nothing to show yet.
          if (!hasStateRef.current) {
            setError(e?.response?.data?.error || e?.message || "Connection error");
          }
          setLoading(false);
        }
      }
      schedule();
    };

    run();
    const onVisible = () => {
      if (!document.hidden && aliveRef.current) {
        clearTimeout(timer);
        run();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      aliveRef.current = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [gameId, playerId, intervalMs]);

  return { state, error, loading, setState };
}