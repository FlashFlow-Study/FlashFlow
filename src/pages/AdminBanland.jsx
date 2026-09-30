import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, Ban as BanIcon, User as UserIcon, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSeo } from "@/lib/useSeo";

export default function AdminBanland() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const [bans, setBans] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [search, setSearch] = useState("");
  const [draftId, setDraftId] = useState(null);
  const [draftReason, setDraftReason] = useState("");

  useSeo("Banland — Admin | FlashFlow", "Admin panel to ban and unban FlashFlow users.");

  const load = async () => {
    try {
      const [allUsers, banRecs] = await Promise.all([
        base44.entities.User.list("-created_date", 500),
        base44.entities.Ban.list("-banned_date", 500),
      ]);
      const map = {};
      banRecs.forEach((b) => { map[b.user_id] = b; });
      setUsers(allUsers);
      setBans(map);
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

  const doBan = async (u) => {
    setBusy(u.id);
    try {
      const existing = bans[u.id];
      if (existing) {
        // already banned — nothing to do
        setDraftId(null);
        return;
      }
      await base44.entities.Ban.create({
        user_id: u.id,
        full_name: u.full_name || "",
        email: u.email || "",
        reason: draftReason.trim(),
        banned_date: new Date().toISOString(),
      });
      const fresh = await base44.entities.Ban.filter({ user_id: u.id });
      setBans((prev) => ({ ...prev, [u.id]: fresh[0] }));
      setDraftId(null);
      setDraftReason("");
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const doUnban = async (u) => {
    setBusy(u.id);
    try {
      const b = bans[u.id];
      if (!b) return;
      await base44.entities.Ban.delete(b.id);
      setBans((prev) => {
        const next = { ...prev };
        delete next[u.id];
        return next;
      });
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-display text-2xl text-foreground">Admins only</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          You don't have access to this page.
        </p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary">
          ← Back home
        </Link>
      </div>
    );

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/admin" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back to admin
      </Link>

      <h1 className="mt-4 font-display text-4xl font-bold text-foreground tracking-tight">Ban users</h1>
      <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
        Ban a user to block them from FlashFlow. You can add a reason and unban at any time. Admins
        can't be banned.
      </p>

      <div className="mt-6 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full px-4 py-2.5 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
        />
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border border border-border rounded-md">
          {filtered.map((u) => {
            const admin = u.role === "admin";
            const self = u.id === user?.id;
            const ban = bans[u.id];
            const banned = !!ban;
            const isDraft = draftId === u.id;
            return (
              <div key={u.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-foreground truncate">{u.full_name || "Unnamed"}</p>
                      <p className="font-mono text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500 text-white rounded-full font-mono text-[9px] uppercase tracking-widest">
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </span>
                    ) : banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 border border-destructive/40 text-destructive rounded-full font-mono text-[9px] uppercase tracking-widest">
                        <BanIcon className="w-3 h-3" /> Banned
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active</span>
                    )}
                    {!admin && !self && !banned && (
                      <button
                        onClick={() => {
                          setDraftId(isDraft ? null : u.id);
                          setDraftReason("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
                      >
                        <BanIcon className="w-3 h-3" /> Ban
                      </button>
                    )}
                    {!admin && !self && banned && (
                      <button
                        onClick={() => doUnban(u)}
                        disabled={busy === u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest rounded-md hover:border-foreground transition-colors"
                      >
                        {busy === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Unban
                      </button>
                    )}
                  </div>
                </div>
                {isDraft && (
                  <div className="mt-3 pl-12">
                    <input
                      value={draftReason}
                      onChange={(e) => setDraftReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="w-full px-3 py-2 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => doBan(u)}
                        disabled={busy === u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground font-mono text-[10px] uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
                      >
                        {busy === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BanIcon className="w-3 h-3" />}
                        Confirm ban
                      </button>
                      <button
                        onClick={() => setDraftId(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest rounded-md hover:border-foreground transition-colors"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
                {banned && ban?.reason && (
                  <p className="mt-2 pl-12 font-body text-xs text-muted-foreground">
                    Reason: {ban.reason}
                  </p>
                )}
              </div>
            );
          })}
          {!filtered.length && (
            <p className="p-6 text-center font-body text-sm text-muted-foreground">No users match.</p>
          )}
        </div>
      )}
    </div>
  );
}