import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import ProgressGauge from "./ProgressGauge";

export default function FlashcardMode({ cards, onExit }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const next = () => {
    setFlipped(false);
    if (index < cards.length - 1) setIndex(index + 1);
  };
  const prev = () => {
    setFlipped(false);
    if (index > 0) setIndex(index - 1);
  };

  if (!card) return null;

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

      <div
        className="w-full max-w-xl h-80 cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-card border border-border p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Term
            </span>
            <p className="font-display text-3xl leading-snug text-foreground">{card.front}</p>
            <span className="absolute bottom-4 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <RotateCw className="w-3 h-3" /> Click to flip
            </span>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-primary text-primary-foreground p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-4">
              Definition
            </span>
            <p className="font-display text-2xl leading-snug">{card.back}</p>
            <span className="absolute bottom-4 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest opacity-70">
              <RotateCw className="w-3 h-3" /> Click to flip
            </span>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={prev}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest disabled:opacity-30 hover:border-primary disabled:hover:border-border transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors"
        >
          Flip
        </button>
        <button
          onClick={next}
          disabled={index === cards.length - 1}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest disabled:opacity-30 hover:border-primary disabled:hover:border-border transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}