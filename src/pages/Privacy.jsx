import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Database, Trash2, School, Lock, KeyRound, Cog, Clock, FileText } from "lucide-react";
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
    "FlashFlow Privacy Policy — What Data We Collect and Your Rights",
    "FlashFlow's privacy policy: what study data the platform collects, why it is collected, how it is kept secure under UK GDPR, and how to access, export or delete it at any time."
  );
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Effective from 20 October 2026
        </span>
        <h1 className="mt-2 font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.05]">
          Privacy Policy
        </h1>
        <p className="mt-4 font-body text-sm md:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
          This document explains what information FlashFlow Study collects, why it is collected, how it is used and
          protected, and what choices and rights you have when using the platform.
        </p>
      </div>

      <Section icon={FileText} title="Definitions">
        <p>In this document:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>"We", "us" or "our"</strong> refers to FlashFlow Study (flashflowstudy.com) and the authorised administrators responsible for managing FlashFlow Study within your school or organisation.</li>
          <li><strong>"You" or "your"</strong> refers to the individual using FlashFlow Study, including students, teachers and other authorised users.</li>
          <li><strong>"FlashFlow Study"</strong> refers to the website, services, features and systems provided through flashflowstudy.com.</li>
          <li><strong>"School" or "organisation"</strong> refers to the school, college or other organisation that provides or authorises your access to FlashFlow Study.</li>
          <li><strong>"Administrator"</strong> refers to an authorised person responsible for managing FlashFlow Study or your organisation's use of the service (this may include school IT staff, teachers or other designated staff members), or a person or developer overseeing FlashFlow and user activities.</li>
        </ul>
      </Section>

      <Section icon={KeyRound} title="Sign-in with Google (SSO)">
        <p>
          We use Google SSO to make it easier for you to access FlashFlow Study using your existing Google account.
          Depending on the type of Google account you hold, a Google Workspace Administrator may need to approve
          FlashFlow Study before you can sign in. Our Google SSO requests are <strong>openid</strong>, <strong>email</strong> and <strong>profile</strong>, which together provide only your email address, full name and profile image (where available).
        </p>
        <p>
          We do not request access to your Google contacts, photographs, calendars, Drive files, emails or any other
          Google data, and we do not store anything beyond the minimum profile information required to create and
          identify your account. If you remove FlashFlow Study's access from your Google account settings, you can
          revoke this consent at any time.
        </p>
        <p>
          Where your access is provided through a Google Workspace for Education account, your school and its
          designated Google Workspace Administrator control whether FlashFlow Study may be used with that account.
          Any approval, restriction or withdrawal of such access is a matter between you and your school; FlashFlow
          Study will act on the instructions of the school in respect of accounts under its control.
        </p>
      </Section>

      <Section icon={School} title="Who is responsible for your data">
        <p>
          Where FlashFlow Study is deployed, provided or authorised by a school or organisation, the school acts as
          the <strong>data controller</strong> in respect of its users' personal data, and FlashFlow Study acts as the
          <strong> data processor</strong>. In this capacity, FlashFlow Study processes personal data only on the
          documented instructions of the school, and the school retains responsibility for ensuring that the use of
          FlashFlow Study complies with its own data protection obligations, including those arising under the UK
          GDPR and the Data Protection Act 2018.
        </p>
        <p>
          Where you create your account and use FlashFlow Study independently, without your access being provided
          or authorised by a school or organisation, you use the service in a personal capacity and FlashFlow
          Study determines the purposes and means of processing your personal data as described in this document.
          In this case you act entirely on your own behalf: you control your own account, decks, classes and study
          records, and you can exercise all of the rights set out in this document directly, at any time, without
          needing a school Administrator to act for you.
        </p>
        <p>
          Any questions, requests or complaints regarding this document or the processing of your personal data should
          be directed to <strong>support@flashflowstudy.com</strong>. Where your access is provided by a school, you
          may also contact your school's Administrator or data protection lead.
        </p>
      </Section>

      <Section icon={Database} title="Information we collect">
        <p>To provide the service, the platform collects only the data it needs to function:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account information</strong> — your email address and name, used to identify you, and whether your account is a teacher or student account, so the appropriate features are shown.</li>
          <li><strong>Study content</strong> — flashcard decks and cards, folders, and (for teachers) classrooms, members and assignments that you create.</li>
          <li><strong>Study records and assignment progress</strong> — sessions, cards studied and scores, so that you can track your progress and teachers can monitor assigned work; which classes you belong to and your completion of assigned work.</li>
          <li><strong>Device confirmation</strong> — a confirmation flag stored only in your own browser to remember that you have confirmed this device at sign-in.</li>
          <li><strong>Messages you send us</strong> — if you contact us through the contact form, the platform stores your name, email address and message so that your enquiry can be read and answered.</li>
        </ul>
        <p>
          We do <strong>not</strong> collect location data, biometric data, browsing history, advertising identifiers
          or any categories of data beyond those set out above. We do not use third-party advertising or analytics
          trackers on the platform.
        </p>
      </Section>

      <Section icon={Cog} title="How we use your information">
        <p>The platform uses your personal data only to operate the service, specifically:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To display your decks, cards, classes and assignments.</li>
          <li>To record study progress and assignment completion.</li>
          <li>To send a one-time confirmation code to your email address when you sign in from a new device, and to send service messages relating to your account, class invitations and assignments.</li>
          <li>To permit teachers and Administrators to manage classrooms and monitor assigned work.</li>
          <li>To maintain the security and integrity of the service, including the prevention of abuse.</li>
        </ul>
        <p>
          <strong>Legal bases.</strong> Your personal data is processed on the following legal bases: the performance
          of the contract between you and us in providing the service; our legitimate interests in operating,
          securing and improving the service; and, where required, your consent, which may be withdrawn at any time
          without affecting the lawfulness of processing based on consent before its withdrawal.
        </p>
        <p>
          <strong>What we do not do.</strong> We do not sell your personal data. We do not share your personal data
          with third parties for the purpose of training artificial intelligence models. We do not use your personal
          data for advertising, and the platform displays no third-party advertisements.
        </p>
        <p>
          <strong>AI-assisted deck creation.</strong> Where you deliberately submit material to FlashFlow Study's
          AI-assisted deck creation feature, that material is processed solely for the purpose of generating the
          flashcards you have requested. Study content that you do not submit to this feature is not processed by
          it, and your data is not used to train third-party AI models.
        </p>
        <p>
          <strong>Service providers.</strong> FlashFlow Study is operated on secure managed cloud infrastructure, and
          uses a small number of third-party service providers strictly necessary to operate the platform (including
          hosting, bot-protection and email delivery services). Such providers process personal data only on our
          instructions and are bound by appropriate data protection obligations.
        </p>
      </Section>

      <Section icon={Lock} title="How we keep your data secure">
        <p>
          Every user's study data, decks and records are isolated per account, and such isolation is enforced at the
          database level through row-level security controls, not merely by the user interface. A user can access
          only their own study records and content shared with them. Private decks cannot be viewed by other users,
          even where a direct link is known. Classrooms, assignments and class materials are visible only to the
          teacher and enrolled students concerned.
        </p>
        <p>
          Data is transmitted over encrypted connections. The platform is protected against automated abuse and bot
          activity, and public-facing forms are safeguarded by bot-verification controls.
        </p>
        <p>
          Administrators may moderate content and suspend or ban accounts that breach the FlashFlow Study Terms of
          Service, in order to protect users and maintain a safe, school-appropriate environment.
        </p>
      </Section>

      <Section icon={Trash2} title="Your rights and data deletion">
        <p>
          Subject to applicable data protection law, including the UK GDPR and the Data Protection Act 2018, you
          have the following rights in respect of your personal data:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Right of access</strong> — to request a copy of the personal data held about you.</li>
          <li><strong>Right to rectification</strong> — to request correction of inaccurate personal data.</li>
          <li><strong>Right to erasure</strong> — to request deletion of your personal data and your account.</li>
          <li><strong>Right to data portability</strong> — to receive your data in a structured, commonly used format.</li>
          <li><strong>Right to object and to withdraw consent</strong> — to object to certain processing or withdraw consent where processing is based on it.</li>
        </ul>
        <p>
          To exercise any of these rights, contact <strong>support@flashflowstudy.com</strong>. Where your access is
          provided by a school, your school's Administrator may make or support such requests on your behalf.
          Requests are answered within one month of receipt. Deleting your account removes your personal data from
          the platform, save where we are required to retain certain records by law, in which case such records are
          retained no longer than necessary for that purpose.
        </p>
      </Section>

      <Section icon={Clock} title="Data retention">
        <p>
          Your personal data is retained only for as long as your account is active and as necessary to provide the
          service, or where retention is required for security, legal or operational reasons. Upon account deletion,
          or upon a valid erasure request, your personal data is deleted from the platform in accordance with the
          section above.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="Changes to this policy">
        <p>
          We may update this document from time to time to reflect changes in the service or in applicable law. The
          current version is always available at flashflowstudy.com, with its effective date shown above. Where
          changes are material, users are notified through the platform or by email. Continued use of FlashFlow
          Study after the effective date of an updated policy constitutes acceptance of the updated policy.
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