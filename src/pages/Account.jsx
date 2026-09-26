import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, KeyRound, Trash2, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import StatCard from "@/components/StatCard";
import { useVerifications } from "@/hooks/useVerifications";
import UserBadges from "@/components/UserBadges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Account() {
  useSeo("FlashFlow - Manage Your Account", "All account settings.");
  const { user, logout, checkUserAuth } = useAuth();
  const [name, setName] = useState(user?.display_name || user?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [decksCreated, setDecksCreated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [togglingTeacher, setTogglingTeacher] = useState(false);
  const { badges: vBadges } = useVerifications([user?.id].filter(Boolean));

  useEffect(() => {
    (async () => {
      try {
        const [sess, decks] = await Promise.all([
          base44.entities.StudySession.list("-created_date", 100),
          base44.entities.Deck.list("-created_date", 100),
        ]);
        setSessions(sess);
        setDecksCreated(decks.filter((d) => d.created_by_id === user?.id).length);
        if (user?.id) {
          try {
            const existing = await base44.entities.Profile.filter({ user_id: user.id });
            const name = user.display_name || user.full_name || "";
            const isTeacher = !!user?.is_teacher;
            if (existing.length === 0) {
              await base44.entities.Profile.create({ user_id: user.id, full_name: name, is_teacher: isTeacher });
            } else if (existing[0].full_name !== name || existing[0].is_teacher !== isTeacher) {
              await base44.entities.Profile.update(existing[0].id, { full_name: name, is_teacher: isTeacher });
            }
          } catch { /* ignore */ }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const cardsStudied = sessions.reduce((s, x) => s + (x.cards_studied || 0), 0);
  const myBadges = { verified: user?.role === "admin" || vBadges(user?.id).verified, admin: user?.role === "admin" };

  const saveName = async () => {
    setSavingName(true);
    setError("");
    try {
      await base44.auth.updateMe({ display_name: name.trim() });
      try {
        const existing = await base44.entities.Profile.filter({ user_id: user.id });
        if (existing.length > 0) {
          await base44.entities.Profile.update(existing[0].id, { full_name: name.trim() });
        } else {
          await base44.entities.Profile.create({ user_id: user.id, full_name: name.trim(), is_teacher: !!user?.is_teacher });
        }
      } catch { /* ignore */ }
      await checkUserAuth();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save your name.");
    } finally {
      setSavingName(false);
    }
  };

  const toggleTeacherMode = async () => {
    setTogglingTeacher(true);
    setError("");
    try {
      const newTeacher = !user?.is_teacher;
      await base44.auth.updateMe({ is_teacher: newTeacher });
      try {
        const existing = await base44.entities.Profile.filter({ user_id: user.id });
        if (existing.length > 0) {
          await base44.entities.Profile.update(existing[0].id, { is_teacher: newTeacher });
        } else {
          await base44.entities.Profile.create({ user_id: user.id, full_name: user.display_name || user.full_name || "", is_teacher: newTeacher });
        }
      } catch { /* ignore */ }
      window.location.reload();
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't update teacher mode.");
    } finally {
      setTogglingTeacher(false);
    }
  };

  const clearData = async () => {
    setClearing(true);
    setError("");
    try {
      const decks = await base44.entities.Deck.filter({ created_by_id: user.id });
      const ids = decks.map((d) => d.id);
      if (ids.length) await base44.entities.Card.deleteMany({ deck_id: { $in: ids } });
      await base44.entities.Deck.deleteMany({ created_by_id: user.id });
      await base44.entities.StudySession.deleteMany({ created_by_id: user.id });
      setDecksCreated(0);
      setSessions([]);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't clear your data.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">Account</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Profile & settings
      </p>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Cards studied" value={loading ? "—" : cardsStudied} index={0} accent="text-positive" />
        <StatCard label="Sessions" value={loading ? "—" : sessions.length} index={1} />
        <StatCard label="Decks created" value={loading ? "—" : decksCreated} index={2} accent="text-primary" />
      </div>

      {/* Profile */}
      <section className="mt-8 p-6 border border-slate-200 bg-card rounded-md">
        <h2 className="font-display text-2xl text-foreground">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl font-bold">
            {(name || user?.email || "?").charAt(0).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
            <p className="font-display text-lg text-foreground truncate">{name || "Unnamed"}</p>
            <UserBadges verified={myBadges.verified} admin={myBadges.admin} />
          </div>
            <p className="font-mono text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Display name
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-background border border-slate-200 font-body text-sm focus:outline-none focus:border-primary rounded-md"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity rounded-md"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : nameSaved ? <Check className="w-4 h-4" /> : null}
              {nameSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* Teacher mode */}
      <section className="mt-6 p-6 border border-blue-200 dark:border-blue-800 bg-card rounded-md">
        <h2 className="font-display text-2xl text-foreground">Teacher mode</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground max-w-md">
          Enable teacher mode to create classrooms, invite students by email or join code, and share private flashcard sets with your classes.
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-base text-foreground">
              {user?.is_teacher ? "Teacher mode is on" : "Teacher mode is off"}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {user?.role === "admin" ? "Admin — always included" : "Toggle to manage classrooms"}
            </p>
          </div>
          <button
            onClick={toggleTeacherMode}
            disabled={togglingTeacher}
            className={`inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors rounded-md disabled:opacity-40 ${
              user?.is_teacher
                ? "border border-border hover:border-primary"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {togglingTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {user?.is_teacher ? "Turn off" : "Turn on"}
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="mt-6 p-6 border border-slate-200 bg-card rounded-md">
        <h2 className="font-display text-2xl text-foreground">Settings</h2>
        <div className="mt-5 divide-y divide-slate-200">
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-base text-foreground">Change password</p>
              <p className="font-mono text-xs text-muted-foreground">Send a reset link to your email.</p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset
            </Link>
          </div>
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-base text-foreground">Delete my data</p>
              <p className="font-mono text-xs text-muted-foreground">Removes all your decks, cards, and study history.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-destructive/40 text-destructive font-mono text-xs uppercase tracking-widest hover:border-destructive transition-colors rounded-md">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all your data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes every deck, card, and study session you own. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearData}
                    disabled={clearing}
                    className="bg-destructive text-destructive-foreground hover:opacity-90"
                  >
                    {clearing ? "Deleting…" : "Delete everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-base text-foreground">Sign out</p>
              <p className="font-mono text-xs text-muted-foreground">Return to the login screen.</p>
            </div>
            <button
              onClick={() => logout(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </div>
      </section>

      {error && <p className="mt-6 font-body text-sm text-destructive">{error}</p>}
    </div>
  );
}