import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ban as BanIcon, ShieldCheck, FileLock, Loader2, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSeo } from "@/lib/useSeo";

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [bannedCount, setBannedCount] = useState(null);
  const [pendingVerify, setPendingVerify] = useState(null);

  useSeo("Admin | FlashFlow", "FlashFlow administration overview.");

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const [bans, verifications] = await Promise.all([
          base44.entities.Ban.list(undefined, 500),
          base44.entities.Verification.list(undefined, 500),
        ]);
        setBannedCount(bans.length);
        setPendingVerify(verifications.filter((v) => !v.is_verified).length);
      } catch {
        setBannedCount(0);
        setPendingVerify(0);
      }
    })();
  }, [isAdmin]);

  if (!isAdmin)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-display text-2xl text-foreground">Admins only</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          You don't have access to this page.
        </p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-primary">
          ← Back home
        </Link>
      </div>
    );

  const sections = [
    {
      to: "/admin/banland",
      icon: BanIcon,
      title: "Banland",
      desc: "Ban and unban users, with optional reasons.",
      stat: bannedCount,
      statLabel: "banned",
    },
    {
      to: "/admin/verify",
      icon: ShieldCheck,
      title: "Account verification",
      desc: "Grant verified status to user accounts.",
      stat: pendingVerify,
      statLabel: "pending",
    },
    {
      to: "/admin/data-privacy",
      icon: FileLock,
      title: "Data privacy",
      desc: "Export or erase user data for GDPR requests.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Internal</span>
      <h1 className="mt-2 font-display text-4xl font-bold text-foreground tracking-tight">Admin</h1>
      <p className="mt-2 font-body text-sm text-muted-foreground max-w-lg">
        Manage users, verification, and data privacy across FlashFlow.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s, i) => {
          const Icon = s.icon;
          const hasStat = s.stat !== undefined;
          return (
            <motion.div
              key={s.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                to={s.to}
                className="group block h-full p-6 border border-border bg-card rounded-xl hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </span>
                  {hasStat && (
                    <span className="text-right">
                      <span className="block font-display text-2xl text-foreground leading-none">
                        {s.stat === null ? <Loader2 className="w-4 h-4 animate-spin inline" /> : s.stat}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.statLabel}</span>
                    </span>
                  )}
                </div>
                <h2 className="mt-4 font-display text-xl text-foreground tracking-tight">{s.title}</h2>
                <p className="mt-1 font-body text-sm text-muted-foreground">{s.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}