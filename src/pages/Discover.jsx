import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Compass, Search, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DeckCard from "@/components/DeckCard";
import { useCreators } from "@/hooks/useCreators";
import { useSeo } from "@/lib/useSeo";

export default function Discover() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentTags, setRecentTags] = useState([]); // [{ tag, weight }]
  const [recommended, setRecommended] = useState([]);
  const [matchedByDeck, setMatchedByDeck] = useState({});
  const [counts, setCounts] = useState({});
  const { creatorName } = useCreators(recommended);

  useSeo(
    "Discover Flashcards — Public Sets Picked For You | FlashFlow",
    "Discover public flashcard sets recommended from the tags of decks you've been studying recently on FlashFlow."
  );

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // 1. Recent study sessions → deck ids with recency weighting
        const sessions = await base44.entities.StudySession.list("-created_date", 50);
        const seenDeckIds = new Set();
        const deckWeights = {};
        sessions.forEach((s, i) => {
          if (!s.deck_id) return;
          seenDeckIds.add(s.deck_id);
          deckWeights[s.deck_id] = Math.max(deckWeights[s.deck_id] || 0, 1 / (i + 1));
        });
        const studiedIds = [...seenDeckIds];

        // 2. Fetch those decks → collect tag weights
        let tagWeights = {};
        if (studiedIds.length) {
          const studiedDecks = await base44.entities.Deck.filter({ id: { $in: studiedIds } }).catch(() => []);
          studiedDecks.forEach((d) => {
            const w = deckWeights[d.id] || 0;
            (d.tags || []).forEach((t) => {
              tagWeights[t] = (tagWeights[t] || 0) + w;
            });
          });
        }
        setRecentTags(
          Object.entries(tagWeights)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, weight]) => ({ tag, weight }))
        );

        // 3. Public decks, excluding own + already studied
        const all = await base44.entities.Deck.list("-created_date", 200);
        const candidates = all.filter(
          (d) => d.is_public && d.created_by_id !== user.id && !seenDeckIds.has(d.id)
        );

        // 4. Score by overlap with recent tag weights
        const scored = candidates
          .map((d) => {
            const matched = (d.tags || []).filter((t) => tagWeights[t] > 0);
            const score = matched.reduce((s, t) => s + (tagWeights[t] || 0), 0);
            return { deck: d, score, matched };
          })
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 24);

        setRecommended(scored.map((s) => s.deck));
        const matchMap = {};
        scored.forEach((s) => { matchMap[s.deck.id] = s.matched; });
        setMatchedByDeck(matchMap);

        // 5. Card counts for displayed decks
        const c = {};
        await Promise.all(
          scored.map(async (s) => {
            try {
              const list = await base44.entities.Card.filter({ deck_id: s.deck.id }, undefined, 0);
              c[s.deck.id] = list.length;
            } catch { /* ignore */ }
          })
        );
        setCounts(c);
      } catch {
        setRecommended([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const hasRecentTags = recentTags.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 md:p-8 shadow-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 inline-flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" /> For you
        </span>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Discover decks
        </h1>
        <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
          Public sets picked from the tags of decks you've been studying recently.
        </p>

        {hasRecentTags && (
          <div className="mt-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Your recent tags
            </p>
            <div className="flex flex-wrap gap-2">
              {recentTags.slice(0, 12).map(({ tag }) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-card border border-blue-200 dark:border-blue-800 font-mono text-[11px] text-primary rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !hasRecentTags ? (
        <div className="mt-10 p-8 border border-dashed border-slate-200 rounded-md text-center max-w-md mx-auto">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">
            Study a few decks and we'll recommend public sets based on their tags.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Search className="w-4 h-4" /> Browse public decks
          </Link>
        </div>
      ) : recommended.length === 0 ? (
        <div className="mt-10 p-8 border border-dashed border-slate-200 rounded-md text-center max-w-md mx-auto">
          <p className="font-body text-sm text-muted-foreground mb-4">
            No public sets match your recent tags yet. Try browsing the library.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Search className="w-4 h-4" /> Browse public decks
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {recommended.length} {recommended.length === 1 ? "recommendation" : "recommendations"}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((d, i) => (
              <div key={d.id} className="relative">
                <DeckCard deck={d} index={i} cardCount={counts[d.id]} creatorName={creatorName(d)} />
                {matchedByDeck[d.id]?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {matchedByDeck[d.id].slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-primary/5 border border-primary/20 font-mono text-[10px] text-primary rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}