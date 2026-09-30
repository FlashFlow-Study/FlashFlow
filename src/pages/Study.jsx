import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Layers, Lock, LogIn, ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { recordAssignmentProgress, goalLabel } from "@/lib/assignments";
import { buildQuestions } from "@/lib/studyCards";
import StudySetup from "@/components/study/StudySetup";
import FlashcardMode from "@/components/study/FlashcardMode";
import PracticeMode from "@/components/study/PracticeMode";
import TypeMode from "@/components/study/TypeMode";
import TestMode from "@/components/study/TestMode";
import SpeakingMode from "@/components/study/SpeakingMode";
import GridMode from "@/components/study/GridMode";
import { resolveDeckLanguages } from "@/lib/deckLanguages";
import { playSound, warmupSounds } from "@/lib/sounds";

const MODE_LABELS = { flashcards: "Flashcards", quiz: "Practice", type: "Type", test: "Test", grid: "Grid", speaking: "Speaking" };

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
  const [started, setStarted] = useState(false);
  const [randomize, setRandomize] = useState(true);
  const [varyDirection, setVaryDirection] = useState(true);
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState([]);
  const recordedRef = useRef(false);
  const startTimeRef = useRef(null);

  const modeLabelText = MODE_LABELS[mode] || mode;
  const assignedCount = mode === "test" && assignment?.test_length ? assignment.test_length : null;
  const locked = !!assignedCount;
  const isSpeaking = mode === "speaking";

  const handleComplete = async (stats) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    playSound("all-questions-answered");
    if (!user) return;
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

  // Keep a ref of the latest questions so rapid swaps never read stale state.
  const questionsRef = useRef(questions);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Toggle a card's persistent term/definition orientation for the current
  // session and persist it to the card record (owners only; silently ignored
  // for decks the user doesn't own). Re-bakes the question so the card is shown
  // from the other side immediately.
  const swapCard = useCallback((cardId) => {
    const current = questionsRef.current.find((q) => q.id === cardId);
    if (!current) return;
    const orientation = current.orientation === "swapped" ? "normal" : "swapped";
    questionsRef.current = questionsRef.current.map((q) =>
      q.id === cardId
        ? {
            ...q,
            orientation,
            flipped: !q.flipped,
            prompt: q.answer,
            answer: q.prompt,
            promptLabel: q.answerLabel,
            answerLabel: q.promptLabel,
          }
        : q
    );
    setQuestions(questionsRef.current);
    base44.entities.Card.update(cardId, { orientation }).catch(() => {});
  }, []);

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

  // Default question count for test mode (before the user starts)
  useEffect(() => {
    if (started) return;
    const d = assignedCount
      ? Math.min(assignedCount, cards.length)
      : Math.min(20, cards.length);
    if (d) setQuestionCount(d);
  }, [assignment, cards.length, started]);

  // Speaking mode has its own controls — skip the setup screen.
  useEffect(() => {
    if (isSpeaking) {
      setStarted(true);
      playSound("start-practice");
      warmupSounds();
    }
  }, [isSpeaking]);

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

  const gated = mode !== "flashcards" && mode !== "speaking";
  if (gated && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to={`/deck/${id}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              ← {deck.title}
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {modeLabelText} mode
            </span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center border border-slate-200 bg-card rounded-md p-8">
            <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl text-foreground">Sign in to continue</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              {modeLabelText} mode is available once you sign in. Flashcard mode is free to practice.
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

  const start = () => {
    const qs = buildQuestions(cards, { shuffle: randomize, varyDirection });
    const final = mode === "test" ? qs.slice(0, Math.min(questionCount, qs.length)) : qs;
    setQuestions(final);
    setStarted(true);
    playSound("start-practice");
    warmupSounds();
  };

  const exitTarget = assignment ? `/classroom/${assignment.classroom_id}` : `/deck/${id}`;
  const { sourceLang: resolvedSource, targetLang: resolvedTarget } = resolveDeckLanguages(deck, cards);

  const Mode = isSpeaking ? SpeakingMode : mode === "quiz" ? PracticeMode : mode === "type" ? TypeMode : mode === "test" ? TestMode : mode === "grid" ? GridMode : FlashcardMode;
  if (started && !startTimeRef.current) startTimeRef.current = Date.now();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to={exitTarget} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← {deck.title}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {modeLabelText} mode
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
        {!started && !isSpeaking ? (
          <StudySetup
            modeLabel={modeLabelText}
            deckTitle={deck.title}
            cardCount={cards.length}
            randomize={randomize}
            setRandomize={setRandomize}
            varyDirection={varyDirection}
            setVaryDirection={setVaryDirection}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            showCount={mode === "test"}
            locked={locked}
            onStart={start}
            onCancel={() => (window.location.href = exitTarget)}
          />
        ) : (
          <Mode
            cards={isSpeaking ? cards : questions}
            onExit={() => (window.location.href = exitTarget)}
            onComplete={handleComplete}
            onSwapCard={swapCard}
            isTwoLanguages={deck.is_two_languages}
            sourceLang={resolvedSource}
            targetLang={resolvedTarget}
            deck={deck}
          />
        )}
      </main>
    </div>
  );
}