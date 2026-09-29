import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, ArrowRight, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSeo } from "@/lib/useSeo";
import BetaBadge from "@/components/BetaBadge";

export default function LiveJoin() {
  useSeo("FlashFlow Live — Join a game", "Join a live FlashFlow study game with a code from your host.");
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async (e) => {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setError("Enter the game code and your name.");
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("joinLiveGame", {
        join_code: code.trim().toUpperCase(),
        display_name: name.trim()
      });
      if (res.data?.player_token) {
        sessionStorage.setItem(`live_token_${res.data.player_id}`, res.data.player_token);
      }
      navigate(`/live/play/${res.data.game_id}/${res.data.player_id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not join that game.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back
      </Link>

      <span className="block mt-6 font-mono text-[10px] uppercase tracking-widest text-primary">
        FlashFlow Live <BetaBadge className="ml-1 align-middle" />
      </span>
      <h1 className="font-display text-5xl text-foreground mt-2 tracking-tight">Join a game</h1>
      <p className="mt-3 font-body text-sm text-muted-foreground max-w-lg">
        Enter the code your host shared, pick a display name, and jump in. No account needed.
      </p>

      <form onSubmit={join} className="mt-8 max-w-md space-y-4 p-5 border border-border bg-card rounded-md">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Game code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            className="w-full mt-1 px-4 py-3 bg-background border border-border font-mono text-lg tracking-[0.3em] uppercase focus:outline-none focus:border-primary rounded-md"
            placeholder="ABCD2"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-full mt-1 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            placeholder="Your name"
          />
        </div>
        {error && <p className="font-body text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-60"
        >
          <Zap className="w-4 h-4" /> {busy ? "Joining…" : "Join game"}
        </button>
      </form>

      <div className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>Want to run a game?</span>
        <Link to="/live/create" className="text-primary hover:underline inline-flex items-center gap-1">
          Host instead <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}