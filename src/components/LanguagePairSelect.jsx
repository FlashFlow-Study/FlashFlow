import React from "react";
import { LANGUAGES } from "@/lib/speech";

/**
 * Source / target language pickers for two-language decks.
 * Convention: front cards use the source language, back cards use the target language.
 */
export default function LanguagePairSelect({ sourceLang, setSourceLang, targetLang, setTargetLang }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Source language (front)
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
          >
            <option value="">Browser default</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Target language (back)
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full mt-1 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
          >
            <option value="">Browser default</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
        Front cards use the source language; back cards use the target language. Pronunciation uses these for audio.
      </p>
    </div>
  );
}