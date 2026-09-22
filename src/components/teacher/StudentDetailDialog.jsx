import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  completionStatus,
  statusBadgeClass,
  latenessSuffix,
  assignmentTotal,
  studentPct,
  fmtDateTime,
  fmtDate,
} from "@/lib/assignmentStatus";
import { modeLabel, goalLabel } from "@/lib/assignments";

function Stat({ label, value }) {
  return (
    <div className="p-4 border border-border rounded-md bg-card">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl text-foreground">{value}</p>
    </div>
  );
}

export default function StudentDetailDialog({ open, onClose, assignment, member, completion }) {
  if (!member) return null;
  const status = completionStatus(assignment, completion);
  const total = assignmentTotal(assignment);
  const correct = completion?.questions_correct || 0;
  const done = completion?.questions_done || 0;
  const unanswered = total > 0 ? Math.max(0, total - done) : null;
  const incorrect = Math.max(0, done - correct);
  const pct = studentPct(correct, total);
  const attempts = completion?.attempts || (completion ? 1 : 0);
  const minutes = completion?.minutes_studied || 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{member.student_email}</DialogTitle>
          <DialogDescription className="font-body text-sm">
            {assignment?.title} · {modeLabel(assignment?.mode)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1.5 border rounded ${statusBadgeClass(status.tone)}`}>
              {status.label}{latenessSuffix(status)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Correct" value={correct} />
            <Stat label="Incorrect" value={incorrect} />
            <Stat label="Unanswered" value={unanswered ?? "—"} />
            <Stat label="Score" value={pct != null ? `${pct}%` : "—"} />
            <Stat label="Attempts" value={attempts} />
            <Stat label="Time spent" value={`${Math.round(minutes * 10) / 10}m`} />
            <Stat label="Started" value={fmtDate(completion?.started_date || completion?.last_attempt_date)} />
            <Stat label="Completed" value={fmtDate(completion?.completed_date)} />
          </div>

          {total > 0 && (
            <div className="p-4 border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-md">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progress</p>
              <p className="mt-1 font-body text-sm text-foreground">
                {correct} / {total} correct · {pct}% — goal: {goalLabel(assignment)}
              </p>
            </div>
          )}

          <div className="text-xs font-mono text-muted-foreground space-y-1">
            <p>Submission status: {completion ? (status.key === "done" || status.key === "late" ? "Submitted" : "In progress") : "Not started"}</p>
            <p>Last attempt: {fmtDateTime(completion?.last_attempt_date)}</p>
          </div>

          <p className="font-body text-xs text-muted-foreground border-t border-border pt-3">
            Question-level breakdown isn't available for this assignment. Aggregated stats above come from the student's study activity.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}