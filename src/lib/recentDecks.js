const KEY = "flashflow_recent_decks";
const MAX = 8;

export function addRecentDeck(deckId) {
  if (!deckId) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((entry) => {
      const id = typeof entry === "string" ? entry : entry.id;
      return id !== deckId;
    });
    filtered.unshift({ id: deckId, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function getRecentDeckIds() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.map((entry) => (typeof entry === "string" ? entry : entry.id));
  } catch {
    return [];
  }
}