import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Fetches Verification records for a set of user ids and resolves
 * badge state per user. Admins are treated as verified automatically.
 */
export function useVerifications(userIds = []) {
  const [records, setRecords] = useState({});

  const key = JSON.stringify([...new Set(userIds)].filter(Boolean).sort());

  useEffect(() => {
    const ids = [...new Set(userIds)].filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.Verification.filter({ user_id: { $in: ids } });
        if (cancelled) return;
        const map = {};
        recs.forEach((r) => { map[r.user_id] = r; });
        setRecords(map);
      } catch {
        /* ignore — badges simply won't show */
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  const badges = (uid) => {
    if (!uid) return { verified: false, admin: false };
    const r = records[uid];
    const admin = r?.role === "admin";
    return { verified: admin || r?.is_verified === true, admin };
  };

  return { records, badges };
}