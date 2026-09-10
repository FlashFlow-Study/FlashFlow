import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ProgressGauge from "./ProgressGauge";

function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export default function TypeMode({ cards, onExit, onComplete }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const card = cards[index];
  const correct = checked && normalize(value) === normalize(card.back);

  const check = () => {
    setChecked(true);
    if (normalize(value) === normalize(card.back)) setScore((s) => s + 1);
  };

  const next = () => {
    if (index >= cards.length - 1) onComplete?.({ cards_studied: cards.length, score });
    setValue("");
    setChecked(false);
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
          className="px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors"
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
          Term
        </span>
        <h3 className="font-display text-3xl text-foreground mt-3 mb-6">{card.front}</h3>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !checked) check();
            if (e.key === "Enter" && checked) next();
          }}
          disabled={checked}
          placeholder="Type the definition…"
          className={`w-full px-4 py-3 bg-card border font-body text-sm focus:outline-none transition-colors ${
            checked
              ? correct
                ? "border-primary"
                : "border-destructive"
              : "border-border focus:border-primary"
          }`}
        />

        {checked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 border border-border bg-card"
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
            {!correct && (
              <p className="font-body text-sm text-foreground">
                <span className="text-muted-foreground">Answer: </span>
                {card.back}
              </p>
            )}
          </motion.div>
        )}

        {!checked ? (
          <button
            onClick={check}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Check answer
          </button>
        ) : (
          <button
            onClick={next}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {index < cards.length - 1 ? "Next card" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}