/**
 * Deck visibility helpers. A deck has one of three visibility states:
 *   "private"  — only the owner (and classroom members) can see it
 *   "unlisted" — not listed publicly, but any logged-in user with the direct
 *                link can view and study it (treated like public for read access)
 *   "public"   — listed in Discover/profile/search and open via link
 * The legacy `is_public` boolean stays true only when visibility === "public".
 */
export function deckVisibility(deck) {
  if (!deck) return "private";
  if (deck.visibility === "public" || deck.visibility === "unlisted") return deck.visibility;
  if (deck.visibility === "private") return "private";
  // Legacy decks created before the visibility field: derive from is_public.
  return deck.is_public ? "public" : "private";
}