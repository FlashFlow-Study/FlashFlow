import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, MessageSquare, Ban, Upload, School, FileText } from "lucide-react";
import { useSeo } from "@/lib/useSeo";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="border-t border-slate-200 dark:border-slate-800 py-8 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </span>
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="font-body text-sm md:text-[15px] text-muted-foreground leading-relaxed space-y-3 max-w-3xl">
        {children}
      </div>
    </section>
  );
}

export default function Terms() {
  useSeo(
    "FlashFlow Terms of Service — Community Rules",
    "FlashFlow's terms of service set out the community rules for using the platform, and the consequences for content removal or account bans."
  );
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Last updated 28 September 2026
        </span>
        <h1 className="mt-2 font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.05]">
          Terms of Service
        </h1>
        <p className="mt-4 font-body text-sm md:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
          FlashFlow is a flashcard and study platform built for school use. These terms set out the
          simple rules for using FlashFlow and the content you share. By using the app, you agree to
          follow them.
        </p>
      </div>

      <Section icon={School} title="Keep it appropriate for a school study space">
        <p>
          FlashFlow is used in classrooms, so everything you add must be suitable for a school
          environment. This applies everywhere in the app — cards, decks, titles, descriptions,
          tags, your display name, and any other content you create or share.
        </p>
      </Section>

      <Section icon={MessageSquare} title="No hate speech, slurs, or abusive content">
        <p>
          Do not include slurs, hate speech, or horrible, abusive, or threatening language anywhere
          in FlashFlow — not in your cards, decks, titles, tags, display name, or anything else.
          Content that attacks or demeans people based on race, ethnicity, religion, gender,
          sexuality, disability, or any other identity is not allowed.
        </p>
      </Section>

      <Section icon={Ban} title="No harassment">
        <p>
          Do not harass, bully, or intimidate other users. Repeated unwanted contact, targeting
          another student, or using the app to bother someone is not allowed.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="No spam, scams, or misleading content">
        <p>
          Don't use FlashFlow to send spam, run scams, or post misleading content. This includes
          deceptive links, fake giveaways, repeated unwanted decks or invitations, or anything
          designed to trick or flood other users.
        </p>
      </Section>

      <Section icon={Upload} title="Only share content you have the right to">
        <p>
          Only upload or share content that you created or that you have permission to share. Don't
          post copyrighted material you don't have the rights to, and don't upload other people's
          private information.
        </p>
      </Section>

      <Section icon={FileText} title="What happens if the rules are broken">
        <p>
          Breaking these rules can result in content being removed and your account being banned by
          an administrator, at the administrators' discretion. A ban stops you from using FlashFlow.
        </p>
        <p>
          If you believe content or a ban decision was wrong, you can{" "}
          <Link to="/contact" className="text-primary hover:underline">contact us</Link> to ask us to
          review it.
        </p>
      </Section>

      <Section icon={FileText} title="Changes to these terms">
        <p>
          We may update these terms as the platform evolves. The "Last updated" date above reflects
          the most recent revision. Continued use of FlashFlow after a change means you accept the
          updated terms.
        </p>
      </Section>

      <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6">
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-primary hover:underline">
          ← Back to FlashFlow
        </Link>
      </div>
    </div>
  );
}