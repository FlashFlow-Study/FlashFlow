import React, { useState } from "react";
import { Ban, Clock, Download, Loader2, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Banned / suspended / terminated screen. A user lands here based on their
// Ban record's state:
//  - pending_review: auto-suspended after repeated content-moderation flags,
//    awaiting admin review. They can still download their data.
//  - banned (reversible): a normal admin ban. They can appeal via support
//    email and sign out. Their data is retained, so no download is offered.
//  - terminated (irreversible): admin wiped the account. No appeal — only a
//    final data download (of whatever the SDK can still read) and sign out.
const SUPPORT_EMAIL = "support@flashflowstudy.com";
const TERMINATED_REASON = "Account terminated by admin. All account data wiped.";

export default function BannedScreen({ ban }) {
  const [downloading, setDownloading] = useState(false);
  const pending = ban?.status === "pending_review";
  // A termination is flagged explicitly, with a fallback for legacy ban
  // records created before the `terminated` field existed (identifiable by
  // the fixed termination reason text).
  const terminated = !!ban?.terminated || ban?.reason === TERMINATED_REASON;
  const reason = ban?.reason;

  const downloadData = async () => {
    setDownloading(true);
    try {
      const [decks, cards, sessions, stars] = await Promise.all([
        base44.entities.Deck.list("-created_date", 500).catch(() => []),
        base44.entities.Card.list("-created_date", 1000).catch(() => []),
        base44.entities.StudySession.list("-created_date", 500).catch(() => []),
        base44.entities.UserCardStar.list("-created_date", 500).catch(() => []),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        account: { id: ban?.user_id, email: ban?.email, full_name: ban?.full_name },
        decks,
        cards,
        study_sessions: sessions,
        starred_cards: stars,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flashflow-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  const appealHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "FlashFlow account appeal"
  )}&body=${encodeURIComponent(
    `Hi FlashFlow team,\n\nMy account (${ban?.email || ""}) was banned and I'd like to appeal.\n\nReason given: ${reason || "(none)"}\n\nMy message: `
  )}`;

  const heading = pending ? "Account suspended" : terminated ? "Account terminated" : "Account banned";
  const intro = pending
    ? "Your account has been automatically suspended pending review after repeated content-moderation flags. An administrator will review your decks and decide whether to reinstate or terminate your account."
    : terminated
    ? "Your FlashFlow account has been terminated by an administrator for violating the Terms of Service. All of your data has been wiped. You can no longer use the app."
    : "Your FlashFlow account has been banned by an administrator. You can't use the app while the ban is active. If you believe this is a mistake, you can appeal below.";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center border border-destructive/40 bg-card rounded-md p-8">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          {pending ? <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" /> : <Ban className="w-7 h-7 text-destructive" />}
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">{heading}</h1>
        <p className="mt-3 font-body text-sm text-muted-foreground leading-relaxed">{intro}</p>
        {reason ? (
          <p className="mt-4 text-left p-4 border border-border rounded-md bg-background">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Reason</span>
            <span className="block mt-1 font-body text-sm text-foreground">{reason}</span>
          </p>
        ) : null}

        {!pending && !terminated && (
          <a
            href={appealHref}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Mail className="w-4 h-4" /> Appeal this ban
          </a>
        )}

        {(pending || terminated) && (
          <p className="mt-5 font-body text-sm text-muted-foreground">
            You can download a copy of your data before you leave.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {(pending || terminated) && (
            <button
              onClick={downloadData}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download my data
            </button>
          )}
          <button
            onClick={() => base44.auth.logout(window.location.origin)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground transition-colors rounded-md"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}