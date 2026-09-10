import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ProgressGauge from "./ProgressGauge";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizMode({ cards, onExit, onComplete }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const card = cards[index];

  const options = useMemo(() => {
    if (!card) return [];
    const distractors = shuffle(cards.filter((c) => c.id !== card.id))
      .slice(0, 3)
      .map((c) => c.back);
    return shuffle([card.back, ...distractors]);
  }, [index, cards]);

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt);
    if (opt === card.back) setScore((s) => s + 1);
  };

  const next = () => {
    if (index >= cards.length - 1) onComplete?.({ cards_studied: cards.length, score });
    setSelected(null);
    setIndex((i) => i + 1);
  };

  if (!card) {
    return (
      <div className="text-center">
        <h2 className="font-display text-4xl text-foreground mb-2">Quiz Complete</h2>
        <p className="font-mono text-sm text-muted-foreground mb-6">
          You scored {score} / {cards.length}
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
        <ProgressGauge current={index + 1} total={cards.length} label="Question" />
        <button
          onClick={onExit}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="w-full max-w-xl">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Score: {score}
        </span>
        <h3 className="font-display text-3xl text-foreground mt-3 mb-8">{card.front}</h3>

        <div className="space-y-3">
          {options.map((opt) => {
            const isAnswer = opt === card.back;
            const isPicked = opt === selected;
            let cls = "border-border hover:border-primary/60";
            if (selected) {
              if (isAnswer) cls = "border-primary bg-primary/5";
              else if (isPicked) cls = "border-destructive bg-destructive/5";
              else cls = "border-border opacity-50";
            }
            return (
              <motion.button
                key={opt}
                onClick={() => choose(opt)}
                disabled={!!selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className={`w-full text-left p-4 border font-body text-sm flex items-center justify-between ${cls}`}
              >
                <span>{opt}</span>
                {selected && isAnswer && <Check className="w-4 h-4 text-primary" />}
                {selected && isPicked && !isAnswer && <X className="w-4 h-4 text-destructive" />}
              </motion.button>
            );
          })}
        </div>

        {selected && (
          <button
            onClick={next}
            className="mt-8 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {index < cards.length - 1 ? "Next question" : "See results"}
          </button>
        )}
      </div>
    </div>
  );
}