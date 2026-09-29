import React from "react";

/**
 * Small, unobtrusive "Beta" status pill used to mark in-progress features
 * (e.g. Live games). Subtle amber pill, tiny uppercase mono text, dark-mode
 * compatible. Renders as an inline element so it sits beside any label/button.
 */
export default function BetaBadge({ className = "", title = "This feature is in beta" }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono uppercase tracking-widest text-[9px] px-1.5 py-0.5 leading-none ${className}`}
    >
      Beta
    </span>
  );
}