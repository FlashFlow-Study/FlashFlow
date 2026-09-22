import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, Layers, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSeo } from "@/lib/useSeo";

const MODES = [
  { id: "race", label: "Race", desc: "Everyone answers the same card; faster correct answers score more. Host advances card by card." },
  { id: "team", label: "Team", desc: "Players auto-split into balanced teams. Each member works through the deck; first team to finish wins." }
];

export default function LiveCreate() {
  useSeo("Host a live game — FlashFlow", "Create a live FlashFlow study game and project it for your class.");
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState("race");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.Deck.filter({}, "-created_date", 100)
      .then(setDecks)
      .catch(() => setDecks([]))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    setError("");
    if (!selected) { setError("Pick a deck to host."); return; }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("createLiveGame", { deck_id: selected, mode });
      navigate(`/live/host/${res.data.game_id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not create the game.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <span className="font-mono text-[10px] uppercase tracking-widest text-primary">FlashFlow Live</span>
      <h1 className="font-display text-4xl text-foreground mt-2 tracking-tight">Host a live game</h1>
      <p className="mt-3 font-body text-sm text-muted-foreground max-w-lg">
        Pick a deck and a mode, then project the lobby and share the join code.
      </p>

      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Choose a deck</p>
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading your decks…</p>
        ) : decks.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">You don't have any decks yet. Create one first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {decks.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className={`text-left p-4 border rounded-md transition-colors ${
                  selected === d.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"
                }`}
              >
                <p className="font-display text-lg text-foreground">{d.title}</p>
                {d.description && <p className="mt-1 font-body text-xs text-muted-foreground line-clamp-2">{d.description}</p>}
                <p className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Layers className="w-3 h-3" /> Deck
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Choose a mode</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-left p-4 border rounded-md transition-colors ${
                mode === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"
              }`}
            >
              <p className="font-display text-lg text-foreground">{m.label}</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-6 font-body text-sm text-destructive">{error}</p>}

      <button
        onClick={create}
        disabled={busy}
        className="mt-8 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-60"
      >
        <Zap className="w-4 h-4" /> {busy ? "Creating…" : "Create game"} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}