import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Upload, Loader2, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DeckCard from "@/components/DeckCard";

export default function MyDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Deck.list("-created_date", 200);
        const mine = all.filter((d) => d.created_by_id === user?.id);
        setDecks(mine);
        const c = {};
        await Promise.all(
          mine.map(async (d) => {
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
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Your collection
            </span>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              My Decks
            </h1>
            <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
              All of your flashcard sets in one place. Create, import, and manage your study material.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Create deck
            </Link>
            <Link
              to="/create?import=1"
              className="inline-flex items-center gap-2 px-5 py-3 border border-blue-200 dark:border-blue-800 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-lg"
            >
              <Upload className="w-4 h-4" /> Import
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {loading ? "Loading…" : `${decks.length} ${decks.length === 1 ? "deck" : "decks"}`}
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : decks.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-blue-200 dark:border-blue-800 rounded-xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-body text-sm text-muted-foreground mb-5">You have no decks yet.</p>
          <div className="flex justify-center gap-3">
            <Link to="/create" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Create
            </Link>
            <Link to="/create?import=1" className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest rounded-lg hover:border-primary transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((d, i) => (
            <DeckCard key={d.id} deck={d} index={i} cardCount={counts[d.id]} />
          ))}
        </div>
      )}
    </div>
  );
}