import { useState, useRef, useCallback, useEffect } from "react";

// Whether the browser exposes the Web Speech recognition API.
export function recognitionSupported() {
  return (
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)
  );
}

/**
 * Wraps the browser's webkitSpeechRecognition for short, single-shot prompts.
 * `start(lang)` creates a fresh recognition instance (they're single-use),
 * sets its recognition language, and streams interim + final transcripts.
 * `stop()` aborts cleanly and suppresses the "no-speech" error that would
 * otherwise fire from an aborted/ended session.
 *
 * Returns { supported, listening, interim, error, start, stop }.
 */
export function useSpeechRecognition({ onResult, onError } = {}) {
  const supported = recognitionSupported();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      // Mark as manual so onend/onerror don't fire a spurious "no-speech".
      rec._manual = true;
      try {
        rec.stop();
      } catch (e) {}
      try {
        rec.abort();
      } catch (e) {}
    }
    setListening(false);
  }, []);

  const start = useCallback(
    (lang) => {
      if (!supported) return;
      stop();
      setInterim("");
      setError(null);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = lang || "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      let settled = false;

      rec.onstart = () => setListening(true);
      rec.onresult = (e) => {
        let final = "";
        let inter = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
          else inter += r[0].transcript;
        }
        if (inter) setInterim(inter);
        if (final) {
          settled = true;
          setInterim("");
          if (onResultRef.current) onResultRef.current(final);
        }
      };
      rec.onerror = (e) => {
        setListening(false);
        if (rec._manual) return;
        if (!settled) {
          settled = true;
          setError(e.error || "error");
          if (onErrorRef.current) onErrorRef.current(e.error || "error");
        }
      };
      rec.onend = () => {
        setListening(false);
        if (rec._manual) return;
        if (!settled) {
          settled = true;
          setError("no-speech");
          if (onErrorRef.current) onErrorRef.current("no-speech");
        }
      };

      recRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        setError("start_failed");
      }
    },
    [supported, stop]
  );

  // Abort any active recognition on unmount.
  useEffect(
    () => () => {
      if (recRef.current) {
        recRef.current._manual = true;
        try {
          recRef.current.abort();
        } catch (e) {}
      }
    },
    []
  );

  return { supported, listening, interim, error, start, stop };
}