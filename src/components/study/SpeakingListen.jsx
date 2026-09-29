import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, VolumeX } from "lucide-react";
import ProgressGauge from "./ProgressGauge";
import SpeakButton from "@/components/SpeakButton";
import { speechSupported, pickVoice } from "@/lib/speech";
import { shuffle } from "@/lib/studyCards";

// Pacing for the spoken sequence (milliseconds).
const REP_PAUSE = 900; // between each repetition of the front word
const LONG_PAUSE = 1500; // after the 3rd repetition, before the back/definition
const ADVANCE_PAUSE = 1200; // before advancing to the next card

/**
 * Hands-free auditory revision mode. For every card, speaks the front word
 * three times (with a pause between each repetition), then — unless "front
 * only" is on — speaks the back definition once after a longer pause, then
 * advances after a comfortable pause. For two-language decks each side is
 * spoken in its own language; regular decks use the default voice.
 */
export default function SpeakingListen({ cards, onExit, onComplete, isTwoLanguages, sourceLang, targetLang }) {
  const supported = speechSupported();
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("front"); // "front" | "back" — visual only
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.85);
  const [frontOnly, setFrontOnly] = useState(false);
  const listenedRef = useRef(new Set());

  const card = cards[order[index]];

  // Drive the spoken sequence for the current card. Cancellation is handled by
  // a local `cancelled` flag plus a list of pending timers, both torn down in
  // the effect cleanup — so pause, stop, card change, and unmount all abort any
  // queued utterances and pending pauses cleanly.
  useEffect(() => {
    if (!playing || !supported || !card) {
      if (playing && !card) setPlaying(false);
      return;
    }
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
    const speakThen = (text, lang, onDone) => {
      if (cancelled || !text || !text.trim()) {
        onDone?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      if (lang) {
        u.lang = lang;
        const v = pickVoice(lang);
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

    const nextCard = () => {
      setPhase("front");
      setIndex((i) => {
        if (i + 1 < order.length) return i + 1;
        setPlaying(false);
        return i;
      });
    };

    const frontLang = isTwoLanguages ? sourceLang : null;
    const backLang = isTwoLanguages ? targetLang : null;

    setPhase("front");
    // Front word, 1st repetition
    speakThen(card.front, frontLang, () => {
      if (frontOnly || !card.back || !card.back.trim()) {
        listenedRef.current.add(order[index]);
        later(ADVANCE_PAUSE, nextCard);
        return;
      }
      later(REP_PAUSE, () =>
        // 2nd repetition
        speakThen(card.front, frontLang, () =>
          later(REP_PAUSE, () =>
            // 3rd repetition
            speakThen(card.front, frontLang, () => {
              if (frontOnly) {
                listenedRef.current.add(order[index]);
                later(ADVANCE_PAUSE, nextCard);
                return;
              }
              setPhase("back");
              later(LONG_PAUSE, () =>
                speakThen(card.back, backLang, () => {
                  listenedRef.current.add(order[index]);
                  later(ADVANCE_PAUSE, nextCard);
                })
              );
            })
          )
        )
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      synth.cancel();
    };
  }, [playing, index, order, rate, frontOnly, card, isTwoLanguages, sourceLang, targetLang, supported]);

  const togglePlay = () => setPlaying((p) => !p);
  const jump = (dir) => {
    if (supported) window.speechSynthesis.cancel();
    setPhase("front");
    setIndex((i) => Math.max(0, Math.min(order.length - 1, i + dir)));
  };
  const doShuffle = () => {
    if (supported) window.speechSynthesis.cancel();
    setOrder(shuffle(cards.map((_, i) => i)));
    setIndex(0);
    setPhase("front");
  };

  const stopAndFinish = () => {
    setPlaying(false);
    if (supported) window.speechSynthesis.cancel();
    onComplete?.({
      cards_studied: listenedRef.current.size || Math.min(index + 1, order.length),
      score: 0,
    });
  };

  if (!supported) {
    return (
      <div className="text-center max-w-md mx-auto">
        <VolumeX className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-3xl text-foreground">Speaking mode isn't available</h2>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          Your browser doesn't support speech synthesis. Try a modern browser like Chrome, Edge, or Safari to use Speaking mode.
        </p>
        <button
          onClick={() => {
            stopAndFinish();
            onExit();
          }}
          className="mt-6 px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <div className="w-full mb-6 flex items-center justify-between">
        <ProgressGauge current={index + 1} total={order.length} label="Card" />
        <button
          onClick={() => {
            stopAndFinish();
            onExit();
          }}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </div>

      <div className="w-full space-y-3">
        <div
          className={`p-5 border rounded-md ${
            phase === "front" && playing ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Front{isTwoLanguages && sourceLang ? ` · ${sourceLang}` : ""}
            </span>
            <SpeakButton text={card.front} lang={isTwoLanguages ? sourceLang : undefined} rate={rate} />
          </div>
          <p className="mt-2 font-display text-2xl text-foreground break-words">{card.front}</p>
        </div>

        {!frontOnly && (
          <div
            className={`p-5 border rounded-md ${
              phase === "back" && playing ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Back{isTwoLanguages && targetLang ? ` · ${targetLang}` : ""}
              </span>
              <SpeakButton text={card.back} lang={isTwoLanguages ? targetLang : undefined} rate={rate} />
            </div>
            <p className="mt-2 font-display text-2xl text-foreground break-words">{card.back}</p>
          </div>
        )}
      </div>

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
          <button
            onClick={() => setFrontOnly((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border font-mono text-xs uppercase tracking-widest transition-colors rounded-md"
          >
            <span className={frontOnly ? "text-primary" : "text-muted-foreground"}>
              {frontOnly ? "Front only" : "Front + back"}
            </span>
            <span
              className={`w-9 h-5 rounded-full relative transition-colors ${frontOnly ? "bg-primary" : "bg-border"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  frontOnly ? "left-4" : "left-0.5"
                }`}
              />
            </span>
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
          stopAndFinish();
          onExit();
        }}
        className="mt-8 px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
      >
        Back to deck
      </button>
    </div>
  );
}