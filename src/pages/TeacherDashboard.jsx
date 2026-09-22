import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap, Plus, Pencil, Trash2, Loader2, ClipboardList, ChevronDown, Layers, BookOpen, Calendar, Users,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { modeLabel, goalLabel } from "@/lib/assignments";
import { completionStatus, statusBadgeClass, latenessSuffix, fmtDate } from "@/lib/assignmentStatus";
import AssignmentFormDialog from "@/components/teacher/AssignmentFormDialog";
import AssignmentOverview from "@/components/teacher/AssignmentOverview";
import StudentDetailDialog from "@/components/teacher/StudentDetailDialog";

const STATUS_RANK = { overdue: 0, late: 1, done: 2, notdone: 3 };

function assignmentDueStatus(assignment, completions, members) {
  // For a teacher-side assignment card: worst-case status across the class.
  if (members.length === 0) {
    const due = assignment.due_date ? new Date(assignment.due_date) : null;
    const now = new Date();
    if (due && now > due) return { key: "overdue", label: "Overdue", tone: "destructive" };
    return { key: "notdone", label: "No students yet", tone: "muted" };
  }
  const statuses = members.map((m) => {
    const comp = completions.find((c) => (c.student_email || "").toLowerCase() === (m.student_email || "").toLowerCase());
    return completionStatus(assignment, comp);
  });
  const minRank = Math.min(...statuses.map((s) => STATUS_RANK[s.key]));
  return statuses.find((s) => STATUS_RANK[s.key] === minRank) || { key: "notdone", label: "Not done", tone: "muted" };
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [decks, setDecks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailMember, setDetailMember] = useState(null);
  const [detailCompletion, setDetailCompletion] = useState(null);
  const [error, setError] = useState("");

  const isTeacher = user?.is_teacher === true;

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Classroom.list("-created_date", 100);
        const mine = all.filter((c) => c.created_by_id === user?.id);
        setClassrooms(mine);
        if (mine.length) setSelectedId(mine[0].id);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [d, m, a, comp] = await Promise.all([
          base44.entities.Deck.filter({ classroom_id: selectedId }, "-created_date", 100).catch(() => []),
          base44.entities.ClassroomMembership.filter({ classroom_id: selectedId }).catch(() => []),
          base44.entities.Assignment.filter({ classroom_id: selectedId }, "-created_date", 100).catch(() => []),
          base44.entities.AssignmentCompletion.filter({ classroom_id: selectedId }).catch(() => []),
        ]);
        setDecks(d);
        setMembers(m.filter((mm) => mm.status === "joined"));
        setAssignments(a);
        setCompletions(comp);
        setSelectedAssignmentId("");
      } catch (e) {
        setError("Couldn't load this class.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  const selectedClassroom = classrooms.find((c) => c.id === selectedId);
  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId) || null;

  const sortedAssignments = useMemo(() => {
    const withStatus = assignments.map((a) => ({
      a,
      status: assignmentDueStatus(a, completions, members),
    }));
    const dueMs = (x) => (x.a.due_date ? new Date(x.a.due_date).getTime() : Infinity);
    return [...withStatus].sort((x, y) => dueMs(x) - dueMs(y));
  }, [assignments, completions, members]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a) => { setEditing(a); setFormOpen(true); };

  const onSaved = (saved) => {
    setAssignments((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setEditing(null);
  };

  const deleteAssignment = async (a) => {
    try {
      await base44.entities.AssignmentCompletion.deleteMany({ assignment_id: a.id }).catch(() => {});
      await base44.entities.Assignment.delete(a.id);
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
      setCompletions((prev) => prev.filter((c) => c.assignment_id !== a.id));
      if (selectedAssignmentId === a.id) setSelectedAssignmentId("");
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't delete the assignment.");
    }
  };

  const pickStudent = (member, comp) => {
    setDetailMember(member);
    setDetailCompletion(comp);
  };

  if (!isTeacher) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl text-foreground">Teacher mode required</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Turn on teacher mode in your account settings to access the assignments dashboard.
        </p>
        <Link to="/account" className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-md">
          Go to account
        </Link>
      </div>
    );
  }

  if (loading && !selectedClassroom) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
        Teacher Dashboard
      </h1>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Assignments & analytics
      </p>

      {classrooms.length === 0 ? (
        <div className="mt-8 p-10 border border-dashed border-slate-200 rounded-md text-center">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl text-foreground">No classes yet</h2>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Create a classroom first to manage assignments and view student analytics.
          </p>
          <Link to="/classrooms" className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-md">
            <Plus className="w-4 h-4" /> Create a class
          </Link>
        </div>
      ) : (
        <>
          {/* Classroom selector */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md min-w-[220px]"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {members.length} students
            </span>
            <div className="sm:ml-auto">
              <button
                onClick={openCreate}
                disabled={decks.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
              >
                <Plus className="w-4 h-4" /> New assignment
              </button>
            </div>
          </div>
          {decks.length === 0 && (
            <p className="mt-3 font-body text-sm text-muted-foreground">
              This class has no decks. <Link to={`/classroom/${selectedId}`} className="text-primary hover:underline">Add a deck</Link> before creating assignments.
            </p>
          )}

          {error && <p className="mt-4 font-body text-sm text-destructive">{error}</p>}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignment list */}
            <div className="lg:col-span-1">
              <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Assignments
              </h2>
              {loading ? (
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading…</p>
              ) : sortedAssignments.length === 0 ? (
                <div className="mt-4 p-6 border border-dashed border-slate-200 rounded-md text-center">
                  <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">
                    No assignments yet. Create one to track student progress.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {sortedAssignments.map(({ a, status }, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <button
                        onClick={() => setSelectedAssignmentId(a.id)}
                        className={`w-full text-left p-4 border rounded-lg transition-colors ${
                          a.id === selectedAssignmentId
                            ? "border-primary bg-primary/5"
                            : "border-blue-100 dark:border-blue-900/40 bg-card hover:border-primary"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg text-foreground leading-tight">{a.title}</h3>
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border rounded ${statusBadgeClass(status.tone)}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3" /> {a.deck_title || "Deck"}</span>
                          <span className="inline-flex items-center gap-1"><Layers className="w-3 h-3" /> {modeLabel(a.mode)}</span>
                          {a.due_date && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(a.due_date)}</span>}
                        </div>
                        <p className="mt-2 font-body text-xs text-muted-foreground">{goalLabel(a)}</p>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Overview / detail */}
            <div className="lg:col-span-2">
              {selectedAssignment ? (
                <div className="p-5 border border-blue-100 dark:border-blue-900/40 bg-card rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl text-foreground">{selectedAssignment.title}</h2>
                      {selectedAssignment.description && (
                        <p className="mt-1 font-body text-sm text-muted-foreground">{selectedAssignment.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(selectedAssignment)} className="inline-flex items-center gap-1.5 px-3 py-2 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-primary transition-colors rounded-md">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-border font-mono text-[10px] uppercase tracking-widest text-destructive hover:border-destructive transition-colors rounded-md">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{selectedAssignment.title}" and all its student progress will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAssignment(selectedAssignment)}
                              className="bg-destructive text-destructive-foreground hover:opacity-90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <AssignmentOverview
                    assignment={selectedAssignment}
                    members={members}
                    completions={completions.filter((c) => c.assignment_id === selectedAssignment.id)}
                    onPickStudent={pickStudent}
                  />
                </div>
              ) : (
                <div className="p-10 border border-dashed border-slate-200 rounded-md text-center h-full flex flex-col items-center justify-center">
                  <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h2 className="font-display text-2xl text-foreground">Select an assignment</h2>
                  <p className="mt-2 font-body text-sm text-muted-foreground max-w-sm">
                    Choose an assignment from the list to view class averages, completion summary, and per-student results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AssignmentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
        classroom={selectedClassroom}
        decks={decks}
        assignment={editing}
      />

      <StudentDetailDialog
        open={!!detailMember}
        onClose={() => setDetailMember(null)}
        assignment={selectedAssignment}
        member={detailMember}
        completion={detailCompletion}
      />
    </div>
  );
}