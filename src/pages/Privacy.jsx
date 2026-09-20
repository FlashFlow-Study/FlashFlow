import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, Database, EyeOff, Trash2, School, Lock } from "lucide-react";
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

export default function Privacy() {
  useSeo(
    "FlashFlow Privacy Policy — How We Handle Your Study Data",
    "FlashFlow's privacy policy explains what study and account data we collect, how we secure it, and how you can export or delete it at any time."
  );
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Effective {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </span>
        <h1 className="mt-2 font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.05]">
          Privacy Policy
        </h1>
        <p className="mt-4 font-body text-sm md:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
          FlashFlow is a flashcard and study platform intended for use in schools. This policy explains what data we
          collect, why we collect it, and how you can request access to or deletion of your data.
        </p>
      </div>

      <Section icon={School} title="Who is responsible for your data">
        <p>
          When FlashFlow is deployed by a school, the school acts as the data controller and FlashFlow acts as the
          data processor. If you are a student, your teacher or school administrator can help you exercise your data
          rights. For general enquiries, <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </Section>

      <Section icon={Database} title="What data we collect">
        <p>To provide the service, we collect only the data the platform needs to function:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account details</strong> — your email address and name, used to identify you.</li>
          <li><strong>Role</strong> — whether your account is a teacher or student, so the right features are shown.</li>
          <li><strong>Content you create</strong> — flashcard decks and cards, folders, and (for teachers) classrooms, members, and assignments.</li>
          <li><strong>Study activity</strong> — sessions, cards studied, and scores, so you can track progress and teachers can monitor assignments.</li>
          <li><strong>Classroom membership & assignment progress</strong> — which classes you belong to and your completion of assigned work.</li>
          <li><strong>Device-trust flag</strong> — stored only in your own browser to remember that you've confirmed this device at sign-in.</li>
        </ul>
        <p>We do <strong>not</strong> collect location data, biometric data, or browsing history.</p>
      </Section>

      <Section icon={Mail} title="Sign-in with Google (SSO)">
        <p>
          If you sign in with Google, we request only the minimum profile information needed to create and identify
          your account: your <strong>name</strong> and <strong>email address</strong>.
        </p>
        <p>
          We do <strong>not</strong> request access to your Google contacts, photos, calendars, Drive files, emails, or
          any other Google data, and we do not store anything beyond your name and email from that sign-in. Any extra
          fields returned by Google are discarded and never written to our database.
        </p>
      </Section>

      <Section icon={EyeOff} title="What we do with your data">
        <p>We use your data only to run the platform:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To show you your decks, cards, classes, and assignments.</li>
          <li>To record study progress and assignment completion.</li>
          <li>To send a one-time confirmation code to your email when you sign in from a new device.</li>
          <li>To let teachers manage classrooms and monitor assigned work.</li>
        </ul>
        <p>We do not sell your data, and we do not share it with third parties for advertising.</p>
      </Section>

      <Section icon={Lock} title="How we keep it secure">
        <p>
          Passwords are never stored in plain text. Access to records is restricted so that one user cannot read or
          edit another user's private data. Sign-in from a new device or browser is confirmed with an emailed code,
          and trusted devices are remembered only on that browser.
        </p>
      </Section>

      <Section icon={Trash2} title="Your rights & data deletion">
        <p>
          You have the right to access, export, correct, and delete your personal data. You can export or erase all
          data tied to an account — including decks, cards, classes, assignments, and study history — at any time.
        </p>
        <p>
          Teachers and school administrators can perform export and erasure on behalf of a user through the internal
          Data Privacy tools. When data is erased, it is permanently removed from the platform and cannot be recovered.
        </p>
        <p>
          To request export or deletion of your data, ask your school administrator or{" "}
          <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="Changes to this policy">
        <p>
          We may update this policy as the platform evolves. The effective date above reflects the most recent
          revision. Continued use of FlashFlow after a change means you accept the updated policy.
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