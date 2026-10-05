import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldAlert, Check, X, Ban as BanIcon, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSeo } from "@/lib/useSeo";
import { toast } from "@/components/ui/use-toast";

const CATEGORY_LABEL = {
  inappropriate: "Inappropriate",
  copyright: "Copyrighted",
};
const SEVERITY_TONE = {
  low: "border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  medium: "border-orange-300 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30",
  high: "border-destructive/50 text-destructive bg-destructive/5",
};

export default function AdminModeration() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [flags, setFlags] = useState([]);
  const [bans, setBans] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useSeo("Moderation — Admin | FlashFlow", "Review flagged deck content and suspended accounts.");

  const load = async () => {
    try {
      const [flagRecs, banRecs] = await Promise.all([
        base44.entities.ModerationFlag.list("-scanned_at", 500),
        base44.entities.Ban.list("-banned_date", 500),
      ]);
      setFlags(flagRecs);
      setBans(banRecs);
      const ids = new Set();
      flagRecs.forEach((f) => ids.add(f.user_id));
      banRecs.forEach((b) => ids.add(b.user_id));
      if (ids.size) {
        try {
          const all = await base44.entities.User.list("-created_date", 500);
          const map = {};
          all.forEach((u) => { map[u.id] = u; });
          setUsers(map);
        } catch { /* ignore */ }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    load();
  }, [isAdmin]);

  const pendingFlags = flags.filter((f) => f.status === "pending");
  const suspendedBans = bans.filter((b) => b.status === "pending_review");

  const setFlagStatus = async (flag, status) => {
    setBusy(flag.id);
    try {
      await base44.entities.ModerationFlag.update(flag.id, { status });
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, status } : f)));
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const terminate = async (userId) => {
    setBusy(`ban-${userId}`);
    try {
      const existing = bans.find((b) => b.user_id === userId);
      if (existing) {
        await base44.entities.Ban.update(existing.id, { status: "banned", source: existing.source || "manual" });
      } else {
        const u = users[userId] || {};
        await base44.entities.Ban.create({
          user_id: userId,
          full_name: u.full_name || "",
          email: u.email || "",
          reason: "Account terminated by admin following content moderation review.",
          banned_date: new Date().toISOString(),
          status: "banned",
          source: "manual",
        });
      }
      const userFlags = pendingFlags.filter((f) => f.user_id === userId);
      if (userFlags.length) {
        await base44.entities.ModerationFlag.bulkUpdate(
          userFlags.map((f) => ({ id: f.id, status: "upheld" }))
        );
        setFlags((prev) => prev.map((f) => (f.user_id === userId && f.status === "pending" ? { ...f, status: "upheld" } : f)));
      }
      toast({ description: "Account terminated." });
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const reinstate = async (userId) => {
    setBusy(`rein-${userId}`);
    try {
      const existing = bans.find((b) => b.user_id === userId);
      if (existing) await base44.entities.Ban.delete(existing.id);
      const userFlags = pendingFlags.filter((f) => f.user_id === userId);
      if (userFlags.length) {
        await base44.entities.ModerationFlag.bulkUpdate(
          userFlags.map((f) => ({ id: f.id, status: "dismissed" }))
        );
        setFlags((prev) => prev.map((f) => (f.user_id === userId && f.status === "pending" ? { ...f, status: "dismissed" } : f)));
      }
      toast({ description: "Account reinstated." });
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-display text-2xl text-foreground">Admins only</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">You don't have access to this page.</p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary">← Back home</Link>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/admin" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back to admin
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold text-foreground tracking-tight">Content moderation</h1>
      <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
        Decks are scanned for inappropriate or copyrighted material before they go public. Repeated violations auto-suspend
        the account pending your review.
      </p>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Suspended accounts ({suspendedBans.length})
            </h2>
            {suspendedBans.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground border border-border rounded-md p-4">
                No accounts are currently suspended.
              </p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-md">
                {suspendedBans.map((b) => {
                  const u = users[b.user_id] || {};
                  const userFlags = pendingFlags.filter((f) => f.user_id === b.user_id);
                  return (
                    <div key={b.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-body text-sm text-foreground truncate">{u.full_name || u.email || b.user_id}</p>
                          <p className="font-mono text-xs text-muted-foreground truncate">{b.email || u.email}</p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400">
                            {b.flag_count || userFlags.length} flags · pending review
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => reinstate(b.user_id)}
                            disabled={busy === `rein-${b.user_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest rounded-md hover:border-foreground transition-colors"
                          >
                            {busy === `rein-${b.user_id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Reinstate
                          </button>
                          <button
                            onClick={() => terminate(b.user_id)}
                            disabled={busy === `ban-${b.user_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground font-mono text-[10px] uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
                          >
                            {busy === `ban-${b.user_id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <BanIcon className="w-3 h-3" />} Terminate
                          </button>
                        </div>
                      </div>
                      {b.reason && <p className="mt-2 font-body text-xs text-muted-foreground">{b.reason}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Flagged content ({pendingFlags.length})
            </h2>
            {pendingFlags.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground border border-border rounded-md p-4">
                No pending flags. All scanned decks passed review.
              </p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-md">
                {pendingFlags.map((f) => {
                  const u = users[f.user_id] || {};
                  return (
                    <div key={f.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[9px] uppercase tracking-widest ${SEVERITY_TONE[f.severity] || SEVERITY_TONE.medium}`}>
                              {f.severity}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                              {CATEGORY_LABEL[f.category] || f.category}
                            </span>
                            {f.image_urls?.length > 0 && (
                              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                                <Eye className="w-3 h-3" /> {f.image_urls.length} image{f.image_urls.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 font-display text-base text-foreground truncate">{f.deck_title || "Untitled deck"}</p>
                          <p className="font-mono text-xs text-muted-foreground truncate">by {u.full_name || u.email || f.user_id}</p>
                          {f.reason && <p className="mt-1 font-body text-sm text-foreground">{f.reason}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={() => setFlagStatus(f, "dismissed")}
                            disabled={busy === f.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest rounded-md hover:border-foreground transition-colors"
                          >
                            {busy === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Dismiss
                          </button>
                          <button
                            onClick={() => terminate(f.user_id)}
                            disabled={busy === `ban-${f.user_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground font-mono text-[10px] uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
                          >
                            {busy === `ban-${f.user_id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <BanIcon className="w-3 h-3" />} Terminate
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}