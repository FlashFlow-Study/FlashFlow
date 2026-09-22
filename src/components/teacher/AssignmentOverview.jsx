import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, CheckCircle2, Clock, AlertCircle, Circle, RotateCcw } from "lucide-react";
import {
  completionStatus,
  statusBadgeClass,
  latenessSuffix,
  assignmentTotal,
  studentPct,
  fmtDate,
} from "@/lib/assignmentStatus";
import { modeLabel } from "@/lib/assignments";

const SORTS = [
  { key: "name", label: "Name" },
  { key: "status", label: "Completion" },
  { key: "score", label: "Score" },
  { key: "lateness", label: "Lateness" },
];

const STATUS_RANK = { done: 0, late: 1, notdone: 2, overdue: 3 };

export default function AssignmentOverview({ assignment, members, completions, onPickStudent }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");

  const completionByEmail = useMemo(() => {
    const map = {};
    (completions || []).forEach((c) => {
      if (c.student_email) map[c.student_email.toLowerCase()] = c;
    });
    return map;
  }, [completions]);

  const total = assignmentTotal(assignment);

  const rows = useMemo(() => {
    const list = members.map((m) => {
      const comp = completionByEmail[(m.student_email || "").toLowerCase()];
      const status = completionStatus(assignment, comp);
      const correct = comp?.questions_correct || 0;
      const pct = studentPct(correct, total);
      return { member: m, comp, status, correct, pct };
    });
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((r) => (r.member.student_email || "").toLowerCase().includes(q)) : list;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") return (a.member.student_email || "").localeCompare(b.member.student_email || "");
      if (sortKey === "status") return STATUS_RANK[a.status.key] - STATUS_RANK[b.status.key];
      if (sortKey === "score") return (b.pct ?? -1) - (a.pct ?? -1);
      if (sortKey === "lateness") return (b.status.daysLate || b.status.daysOverdue || 0) - (a.status.daysLate || a.status.daysOverdue || 0);
      return 0;
    });
    return sorted;
  }, [members, completionByEmail, assignment, total, query, sortKey]);

  // Class-level aggregates
  const doneCount = rows.filter((r) => r.status.key === "done" || r.status.key === "late").length;
  const lateCount = rows.filter((r) => r.status.key === "late").length;
  const incompleteCount = rows.length - doneCount;
  const avgCorrect = rows.length ? rows.reduce((s, r) => s + r.correct, 0) / rows.length : 0;
  const avgPct = total > 0 && rows.length ? Math.round((avgCorrect / total) * 100) : null;

  if (members.length === 0) {
    return (
      <div className="mt-4 p-8 border border-dashed border-slate-200 rounded-md text-center">
        <p className="font-body text-sm text-muted-foreground">
          No students have joined this class yet. Invite students from the class page to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 border border-border rounded-md bg-card">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Avg correct</p>
          <p className="mt-1 font-display text-2xl text-foreground">
            {avgPct != null ? `${avgPct}%` : "—"}
          </p>
          {total > 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {Math.round(avgCorrect * 10) / 10} / {total}
            </p>
          )}
        </div>
        <div className="p-4 border border-positive/30 bg-positive/5 rounded-md">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-positive">
            <CheckCircle2 className="w-3 h-3" /> Done
          </div>
          <p className="mt-1 font-display text-2xl text-foreground">{doneCount - lateCount}</p>
        </div>
        <div className="p-4 border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 rounded-md">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-600">
            <Clock className="w-3 h-3" /> Late
          </div>
          <p className="mt-1 font-display text-2xl text-foreground">{lateCount}</p>
        </div>
        <div className="p-4 border border-border rounded-md bg-card">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <AlertCircle className="w-3 h-3" /> Incomplete
          </div>
          <p className="mt-1 font-display text-2xl text-foreground">{incompleteCount}</p>
        </div>
      </div>

      {/* Search + sort */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest border rounded-md whitespace-nowrap transition-colors ${
                sortKey === s.key ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student table */}
      <div className="mt-4 border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Student</th>
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Correct</th>
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Total</th>
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">%</th>
              <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr
                key={r.member.id || r.member.student_email}
                onClick={() => onPickStudent?.(r.member, r.comp)}
                className="cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <td className="px-4 py-3 font-body text-foreground truncate max-w-[200px]">{r.member.student_email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border rounded ${statusBadgeClass(r.status.tone)}`}>
                    {r.status.label}
                    {latenessSuffix(r.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-body text-foreground">{r.correct}</td>
                <td className="px-4 py-3 text-right font-body text-muted-foreground">{total || "—"}</td>
                <td className="px-4 py-3 text-right font-body text-foreground">{r.pct != null ? `${r.pct}%` : "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtDate(r.comp?.completed_date)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center font-body text-sm text-muted-foreground">
                  No students match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Click a student to see detailed stats.
      </p>
    </div>
  );
}