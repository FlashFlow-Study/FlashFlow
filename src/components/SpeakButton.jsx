import React from "react";
import { Volume2 } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * Small speaker button that pronounces `text` using the browser speechSynthesis.
 * `lang` is a BCP-47 code (e.g. "fr-FR"); omit for the default voice.
 * Renders nothing when speech synthesis isn't available (no broken button).
 */
export default function SpeakButton({ text, lang, rate = 1, className = "", title = "Pronounce" }) {
  const { speak, speaking, supported } = useSpeech();
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang, rate);
      }}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center rounded-md transition-colors ${
        speaking ? "text-primary" : "text-muted-foreground hover:text-primary"
      } ${className}`}
    >
      <Volume2 className="w-4 h-4" />
    </button>
  );
}