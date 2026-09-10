import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Lock, Layers } from "lucide-react";

export default function DeckCard({ deck, index = 0, cardCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
    >
      <Link
        to={`/deck/${deck.id}`}
        className="group block h-full bg-card border border-border p-6 transition-colors hover:border-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl leading-tight text-foreground tracking-tight">
            {deck.title}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border ${
              deck.is_public
                ? "border-primary/30 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {deck.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {deck.is_public ? "Public" : "Private"}
          </span>
        </div>
        {deck.description ? (
          <p className="mt-3 text-sm font-body text-muted-foreground line-clamp-2">
            {deck.description}
          </p>
        ) : (
          <p className="mt-3 text-sm font-body text-muted-foreground italic">No description</p>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            {cardCount ?? "—"} cards
          </span>
          {deck.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {deck.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}