import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Trash2, CheckCircle2, Layers, BookOpen, Calendar, Clock, Circle } from "lucide-react";
import { modeLabel, goalLabel, progressText, isCompleted } from "@/lib/assignments";

function dueStatus(due) {
  if (!due) return null;
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { label: "Overdue", tone: "text-destructive" };
  if (diff === 0) return { label: "Due today", tone: "text-amber-500" };
  if (diff <= 2) return { label: `Due in ${diff}d`, tone: "text-amber-500" };
  return { label: `Due ${d.toLocaleDateString()}`, tone: "text-muted-foreground" };
}

export default function AssignmentCard({
  assignment,
  index = 0,
  isTeacher = false,
  completion = null,
  completedCount = 0,
  joinedCount = 0,
  students = [],
  assignmentCompletions = [],
  onDelete,
}) {
  const navigate = useNavigate();
  const done = isTeacher ? false : isCompleted(completion);
  const due = dueStatus(assignment.due_date);

  const completionByEmail = {};
  assignmentCompletions.forEach((c) => {
    if (c.student_email) completionByEmail[c.student_email.toLowerCase()] = c;
  });

  const start = () =>
    navigate(
      `/study/${assignment.deck_id}/${assignment.mode}?assignment=${assignment.id}`
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="p-5 bg-card border border-blue-100 dark:border-blue-900/40 rounded-xl flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-foreground leading-tight">
            {assignment.title}
          </h3>
          {assignment.description && (
            <p className="mt-1 text-sm font-body text-muted-foreground line-clamp-2">
              {assignment.description}
            </p>
          )}
        </div>
        {done && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-positive/30 text-positive bg-positive/5 rounded">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> {assignment.deck_title || "Deck"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> {modeLabel(assignment.mode)}
          {assignment.mode === "test" && assignment.test_length
            ? ` · ${assignment.test_length}q`
            : ""}
        </span>
        {due && (
          <span className={`inline-flex items-center gap-1.5 ${due.tone}`}>
            <Calendar className="w-3.5 h-3.5" /> {due.label}
          </span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Goal
          </p>
          <p className="font-body text-sm text-foreground">{goalLabel(assignment)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Progress
          </p>
          {isTeacher ? (
            <p className="font-body text-sm text-foreground">
              {completedCount}/{joinedCount} done
            </p>
          ) : (
            <p className={`font-body text-sm ${done ? "text-positive" : "text-foreground"}`}>
              {progressText(assignment, completion)}
            </p>
          )}
        </div>
      </div>

      {isTeacher && students.length > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/40">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Students
          </p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {students.map((s) => {
              const c = completionByEmail[(s.student_email || "").toLowerCase()];
              const status = c?.status === "completed" ? "done" : c ? "progress" : "todo";
              return (
                <li key={s.id || s.student_email} className="flex items-center justify-between gap-3">
                  <span className="font-body text-sm text-foreground truncate">{s.student_email}</span>
                  {status === "done" ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-positive">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : status === "progress" ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-amber-500">
                      <Clock className="w-3 h-3" /> In progress
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <Circle className="w-3 h-3" /> Not started
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {isTeacher ? (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest text-destructive hover:border-destructive transition-colors rounded-md"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        ) : (
          <button
            onClick={start}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Play className="w-3.5 h-3.5" /> {done ? "Review" : completion ? "Continue" : "Start"}
          </button>
        )}
      </div>
    </motion.div>
  );
}