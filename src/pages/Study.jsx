import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Layers, Lock, LogIn, ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { recordAssignmentProgress, goalLabel } from "@/lib/assignments";
import FlashcardMode from "@/components/study/FlashcardMode";
import QuizMode from "@/components/study/QuizMode";
import TypeMode from "@/components/study/TypeMode";
import TestMode from "@/components/study/TestMode";

export default function Study() {
  const { id, mode } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const starredOnly = searchParams.get("starred") === "1";
  const assignmentId = searchParams.get("assignment");
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const recordedRef = useRef(false);
  const startTimeRef = useRef(null);

  const handleComplete = async (stats) => {
    if (!user) return;
    if (recordedRef.current) return;
    recordedRef.current = true;
    const minutes = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 0;
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
    if (assignment) {
      try {
        await recordAssignmentProgress(assignment, user, stats, minutes);
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await base44.entities.Deck.get(id);
        setDeck(d);
        let c = await base44.entities.Card.filter({ deck_id: id }, "order", 100);
        if (starredOnly) {
          const stars = await base44.entities.UserCardStar.filter({ deck_id: id }).catch(() => []);
          const sIds = new Set(stars.map((s) => s.card_id));
          c = c.filter((card) => sIds.has(card.id));
        }
        setCards(c);
        if (assignmentId) {
          const a = await base44.entities.Assignment.get(assignmentId).catch(() => null);
          setAssignment(a);
        }
      } catch {
        setDeck(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, starredOnly, assignmentId]);

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

  const gated = mode !== "flashcards";
  if (gated && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to={`/deck/${id}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              ← {deck.title}
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {mode === "quiz" ? "Quiz mode" : mode === "test" ? "Test mode" : "Type mode"}
            </span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center border border-slate-200 bg-card rounded-md p-8">
            <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl text-foreground">Sign in to continue</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              {mode === "quiz" ? "Quiz" : mode === "test" ? "Test" : "Type"} mode is available once you sign in. Flashcard mode is free to practice.
            </p>
            <Link
              to={`/login?returnTo=${encodeURIComponent(`/study/${id}/${mode}`)}`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
            >
              <LogIn className="w-4 h-4" /> Sign in
            </Link>
            <Link to={`/study/${id}/flashcards`} className="mt-3 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Practice with flashcards instead →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const Mode = mode === "quiz" ? QuizMode : mode === "type" ? TypeMode : mode === "test" ? TestMode : FlashcardMode;
  if (!startTimeRef.current) startTimeRef.current = Date.now();

  const exitTarget = assignment ? `/classroom/${assignment.classroom_id}` : `/deck/${id}`;
  const assignedCount = mode === "test" && assignment?.test_length ? assignment.test_length : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to={exitTarget} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← {deck.title}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {mode === "quiz" ? "Quiz mode" : mode === "type" ? "Type mode" : mode === "test" ? "Test mode" : "Flashcard mode"}
          </span>
        </div>
        {assignment && (
          <div className="border-t border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Assignment
              </span>
              <span className="font-body text-sm text-foreground truncate">{assignment.title}</span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-primary shrink-0">
                Goal: {goalLabel(assignment)}
              </span>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Mode
          cards={cards}
          onExit={() => (window.location.href = exitTarget)}
          onComplete={handleComplete}
          isTwoLanguages={deck.is_two_languages}
          assignedCount={assignedCount}
        />
      </main>
    </div>
  );
}