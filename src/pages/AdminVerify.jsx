import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, ShieldCheck, BadgeCheck, User as UserIcon, Check, X,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSeo } from "@/lib/useSeo";

export default function AdminVerify() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState("");

  useSeo(
    "Verify Users — Admin | FlashFlow",
    "Admin panel to grant verified status to FlashFlow users."
  );

  const load = async () => {
    setSyncing(true);
    try {
      const allUsers = await base44.entities.User.list("-created_date", 500);
      const recs = await base44.entities.Verification.list("-updated_date", 500);
      const byUid = {};
      recs.forEach((r) => { byUid[r.user_id] = r; });

      // Sync: create missing records and keep role/email/name accurate.
      const toCreate = [];
      const updates = [];
      allUsers.forEach((u) => {
        const name = u.full_name || "";
        const r = byUid[u.id];
        const verifiedForAdmin = u.role === "admin";
        if (!r) {
          toCreate.push({
            user_id: u.id,
            full_name: name,
            email: u.email || "",
            role: u.role || "user",
            is_verified: verifiedForAdmin,
          });
        } else if (
          r.role !== (u.role || "user") ||
          r.email !== (u.email || "") ||
          r.full_name !== name ||
          (verifiedForAdmin && !r.is_verified)
        ) {
          updates.push({
            id: r.id,
            full_name: name,
            email: u.email || "",
            role: u.role || "user",
            ...(verifiedForAdmin ? { is_verified: true } : {}),
          });
        }
      });
      if (toCreate.length) await base44.entities.Verification.bulkCreate(toCreate);
      if (updates.length) await base44.entities.Verification.bulkUpdate(updates);

      const fresh = await base44.entities.Verification.list("-updated_date", 500);
      const map = {};
      fresh.forEach((r) => { map[r.user_id] = r; });
      setUsers(allUsers);
      setRecords(map);
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
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

  const toggleVerify = async (u) => {
    if (u.role === "admin") return;
    const r = records[u.id];
    if (!r) return;
    setToggling(u.id);
    try {
      const next = !r.is_verified;
      await base44.entities.Verification.update(r.id, { is_verified: next });
      setRecords((prev) => ({ ...prev, [u.id]: { ...r, is_verified: next } }));
    } catch {
      /* ignore */
    } finally {
      setToggling(null);
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
      <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">Verify users</h1>
      <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
        Grant the verified badge to community members. Admins are verified automatically.
      </p>

      <div className="mt-6 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full px-4 py-2.5 bg-card border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
        />
      </div>

      {loading || syncing ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border border border-border rounded-md">
          {filtered.map((u) => {
            const r = records[u.id];
            const admin = u.role === "admin";
            const verified = admin || r?.is_verified === true;
            return (
              <div key={u.id} className="p-4 flex items-center justify-between gap-3">
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
                  ) : verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 border border-positive/40 text-positive rounded-full font-mono text-[9px] uppercase tracking-widest">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Unverified</span>
                  )}
                  <button
                    onClick={() => toggleVerify(u)}
                    disabled={admin || toggling === u.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest rounded-md transition-colors disabled:opacity-40 ${
                      verified
                        ? "border border-border hover:border-destructive hover:text-destructive"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {toggling === u.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : verified ? (
                      <X className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    {verified ? "Revoke" : "Verify"}
                  </button>
                </div>
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