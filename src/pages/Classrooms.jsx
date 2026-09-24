import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, KeyRound, Loader2, GraduationCap, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Classrooms() {
  const { user } = useAuth();
  const isTeacher = user?.is_teacher === true;
  const [classrooms, setClassrooms] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [list, myMemberships] = await Promise.all([
          base44.entities.Classroom.list("-created_date", 100),
          base44.entities.ClassroomMembership.filter({ student_email: user?.email, status: "joined" }).catch(() => []),
        ]);
        setClassrooms(list);
        setMemberships(myMemberships);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const myClassrooms = classrooms.filter((c) => c.created_by_id === user?.id);
  const joinedClassroomIds = new Set(memberships.map((m) => m.classroom_id));
  const joinedClassrooms = classrooms.filter((c) => joinedClassroomIds.has(c.id));

  const create = async () => {
    setError("");
    if (!name.trim()) {
      setError("Give your class a name.");
      return;
    }
    setSaving(true);
    try {
      const code = generateCode();
      const classroom = await base44.entities.Classroom.create({
        name: name.trim(),
        description: description.trim(),
        join_code: code,
        member_user_ids: [],
      });
      const emailList = emails
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes("@"));
      if (emailList.length) {
        await base44.entities.ClassroomMembership.bulkCreate(
          emailList.map((e) => ({
            classroom_id: classroom.id,
            classroom_name: classroom.name,
            student_email: e,
            status: "invited",
          }))
        );
      }
      setClassrooms((prev) => [classroom, ...prev]);
      setName("");
      setDescription("");
      setEmails("");
      setShowCreate(false);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't create classroom.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">Classrooms</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {isTeacher ? "Manage your classes" : "Your classes"}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Plus className="w-4 h-4" /> New class
          </button>
        )}
      </div>

      {/* Create form */}
      {isTeacher && showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 p-6 border border-blue-200 dark:border-blue-800 bg-card rounded-md"
        >
          <h2 className="font-display text-2xl text-foreground">Create a new class</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Class name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Period 3 Biology"
                className="w-full mt-1.5 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fall semester — Cell biology unit"
                className="w-full mt-1.5 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Invite students by email (optional)
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={3}
                placeholder="student1@email.com, student2@email.com…"
                className="w-full mt-1.5 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md resize-none"
              />
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Separate emails with commas. Students can also join later with the class code.
              </p>
            </div>
            {error && <p className="font-body text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={create}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Creating…" : "Create class"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Teacher's classrooms */}
      {isTeacher && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">My Classes</h2>
          {loading ? (
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading…</p>
          ) : myClassrooms.length === 0 ? (
            <div className="mt-4 p-8 border border-dashed border-slate-200 rounded-md text-center">
              <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">
                {showCreate ? "Fill in the form above to create your first class." : "You haven't created any classes yet."}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myClassrooms.map((c, i) => (
                <ClassroomCard key={c.id} classroom={c} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Joined classrooms (student) */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-2xl text-foreground">Joined Classes</h2>
          <Link
            to="/join"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <KeyRound className="w-3.5 h-3.5" /> Join a class
          </Link>
        </div>
        {loading ? (
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading…</p>
        ) : joinedClassrooms.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-md text-center">
            <KeyRound className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">
              You haven't joined any classes yet. Tap "Join a class" to enter a class code.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {joinedClassrooms.map((c, i) => (
              <ClassroomCard key={c.id} classroom={c} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ClassroomCard({ classroom, index }) {
  const [copied, setCopied] = useState(false);
  const copyCode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link
        to={`/classroom/${classroom.id}`}
        className="block p-5 bg-card border border-blue-100 dark:border-blue-900/40 hover:border-primary hover:shadow-md hover:shadow-blue-100 dark:hover:shadow-blue-950/30 transition-all rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">{classroom.name}</h3>
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-primary/30 text-primary rounded">
            <Users className="w-3 h-3" />
            {classroom.member_user_ids?.length || 0}
          </span>
        </div>
        {classroom.description && (
          <p className="mt-2 text-sm font-body text-muted-foreground line-clamp-2">{classroom.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-blue-100 dark:border-blue-900/40 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Class code</span>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
          >
            {classroom.join_code}
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}