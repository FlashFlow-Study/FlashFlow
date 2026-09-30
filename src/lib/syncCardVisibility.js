import { base44 } from "@/api/base44Client";

/**
 * Re-sync a deck's cards' denormalized visibility fields (deck_is_public and
 * deck_classroom_members) so Card read RLS stays correct after a deck's
 * visibility or classroom membership changes. Reads and writes run as the
 * deck owner, whose created_by_id matches the cards.
 *
 * `visibility` is the deck's normalized visibility ("private" | "unlisted" |
 * "public"). The denormalized `deck_is_public` flag is set true for both
 * public and unlisted decks, since both are accessible via direct link to
 * logged-in users.
 */
export async function syncDeckCardsVisibility(deckId, visibility, classroomMembers) {
  const linkAccessible = visibility === "public" || visibility === "unlisted";
  const cards = await base44.entities.Card.filter({ deck_id: deckId }, undefined, 1000);
  if (!cards.length) return;
  await base44.entities.Card.bulkUpdate(
    cards.map((c) => ({
      id: c.id,
      deck_is_public: linkAccessible,
      deck_classroom_members: classroomMembers || [],
    }))
  );
}