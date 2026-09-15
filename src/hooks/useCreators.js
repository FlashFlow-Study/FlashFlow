import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useCreators(decks) {
  const [creators, setCreators] = useState({});

  const userKey = JSON.stringify([...new Set(decks.map((d) => d.created_by_id).filter(Boolean))].sort());

  useEffect(() => {
    const userIds = [...new Set(decks.map((d) => d.created_by_id).filter(Boolean))];
    if (!userIds.length) return;

    let cancelled = false;
    (async () => {
      try {
        const profiles = await base44.entities.Profile.filter({ user_id: { $in: userIds } });
        if (cancelled) return;
        const map = {};
        profiles.forEach((p) => { map[p.user_id] = p; });
        setCreators(map);
      } catch {
        // ignore — creator names simply won't show
      }
    })();
    return () => { cancelled = true; };
  }, [userKey]);

  const creatorName = (deck) => {
    if (!deck?.created_by_id) return null;
    const c = creators[deck.created_by_id];
    if (!c) return null;
    return c.full_name || null;
  };

  return { creators, creatorName };
}