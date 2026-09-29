import React, { useState } from "react";
import { VolumeX } from "lucide-react";
import { speechSupported } from "@/lib/speech";
import { recognitionSupported } from "@/hooks/useSpeechRecognition";
import SpeakingStart from "./SpeakingStart";
import SpeakingListen from "./SpeakingListen";
import SpeakingPractice from "./SpeakingPractice";

/**
 * Orchestrates the Speaking study mode. Shows a start screen where the user
 * picks a practice style (pronunciation practice or hands-free listening) and
 * the side/language to practice, then renders the chosen mode. Speech
 * synthesis is required for either mode; speech recognition + mic permission
 * are required for pronunciation practice, and the practice mode degrades to
 * hands-free listening on its own when those are unavailable.
 */
export default function SpeakingMode({ cards, onExit, onComplete, isTwoLanguages, sourceLang, targetLang, deck }) {
  const ttsSupported = speechSupported();
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("practice");
  const [side, setSide] = useState("front");
  const [lang, setLang] = useState("");
  const [otherLang, setOtherLang] = useState("");

  if (!ttsSupported) {
    return (
      <div className="text-center max-w-md mx-auto">
        <VolumeX className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-3xl text-foreground">Speaking mode isn't available</h2>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          Your browser doesn't support speech synthesis. Try a modern browser like Chrome, Edge, or Safari to use Speaking mode.
        </p>
        <button
          onClick={onExit}
          className="mt-6 px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <SpeakingStart
        isTwoLanguages={isTwoLanguages}
        sourceLang={sourceLang}
        targetLang={targetLang}
        singleLang={deck?.source_lang || "en-US"}
        recognitionSupported={recognitionSupported()}
        sampleFront={cards[0]?.front}
        sampleBack={cards[0]?.back}
        onCancel={onExit}
        onStart={(m, s, sideLang) => {
          setMode(m);
          setSide(s);
          setLang(sideLang);
          setOtherLang(isTwoLanguages ? (s === "front" ? targetLang : sourceLang) : sideLang);
          setStarted(true);
        }}
      />
    );
  }

  if (mode === "practice") {
    return (
      <SpeakingPractice
        cards={cards}
        onExit={onExit}
        onComplete={onComplete}
        side={side}
        lang={lang}
        otherLang={otherLang}
        isTwoLanguages={isTwoLanguages}
        sourceLang={sourceLang}
        targetLang={targetLang}
      />
    );
  }

  return (
    <SpeakingListen
      cards={cards}
      onExit={onExit}
      onComplete={onComplete}
      isTwoLanguages={isTwoLanguages}
      sourceLang={sourceLang}
      targetLang={targetLang}
    />
  );
}