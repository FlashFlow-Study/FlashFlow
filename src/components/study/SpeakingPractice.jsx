import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Mic, RotateCcw, Check, AlertCircle, Volume2 } from "lucide-react";
import ProgressGauge from "./ProgressGauge";
import SpeakButton from "@/components/SpeakButton";
import { speechSupported, pickVoice, languageLabel } from "@/lib/speech";
import { shuffle } from "@/lib/studyCards";
import { recognitionSupported, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { scorePronunciation } from "@/lib/pronunciation";
import SpeakingListen from "./SpeakingListen";

// Pacing for the spoken sequence (milliseconds).
const REP_PAUSE = 900; // between each repetition of the term
const LONG_PAUSE = 1500; // after the 3rd repetition, before the definition
const READY_DELAY = 500; // after the definition, before auto-starting the mic

/**
 * Pronunciation-practice mode. For each card: speaks the chosen term three
 * times with pauses, then the definition once; then enables the microphone so
 * the user repeats the term, scores what they said against the expected term,
 * and shows feedback (Perfect / Close / Try again) with what was heard. Falls
 * back to the hands-free SpeakingListen mode if speech recognition or the mic
 * is unavailable.
 */
export default function SpeakingPractice({
  cards,
  onExit,
  onComplete,
  side,
  lang,
  otherLang,
  isTwoLanguages,
  sourceLang,
  targetLang,
}) {
  const ttsSupported = speechSupported();
  const recSupported = recognitionSupported();
  const [micOk, setMicOk] = useState(null); // null = pending, true/false = resolved
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("speaking"); // speaking | ready | listening | feedback
  const [playing, setPlaying] = useState(true);
  const [rate, setRate] = useState(0.85);
  const [result, setResult] = useState(null);
  const statsRef = useRef({ attempts: 0, correct: 0, studied: new Set() });
  const termRef = useRef("");

  const card = cards[order[index]];
  const term = side === "front" ? card?.front : card?.back;
  const def = side === "front" ? card?.back : card?.front;
  const termLang = lang;
  const defLang = isTwoLanguages ? otherLang : lang;
  termRef.current = term;

  const handleResult = (finalText) => {
    const r = scorePronunciation(finalText, termRef.current);
    statsRef.current.attempts += 1;
    statsRef.current.studied.add(order[index]);
    if (r.verdict === "perfect" || r.verdict === "close") statsRef.current.correct += 1;
    setResult(r);
    setPhase("feedback");
  };
  const handleError = (err) => {
    if (err === "not-allowed" || err === "service-not-allowed") {
      setMicOk(false);
      return;
    }
    // no-speech / no-match / network — let the user retry.
    setResult({ verdict: "tryagain", score: 0, heard: "", expected: termRef.current, noSpeech: true });
    setPhase("feedback");
  };

  const { listening, interim, start, stop } = useSpeechRecognition({
    onResult: handleResult,
    onError: handleError,
  });

  // Request mic permission once, when the session starts.
  useEffect(() => {
    if (!recSupported) {
      setMicOk(false);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) setMicOk(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) setMicOk(true);
      } catch (e) {
        if (!cancelled) setMicOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const degraded = !recSupported || micOk === false;

  // Speak the term 3x, then the definition, then hand off to the user. Same
  // cancellation discipline as the listen mode: a `cancelled` flag + pending
  // timers torn down in cleanup, so pause / card change / unmount abort cleanly.
  useEffect(() => {
    if (!playing || phase !== "speaking" || !ttsSupported || !card) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    let cancelled = false;
    const timers = [];
    const later = (ms, fn) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };
    const speakThen = (text, l, onDone) => {
      if (cancelled || !text || !text.trim()) {
        if (!cancelled) onDone?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      if (l) {
        u.lang = l;
        const v = pickVoice(l);
        if (v) u.voice = v;
      }
      u.rate = rate;
      u.onend = () => {
        if (!cancelled) onDone?.();
      };
      u.onerror = () => {
        if (!cancelled) onDone?.();
      };
      synth.speak(u);
    };

    speakThen(term, termLang, () => {
      if (!def || !def.trim()) {
        if (!cancelled) setPhase("ready");
        return;
      }
      later(REP_PAUSE, () =>
        speakThen(term, termLang, () =>
          later(REP_PAUSE, () =>
            speakThen(term, termLang, () =>
              later(LONG_PAUSE, () =>
                speakThen(def, defLang, () => {
                  if (!cancelled) setPhase("ready");
                })
              )
            )
          )
        )
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      synth.cancel();
    };
  }, [playing, phase, index, order, rate, card, term, def, termLang, defLang, ttsSupported]);

  // After the spoken intro, automatically start listening for the user's turn.
  useEffect(() => {
    if (!playing || micOk !== true || phase !== "ready") return;
    const t = setTimeout(() => {
      setPhase("listening");
      start(lang);
    }, READY_DELAY);
    return () => clearTimeout(t);
  }, [playing, phase, micOk, lang, start]);

  // Abort recognition whenever we leave the listening phase.
  useEffect(() => {
    if (phase === "listening") return;
    stop();
  }, [phase, stop]);

  // Unmount cleanup — cancel any queued speech and the active recognition.
  useEffect(
    () => () => {
      if (ttsSupported) window.speechSynthesis.cancel();
      stop();
    },
    [stop, ttsSupported]
  );

  const speakTerm = () => {
    if (!ttsSupported || !term) return;
    stop();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(term);
    if (termLang) {
      u.lang = termLang;
      const v = pickVoice(termLang);
      if (v) u.voice = v;
    }
    u.rate = rate;
    synth.speak(u);
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      if (ttsSupported) window.speechSynthesis.cancel();
      stop();
      setPhase("ready");
    } else {
      setResult(null);
      setPhase("speaking");
      setPlaying(true);
    }
  };
  const jump = (dir) => {
    if (ttsSupported) window.speechSynthesis.cancel();
    stop();
    setResult(null);
    setIndex((i) => Math.max(0, Math.min(order.length - 1, i + dir)));
    setPhase("speaking");
  };
  const doShuffle = () => {
    if (ttsSupported) window.speechSynthesis.cancel();
    stop();
    setOrder(shuffle(cards.map((_, i) => i)));
    setIndex(0);
    setResult(null);
    setPhase("speaking");
  };
  const retry = () => {
    setResult(null);
    setPhase("ready");
  };
  const next = () => {
    setResult(null);
    if (index + 1 < order.length) {
      setIndex((i) => i + 1);
      setPhase("speaking");
    } else {
      finish();
    }
  };
  const finish = () => {
    setPlaying(false);
    if (ttsSupported) window.speechSynthesis.cancel();
    stop();
    onComplete?.({
      cards_studied: statsRef.current.studied.size || Math.min(index + 1, order.length),
      score: statsRef.current.correct,
    });
  };

  if (degraded) {
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
  if (!card) return null;

  const verdictStyles = {
    perfect: "border-positive bg-positive/5",
    close: "border-primary bg-primary/5",
    tryagain: "border-destructive/40 bg-destructive/5",
  };
  const verdictText = { perfect: "Perfect!", close: "Close", tryagain: "Try again" };
  const verdictIcon = {
    perfect: <Check className="w-5 h-5 text-positive" />,
    close: <Check className="w-5 h-5 text-primary" />,
    tryagain: <AlertCircle className="w-5 h-5 text-destructive" />,
  };

  const showMic = phase === "ready" || phase === "listening";

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <div className="w-full mb-6 flex items-center justify-between">
        <ProgressGauge current={index + 1} total={order.length} label="Card" />
        <button
          onClick={() => {
            finish();
            onExit();
          }}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="w-full space-y-3">
        {/* Term card — the thing the user repeats */}
        <div
          className={`p-5 border rounded-md ${
            phase === "speaking" || phase === "ready" || phase === "listening"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {side === "front" ? "Term" : "Definition"} · {languageLabel(termLang) || termLang || "Default"}
            </span>
            <SpeakButton text={term} lang={termLang} rate={rate} title="Hear the term" />
          </div>
          <p className="mt-2 font-display text-2xl text-foreground break-words">{term}</p>
        </div>

        {/* Definition card — context */}
        {def && def.trim() && (
          <div className="p-5 border border-border bg-card rounded-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {side === "front" ? "Definition" : "Term"} · {isTwoLanguages ? languageLabel(defLang) || defLang || "Default" : ""}
              </span>
              <SpeakButton text={def} lang={isTwoLanguages ? defLang : undefined} rate={rate} />
            </div>
            <p className="mt-2 font-display text-2xl text-foreground break-words">{def}</p>
          </div>
        )}
      </div>

      {/* Pronunciation / mic + feedback panel */}
      <div className="mt-6 w-full">
        {phase === "speaking" && (
          <div className="flex items-center justify-center gap-3 py-6 border border-border rounded-md bg-card">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Listen…</span>
          </div>
        )}

        {showMic && (
          <div className="flex flex-col items-center gap-3 py-6 border border-primary/40 rounded-md bg-primary/5">
            <Mic className={`w-8 h-8 text-primary ${listening ? "animate-pulse" : ""}`} />
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              {listening ? "Listening — say the term" : "Your turn"}
            </p>
            <p className="font-display text-xl text-foreground break-words text-center">{term}</p>
            {interim && (
              <p className="font-body text-sm text-muted-foreground italic text-center break-words">
                “{interim}”
              </p>
            )}
          </div>
        )}

        {phase === "feedback" && result && (
          <div className={`p-5 border rounded-md ${verdictStyles[result.verdict]}`}>
            <div className="flex items-center gap-2">
              {verdictIcon[result.verdict]}
              <span className="font-display text-2xl text-foreground">{verdictText[result.verdict]}</span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {Math.round(result.score * 100)}% match
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm font-body">
              <div className="flex gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground w-16 shrink-0 pt-0.5">
                  You said
                </span>
                <span className="text-foreground break-words">
                  {result.heard ? `"${result.heard}"` : result.noSpeech ? "— (nothing heard)" : "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground w-16 shrink-0 pt-0.5">
                  Expected
                </span>
                <span className="text-muted-foreground break-words">{result.expected}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={speakTerm}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
              >
                <Volume2 className="w-3.5 h-3.5" /> Hear again
              </button>
              <button
                onClick={retry}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
              >
                {index + 1 < order.length ? "Next" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transport controls — consistent with the other study modes */}
      <div className="mt-8 flex flex-col items-center gap-5 w-full">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => jump(-1)}
            disabled={index === 0}
            className="w-12 h-12 inline-flex items-center justify-center border border-border font-mono hover:border-primary disabled:opacity-30 transition-colors rounded-md"
            aria-label="Previous card"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 inline-flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-full"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>
          <button
            onClick={() => jump(1)}
            disabled={index >= order.length - 1}
            className="w-12 h-12 inline-flex items-center justify-center border border-border font-mono hover:border-primary disabled:opacity-30 transition-colors rounded-md"
            aria-label="Next card"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={doShuffle}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
          >
            <Shuffle className="w-3.5 h-3.5" /> Shuffle
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 w-full max-w-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Speed</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="font-mono text-xs text-foreground w-10 text-right">{rate.toFixed(1)}x</span>
        </div>
      </div>

      <button
        onClick={() => {
          finish();
          onExit();
        }}
        className="mt-8 px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
      >
        Back to deck
      </button>
    </div>
  );
}