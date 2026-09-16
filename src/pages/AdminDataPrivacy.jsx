import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, Search, Download, Trash2, UserRound, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { exportUserData, eraseUserData, downloadJson } from "@/lib/dataPrivacy";

export default function AdminDataPrivacy() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState(null);
  const [working, setWorking] = useState(false);
  const [report, setReport] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [mode, setMode] = useState(null); // "erase" | "erase_account"

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
        <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl text-foreground">Admins only</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          This data-privacy tool is restricted to administrators.
        </p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary hover:underline">
          ← Back home
        </Link>
      </div>
    );
  }

  const findUser = async (e) => {
    e.preventDefault();
    setSearching(true);
    setTarget(null);
    setReport(null);
    setConfirmText("");
    setMode(null);
    try {
      const all = await base44.entities.User.list(undefined, 1000);
      const q = query.trim().toLowerCase();
      const match = all.find((u) => (u.email || "").toLowerCase() === q || (u.email || "").toLowerCase().includes(q));
      setTarget(match || false);
    } catch (err) {
      setTarget(false);
    } finally {
      setSearching(false);
    }
  };

  const doExport = async () => {
    if (!target) return;
    setWorking(true);
    setReport(null);
    try {
      const data = await exportUserData(target.id);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(data, `flashflow-data-${(target.email || target.id).replace(/[^a-z0-9]+/gi, "_")}-${stamp}.json`);
    } finally {
      setWorking(false);
    }
  };

  const doErase = async () => {
    if (!target || confirmText !== "DELETE") return;
    setWorking(true);
    setReport(null);
    try {
      const r = await eraseUserData(target.id, { deleteAccount: mode === "erase_account" });
      setReport(r);
      if (mode === "erase_account") setTarget(false);
    } finally {
      setWorking(false);
      setConfirmText("");
      setMode(null);
    }
  };

  const openConfirm = (m) => {
    setMode(m);
    setConfirmText("");
    setReport(null);
  };
  const cancelConfirm = () => {
    setMode(null);
    setConfirmText("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Internal · GDPR
        </span>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Data Privacy Tools
        </h1>
        <p className="mt-2 font-body text-sm text-muted-foreground max-w-xl">
          Export or erase all data associated with a user account in response to a data-subject request. Actions are
          irreversible.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={findUser} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find user by email…"
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-slate-200 font-body text-sm focus:outline-none focus:border-primary rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {searching ? "Searching…" : "Find"}
        </button>
      </form>

      {/* No match */}
      {target === false && (
        <p className="mt-6 font-body text-sm text-muted-foreground">No user found for that email.</p>
      )}

      {/* Found user */}
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 border border-slate-200 bg-card rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl text-foreground truncate">{target.full_name || "Unnamed"}</p>
              <p className="font-body text-sm text-muted-foreground truncate">{target.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-slate-200 rounded text-muted-foreground">
                  {target.role || "user"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-slate-200 rounded text-muted-foreground">
                  Joined {target.created_date ? new Date(target.created_date).toLocaleDateString("en-GB") : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={doExport}
              disabled={working}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 font-mono text-xs uppercase tracking-widest rounded-md hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export data
            </button>
            <button
              onClick={() => openConfirm("erase")}
              disabled={working}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 dark:text-amber-400 font-mono text-xs uppercase tracking-widest rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Erase data
            </button>
            <button
              onClick={() => openConfirm("erase_account")}
              disabled={working}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-destructive/40 text-destructive font-mono text-xs uppercase tracking-widest rounded-md hover:bg-destructive/5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Erase data & delete account
            </button>
          </div>

          {/* Confirmation */}
          {mode && (
            <div className="mt-6 p-4 border border-destructive/30 bg-destructive/5 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="font-body text-sm text-foreground">
                  This permanently deletes all of {target.email}'s data
                  {mode === "erase_account" ? " and removes the account entirely" : ""}. This cannot be undone.
                  Type <strong className="font-mono">DELETE</strong> to confirm.
                </p>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="flex-1 px-3 py-2 bg-card border border-slate-200 font-mono text-sm focus:outline-none focus:border-primary rounded-md"
                />
                <button
                  onClick={doErase}
                  disabled={working || confirmText !== "DELETE"}
                  className="px-4 py-2 bg-destructive text-destructive-foreground font-mono text-xs uppercase tracking-widest rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {working ? "Working…" : "Confirm erasure"}
                </button>
                <button
                  onClick={cancelConfirm}
                  disabled={working}
                  className="px-4 py-2 border border-slate-200 font-mono text-xs uppercase tracking-widest rounded-md hover:border-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Erasure report */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 border border-slate-200 bg-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-positive" />
            <h2 className="font-display text-lg text-foreground">Erasure complete</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.steps.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-md text-xs font-mono"
              >
                <span className="text-muted-foreground truncate">{s.name}</span>
                {s.ok ? (
                  <span className="text-positive">{s.count != null ? `${s.count} removed` : "done"}</span>
                ) : (
                  <span className="text-destructive truncate ml-2" title={s.error}>failed</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}