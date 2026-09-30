import React, { useState, useRef } from "react";
import { Check, X, Minus, ArrowRight } from "lucide-react";
import ProgressGauge from "./ProgressGauge";
import SpecialCharToolbar from "@/components/SpecialCharToolbar";
import { playSound } from "@/lib/sounds";

function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export default function TestMode({ cards, onExit, onComplete }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const activeInputRef = useRef(null);

  const card = cards[index];

  const submitQuestion = () => {
    const newAnswers = [...answers, value.trim()];
    setAnswers(newAnswers);
    setValue("");
    if (index < cards.length - 1) {
      setIndex(index + 1);
    } else {
      const score = cards.reduce(
        (acc, c, i) => acc + (normalize(newAnswers[i]) === normalize(c.answer) ? 1 : 0),
        0
      );
      onComplete?.({ cards_studied: cards.length, score });
      setSubmitted(true);
      // Test answers are judged in a single batch at the end, so play one
      // outcome sound reflecting the overall result (majority correct = pass).
      playSound(score >= Math.ceil(cards.length / 2) ? "question-right" : "question-wrong");
    }
  };

  if (submitted) {
    const score = cards.reduce(
      (acc, c, i) => acc + (normalize(answers[i]) === normalize(c.answer) ? 1 : 0),
      0
    );
    const pct = Math.round((score / cards.length) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <span className="font-display text-2xl text-primary">{pct}%</span>
          </div>
          <h2 className="font-display text-4xl text-foreground tracking-tight">Test complete</h2>
          <p className="mt-3 font-body text-sm text-muted-foreground">
            You got <span className="text-foreground font-medium">{score}</span> out of{" "}
            <span className="text-foreground font-medium">{cards.length}</span> correct.
          </p>
        </div>

        <div className="mt-8 divide-y divide-border border border-border rounded-md">
          {cards.map((c, i) => {
            const correct = normalize(answers[i]) === normalize(c.answer);
            const blank = !answers[i];
            return (
              <div key={c.id} className="p-4 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {correct ? (
                    <Check className="w-5 h-5 text-positive" />
                  ) : blank ? (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <X className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base text-foreground">{c.prompt}</p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <p className={`font-body text-sm ${correct ? "text-positive" : "text-destructive"}`}>
                      <span className="text-muted-foreground">Your answer: </span>
                      {answers[i] || <span className="italic">— blank —</span>}
                    </p>
                    {!correct && (
                      <p className="font-body text-sm text-muted-foreground">
                        <span>Correct: </span>
                        <span className="text-foreground">{c.answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onExit}
          className="mt-8 mx-auto block px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <ProgressGauge current={index + 1} total={cards.length} label="Question" />
        <button
          onClick={onExit}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="w-full max-w-2xl">
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
            if (e.key === "Enter" && value.trim()) submitQuestion();
          }}
          placeholder={`Type the ${card.answerLabel.toLowerCase()}…`}
          className="w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
        />

        <div className="mt-3 p-3 border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-md">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Special characters
          </p>
          <SpecialCharToolbar activeInputRef={activeInputRef} />
        </div>

        <button
          onClick={submitQuestion}
          disabled={!value.trim()}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
        >
          {index < cards.length - 1 ? (
            <span className="inline-flex items-center gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </span>
          ) : (
            "Submit test"
          )}
        </button>
      </div>
    </div>
  );
}