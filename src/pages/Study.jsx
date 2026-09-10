import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FlashcardMode from "@/components/study/FlashcardMode";
import QuizMode from "@/components/study/QuizMode";
import TypeMode from "@/components/study/TypeMode";

export default function Study() {
  const { id, mode } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const recordedRef = useRef(false);

  const handleComplete = async (stats) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    try {
      await base44.entities.StudySession.create({
        deck_id: id,
        deck_title: deck?.title,
        mode,
        cards_studied: stats?.cards_studied ?? cards.length,
        score: stats?.score ?? 0,
      });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await base44.entities.Deck.get(id);
        setDeck(d);
        const c = await base44.entities.Card.filter({ deck_id: id }, "order", 100);
        setCards(c);
      } catch {
        setDeck(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );
  if (deck === false || cards.length === 0)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Layers className="w-8 h-8 text-muted-foreground" />
        <p className="font-body text-sm text-muted-foreground">
          {deck === false ? "Deck not found." : "This deck has no cards to study."}
        </p>
        <Link to={`/deck/${id}`} className="font-mono text-xs uppercase tracking-widest text-primary">
          ← Back to deck
        </Link>
      </div>
    );

  const Mode = mode === "quiz" ? QuizMode : mode === "type" ? TypeMode : FlashcardMode;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/deck/${id}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← {deck.title}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {mode === "quiz" ? "Quiz mode" : mode === "type" ? "Type mode" : "Flashcard mode"}
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Mode cards={cards} onExit={() => (window.location.href = `/deck/${id}`)} onComplete={handleComplete} />
      </main>
    </div>
  );
}