import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function Join() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const join = async () => {
    setError("");
    if (!code.trim()) {
      setError("Enter a join code.");
      return;
    }
    setJoining(true);
    try {
      const normalizedCode = code.trim().toUpperCase();
      const classrooms = await base44.entities.Classroom.filter({
        join_code: normalizedCode,
      });
      if (!classrooms.length) {
        setError("Invalid join code.");
        return;
      }
      const classroom = classrooms[0];

      const existing = await base44.entities.ClassroomMembership.filter({
        classroom_id: classroom.id,
        student_email: user.email,
      });

      // Enforce a maximum of 10 joined classrooms per student.
      const alreadyJoinedHere = existing.some((m) => m.status === "joined");
      if (!alreadyJoinedHere) {
        const myJoined = await base44.entities.ClassroomMembership.filter({
          student_email: user.email,
          status: "joined",
        });
        if (myJoined.length >= 10) {
          setError("You can only be in up to 10 classes at a time. Leave one before joining another.");
          return;
        }
      }

      if (existing.length > 0) {
        const membership = existing[0];
        const patch = {};
        if (membership.status !== "joined") patch.status = "joined";
        if (!membership.user_id) patch.user_id = user.id;
        if (!membership.teacher_id) patch.teacher_id = classroom.created_by_id;
        if (Object.keys(patch).length) {
          await base44.entities.ClassroomMembership.update(membership.id, patch);
        }
      } else {
        await base44.entities.ClassroomMembership.create({
          classroom_id: classroom.id,
          classroom_name: classroom.name,
          student_email: user.email,
          user_id: user.id,
          teacher_id: classroom.created_by_id,
          status: "joined",
        });
      }

      setSuccess(classroom);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't join that classroom.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 md:px-8 py-12 md:py-20">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-4xl text-foreground tracking-tight">Join a class</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Enter the code your teacher gave you to access their flashcard sets.
        </p>

        {success ? (
          <div className="mt-8 p-6 border border-positive/30 bg-positive/5 rounded-md text-center">
            <CheckCircle2 className="w-10 h-10 text-positive mx-auto mb-3" />
            <p className="font-display text-xl text-foreground">
              Joined {success.name || "classroom"}!
            </p>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              You can now study the decks from this class.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => navigate("/")}
                className="px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
              >
                Go to my decks
              </button>
              <button
                onClick={() => {
                  setSuccess(null);
                  setCode("");
                }}
                className="px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
              >
                Join another class
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Classroom code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="e.g. AB3XK9"
              maxLength={10}
              className="w-full mt-2 px-4 py-4 bg-card border border-border font-mono text-2xl tracking-[0.3em] text-center uppercase focus:outline-none focus:border-primary rounded-md"
            />
            <button
              onClick={join}
              disabled={joining}
              className="mt-5 w-full px-6 py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              {joining ? "Joining…" : "Join class"}
            </button>
            {error && <p className="mt-4 font-body text-sm text-destructive">{error}</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}