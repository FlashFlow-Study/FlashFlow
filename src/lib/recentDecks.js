const PREFIX = "flashflow_recent_decks";
const MAX = 8;

const keyFor = (userId) => (userId ? `${PREFIX}:${userId}` : `${PREFIX}:anon`);

export function addRecentDeck(deckId, userId) {
  if (!deckId) return;
  try {
    const key = keyFor(userId);
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((entry) => {
      const id = typeof entry === "string" ? entry : entry.id;
      return id !== deckId;
    });
    filtered.unshift({ id: deckId, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function getRecentDeckIds(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.map((entry) => (typeof entry === "string" ? entry : entry.id));
  } catch {
    return [];
  }
}