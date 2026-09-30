import React from "react";
import { Lock, Link2, Globe } from "lucide-react";

const OPTIONS = [
  { value: "private", label: "Private", icon: Lock },
  { value: "unlisted", label: "Unlisted", icon: Link2 },
  { value: "public", label: "Public", icon: Globe },
];

export default function VisibilityPicker({ value, onChange, block = false, className = "" }) {
  return (
    <div className={`${block ? "w-full flex" : "inline-flex"} border border-border rounded-md overflow-hidden ${className}`}>
      {OPTIONS.map((opt, i) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${block ? "flex-1" : ""} inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              i < OPTIONS.length - 1 ? "border-r border-border" : ""
            } ${active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="w-3 h-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}