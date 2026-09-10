import React, { useMemo } from "react";

export default function ProgressGauge({ current, total, label }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const size = 96;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = useMemo(() => circ - (pct / 100) * circ, [circ, pct]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl text-foreground">{pct}%</span>
        </div>
      </div>
      {label && (
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {label}
          <div className="font-mono text-sm text-foreground normal-case tracking-normal mt-1">
            {current} / {total}
          </div>
        </div>
      )}
    </div>
  );
}