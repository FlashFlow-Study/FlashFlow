import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

// Confirmation dialog for irreversible account termination. Requires the
// admin to retype their own email exactly before the Terminate button enables.
export default function TerminateConfirmDialog({
  open,
  targetName,
  targetEmail,
  adminEmail,
  busy,
  onClose,
  onConfirm,
}) {
  const [typed, setTyped] = useState("");
  const matches =
    typed.trim().toLowerCase() === String(adminEmail || "").trim().toLowerCase();

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-card border-2 border-destructive/50 rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-2 text-destructive mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-display text-xl font-bold">Terminate this account?</h2>
          </div>
          <p className="font-body text-sm text-foreground">
            You are about to permanently terminate{" "}
            <span className="font-medium">
              {targetName || targetEmail || "this user"}
            </span>
            .
          </p>
          <p className="font-body text-sm text-destructive font-medium mt-3">
            Are you really, really sure? All account data will be wiped completely.
            This cannot be undone.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Type your admin email to confirm
          </p>
          <p className="font-mono text-xs text-foreground mb-2 break-all">{adminEmail}</p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Your admin email"
            autoFocus
            autoComplete="off"
            className="w-full px-3 py-2 bg-background border border-border font-body text-sm focus:outline-none focus:border-destructive rounded-md"
          />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 border border-border font-mono text-[11px] uppercase tracking-widest rounded-md hover:border-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(typed)}
              disabled={!matches || busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground font-mono text-[11px] uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              Terminate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}