import { base44 } from "@/api/base44Client";

/**
 * Re-sync a deck's cards' denormalized visibility fields (deck_is_public and
 * deck_classroom_members) so Card read RLS stays correct after a deck's
 * visibility or classroom membership changes. Reads and writes run as the
 * deck owner, whose created_by_id matches the cards.
 */
export async function syncDeckCardsVisibility(deckId, isPublic, classroomMembers) {
  const cards = await base44.entities.Card.filter({ deck_id: deckId }, undefined, 1000);
  if (!cards.length) return;
  await base44.entities.Card.bulkUpdate(
    cards.map((c) => ({
      id: c.id,
      deck_is_public: !!isPublic,
      deck_classroom_members: classroomMembers || [],
    }))
  );
}