import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DeckCard from "@/components/DeckCard";

export default function Home() {
  const [mine, setMine] = useState([]);
  const [pub, setPub] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("mine");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      }
      try {
        const [myDecks, publicDecks] = await Promise.all([
          base44.entities.Deck.list("-created_date", 50),
          base44.entities.Deck.filter({ is_public: true }, "-created_date", 50),
        ]);
        const all = [...myDecks, ...publicDecks];
        const c = {};
        await Promise.all(
          all.map(async (d) => {
            const list = await base44.entities.Card.filter({ deck_id: d.id }, undefined, 0);
            c[d.id] = list.length;
          })
        );
        setCounts(c);
        setMine(myDecks);
        setPub(publicDecks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = tab === "mine" ? mine : pub;
  const filtered = query
    ? list.filter(
        (d) =>
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.description?.toLowerCase().includes(query.toLowerCase())
      )
    : list;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display text-6xl md:text-7xl leading-[0.95] text-foreground tracking-tight"
          >
            Study smarter,
            <br />
            <span className="text-primary">remember longer.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="mt-6 max-w-md font-body text-sm text-muted-foreground leading-relaxed"
          >
            Build flashcard decks by hand or paste your notes and let AI draft the cards for you.
            Then study three ways — flip, quiz, or type your answers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create a deck
            </Link>
            <Link
              to="/create?ai=1"
              className="inline-flex items-center gap-2 px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Generate with AI
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Library */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl text-foreground">Library</h2>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-1">
              {user ? "Your decks & the public library" : "Browse public study decks"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => setTab("mine")}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
                  tab === "mine"
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                My decks
              </button>
            )}
            <button
              onClick={() => setTab("public")}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
                tab === "public"
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Public
            </button>
          </div>
        </div>

        <div className="relative mb-8 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decks…"
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-sm text-muted-foreground">
              {tab === "mine"
                ? "You have no decks yet. Create your first one."
                : "No public decks match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((d, i) => (
              <DeckCard key={d.id} deck={d} index={i} cardCount={counts[d.id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}