import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { School, Loader2, GraduationCap, Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DeckCard from "@/components/DeckCard";
import { useVerifications } from "@/hooks/useVerifications";
import UserBadges from "@/components/UserBadges";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [decks, setDecks] = useState([]);
  const [counts, setCounts] = useState({});
  const [sharedClasses, setSharedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { badges } = useVerifications([userId]);

  useEffect(() => {
    (async () => {
      try {
        const [profiles, allDecks] = await Promise.all([
          base44.entities.Profile.filter({ user_id: userId }),
          base44.entities.Deck.list("-created_date", 200),
        ]);
        setProfile(profiles[0] || null);
        const userDecks = allDecks.filter(
          (d) => d.created_by_id === userId && d.is_public
        );
        setDecks(userDecks);
        const c = {};
        const deckIds = userDecks.map((d) => d.id);
        if (deckIds.length) {
          try {
            const cards = await base44.entities.Card.filter({ deck_id: { $in: deckIds } }, undefined, 1000);
            cards.forEach((card) => { c[card.deck_id] = (c[card.deck_id] || 0) + 1; });
          } catch {
            /* ignore — card counts simply won't show */
          }
        }
        setCounts(c);

        if (user && userId !== user.id) {
          const [teacherClasses, myMemberships] = await Promise.all([
            base44.entities.Classroom.filter({ created_by_id: userId }).catch(() => []),
            base44.entities.ClassroomMembership.filter({ student_email: user.email, status: "joined" }).catch(() => []),
          ]);
          const myClassIds = new Set(myMemberships.map((m) => m.classroom_id));
          setSharedClasses(teacherClasses.filter((cl) => myClassIds.has(cl.id)));
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, user?.email, user?.id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  const displayName = profile?.full_name || "Unknown user";
  const isTeacher = profile?.is_teacher;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back
      </Link>

      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-5">
          <span className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl font-bold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {displayName}
              </h1>
              <UserBadges verified={badges(userId).verified} admin={badges(userId).admin} />
              {isTeacher && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-full font-mono text-[10px] uppercase tracking-widest">
                  <GraduationCap className="w-3 h-3" /> Teacher
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {decks.length} {decks.length === 1 ? "public set" : "public sets"}
            </p>
          </div>
        </div>
      </div>

      {sharedClasses.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Classes you're in with this {isTeacher ? "teacher" : "person"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedClasses.map((c) => (
              <Link
                key={c.id}
                to={`/classroom/${c.id}`}
                className="p-5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-500" />
                  <span className="font-display text-lg text-foreground">{c.name}</span>
                </div>
                {c.description && (
                  <p className="mt-2 font-body text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">Public sets</h2>
        {decks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-md">
            <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-sm text-muted-foreground">
              {profile ? "This user has no public sets yet." : "Profile not found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((d, i) => (
              <DeckCard key={d.id} deck={d} index={i} cardCount={counts[d.id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}