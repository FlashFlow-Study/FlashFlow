import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, ArrowRight, Check, Sparkles, GraduationCap, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSeo } from "@/lib/useSeo";
import BetaBadge from "@/components/BetaBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function ExamPractice() {
  const { deckId } = useParams();
  const { user } = useAuth();
  useSeo("Exam practice", "AI-marked exam-style practice questions for this deck.");
  const [deck, setDeck] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await base44.entities.Deck.get(deckId);
        setDeck(d);
        const qs = await base44.entities.ExamQuestion.filter({ deck_id: deckId }, "order", 100);
        setQuestions(Array.isArray(qs) ? qs : qs?.items || []);
      } catch {
        setDeck(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId]);

  const owner = !!user && deck?.created_by_id === user.id;

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateExamQuestions", { deck_id: deckId, count: 10 });
      const created = res?.data?.questions || [];
      setQuestions(created);
      setCurrent(0);
      setAnswers({});
      setResults(null);
      toast({ description: `Generated ${created.length} practice questions.` });
    } catch (e) {
      toast({
        variant: "destructive",
        description: e?.response?.data?.error || e?.message || "Couldn't generate questions.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        deck_id: deckId,
        answers: questions.map((q) => ({ question_id: q.id, answer_text: answers[q.id] || "" })),
      };
      const res = await base44.functions.invoke("markExamAttempt", payload);
      setResults(res?.data || null);
    } catch (e) {
      toast({
        variant: "destructive",
        description: e?.response?.data?.error || e?.message || "Couldn't mark your attempt.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setResults(null);
    setCurrent(0);
    setAnswers({});
  };

  if (loading)
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );

  if (deck === false)
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center gap-4">
        <p className="font-body text-sm text-muted-foreground">Deck not found.</p>
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-primary">
          ← Back home
        </Link>
      </div>
    );

  // No questions yet.
  if (!questions.length) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to={`/deck/${deckId}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Back to deck
        </Link>
        <div className="mt-6 flex items-center gap-2">
          <h1 className="font-display text-4xl text-foreground tracking-tight">Exam practice</h1>
          <BetaBadge />
        </div>
        {owner ? (
          <div className="mt-8 border border-border bg-card rounded-xl p-8 text-center">
            <GraduationCap className="w-10 h-10 text-primary mx-auto" />
            <h2 className="mt-4 font-display text-2xl text-foreground">Generate practice questions</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground max-w-md mx-auto">
              There are no exam questions for this deck yet. Generate a set of AI-written,
              GCSE/A-level style practice questions from your cards — with AI marking for the
              extended answers.
            </p>
            <Button onClick={generate} disabled={generating} className="mt-6">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate questions
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-8 border border-border bg-card rounded-xl p-8 text-center">
            <h2 className="font-display text-2xl text-foreground">No exam practice yet</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground max-w-md mx-auto">
              The deck owner hasn't added exam practice questions to this set yet. Ask them to
              generate a set, then you'll be able to try it here.
            </p>
            <Link to={`/deck/${deckId}`} className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary">
              ← Back to deck
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Results screen.
  if (results) {
    const pct = results.total_marks ? Math.round((results.score / results.total_marks) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to={`/deck/${deckId}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Back to deck
        </Link>
        <div className="mt-6 flex items-center gap-2">
          <h1 className="font-display text-4xl text-foreground tracking-tight">Your results</h1>
          <BetaBadge />
        </div>

        <div className="mt-6 border border-border bg-card rounded-xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Overall score</p>
              <p className="mt-1 font-display text-4xl text-foreground tracking-tight">
                {results.score}<span className="text-muted-foreground">/{results.total_marks}</span>
              </p>
            </div>
            <span className="font-display text-3xl text-primary">{pct}%</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {results.questions.map((r, i) => (
            <div key={r.question_id} className="border border-border bg-card rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg text-foreground">
                  <span className="font-mono text-xs text-muted-foreground mr-2">Q{i + 1}</span>
                  {r.question_text}
                </p>
                <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {r.awarded_marks}/{r.max_marks}
                </span>
              </div>

              <p className="mt-3 font-body text-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Your answer: </span>
                <span className="text-foreground">{r.answer_text || <span className="text-muted-foreground italic">No answer</span>}</span>
              </p>

              {r.question_type === "multiple_choice" && (
                <p className="mt-2 font-body text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Correct answer: </span>
                  <span className="text-primary">{r.correct_answer}</span>
                </p>
              )}
              {r.question_type === "short_answer" && (
                <p className="mt-2 font-body text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Model answer: </span>
                  <span className="text-primary">{r.correct_answer}</span>
                </p>
              )}
              {r.question_type === "extended" && (
                <div className="mt-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Model mark scheme</p>
                  <p className="mt-1 font-body text-sm text-foreground whitespace-pre-line">{r.mark_scheme}</p>
                </div>
              )}

              {r.feedback && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-primary">AI feedback</p>
                  <p className="mt-1 font-body text-sm text-foreground leading-relaxed">{r.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 font-body text-xs text-muted-foreground italic">
          This is indicative practice feedback to help you revise, not an official exam grade.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={restart} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" /> Try again
          </Button>
          <Link
            to={`/deck/${deckId}`}
            className="inline-flex items-center px-4 py-2.5 border border-border font-mono text-xs uppercase tracking-widest text-foreground hover:border-primary transition-colors rounded-md"
          >
            Back to deck
          </Link>
        </div>
      </div>
    );
  }

  // Question runner.
  const q = questions[current];
  const answered = answers[q.id]?.trim()?.length > 0;
  const isLast = current === questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to={`/deck/${deckId}`} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back to deck
      </Link>
      <div className="mt-6 flex items-center gap-2">
        <h1 className="font-display text-4xl text-foreground tracking-tight">Exam practice</h1>
        <BetaBadge />
      </div>
      {deck?.title && <p className="mt-1 font-body text-sm text-muted-foreground">{deck.title}</p>}

      {/* Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Question {current + 1} of {questions.length}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {q.marks} {q.marks === 1 ? "mark" : "marks"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-6 border border-border bg-card rounded-xl p-6">
        <span className="inline-block font-mono text-[10px] uppercase tracking-widest text-primary mb-3">
          {q.question_type === "multiple_choice" ? "Multiple choice" : q.question_type === "short_answer" ? "Short answer" : "Extended response"}
        </span>
        <p className="font-display text-xl text-foreground leading-snug">{q.question_text}</p>

        <div className="mt-5">
          {q.question_type === "multiple_choice" && (
            <div className="space-y-2">
              {(q.options || []).map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                    className={`w-full text-left p-3.5 border rounded-lg transition-colors flex items-center gap-3 ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                    </span>
                    <span className="font-body text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.question_type === "short_answer" && (
            <Input
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              placeholder="Type your answer…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          )}

          {q.question_type === "extended" && (
            <div>
              <Textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                placeholder="Write your full answer…"
                rows={6}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Worth {q.marks} marks · AI feedback is provided after you submit
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        {isLast ? (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Marking…
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" /> Submit & mark
              </>
            )}
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => c + 1)} disabled={!answered}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
      {!answered && !isLast && (
        <p className="mt-2 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Answer to continue
        </p>
      )}
    </div>
  );
}