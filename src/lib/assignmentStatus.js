// Completion status + lateness helpers for the Teacher Dashboard.
// Lateness is always expressed in whole calendar days.

function dayOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const DAY_MS = 86400000;

/**
 * Returns { key, label, tone, daysLate?, daysOverdue? } for a student's
 * completion record against an assignment.
 *
 *  - completed on/before due  -> "Done"
 *  - completed after due       -> "Done, but late" (+ daysLate, never 0)
 *  - not done + due passed     -> "Overdue" (+ daysOverdue)
 *  - not done + due in future  -> "Not done"
 */
export function completionStatus(assignment, completion) {
  const due = assignment?.due_date ? dayOnly(assignment.due_date) : null;
  const now = dayOnly(new Date());
  const isDone = completion?.status === "completed";

  if (isDone) {
    const completed = completion?.completed_date ? dayOnly(completion.completed_date) : null;
    if (due && completed && completed > due) {
      const days = Math.round((completed - due) / DAY_MS);
      if (days > 0) return { key: "late", label: "Done, but late", daysLate: days, tone: "amber" };
    }
    return { key: "done", label: "Done", tone: "positive" };
  }

  if (due && now > due) {
    const days = Math.round((now - due) / DAY_MS);
    return { key: "overdue", label: "Overdue", daysOverdue: days, tone: "destructive" };
  }
  return { key: "notdone", label: "Not done", tone: "muted" };
}

export function statusBadgeClass(tone) {
  return {
    positive: "border-positive/30 text-positive bg-positive/5",
    amber: "border-amber-400/40 text-amber-600 bg-amber-50 dark:bg-amber-950/20",
    destructive: "border-destructive/30 text-destructive bg-destructive/5",
    muted: "border-border text-muted-foreground",
  }[tone] || "border-border text-muted-foreground";
}

export function latenessSuffix(status) {
  if (status.daysLate > 0) return ` · ${status.daysLate} day${status.daysLate === 1 ? "" : "s"} late`;
  if (status.daysOverdue > 0) return ` · ${status.daysOverdue} day${status.daysOverdue === 1 ? "" : "s"} overdue`;
  return "";
}

// Denominator used for percentage calculations.
export function assignmentTotal(assignment) {
  if (assignment?.mode === "test" && assignment?.test_length) return assignment.test_length;
  return assignment?.goal_value || 0;
}

export function studentPct(correct, total) {
  if (!total || total <= 0) return null;
  return Math.round((correct / total) * 100);
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}