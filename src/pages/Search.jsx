import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DeckCard from "@/components/DeckCard";
import { useCreators } from "@/hooks/useCreators";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [decks, setDecks] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { creatorName } = useCreators(decks);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await base44.entities.Deck.list("-created_date", 200);
        const publicDecks = all.filter((d) => d.is_public);
        setDecks(publicDecks);
        const c = {};
        await Promise.all(
          publicDecks.map(async (d) => {
            const list = await base44.entities.Card.filter({ deck_id: d.id }, undefined, 0);
            c[d.id] = list.length;
          })
        );
        setCounts(c);
      } catch {
        setDecks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setQuery = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set("q", val);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  const matches = (d) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q) ||
      (d.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  };

  const filtered = decks.filter(matches);
  const allTags = [...new Set(decks.flatMap((d) => d.tags || []))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 md:p-8 shadow-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Public Library
        </span>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Search decks
        </h1>
        <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
          Explore public flashcard sets created by the community. Search by title, description, or tags.
        </p>

        <div className="mt-5 relative max-w-xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search by title, description, or tag…"
            className="w-full pl-12 pr-4 py-3.5 bg-card border border-blue-200 dark:border-blue-800 font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg shadow-sm"
          />
        </div>

        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {allTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1.5 bg-card border border-border font-mono text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors rounded-full"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {loading ? "Searching…" : `${filtered.length} ${filtered.length === 1 ? "result" : "results"}`}
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-sm text-muted-foreground">
            {query ? `No decks match "${query}".` : "No public decks available yet."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d, i) => (
            <div key={d.id}>
              <DeckCard deck={d} index={i} cardCount={counts[d.id]} creatorName={creatorName(d)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}