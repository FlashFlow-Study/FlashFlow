import { useState, useEffect, useRef, useCallback } from "react";
import { pickVoice, speechSupported } from "@/lib/speech";

/**
 * Wraps the browser speechSynthesis API for one-off pronunciation playback.
 * Returns { speak, cancel, speaking, supported }.
 * `speak(text, lang, rate)` cancels any in-flight utterance and speaks `text`
 * using a voice matching `lang` (BCP-47), falling back to the default voice.
 */
export function useSpeech() {
  const supported = speechSupported();
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef(null);

  const speak = useCallback(
    (text, lang, rate = 1) => {
      if (!supported || !text || !text.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (lang) {
        u.lang = lang;
        const v = pickVoice(lang);
        if (v) u.voice = v;
      }
      u.rate = rate;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u;
      synth.speak(u);
    },
    [supported]
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  // Stop any speech if the component unmounts.
  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, cancel, speaking, supported };
}