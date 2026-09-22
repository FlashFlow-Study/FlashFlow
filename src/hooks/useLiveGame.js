import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Polls getLiveGameState on an interval and re-renders. No WebSockets.
export function useLiveGame(gameId, playerId, intervalMs = 3000) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    setState(null);
    setLoading(true);
    setError("");

    const run = async () => {
      try {
        const res = await base44.functions.invoke("getLiveGameState", {
          game_id: gameId,
          player_id: playerId || ""
        });
        if (aliveRef.current) { setState(res.data); setError(""); setLoading(false); }
      } catch (e) {
        if (aliveRef.current) {
          setError(e?.response?.data?.error || e?.message || "Connection error");
          setLoading(false);
        }
      }
    };

    run();
    const id = setInterval(run, intervalMs);
    return () => { aliveRef.current = false; clearInterval(id); };
  }, [gameId, playerId, intervalMs]);

  return { state, error, loading, setState };
}