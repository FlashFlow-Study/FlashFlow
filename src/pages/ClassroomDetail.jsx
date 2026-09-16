import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, KeyRound, Plus, Copy, Check, Loader2, Trash2, Mail,
  GraduationCap, Layers, Play, User as UserIcon, ClipboardList,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AssignmentCard from "@/components/AssignmentCard";

export default function ClassroomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [decks, setDecks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newEmails, setNewEmails] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const isTeacher = classroom?.created_by_id === user?.id;

  const loadAssignments = async () => {
    const [a, comp] = await Promise.all([
      base44.entities.Assignment.filter({ classroom_id: id }, "-created_date", 100).catch(() => []),
      base44.entities.AssignmentCompletion.filter({ classroom_id: id }).catch(() => []),
    ]);
    setAssignments(a);
    setCompletions(comp);
  };

  useEffect(() => {
    (async () => {
      try {
        const c = await base44.entities.Classroom.get(id);
        setClassroom(c);
        const [m, d] = await Promise.all([
          base44.entities.ClassroomMembership.filter({ classroom_id: id }),
          base44.entities.Deck.filter({ classroom_id: id }, "-created_date", 100),
        ]);
        setMembers(m);
        setDecks(d);
        await loadAssignments();
      } catch {
        setClassroom(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addStudents = async () => {
    setError("");
    const emailList = newEmails
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));
    if (!emailList.length) {
      setError("Enter at least one email.");
      return;
    }
    setAdding(true);
    try {
      const existing = new Set(members.map((m) => m.student_email));
      const toCreate = emailList.filter((e) => !existing.has(e));
      if (toCreate.length) {
        const created = await base44.entities.ClassroomMembership.bulkCreate(
          toCreate.map((e) => ({
            classroom_id: id,
            classroom_name: classroom.name,
            student_email: e,
            status: "invited",
          }))
        );
        setMembers((prev) => [...prev, ...created]);
      }
      setNewEmails("");
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't add students.");
    } finally {
      setAdding(false);
    }
  };

  const deleteAssignment = async (a) => {
    try {
      await base44.entities.Assignment.delete(a.id);
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
      setCompletions((prev) => prev.filter((c) => c.assignment_id !== a.id));
    } catch {
      /* ignore */
    }
  };

  const removeStudent = async (member) => {
    try {
      await base44.entities.ClassroomMembership.delete(member.id);
      if (member.user_id) {
        const memberIds = (classroom.member_user_ids || []).filter((uid) => uid !== member.user_id);
        await base44.entities.Classroom.update(id, { member_user_ids: memberIds });
        setClassroom((c) => ({ ...c, member_user_ids: memberIds }));
        const updatedDecks = decks.map((d) => ({
          id: d.id,
          classroom_members: (d.classroom_members || []).filter((uid) => uid !== member.user_id),
        }));
        if (updatedDecks.length) await base44.entities.Deck.bulkUpdate(updatedDecks);
        setDecks((prev) =>
          prev.map((d) => ({
            ...d,
            classroom_members: (d.classroom_members || []).filter((uid) => uid !== member.user_id),
          }))
        );
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch {
      /* ignore */
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );
  if (classroom === false)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-body text-sm text-muted-foreground">Classroom not found.</p>
        <Link to="/classrooms" className="font-mono text-xs uppercase tracking-widest text-primary">
          ← Back to classrooms
        </Link>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/classrooms" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Classrooms
      </Link>

      <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">{classroom.name}</h1>
          {classroom.description && (
            <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">{classroom.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {members.filter((m) => m.status === "joined").length} joined · {members.filter((m) => m.status === "invited").length} invited
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              {decks.length} {decks.length === 1 ? "deck" : "decks"}
            </span>
          </div>
        </div>
        {isTeacher && (
          <div className="flex items-center gap-3 p-4 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 rounded-md">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Join code</span>
              <p className="font-mono text-2xl tracking-[0.2em] text-primary">{classroom.join_code}</p>
            </div>
            <button onClick={copyCode} className="p-2.5 border border-border hover:border-primary transition-colors rounded-md">
              {copied ? <Check className="w-4 h-4 text-positive" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Decks */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-foreground">Decks in this class</h2>
          {isTeacher && (
            <Link
              to={`/create?classroom_id=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Create deck
            </Link>
          )}
        </div>
        {decks.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-md text-center">
            <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">
              {isTeacher ? "No decks yet. Create one for this class." : "Your teacher hasn't added any decks yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decks.map((d, i) => (
              <Link
                key={d.id}
                to={`/deck/${d.id}`}
                className="group p-5 bg-card border border-blue-100 dark:border-blue-900/40 hover:border-primary hover:shadow-md hover:shadow-blue-100 dark:hover:shadow-blue-950/30 transition-all rounded-xl"
              >
                <h3 className="font-display text-xl text-foreground">{d.title}</h3>
                {d.description && <p className="mt-1.5 text-sm font-body text-muted-foreground line-clamp-2">{d.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Layers className="w-3.5 h-3.5" /> Deck
                  </span>
                  <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Assignments */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Assignments
          </h2>
          {isTeacher && (
            <Link
              to={`/assign/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> New assignment
            </Link>
          )}
        </div>
        {assignments.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-md text-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">
              {isTeacher
                ? "No assignments yet. Create one for this class."
                : "Your teacher hasn't assigned anything yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignments.map((a, i) => {
              const joinedCount = members.filter((m) => m.status === "joined").length;
              const completedCount = isTeacher
                ? completions.filter(
                    (c) => c.assignment_id === a.id && c.status === "completed"
                  ).length
                : 0;
              const myCompletion = isTeacher
                ? null
                : completions.find((c) => c.assignment_id === a.id);
              return (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  index={i}
                  isTeacher={isTeacher}
                  completion={myCompletion}
                  completedCount={completedCount}
                  joinedCount={joinedCount}
                  onDelete={() => deleteAssignment(a)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Members (teacher only) */}
      {isTeacher && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">Students</h2>

          {/* Add students */}
          <div className="mt-4 p-5 border border-blue-200 dark:border-blue-800 bg-card rounded-md">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Add students by email
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={newEmails}
                onChange={(e) => setNewEmails(e.target.value)}
                placeholder="student@email.com, another@email.com…"
                className="flex-1 px-4 py-2.5 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
              />
              <button
                onClick={addStudents}
                disabled={adding}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                {adding ? "Adding…" : "Invite"}
              </button>
            </div>
            {error && <p className="mt-2 font-body text-sm text-destructive">{error}</p>}
          </div>

          {/* Member list */}
          <div className="mt-4 divide-y divide-border border border-border rounded-md">
            {members.length === 0 ? (
              <p className="p-6 text-center font-body text-sm text-muted-foreground">No students invited yet.</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-foreground truncate">{m.student_email}</p>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest ${
                          m.status === "joined" ? "text-positive" : "text-muted-foreground"
                        }`}
                      >
                        {m.status === "joined" ? "Joined" : "Invited — pending"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStudent(m)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}