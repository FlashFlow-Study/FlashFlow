import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, Globe, Lock, Trash2, Play, Pencil, User, Star, School } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ExportMenu from "@/components/ExportMenu";
import StarToggle from "@/components/StarToggle";
import { useAuth } from "@/lib/AuthContext";
import { useCreators } from "@/hooks/useCreators";
import { addRecentDeck } from "@/lib/recentDecks";

export default function DeckDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flippedIndex, setFlippedIndex] = useState(null);
  const [starredIds, setStarredIds] = useState(new Set());
  const [starredRecords, setStarredRecords] = useState({});
  const [starredOnly, setStarredOnly] = useState(false);
  const { creatorName } = useCreators(deck ? [deck] : []);

  useEffect(() => {
    (async () => {
      try {
        const d = await base44.entities.Deck.get(id);
        setDeck(d);
        addRecentDeck(id);
        const [c, stars] = await Promise.all([
          base44.entities.Card.filter({ deck_id: id }, "order", 100),
          base44.entities.UserCardStar.filter({ deck_id: id }).catch(() => []),
        ]);
        setCards(c);
        setStarredIds(new Set(stars.map((s) => s.card_id)));
        const recs = {};
        stars.forEach((s) => { recs[s.card_id] = s.id; });
        setStarredRecords(recs);
      } catch {
        setDeck(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const togglePublic = async () => {
    const updated = await base44.entities.Deck.update(id, { is_public: !deck.is_public });
    setDeck(updated);
  };

  const remove = async () => {
    await base44.entities.Card.deleteMany({ deck_id: id });
    await base44.entities.Deck.delete(id);
    navigate("/");
  };

  const toggleStar = async (cardId) => {
    if (starredIds.has(cardId)) {
      try {
        await base44.entities.UserCardStar.delete(starredRecords[cardId]);
        setStarredIds((prev) => { const n = new Set(prev); n.delete(cardId); return n; });
        setStarredRecords((prev) => { const n = { ...prev }; delete n[cardId]; return n; });
      } catch { /* ignore */ }
    } else {
      try {
        const rec = await base44.entities.UserCardStar.create({ card_id: cardId, deck_id: id });
        setStarredIds((prev) => new Set(prev).add(cardId));
        setStarredRecords((prev) => ({ ...prev, [cardId]: rec.id }));
      } catch { /* ignore */ }
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );
  if (deck === false)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-body text-sm text-muted-foreground">Deck not found.</p>
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-primary">
          ← Back home
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Library
        </Link>

        <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border rounded-md ${
                deck.is_public ? "border-blue-200 dark:border-blue-800 text-primary bg-blue-50 dark:bg-blue-950/30" : "border-border text-muted-foreground"
              }`}
            >
              {deck.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {deck.is_public ? "Public" : "Private"}
            </span>
            {deck.classroom_id && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-md">
                <School className="w-3 h-3" /> Class
              </span>
            )}
            <h1 className="font-display text-5xl text-foreground mt-3 tracking-tight">{deck.title}</h1>
            {creatorName(deck) && (
              <Link
                to={`/profile/${deck.created_by_id}`}
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                Created by <span className="text-foreground">{creatorName(deck)}</span>
              </Link>
            )}
            {deck.description && (
              <p className="mt-3 font-body text-sm text-muted-foreground max-w-lg">{deck.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Layers className="w-3.5 h-3.5" /> {cards.length} cards
              </span>
              {deck.tags?.map((t) => (
                <span key={t} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Study modes */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Study modes</p>
            {starredIds.size > 0 && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={starredOnly}
                  onChange={(e) => setStarredOnly(e.target.checked)}
                  className="accent-primary"
                />
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Starred only ({starredIds.size})
                </span>
              </label>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { mode: "flashcards", label: "Flashcards" },
              { mode: "quiz", label: "Quiz" },
              { mode: "type", label: "Type" },
              { mode: "test", label: "Test" },
            ].map((m) => (
              <Link
                key={m.mode}
                to={`/study/${id}/${m.mode}${starredOnly ? "?starred=1" : ""}`}
                className="group p-5 border border-border bg-card hover:border-primary transition-colors flex items-center justify-between"
              >
                <span className="font-display text-xl text-foreground">{m.label}</span>
                <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <ExportMenu deck={deck} cards={cards} />
          {deck.created_by_id === user?.id && (
            <>
              <Link
                to={`/edit/${id}`}
                className="inline-flex items-center px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md shadow-sm shadow-primary/20"
              >
                <Pencil className="w-3.5 h-3.5 inline mr-1.5" /> Edit
              </Link>
              <button
                onClick={togglePublic}
                className="px-4 py-2.5 border border-blue-200 dark:border-blue-800 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
              >
                Make {deck.is_public ? "private" : "public"}
              </button>
              <button
                onClick={remove}
                className="px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest text-destructive hover:border-destructive transition-colors rounded-md"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1.5" /> Delete
              </button>
            </>
          )}
        </div>

        {/* Cards list */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">All cards</p>
            {starredIds.size > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {starredIds.size} starred
              </span>
            )}
          </div>
          {cards.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">This deck has no cards yet.</p>
          ) : (
            <div className="divide-y divide-border border border-border">
              {cards.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 cursor-pointer"
                  onClick={() => setFlippedIndex(flippedIndex === i ? null : i)}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-muted-foreground pt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-lg text-foreground">{c.front}</p>
                        <StarToggle starred={starredIds.has(c.id)} onToggle={() => toggleStar(c.id)} />
                      </div>
                      {flippedIndex === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 font-body text-sm text-muted-foreground border-l-2 border-primary pl-3"
                        >
                          {c.back}
                        </motion.p>
                      )}
                      {flippedIndex !== i && (
                        <p className="mt-1 font-body text-xs text-muted-foreground italic">
                          {c.back.slice(0, 60)}
                          {c.back.length > 60 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}