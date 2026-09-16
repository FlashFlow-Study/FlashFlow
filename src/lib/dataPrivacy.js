import { base44 } from "@/api/base44Client";

// Gathers every record owned by or associated with a user, for GDPR
// data-subject access / export requests. Returns a plain JSON-serialisable object.
export async function exportUserData(userId) {
  const [
    user, decks, classrooms, memberships, assignments, completionsStudent,
    sessions, folders, profiles, stars,
  ] = await Promise.all([
    base44.entities.User.get(userId).catch(() => null),
    base44.entities.Deck.filter({ created_by_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.Classroom.filter({ created_by_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.ClassroomMembership.filter({ user_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.Assignment.filter({ created_by_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.AssignmentCompletion.filter({ user_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.StudySession.filter({ created_by_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.Folder.filter({ created_by_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.Profile.filter({ user_id: userId }, undefined, 1000).catch(() => []),
    base44.entities.UserCardStar.filter({ created_by_id: userId }, undefined, 1000).catch(() => []),
  ]);

  let completionsTeacher = [];
  try {
    completionsTeacher = await base44.entities.AssignmentCompletion.filter({ teacher_id: userId }, undefined, 1000);
  } catch {
    /* ignore */
  }
  // de-dup completions
  const compMap = {};
  [...completionsStudent, ...completionsTeacher].forEach((c) => { compMap[c.id] = c; });

  const deckIds = decks.map((d) => d.id);
  let cards = [];
  if (deckIds.length) {
    try {
      cards = await base44.entities.Card.filter({ deck_id: { $in: deckIds } }, undefined, 5000);
    } catch {
      /* ignore */
    }
  }

  return {
    exported_at: new Date().toISOString(),
    user: user
      ? {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_date: user.created_date,
        }
      : null,
    decks,
    cards,
    classrooms,
    classroom_memberships: memberships,
    assignments,
    assignment_completions: Object.values(compMap),
    study_sessions: sessions,
    folders,
    profiles,
    starred_cards: stars,
  };
}

// Permanently deletes all data associated with a user. If deleteAccount is true,
// the user record itself is also removed (irreversible). Returns a per-step report.
export async function eraseUserData(userId, { deleteAccount = false } = {}) {
  const report = { steps: [], started_at: new Date().toISOString() };
  const step = async (name, fn) => {
    try {
      const r = await fn();
      report.steps.push({ name, ok: true, count: r?.count ?? r?.deleted ?? r?.length ?? null });
    } catch (e) {
      report.steps.push({ name, ok: false, error: e.message || String(e) });
    }
  };

  // 1. Decks owned by the user + their cards.
  let decks = [];
  try { decks = await base44.entities.Deck.filter({ created_by_id: userId }, undefined, 1000); } catch { /* ignore */ }
  const deckIds = decks.map((d) => d.id);
  if (deckIds.length) await step("cards", () => base44.entities.Card.deleteMany({ deck_id: { $in: deckIds } }));
  await step("decks", () => base44.entities.Deck.deleteMany({ created_by_id: userId }));

  // 2. Classrooms owned by the user + their memberships / assignments.
  let classrooms = [];
  try { classrooms = await base44.entities.Classroom.filter({ created_by_id: userId }, undefined, 1000); } catch { /* ignore */ }
  const classroomIds = classrooms.map((c) => c.id);
  if (classroomIds.length) {
    await step("classroom_memberships", () => base44.entities.ClassroomMembership.deleteMany({ classroom_id: { $in: classroomIds } }));
    await step("classroom_assignments", () => base44.entities.Assignment.deleteMany({ classroom_id: { $in: classroomIds } }));
  }
  await step("classrooms", () => base44.entities.Classroom.deleteMany({ created_by_id: userId }));

  // 3. Assignments authored by the user.
  await step("assignments", () => base44.entities.Assignment.deleteMany({ created_by_id: userId }));

  // 4. Assignment completions where the user is the student or the teacher.
  await step("completions_as_student", () => base44.entities.AssignmentCompletion.deleteMany({ user_id: userId }));
  await step("completions_as_teacher", () => base44.entities.AssignmentCompletion.deleteMany({ teacher_id: userId }));

  // 5. Classroom memberships where the user is a member.
  await step("memberships", () => base44.entities.ClassroomMembership.deleteMany({ user_id: userId }));

  // 6. Study sessions.
  await step("study_sessions", () => base44.entities.StudySession.deleteMany({ created_by_id: userId }));

  // 7. Folders.
  await step("folders", () => base44.entities.Folder.deleteMany({ created_by_id: userId }));

  // 8. Profile records.
  await step("profiles", () => base44.entities.Profile.deleteMany({ user_id: userId }));

  // 9. Starred cards.
  await step("starred_cards", () => base44.entities.UserCardStar.deleteMany({ created_by_id: userId }));

  // 10. The account itself.
  if (deleteAccount) {
    await step("user_account", async () => {
      await base44.entities.User.delete(userId);
      return 1;
    });
  }

  report.finished_at = new Date().toISOString();
  return report;
}

// Triggers a JSON file download in the browser.
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}