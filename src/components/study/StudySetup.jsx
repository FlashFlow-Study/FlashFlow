import React from "react";
import { Shuffle, ArrowLeftRight, ArrowRight } from "lucide-react";

export default function StudySetup({
  modeLabel,
  deckTitle,
  cardCount,
  randomize,
  setRandomize,
  varyDirection,
  setVaryDirection,
  questionCount,
  setQuestionCount,
  showCount,
  locked,
  onStart,
  onCancel,
}) {
  return (
    <div className="max-w-md mx-auto text-center">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {modeLabel} mode
      </span>
      <h2 className="mt-2 font-display text-4xl text-foreground tracking-tight">{deckTitle}</h2>
      <p className="mt-3 font-body text-sm text-muted-foreground">
        {cardCount} {cardCount === 1 ? "card" : "cards"} in this set.
      </p>

      <div className="mt-8 space-y-3 text-left">
        <Toggle
          icon={Shuffle}
          label="Shuffle question order"
          description="Randomize the order of questions each session."
          checked={randomize}
          onChange={setRandomize}
        />
        <Toggle
          icon={ArrowLeftRight}
          label="Vary question direction"
          description="Mix up whether you're shown the term or the definition."
          checked={varyDirection}
          onChange={setVaryDirection}
        />
      </div>

      {showCount && (
        <div className="mt-6">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Number of questions
          </label>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
              disabled={locked}
              className="w-10 h-10 border border-border font-mono text-lg hover:border-primary transition-colors rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              −
            </button>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(cardCount, parseInt(e.target.value) || 1)))}
              min={1}
              max={cardCount}
              disabled={locked}
              className="w-20 px-3 py-2.5 bg-card border border-border font-display text-2xl text-center focus:outline-none focus:border-primary rounded-md disabled:opacity-60"
            />
            <button
              onClick={() => setQuestionCount(Math.min(cardCount, questionCount + 1))}
              disabled={locked}
              className="w-10 h-10 border border-border font-mono text-lg hover:border-primary transition-colors rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {locked ? "Length set by your teacher" : `Max ${cardCount} in this set`}
          </p>
        </div>
      )}

      <button
        onClick={onStart}
        className="mt-8 px-8 py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md inline-flex items-center gap-2"
      >
        Start <ArrowRight className="w-4 h-4" />
      </button>
      <button
        onClick={onCancel}
        className="mt-3 block mx-auto font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}

function Toggle({ icon: Icon, label, description, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 p-4 border border-border bg-card rounded-md text-left hover:border-primary transition-colors"
    >
      <span className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <span>
          <span className="block font-body text-sm text-foreground">{label}</span>
          <span className="block font-body text-xs text-muted-foreground">{description}</span>
        </span>
      </span>
      <span className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-primary" : "bg-border"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-5" : "left-0.5"}`} />
      </span>
    </button>
  );
}