import React, { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import {
  serializeSet,
  downloadFile,
  FORMAT_EXT,
  FORMAT_MIME,
  FORMAT_LABEL,
} from "@/lib/setFormats";

const FORMATS = ["csv", "json", "tab"];

export default function ExportMenu({ deck, cards }) {
  const [open, setOpen] = useState(false);
  const slug =
    (deck.title || "deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "deck";

  const exportAs = (format) => {
    const content = serializeSet(deck, cards, format);
    downloadFile(`${slug}.${FORMAT_EXT[format]}`, content, FORMAT_MIME[format]);
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
          <div className="absolute right-0 mt-2 w-44 bg-card border border-slate-200 rounded-md z-20 overflow-hidden shadow-sm">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => exportAs(f)}
                className="w-full text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-secondary transition-colors"
              >
                {FORMAT_LABEL[f]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}