import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, BookOpen, Search, Sparkles, Upload, KeyRound, School } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DeckCard from "@/components/DeckCard";
import StatCard from "@/components/StatCard";
import { useCreators } from "@/hooks/useCreators";
import { getRecentDeckIds } from "@/lib/recentDecks";
import AssignmentCard from "@/components/AssignmentCard";
import { isCompleted } from "@/lib/assignments";
import { useSeo } from "@/lib/useSeo";
import { useJsonLd } from "@/lib/useJsonLd";

export default function Home() {
  const { user } = useAuth();
  useSeo(
    "FlashFlow — Free Flashcard App for Focused Studying",
    "FlashFlow is a free flashcard app for custom flashcard decks, card reviews, and focused study sessions with spaced repetition to help you learn faster."
  );
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FlashFlow",
    url: "https://flashflowstudy.com/"
  });
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [allDecks, setAllDecks] = useState([]);
  const [counts, setCounts] = useState({});
  const [sessions, setSessions] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [ownedClassrooms, setOwnedClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentIds] = useState(() => getRecentDeckIds());
  const { creatorName } = useCreators(allDecks);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Retry once after a short backoff on a transient API rate limit, and
        // degrade to an empty result if it still fails — so the home page
        // recovers instead of crashing on a rate-limited request.
        const withRetry = async (fn) => {
          try {
            return await fn();
          } catch (e) {
            if (cancelled || !String(e?.message || e).includes("Rate limit")) throw e;
            await new Promise((r) => setTimeout(r, 2000));
            if (cancelled) throw e;
            return await fn();
          }
        };
        const safe = (p) => p.catch(() => []);
        const [decks, sess, myMemberships, myClassrooms, myAssignments, myCompletions] = await Promise.all([
          safe(withRetry(() => base44.entities.Deck.list("-created_date", 100))),
          safe(withRetry(() => base44.entities.StudySession.list("-created_date", 100))),
          safe(withRetry(() => base44.entities.ClassroomMembership.filter({ student_email: user?.email }))),
          safe(withRetry(() => base44.entities.Classroom.filter({ created_by_id: user?.id }))),
          safe(withRetry(() => base44.entities.Assignment.list("-created_date", 100))),
          safe(withRetry(() => base44.entities.AssignmentCompletion.filter({ student_email: user?.email }))),
        ]);
        if (cancelled) return;
        setAllDecks(decks);
        setSessions(sess);
        setMemberships(myMemberships);
        setOwnedClassrooms(myClassrooms);
        setAssignments(myAssignments);
        setCompletions(myCompletions);
        const c = {};
        const userClassroomIds = new Set([
          ...myClassrooms.map((cc) => cc.id),
          ...myMemberships.map((m) => m.classroom_id),
        ]);
        const isMine = (d) => d.created_by_id === user?.id;
        const isClassroom = (d) => d.classroom_id && d.created_by_id !== user?.id && userClassroomIds.has(d.classroom_id);
        const isPub = (d) => d.is_public && d.created_by_id !== user?.id;
        const counted = decks.filter(
          (d) => isMine(d) || isClassroom(d) || recentIds.includes(d.id) || (query && isPub(d))
        );
        // One bulk request for all displayed decks' cards, counted client-side,
        // instead of one request per deck (which exceeded the API rate limit).
        const countedIds = counted.map((d) => d.id);
        if (countedIds.length && !cancelled) {
          try {
            const cards = await base44.entities.Card.filter({ deck_id: { $in: countedIds } }, undefined, 1000);
            if (cancelled) return;
            cards.forEach((card) => { c[card.deck_id] = (c[card.deck_id] || 0) + 1; });
          } catch {
            /* ignore — card counts simply won't show */
          }
        }
        if (!cancelled) setCounts(c);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.email]);

  const mine = allDecks.filter((d) => d.created_by_id === user?.id);
  const pub = allDecks.filter((d) => d.is_public && d.created_by_id !== user?.id);
  const userClassroomIds = new Set([
    ...ownedClassrooms.map((c) => c.id),
    ...memberships.map((m) => m.classroom_id),
  ]);
  const classroomDecks = allDecks.filter(
    (d) => d.classroom_id && d.created_by_id !== user?.id && userClassroomIds.has(d.classroom_id)
  );
  const myAssignments = assignments
    .filter(
      (a) =>
        userClassroomIds.has(a.classroom_id) && a.created_by_id !== user?.id
    )
    .sort((a, b) => {
      const ac = completions.find((c) => c.assignment_id === a.id);
      const bc = completions.find((c) => c.assignment_id === b.id);
      return isCompleted(ac) - isCompleted(bc);
    });

  const matches = (d) =>
    !query ||
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(query.toLowerCase());
  const mineFiltered = mine.filter(matches);
  const pubFiltered = pub.filter(matches);

  const lastStudied = {};
  sessions.forEach((s) => {
    if (!lastStudied[s.deck_id]) lastStudied[s.deck_id] = s.created_date;
  });

  const recentDecks = recentIds
    .map((rid) => allDecks.find((d) => d.id === rid))
    .filter(Boolean)
    .slice(0, 4);

  const cardsStudied = sessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0);
  const decksCreated = mine.length;

  const setQuery = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set("q", val);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  const firstName = (user?.display_name || user?.full_name || user?.email || "").split(" ")[0] || "there";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Hero — personalized for signed-in users, keyword-rich for visitors (SEO) */}
      {user ? (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 via-card to-indigo-50/50 dark:from-blue-950/20 dark:via-card dark:to-indigo-950/20 rounded-xl p-6 md:p-10 shadow-sm"
        >
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Welcome back
        </span>
        <h1 className="mt-2 font-display font-bold text-foreground leading-[0.95] tracking-tight"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
          Hello, {firstName}.
        </h1>
        <p className="mt-3 max-w-md font-body text-sm text-muted-foreground leading-relaxed">
          Your study library, ready when you are. Pick a deck, or build a new one.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Plus className="w-4 h-4" /> Create deck
          </Link>
          <Link
            to="/create?import=1"
            className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
          >
            <Upload className="w-4 h-4" /> Import set
          </Link>
        </div>

        <div className="mt-7 flex md:grid md:grid-cols-2 gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <StatCard label="Cards studied" value={loading ? "—" : cardsStudied} index={0} accent="text-positive" />
          <StatCard label="Decks created" value={loading ? "—" : decksCreated} index={1} />
        </div>
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 via-card to-indigo-50/50 dark:from-blue-950/20 dark:via-card dark:to-indigo-950/20 rounded-xl p-6 md:p-10 shadow-sm"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Free flashcard app
          </span>
          <h1 className="mt-2 font-display font-bold text-foreground leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Learn Faster with Custom Flashcards
          </h1>
          <p className="mt-4 max-w-2xl font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            FlashFlow is a free flashcard app for building custom flashcard decks and mastering new
            material through focused study sessions. Create decks by hand, generate cards from your
            notes with AI, or import an existing set — then review with flashcards, quizzes, and
            type-in recall.
          </p>
          <p className="mt-3 max-w-2xl font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            Spaced repetition and active recall keep practice efficient, so you retain more in less
            time. Track cards studied, star the terms that trip you up, and revisit them until they
            stick — whether you're prepping for finals, learning a language, or earning a certification.
          </p>
          <p className="mt-3 max-w-2xl font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            Browse the public library of community decks, or join a class to study sets your teacher
            has assigned. Your decks and progress stay private by default, and you decide what to share.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
            >
              <Plus className="w-4 h-4" /> Create a free account
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 font-mono text-xs uppercase tracking-widest hover:border-primary transition-colors rounded-md"
            >
              <BookOpen className="w-4 h-4" /> Browse public decks
            </Link>
          </div>
        </motion.section>
      )}

      {/* Mobile search */}
      <div className="mt-6 md:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search decks…"
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-slate-200 font-body text-sm focus:outline-none focus:border-primary rounded-md"
        />
      </div>

      {/* Recently Opened Sets */}
      {!query && user && recentDecks.length > 0 && (
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Recently Opened Sets</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Pick up where you left off
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDecks.map((d, i) => (
              <DeckCard
                key={d.id}
                deck={d}
                index={i}
                cardCount={counts[d.id]}
                lastStudied={lastStudied[d.id]}
                creatorName={creatorName(d)}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Your assignments */}
      {!query && myAssignments.length > 0 && (
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Your Assignments</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Assigned by your teachers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myAssignments.slice(0, 4).map((a, i) => {
              const comp = completions.find((c) => c.assignment_id === a.id);
              return (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  index={i}
                  completion={comp}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* My Decks */}
      <section className="mt-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Decks</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {mineFiltered.length} {mineFiltered.length === 1 ? "deck" : "decks"}
            </p>
          </div>
          {mineFiltered.length > 0 && (
            <Link to="/my-decks" className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline">
              View all →
            </Link>
          )}
        </div>
        {loading ? (
          <div className="py-16 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Loading…
          </div>
        ) : mineFiltered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-md">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-sm text-muted-foreground mb-5">
              {query ? "No decks match your search." : "You have no decks yet."}
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/create" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-md">
                <Plus className="w-3.5 h-3.5" /> Create
              </Link>
              <Link to="/create?import=1" className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest rounded-md hover:border-primary transition-colors">
                <Upload className="w-3.5 h-3.5" /> Import
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mineFiltered.map((d, i) => (
              <DeckCard
                key={d.id}
                deck={d}
                index={i}
                cardCount={counts[d.id]}
                lastStudied={lastStudied[d.id]}
              />
            ))}
            <Link
              to="/create"
              className="min-h-[10rem] border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors p-6"
            >
              <Plus className="w-7 h-7" />
              <span className="font-display text-lg">Create / Import new deck</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">Start fresh or import a set</span>
            </Link>
          </div>
        )}
      </section>

      {/* Public Library — only when searching */}
      {query && (
        <section id="library" className="mt-8 scroll-mt-20">
          <div className="mb-5">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Public Library</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Community decks
            </p>
          </div>
          {loading ? (
            <div className="py-16 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Loading…
            </div>
          ) : pubFiltered.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-md">
              <p className="font-body text-sm text-muted-foreground">No public decks match.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pubFiltered.map((d, i) => (
                <DeckCard
                  key={d.id}
                  deck={d}
                  index={i}
                  cardCount={counts[d.id]}
                  lastStudied={lastStudied[d.id]}
                  creatorName={creatorName(d)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Classroom decks */}
      {classroomDecks.length > 0 && (
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Classroom Decks</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              From your classes
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classroomDecks.map((d, i) => (
              <DeckCard
                key={d.id}
                deck={d}
                index={i}
                cardCount={counts[d.id]}
                lastStudied={lastStudied[d.id]}
                creatorName={creatorName(d)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Join a class prompt */}
      {userClassroomIds.size === 0 && user && (
        <section className="mt-8 p-6 border border-dashed border-blue-200 dark:border-blue-800 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg text-foreground">Join a class</p>
              <p className="font-body text-sm text-muted-foreground">
                Enter a code from your teacher to access their flashcard sets.
              </p>
            </div>
          </div>
          <Link
            to="/join"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md shrink-0"
          >
            <KeyRound className="w-4 h-4" /> Join a class
          </Link>
        </section>
      )}
    </div>
  );
}