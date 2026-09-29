import React from "react";
import { Ban, Mail } from "lucide-react";

export default function BannedScreen({ reason }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center border border-destructive/40 bg-card rounded-md p-8">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <Ban className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
          You have been banned
        </h1>
        <p className="mt-3 font-body text-sm text-muted-foreground leading-relaxed">
          Your FlashFlow account has been banned by an administrator and you can no longer use the
          app.
        </p>
        {reason ? (
          <p className="mt-4 text-left p-4 border border-border rounded-md bg-background">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Reason
            </span>
            <span className="block mt-1 font-body text-sm text-foreground">{reason}</span>
          </p>
        ) : null}
        <p className="mt-5 font-body text-sm text-muted-foreground">
          If you believe this is a mistake, you can request a review.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <a
            href="mailto:support@flashflowstudy.com"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md"
          >
            <Mail className="w-4 h-4" /> Contact support
          </a>
        </div>
      </div>
    </div>
  );
}