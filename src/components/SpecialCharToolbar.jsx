import React from "react";

const SPECIAL_CHARS = [
  "à","á","â","ã","ä","å","æ","ç","è","é","ê","ë","ì","í","î","ï",
  "ñ","ò","ó","ô","õ","ö","ø","ù","ú","û","ü","ý","ÿ","ß","œ","\u2019",
  "À","Á","Â","Ã","Ä","Å","Æ","Ç","È","É","Ê","Ë","Ì","Í","Î","Ï",
  "Ñ","Ò","Ó","Ô","Õ","Ö","Ø","Ù","Ú","Û","Ü","Ý","Œ",
  "\u00BF","\u00A1","\u00AB","\u00BB","\u201C","\u201D","\u2018","\u2026",
];

/**
 * activeInputRef: a ref whose .current is set on input focus to
 * { element: <HTMLInputElement>, onChange: (newValue) => void }
 */
export default function SpecialCharToolbar({ activeInputRef }) {
  const insert = (char) => {
    const active = activeInputRef.current;
    if (!active?.element) return;
    const el = active.element;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newValue = el.value.slice(0, start) + char + el.value.slice(end);
    const newPos = start + char.length;
    active.onChange(newValue);
    // Update the DOM node's value/cursor synchronously so a rapid next click
    // reads the correct position instead of a stale one.
    el.value = newValue;
    el.setSelectionRange(newPos, newPos);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className="flex flex-wrap gap-1">
      {SPECIAL_CHARS.map((ch, i) => (
        <button
          key={`${ch}-${i}`}
          type="button"
          onClick={() => insert(ch)}
          className="min-w-[1.75rem] h-7 px-1 flex items-center justify-center text-sm font-body bg-background border border-border rounded hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}