import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Minus, ArrowRight } from "lucide-react";
import ProgressGauge from "./ProgressGauge";

function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TestMode({ cards, onExit, onComplete }) {
  const defaultCount = Math.min(20, cards.length);
  const [phase, setPhase] = useState("setup");
  const [questionCount, setQuestionCount] = useState(defaultCount);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [value, setValue] = useState("");
  const [testCards, setTestCards] = useState([]);

  const start = () => {
    const count = Math.min(questionCount, cards.length);
    setTestCards(shuffle(cards).slice(0, count));
    setAnswers([]);
    setIndex(0);
    setValue("");
    setPhase("test");
  };

  const submitQuestion = () => {
    const newAnswers = [...answers, value.trim()];
    setAnswers(newAnswers);
    setValue("");
    if (index < testCards.length - 1) {
      setIndex(index + 1);
    } else {
      const score = testCards.reduce(
        (acc, card, i) => acc + (normalize(newAnswers[i]) === normalize(card.back) ? 1 : 0),
        0
      );
      onComplete?.({ cards_studied: testCards.length, score });
      setPhase("results");
    }
  };

  // Setup screen
  if (phase === "setup") {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="font-display text-4xl text-foreground tracking-tight">Test mode</h2>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          Type the definition for each term. You'll only see your score after submitting the entire test.
        </p>
        <div className="mt-8">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Number of questions
          </label>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
              className="w-10 h-10 border border-border font-mono text-lg hover:border-primary transition-colors rounded-md"
            >
              −
            </button>
            <input
              type="number"
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(Math.max(1, Math.min(cards.length, parseInt(e.target.value) || 1)))
              }
              min={1}
              max={cards.length}
              className="w-20 px-3 py-2.5 bg-card border border-border font-display text-2xl text-center focus:outline-none focus:border-primary rounded-md"
            />
            <button
              onClick={() => setQuestionCount(Math.min(cards.length, questionCount + 1))}
              className="w-10 h-10 border border-border font-mono text-lg hover:border-primary transition-colors rounded-md"
            >
              +
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Max {cards.length} {cards.length === 1 ? "card" : "cards"} in this set
          </p>
        </div>
        <button
          onClick={start}
          className="mt-8 px-8 py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
        >
          Start test
        </button>
        <button
          onClick={onExit}
          className="mt-3 block mx-auto font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Results screen
  if (phase === "results") {
    const score = testCards.reduce(
      (acc, card, i) => acc + (normalize(answers[i]) === normalize(card.back) ? 1 : 0),
      0
    );
    const pct = Math.round((score / testCards.length) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <span className="font-display text-2xl text-primary">{pct}%</span>
          </div>
          <h2 className="font-display text-4xl text-foreground tracking-tight">Test complete</h2>
          <p className="mt-3 font-body text-sm text-muted-foreground">
            You got <span className="text-foreground font-medium">{score}</span> out of{" "}
            <span className="text-foreground font-medium">{testCards.length}</span> correct.
          </p>
        </div>

        <div className="mt-8 divide-y divide-border border border-border rounded-md">
          {testCards.map((card, i) => {
            const correct = normalize(answers[i]) === normalize(card.back);
            const blank = !answers[i];
            return (
              <div key={card.id} className="p-4 flex items-start gap-3">
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
                  <p className="font-display text-base text-foreground">{card.front}</p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <p className={`font-body text-sm ${correct ? "text-positive" : "text-destructive"}`}>
                      <span className="text-muted-foreground">Your answer: </span>
                      {answers[i] || <span className="italic">— blank —</span>}
                    </p>
                    {!correct && (
                      <p className="font-body text-sm text-muted-foreground">
                        <span>Correct: </span>
                        <span className="text-foreground">{card.back}</span>
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

  // Test screen
  const card = testCards[index];
  if (!card) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <ProgressGauge current={index + 1} total={testCards.length} label="Question" />
        <button
          onClick={onExit}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="w-full max-w-2xl">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Term
        </span>
        <h3 className="font-display text-3xl text-foreground mt-3 mb-6">{card.front}</h3>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) submitQuestion();
          }}
          placeholder="Type the definition…"
          className="w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
        />

        <button
          onClick={submitQuestion}
          disabled={!value.trim()}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
        >
          {index < testCards.length - 1 ? (
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