import React from "react";
import { Repeat } from "lucide-react";

/**
 * Subtle "swap sides" control for a card. Tapping toggles the card's
 * term/definition orientation. `active` highlights when currently swapped.
 */
export default function SwapSidesButton({ onClick, active = false, className = "", title = "Swap sides" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center rounded-md transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-primary"
      } ${className}`}
    >
      <Repeat className="w-4 h-4" />
    </button>
  );
}