import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ProgressGauge from "./ProgressGauge";
import SpecialCharToolbar from "@/components/SpecialCharToolbar";

function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function isAnswerCorrect(userAnswer, correctAnswer, isTwoLanguages) {
  const a = normalize(userAnswer);
  const b = normalize(correctAnswer);
  if (a === b) return true;
  if (isTwoLanguages) return false;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 5) return false;
  const threshold = Math.min(Math.max(1, Math.floor(maxLen / 5)), 4);
  return levenshtein(a, b) <= threshold;
}

export default function TypeMode({ cards, onExit, onComplete, isTwoLanguages }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [markedCorrect, setMarkedCorrect] = useState(false);
  const activeInputRef = useRef(null);

  const card = cards[index];
  const correct = checked && (isAnswerCorrect(value, card.answer, isTwoLanguages) || markedCorrect);

  const check = () => {
    setChecked(true);
    if (isAnswerCorrect(value, card.answer, isTwoLanguages)) setScore((s) => s + 1);
  };

  const next = () => {
    if (index >= cards.length - 1) onComplete?.({ cards_studied: cards.length, score });
    setValue("");
    setChecked(false);
    setMarkedCorrect(false);
    setIndex((i) => i + 1);
  };

  if (!card) {
    return (
      <div className="text-center">
        <h2 className="font-display text-4xl text-foreground mb-2">Type Round Complete</h2>
        <p className="font-mono text-sm text-muted-foreground mb-6">
          Finished {cards.length} cards
        </p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xl mb-8 flex items-center justify-between">
        <ProgressGauge current={index + 1} total={cards.length} label="Card" />
        <button
          onClick={onExit}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="w-full max-w-xl">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {card.promptLabel}
        </span>
        <h3 className="font-display text-3xl text-foreground mt-3 mb-6">{card.prompt}</h3>

        <input
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => { activeInputRef.current = { element: e.target, onChange: setValue }; }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !checked) check();
            if (e.key === "Enter" && checked) next();
          }}
          disabled={checked}
          placeholder={`Type the ${card.answerLabel.toLowerCase()}…`}
          className={`w-full px-4 py-3 bg-card border font-body text-sm focus:outline-none transition-colors rounded-md ${
            checked
              ? correct
                ? "border-primary"
                : "border-destructive"
              : "border-border focus:border-primary"
          }`}
        />

        {!checked && (
          <div className="mt-3 p-3 border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-md">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Special characters
            </p>
            <SpecialCharToolbar activeInputRef={activeInputRef} />
          </div>
        )}

        {checked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 border border-border bg-card rounded-md"
          >
            <div className="flex items-center gap-2 mb-2">
              {correct ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {correct ? "Correct" : "Not quite"}
              </span>
            </div>
            <p className="font-body text-sm text-foreground">
              <span className="text-muted-foreground">Answer: </span>
              {card.answer}
            </p>
            {!isAnswerCorrect(value, card.answer, isTwoLanguages) && !markedCorrect && (
              <button
                onClick={() => { setMarkedCorrect(true); setScore((s) => s + 1); }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-positive hover:text-positive transition-colors rounded-md"
              >
                <Check className="w-3.5 h-3.5" /> I was right — mark correct
              </button>
            )}
          </motion.div>
        )}

        {!checked ? (
          <button
            onClick={check}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            Check answer
          </button>
        ) : (
          <button
            onClick={next}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            {index < cards.length - 1 ? "Next card" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}