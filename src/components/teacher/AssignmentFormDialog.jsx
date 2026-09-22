import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { modeLabel } from "@/lib/assignments";

const MODES = ["flashcards", "quiz", "type", "test"];
const GOALS = [
  { value: "num_questions", label: "Complete a number of questions" },
  { value: "num_correct", label: "Get a specific number correct" },
  { value: "study_minutes", label: "Study for a set amount of time" },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md";

export default function AssignmentFormDialog({ open, onClose, onSaved, classroom, decks, assignment }) {
  const isEdit = !!assignment;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deckId, setDeckId] = useState("");
  const [mode, setMode] = useState("flashcards");
  const [testLength, setTestLength] = useState(10);
  const [goalType, setGoalType] = useState("num_questions");
  const [goalValue, setGoalValue] = useState(20);
  const [assignedDate, setAssignedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (assignment) {
      setTitle(assignment.title || "");
      setDescription(assignment.description || "");
      setDeckId(assignment.deck_id || decks[0]?.id || "");
      setMode(assignment.mode || "flashcards");
      setTestLength(assignment.test_length || 10);
      setGoalType(assignment.goal_type || "num_questions");
      setGoalValue(assignment.goal_value || 20);
      setAssignedDate(assignment.assigned_date || "");
      setDueDate(assignment.due_date || "");
    } else {
      setTitle("");
      setDescription("");
      setDeckId(decks[0]?.id || "");
      setMode("flashcards");
      setTestLength(10);
      setGoalType("num_questions");
      setGoalValue(20);
      setAssignedDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
    }
    setError("");
  }, [open, assignment, decks]);

  const goalUnit = goalType === "study_minutes" ? "minutes" : goalType === "num_correct" ? "correct" : "questions";
  const noDecks = decks.length === 0;

  const save = async () => {
    setError("");
    if (!title.trim()) return setError("Give your assignment a title.");
    if (!deckId) return setError("Pick a deck for this assignment.");
    if (!goalValue || goalValue <= 0) return setError("Set a goal value greater than zero.");
    if (mode === "test" && (!testLength || testLength <= 0)) return setError("Set the test length.");
    setSaving(true);
    try {
      const deck = decks.find((d) => d.id === deckId);
      const payload = {
        classroom_id: classroom.id,
        classroom_name: classroom?.name || "",
        deck_id: deckId,
        deck_title: deck?.title || "",
        title: title.trim(),
        description: description.trim(),
        mode,
        test_length: mode === "test" ? Number(testLength) : 0,
        goal_type: goalType,
        goal_value: Number(goalValue),
        assigned_date: assignedDate || undefined,
        due_date: dueDate || undefined,
      };
      const saved = isEdit
        ? await base44.entities.Assignment.update(assignment.id, payload)
        : await base44.entities.Assignment.create(payload);
      onSaved?.(saved);
      onClose?.();
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save the assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEdit ? "Edit assignment" : "New assignment"}
          </DialogTitle>
        </DialogHeader>

        {noDecks ? (
          <p className="font-body text-sm text-muted-foreground py-4">
            This class has no decks yet. Add a deck to the classroom first.
          </p>
        ) : (
          <div className="space-y-5 py-2">
            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 4 review" className={inputCls} />
            </Field>
            <Field label="Instructions (optional)">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Deck">
              <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className={inputCls}>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Study mode">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-2.5 font-mono text-xs uppercase tracking-widest border rounded-md transition-colors ${
                      mode === m ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {modeLabel(m)}
                  </button>
                ))}
              </div>
            </Field>
            {mode === "test" && (
              <Field label="Test length (number of questions)">
                <input type="number" min={1} max={100} value={testLength} onChange={(e) => setTestLength(Math.max(1, parseInt(e.target.value) || 1))} className="w-32 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md" />
              </Field>
            )}
            <Field label="Completion goal">
              <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className={inputCls}>
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <div className="mt-3 flex items-center gap-3">
                <input type="number" min={1} value={goalValue} onChange={(e) => setGoalValue(Math.max(1, parseInt(e.target.value) || 1))} className="w-28 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md" />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{goalUnit}</span>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assigned date">
                <input type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Due date (optional)">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        )}

        {error && <p className="font-body text-sm text-destructive">{error}</p>}

        {!noDecks && (
          <DialogFooter>
            <button onClick={onClose} className="px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create assignment"}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}