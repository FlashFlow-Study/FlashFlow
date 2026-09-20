import React from "react";
import { Sparkles } from "lucide-react";

export default function TagSuggestions({ suggestions, currentTags, onAdd }) {
  const current = new Set((currentTags || []).map((t) => t.trim().toLowerCase()).filter(Boolean));
  const available = (suggestions || []).filter((s) => !current.has(String(s).toLowerCase()));
  if (!available.length) return null;
  return (
    <div className="mt-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 inline-flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-primary" /> Suggested tags
      </p>
      <div className="flex flex-wrap gap-1.5">
        {available.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onAdd(s)}
            className="px-2.5 py-1 text-xs font-mono lowercase border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}