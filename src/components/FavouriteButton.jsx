import React from "react";
import { Heart } from "lucide-react";

// A heart toggle for bookmarking a deck. Clicks never trigger the surrounding
// link — callers pass `favourited` (current state) and `onToggle` (action).
export default function FavouriteButton({ favourited, onToggle, size = "w-4 h-4", className = "" }) {
  if (!onToggle) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
      title={favourited ? "Remove from favourites" : "Add to favourites"}
      className={`p-1 rounded-md hover:bg-secondary transition-colors ${className}`}
    >
      <Heart
        className={`${size} transition-colors ${
          favourited
            ? "fill-rose-500 text-rose-500"
            : "text-muted-foreground hover:text-rose-500"
        }`}
      />
    </button>
  );
}