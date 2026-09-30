import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, RotateCw, ChevronLeft, Volume2 } from "lucide-react";
import ProgressGauge from "./ProgressGauge";
import SpeakButton from "@/components/SpeakButton";
import SwapSidesButton from "@/components/SwapSidesButton";
import { useSpeech } from "@/hooks/useSpeech";
import { playSound } from "@/lib/sounds";

export default function FlashcardMode({ cards, onExit, onComplete, onSwapCard, isTwoLanguages, sourceLang, targetLang }) {
  const [phase, setPhase] = useState("study"); // "study" | "review" | "done"
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({}); // { [cardId]: { correct, firstTry } }
  const [reviewQueue, setReviewQueue] = useState([]);
  const [round, setRound] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const { speak, cancel } = useSpeech();

  const activeCards = phase === "review" ? reviewQueue : cards;
  const card = activeCards[index];
  const promptLang = card?.flipped ? targetLang : sourceLang;
  const answerLang = card?.flipped ? sourceLang : targetLang;

  const finish = (finalResults) => {
    setPhase("done");
    const firstTryCorrect = cards.filter(
      (c) => finalResults[c.id]?.correct && finalResults[c.id]?.firstTry
    ).length;
    onComplete?.({ cards_studied: cards.length, score: firstTryCorrect });
  };

  const markAnswer = (correct) => {
    playSound(correct ? "question-right" : "question-wrong");
    const existing = results[card.id];
    const newResults = {
      ...results,
      [card.id]: {
        correct,
        firstTry: existing ? existing.firstTry : phase === "study",
      },
    };
    setResults(newResults);
    setFlipped(false);

    if (index < activeCards.length - 1) {
      setIndex(index + 1);
    } else if (phase === "study") {
      const wrong = cards.filter((c) => newResults[c.id] && !newResults[c.id].correct);
      if (wrong.length > 0) {
        setReviewQueue(wrong);
        setPhase("review");
        setRound(2);
        setIndex(0);
      } else {
        finish(newResults);
      }
    } else {
      const stillWrong = reviewQueue.filter((c) => newResults[c.id] && !newResults[c.id].correct);
      if (stillWrong.length > 0 && round < 3) {
        setReviewQueue(stillWrong);
        setRound((r) => r + 1);
        setIndex(0);
      } else {
        finish(newResults);
      }
    }
  };

  const prev = () => {
    setFlipped(false);
    if (index > 0) setIndex(index - 1);
  };

  useEffect(() => {
    if (!isTwoLanguages || !autoPlay) return;
    if (flipped && card) speak(card.answer, answerLang);
    else cancel();
    return () => cancel();
  }, [flipped, index, autoPlay, isTwoLanguages, card, answerLang, speak, cancel]);

  if (phase === "done") {
    const firstTry = cards.filter((c) => results[c.id]?.firstTry).length;
    const totalCorrect = cards.filter((c) => results[c.id]?.correct).length;
    const hadReview = reviewQueue.length > 0 || Object.values(results).some((r) => !r.firstTry && r.correct !== undefined);
    return (
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-positive/15 flex items-center justify-center mb-5">
          <Check className="w-8 h-8 text-positive" />
        </div>
        <h2 className="font-display text-3xl text-foreground">Session complete</h2>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          You studied {cards.length} {cards.length === 1 ? "card" : "cards"}.
        </p>
        <div className="mt-6 w-full space-y-3">
          <div className="flex items-center justify-between p-4 border border-border bg-card rounded-md">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Correct on first try</span>
            <span className="font-display text-2xl text-positive">{firstTry} / {cards.length}</span>
          </div>
          {hadReview && (
            <div className="flex items-center justify-between p-4 border border-border bg-card rounded-md">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Correct after review</span>
              <span className="font-display text-2xl text-primary">{totalCorrect} / {cards.length}</span>
            </div>
          )}
        </div>
        <button
          onClick={onExit}
          className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl">
      <div className="w-full mb-6 flex items-center justify-between gap-3">
        <ProgressGauge
          current={index + 1}
          total={activeCards.length}
          label={phase === "review" ? "Review" : "Card"}
        />
        {isTwoLanguages && (
          <button
            onClick={() => setAutoPlay((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-colors rounded-md shrink-0 ${
              autoPlay ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" /> Auto-pronounce
          </button>
        )}
        <SwapSidesButton
          onClick={() => {
            setFlipped(false);
            onSwapCard?.(card.id);
          }}
          active={card?.orientation === "swapped"}
          title="Swap this card's sides"
        />
        <button
          onClick={onExit}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      {phase === "review" && (
        <span className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 border border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400 rounded-full font-mono text-[10px] uppercase tracking-widest">
          Round {round} — re-study missed cards
        </span>
      )}

      <div
        className="w-full h-[28rem] cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          key={card.id}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-card border border-border p-8 text-center rounded-md"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
              {card.promptLabel}
            </span>
            {isTwoLanguages && (
              <span className="absolute top-3 right-3">
                <SpeakButton text={card.prompt} lang={promptLang} />
              </span>
            )}
            <p className="font-display text-4xl leading-snug text-foreground">{card.prompt}</p>
            <span className="absolute bottom-4 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <RotateCw className="w-3 h-3" /> Click to flip
            </span>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-primary text-primary-foreground p-8 text-center rounded-md"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-4">
              {card.answerLabel}
            </span>
            {isTwoLanguages && (
              <span className="absolute top-3 right-3">
                <SpeakButton text={card.answer} lang={answerLang} />
              </span>
            )}
            <p className="font-display text-3xl leading-snug">{card.answer}</p>
            <span className="absolute bottom-4 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest opacity-70">
              <RotateCw className="w-3 h-3" /> Click to flip back
            </span>
          </div>
        </motion.div>
      </div>

      {/* Answer checker — only after flipping */}
      {flipped ? (
        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={() => markAnswer(false)}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-destructive/30 text-destructive font-mono text-xs uppercase tracking-widest hover:bg-destructive/5 hover:border-destructive transition-colors rounded-md"
          >
            <X className="w-4 h-4" /> Missed it
          </button>
          <button
            onClick={() => markAnswer(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-positive text-positive-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Check className="w-4 h-4" /> Got it
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest disabled:opacity-30 hover:border-primary disabled:hover:border-border transition-colors rounded-md"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button
            onClick={() => setFlipped(true)}
            className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
          >
            <RotateCw className="w-3.5 h-3.5 inline mr-1.5" /> Flip
          </button>
        </div>
      )}
    </div>
  );
}