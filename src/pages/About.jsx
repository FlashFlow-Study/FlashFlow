import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Target, Users } from "lucide-react";
import { useSeo } from "@/lib/useSeo";

export default function About() {
  useSeo(
    "About FlashFlow — How Our Flashcards Help Students Learn",
    "FlashFlow helps students learn faster with custom flashcard decks, AI-generated cards, quizzes, and focused spaced-repetition study sessions."
  );
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back
      </Link>

      <span className="block mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        About FlashFlow
      </span>
      <h1 className="font-display text-5xl text-foreground mt-2 tracking-tight">
        Study smarter, not longer.
      </h1>

      <div className="mt-8 space-y-5 font-body text-sm md:text-base text-muted-foreground leading-relaxed">
        <p>
          FlashFlow is a streamlined study tool that helps students build custom flashcard decks
          and master new material through interactive, spaced learning. Whether you're preparing
          for finals, learning a new language, or brushing up on professional certifications,
          FlashFlow turns your notes into a focused practice experience. You can create decks by
          hand, paste in study notes and let AI generate cards for you, or import an existing set
          from CSV, JSON, or tab-separated files.
        </p>
        <p>
          The platform is built for learners of every kind — university students, self-taught
          hobbyists, teachers who want to share material with a class, and anyone who believes that
          consistent, active recall is the most effective way to retain knowledge. Three study
          modes keep practice fresh: classic flashcard flipping for quick review, multiple-choice
          quizzes to test recognition, and a type-in mode that demands precise recall. Public
          decks can be browsed and practiced by anyone, no account required.
        </p>
        <p>
          FlashFlow is built by a small, independent team passionate about making high-quality
          learning tools accessible to everyone. We believe studying shouldn't require expensive
          software or cluttered interfaces — just clean design, thoughtful features, and a little
          bit of momentum to keep you coming back. Your decks and progress are private by default,
          and you decide what to share with the community.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Sparkles, title: "AI-assisted", body: "Generate cards from your own notes in seconds." },
          { icon: Target, title: "Three modes", body: "Flashcards, quizzes, and typed recall." },
          { icon: Users, title: "For everyone", body: "Students, teachers, and lifelong learners." },
        ].map((f) => (
          <div key={f.title} className="p-5 border border-border bg-card rounded-md">
            <f.icon className="w-5 h-5 text-primary mb-3" />
            <h3 className="font-display text-lg text-foreground">{f.title}</h3>
            <p className="mt-1 font-body text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}