import React from "react";
import { Star } from "lucide-react";

export default function StarToggle({ starred, onToggle, disabled }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      disabled={disabled}
      className="p-1.5 rounded transition-colors hover:bg-secondary disabled:opacity-30"
      title={starred ? "Unstar this card" : "Star this card"}
    >
      <Star
        className={`w-4 h-4 ${
          starred
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground hover:text-foreground"
        }`}
      />
    </button>
  );
}