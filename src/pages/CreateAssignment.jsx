import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { modeLabel } from "@/lib/assignments";

const MODES = ["flashcards", "quiz", "type", "test"];
const GOALS = [
  { value: "num_questions", label: "Complete a number of questions" },
  { value: "num_correct", label: "Get a specific number correct" },
  { value: "study_minutes", label: "Study for a set amount of time" },
];

export default function CreateAssignment() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deckId, setDeckId] = useState("");
  const [mode, setMode] = useState("flashcards");
  const [testLength, setTestLength] = useState(10);
  const [goalType, setGoalType] = useState("num_questions");
  const [goalValue, setGoalValue] = useState(20);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await base44.entities.Classroom.get(classroomId);
        setClassroom(c);
        if (c.created_by_id !== user?.id) {
          setError("Only the class teacher can create assignments.");
          return;
        }
        const d = await base44.entities.Deck.filter(
          { classroom_id: classroomId },
          "-created_date",
          100
        );
        setDecks(d);
        if (d.length) setDeckId(d[0].id);
      } catch {
        setError("Classroom not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [classroomId, user?.id]);

  const goalUnit = goalType === "study_minutes" ? "minutes" : goalType === "num_correct" ? "correct" : "questions";

  const save = async () => {
    setError("");
    if (!title.trim()) return setError("Give your assignment a title.");
    if (!deckId) return setError("Pick a deck for this assignment.");
    if (!goalValue || goalValue <= 0) return setError("Set a goal value greater than zero.");
    if (mode === "test" && (!testLength || testLength <= 0))
      return setError("Set the test length (number of questions).");
    setSaving(true);
    try {
      const deck = decks.find((d) => d.id === deckId);
      await base44.entities.Assignment.create({
        classroom_id: classroomId,
        classroom_name: classroom?.name || "",
        deck_id: deckId,
        deck_title: deck?.title || "",
        title: title.trim(),
        description: description.trim(),
        mode,
        test_length: mode === "test" ? Number(testLength) : 0,
        goal_type: goalType,
        goal_value: Number(goalValue),
        due_date: dueDate || undefined,
        classroom_members: classroom?.member_user_ids || [],
      });
      navigate(`/classroom/${classroomId}`);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't create the assignment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link
        to={`/classroom/${classroomId}`}
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to class
      </Link>
      <h1 className="mt-5 font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
        New assignment
      </h1>
      <p className="mt-2 font-body text-sm text-muted-foreground">
        {classroom?.name ? `For ${classroom.name}` : ""}
      </p>

      {error && (
        <p className="mt-5 font-body text-sm text-destructive">{error}</p>
      )}

      {decks.length === 0 ? (
        <div className="mt-8 p-8 border border-dashed border-slate-200 rounded-md text-center">
          <p className="font-body text-sm text-muted-foreground">
            You need at least one deck in this class before creating an assignment.
          </p>
          <Link
            to={`/create?classroom_id=${classroomId}`}
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-md"
          >
            Create a deck
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 review"
              className="w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md resize-none"
            />
          </Field>

          <Field label="Deck">
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
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
                    mode === m
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {modeLabel(m)}
                </button>
              ))}
            </div>
          </Field>

          {mode === "test" && (
            <Field label="Test length (number of questions)">
              <input
                type="number"
                min={1}
                max={100}
                value={testLength}
                onChange={(e) => setTestLength(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
              />
            </Field>
          )}

          <Field label="Completion goal">
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={goalValue}
                onChange={(e) => setGoalValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-28 px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
              />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {goalUnit}
              </span>
            </div>
          </Field>

          <Field label="Due date (optional)">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-3 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
            />
          </Field>

          <button
            onClick={save}
            disabled={saving}
            className="w-full px-6 py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Creating…" : "Create assignment"}
          </button>
        </div>
      )}
    </div>
  );
}

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