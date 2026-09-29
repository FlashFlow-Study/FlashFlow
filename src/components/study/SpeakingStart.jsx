import React, { useState } from "react";
import { Mic, Headphones, ArrowRight, Volume2 } from "lucide-react";
import { LANGUAGES, languageLabel } from "@/lib/speech";
import SpeakButton from "@/components/SpeakButton";

/**
 * Start screen for Speaking mode. Lets the user pick a practice style
 * (pronunciation practice with the mic, or hands-free listening), which side
 * of the set to practice, and — for single-language decks — confirm the
 * recognition language. Calls onStart(mode, side, lang) when ready.
 */
export default function SpeakingStart({
  isTwoLanguages,
  sourceLang,
  targetLang,
  singleLang,
  recognitionSupported,
  sampleFront,
  sampleBack,
  onCancel,
  onStart,
}) {
  const [mode, setMode] = useState(recognitionSupported ? "practice" : "listen");
  const [side, setSide] = useState("front");
  const [lang, setLang] = useState(singleLang || "en-US");

  const practicing = mode === "practice";
  const frontLang = isTwoLanguages ? sourceLang : practicing ? lang : undefined;
  const backLang = isTwoLanguages ? targetLang : practicing ? lang : undefined;
  const frontLabel = isTwoLanguages
    ? languageLabel(sourceLang)
    : practicing
    ? languageLabel(lang)
    : "Default voice";
  const backLabel = isTwoLanguages
    ? languageLabel(targetLang)
    : practicing
    ? languageLabel(lang)
    : "Default voice";

  const handleStart = () => {
    const sideLang = isTwoLanguages
      ? side === "front"
        ? sourceLang
        : targetLang
      : practicing
      ? lang
      : undefined;
    onStart(mode, side, sideLang);
  };

  const modeBtn = (active, icon, label, desc, onClick) => (
    <button
      onClick={onClick}
      className={`text-left p-4 border rounded-md transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
        <span className="font-display text-base text-foreground">{label}</span>
      </div>
      <p className="mt-1 font-body text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );

  const sideCard = (which, label, langLabel, sample, speakLang, selected, onSelect) => (
    <button
      onClick={onSelect}
      className={`text-left p-4 border rounded-md transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {sample && (
          <SpeakButton text={sample} lang={speakLang} className="text-muted-foreground" title={`Hear ${label}`} />
        )}
      </div>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary/80">
        {langLabel || "—"}
      </p>
      <p className="mt-2 font-body text-sm text-foreground line-clamp-2 break-words">
        {sample || "—"}
      </p>
    </button>
  );

  return (
    <div className="max-w-2xl w-full">
      <div className="text-center mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Speaking mode</span>
        <h1 className="mt-2 font-display text-4xl text-foreground tracking-tight">How do you want to study?</h1>
        <p className="mt-3 font-body text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Listen to each term pronounced, then{" "}
          {recognitionSupported ? "repeat it out loud and get instant feedback." : "follow along hands-free."}
        </p>
      </div>

      {recognitionSupported ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {modeBtn(
            practicing,
            <Mic className="w-5 h-5" />,
            "Pronunciation practice",
            "Hear the term, then say it — we'll score your pronunciation.",
            () => setMode("practice")
          )}
          {modeBtn(
            !practicing,
            <Headphones className="w-5 h-5" />,
            "Hands-free listening",
            "Just listen and follow along — no microphone needed.",
            () => setMode("listen")
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 border border-border rounded-md flex items-center gap-3 bg-card">
          <Headphones className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="font-body text-sm text-muted-foreground">
            Pronunciation practice isn't available in this browser. You can still use hands-free listening.
          </p>
        </div>
      )}

      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        Which side do you want to {practicing ? "practice" : "hear"}?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {sideCard("front", "Front", frontLabel, sampleFront, frontLang, side === "front", () => setSide("front"))}
        {sideCard("back", "Back", backLabel, sampleBack, backLang, side === "back", () => setSide("back"))}
      </div>

      {!isTwoLanguages && practicing && (
        <div className="mb-6 p-4 border border-border rounded-md bg-card">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Recognition language
          </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="mt-2 w-full px-3 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-2 font-body text-xs text-muted-foreground">
            Confirm the language you'll be speaking in — it's used for both pronunciation and listening.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleStart}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
        >
          Start <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}