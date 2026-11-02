import React, { useState, useMemo } from "react";
import { Download, ChevronDown, Star } from "lucide-react";
import {
  serializeSet,
  downloadFile,
  FORMAT_EXT,
  FORMAT_MIME,
  FORMAT_LABEL,
} from "@/lib/setFormats";

const FORMATS = ["csv", "json", "tab"];

export default function ExportMenu({ deck, cards, starredIds }) {
  const [open, setOpen] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const hasStarred = starredIds && starredIds.size > 0;
  const slug =
    (deck.title || "deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "deck";

  const exportCards = useMemo(
    () => (starredOnly && hasStarred ? cards.filter((c) => starredIds.has(c.id)) : cards),
    [cards, starredOnly, hasStarred, starredIds]
  );

  const exportAs = (format) => {
    const content = serializeSet(deck, exportCards, format);
    const suffix = starredOnly && hasStarred ? "-starred" : "";
    downloadFile(`${slug}${suffix}.${FORMAT_EXT[format]}`, content, FORMAT_MIME[format]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
      >
        <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-card border border-slate-200 rounded-md z-20 overflow-hidden shadow-sm">
            {hasStarred && (
              <label className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 cursor-pointer hover:bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={starredOnly}
                  onChange={(e) => setStarredOnly(e.target.checked)}
                  className="accent-amber-400"
                />
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Starred only ({starredIds.size})
                </span>
              </label>
            )}
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => exportAs(f)}
                disabled={starredOnly && hasStarred && exportCards.length === 0}
                className="w-full text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {FORMAT_LABEL[f]}
              </button>
            ))}
            {starredOnly && hasStarred && exportCards.length === 0 && (
              <p className="px-4 py-2 font-body text-[11px] text-muted-foreground">
                No starred cards to export.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}