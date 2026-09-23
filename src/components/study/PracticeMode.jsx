import React, { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import ProgressGauge from "./ProgressGauge";
import SpecialCharToolbar from "@/components/SpecialCharToolbar";
import { shuffle } from "@/lib/studyCards";
import SpeakButton from "@/components/SpeakButton";

function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
function isAnswerCorrect(userAnswer, correctAnswer, isTwoLanguages) {
  const a = normalize(userAnswer);
  const b = normalize(correctAnswer);
  if (a === b) return true;
  if (isTwoLanguages) return false;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 5) return false;
  const threshold = Math.min(Math.max(1, Math.floor(maxLen / 5)), 4);
  return levenshtein(a, b) <= threshold;
}

export default function PracticeMode({ cards, onExit, onComplete, onSwapCard, isTwoLanguages, sourceLang, targetLang }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("choose"); // choose | type | done
  const [selected, setSelected] = useState(null);
  const [mcChecked, setMcChecked] = useState(false);
  const [value, setValue] = useState("");
  const [typeChecked, setTypeChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [markedCorrect, setMarkedCorrect] = useState(false);
  const activeInputRef = useRef(null);

  const card = cards[index];
  const promptLang = card?.flipped ? targetLang : sourceLang;
  const answerLang = card?.flipped ? sourceLang : targetLang;

  const options = useMemo(() => {
    if (!card) return [];
    const distractors = shuffle(cards.filter((c) => c.id !== card.id).map((c) => c.answer)).slice(0, Math.min(3, cards.length - 1));
    return shuffle([card.answer, ...distractors]);
  }, [index, cards, card]);

  if (!card || phase === "done") {
    return (
      <div className="text-center max-w-md mx-auto">
        <h2 className="font-display text-4xl text-foreground mb-2">Practice complete</h2>
        <p className="font-mono text-sm text-muted-foreground mb-6">
          You scored {score} / {cards.length}
        </p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
        >
          Back to deck
        </button>
      </div>
    );
  }

  const mcCorrect = selected === card.answer;
  const typeCorrect = isAnswerCorrect(value, card.answer, isTwoLanguages);
  const effectiveCorrect = typeCorrect || markedCorrect;

  const submitChoice = () => {
    if (selected == null) return;
    setMcChecked(true);
  };

  const goType = () => {
    setPhase("type");
    setValue("");
    setTypeChecked(false);
    setMarkedCorrect(false);
  };

  const checkType = () => {
    setTypeChecked(true);
    if (typeCorrect) setScore((s) => s + 1);
  };

  const next = () => {
    if (index >= cards.length - 1) {
      onComplete?.({ cards_studied: cards.length, score });
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setMcChecked(false);
    setValue("");
    setTypeChecked(false);
    setMarkedCorrect(false);
    setPhase("choose");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <div className="w-full mb-8 flex items-center justify-between">
        <ProgressGauge current={index + 1} total={cards.length} label="Question" />
        <button onClick={onExit} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
          Exit
        </button>
      </div>

      <div className="w-full">
        {phase === "choose" ? (
          <>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {card.promptLabel}
            </span>
            <h3 className="font-display text-3xl text-foreground mt-3 mb-6">{card.prompt}</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Pick the correct {card.answerLabel.toLowerCase()}
            </p>
            <div className="space-y-3">
              {options.map((opt) => {
                const isAnswer = opt === card.answer;
                const isPicked = opt === selected;
                let cls = "border-border hover:border-primary/60";
                if (mcChecked) {
                  if (isAnswer) cls = "border-primary bg-primary/5";
                  else if (isPicked) cls = "border-destructive bg-destructive/5";
                  else cls = "border-border opacity-50";
                }
                return (
                  <div key={opt} className="flex items-center gap-2">
                    {isTwoLanguages && <SpeakButton text={opt} lang={answerLang} />}
                    <motion.button
                      onClick={() => !mcChecked && setSelected(opt)}
                      disabled={mcChecked}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 }}
                      className={`flex-1 text-left p-4 border font-body text-sm flex items-center justify-between rounded-md ${cls}`}
                    >
                      <span>{opt}</span>
                      {mcChecked && isAnswer && <Check className="w-4 h-4 text-primary" />}
                      {mcChecked && isPicked && !isAnswer && <X className="w-4 h-4 text-destructive" />}
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {!mcChecked ? (
              <button
                onClick={submitChoice}
                disabled={selected == null}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
              >
                Submit answer
              </button>
            ) : (
              <div className="mt-6">
                <div className={`flex items-center gap-2 mb-3 ${mcCorrect ? "text-positive" : "text-destructive"}`}>
                  {mcCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span className="font-mono text-xs uppercase tracking-widest">{mcCorrect ? "Correct" : "Not quite"}</span>
                </div>
                {!mcCorrect && (
                  <p className="font-body text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <span>Correct {card.answerLabel.toLowerCase()}: <span className="text-foreground">{card.answer}</span></span>
                    {isTwoLanguages && <SpeakButton text={card.answer} lang={answerLang} />}
                  </p>
                )}
                <button
                  onClick={goType}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
                >
                  Type it to reinforce <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {card.promptLabel}
            </span>
            <h3 className="font-display text-3xl text-foreground mt-3 mb-6">{card.prompt}</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Now type the {card.answerLabel.toLowerCase()}
            </p>
            <input
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={(e) => { activeInputRef.current = { element: e.target, onChange: setValue }; }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!typeChecked) checkType();
                  else next();
                }
              }}
              disabled={typeChecked}
              placeholder={`Type the ${card.answerLabel.toLowerCase()}…`}
              className={`w-full px-4 py-3 bg-card border font-body text-sm focus:outline-none transition-colors rounded-md ${
                typeChecked
                  ? typeCorrect
                    ? "border-primary"
                    : "border-destructive"
                  : "border-border focus:border-primary"
              }`}
            />

            {!typeChecked && (
              <div className="mt-3 p-3 border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-md">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Special characters
                </p>
                <SpecialCharToolbar activeInputRef={activeInputRef} />
              </div>
            )}

            {typeChecked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 border border-border bg-card rounded-md"
              >
                <div className={`flex items-center gap-2 mb-2 ${effectiveCorrect ? "text-positive" : "text-destructive"}`}>
                  {effectiveCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span className="font-mono text-xs uppercase tracking-widest">{effectiveCorrect ? "Correct" : "Not quite"}</span>
                </div>
                <p className="font-body text-sm text-foreground flex items-center gap-2">
                  <span><span className="text-muted-foreground">Answer: </span>{card.answer}</span>
                  {isTwoLanguages && <SpeakButton text={card.answer} lang={answerLang} />}
                </p>
                {!typeCorrect && !markedCorrect && (
                  <button
                    onClick={() => { setMarkedCorrect(true); setScore((s) => s + 1); }}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-positive hover:text-positive transition-colors rounded-md"
                  >
                    <Check className="w-3.5 h-3.5" /> I was right — mark correct
                  </button>
                )}
              </motion.div>
            )}

            {!typeChecked ? (
              <button
                onClick={checkType}
                disabled={!value.trim()}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
              >
                Check answer
              </button>
            ) : (
              <button
                onClick={next}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md inline-flex items-center gap-2"
              >
                {index < cards.length - 1 ? "Next question" : "See results"} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}