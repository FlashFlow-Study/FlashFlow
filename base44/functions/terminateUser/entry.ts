import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Irreversible account termination. Admin-only. Requires the admin to
// retype their own email (confirm_email) as a guard. Wipes the user's
// generated content, marks their device fingerprints as terminated (kept
// for ban-evasion detection), marks pending moderation flags upheld, and
// records a termination ban. User/security records (Ban, ModerationFlag,
// DeviceFingerprint) are retained; everything the user created is deleted.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const targetId = body?.user_id;
    const confirmEmail = String(body?.confirm_email || '').trim().toLowerCase();
    if (!targetId) return Response.json({ error: 'user_id required' }, { status: 400 });
    if (!confirmEmail) return Response.json({ error: 'confirm_email required' }, { status: 400 });
    if (confirmEmail !== String(admin.email || '').trim().toLowerCase()) {
      return Response.json({ error: 'Email confirmation does not match your admin email.' }, { status: 400 });
    }
    if (targetId === admin.id) return Response.json({ error: "You can't terminate your own account." }, { status: 400 });

    const sv = base44.asServiceRole.entities;

    // Decks and their cards.
    const decks = await sv.Deck.filter({ created_by_id: targetId }, '-created_date', 500).catch(() => []);
    for (const d of decks) {
      await sv.Card.deleteMany({ deck_id: d.id }).catch(() => {});
    }
    await sv.Deck.deleteMany({ created_by_id: targetId }).catch(() => {});
    // Cards created directly by the user (safety net for any orphans).
    await sv.Card.deleteMany({ created_by_id: targetId }).catch(() => {});

    await sv.StudySession.deleteMany({ created_by_id: targetId }).catch(() => {});
    await sv.GridScore.deleteMany({ user_id: targetId }).catch(() => {});
    await sv.UserCardStar.deleteMany({ created_by_id: targetId }).catch(() => {});
    await sv.Folder.deleteMany({ created_by_id: targetId }).catch(() => {});

    // Classrooms they own + dependent memberships/assignments.
    const classrooms = await sv.Classroom.filter({ created_by_id: targetId }, '-created_date', 500).catch(() => []);
    for (const c of classrooms) {
      await sv.ClassroomMembership.deleteMany({ classroom_id: c.id }).catch(() => {});
      await sv.Assignment.deleteMany({ classroom_id: c.id }).catch(() => {});
    }
    await sv.Classroom.deleteMany({ created_by_id: targetId }).catch(() => {});
    await sv.ClassroomMembership.deleteMany({ user_id: targetId }).catch(() => {});
    await sv.Assignment.deleteMany({ created_by_id: targetId }).catch(() => {});
    await sv.AssignmentCompletion.deleteMany({ user_id: targetId }).catch(() => {});

    // Mark device fingerprints as terminated (kept, not deleted, so ban-evasion
    // detection still flags sign-ups from this browser).
    await sv.DeviceFingerprint.updateMany(
      { user_id: targetId, terminated: false },
      { $set: { terminated: true } }
    ).catch(() => {});

    // Mark any pending moderation flags for this user as upheld.
    await sv.ModerationFlag.updateMany(
      { user_id: targetId, status: 'pending' },
      { $set: { status: 'upheld' } }
    ).catch(() => {});

    // Create or update the termination ban record.
    const existingBans = await base44.entities.Ban.filter({ user_id: targetId }).catch(() => []);
    const reason = 'Account terminated by admin. All account data wiped.';
    if (existingBans.length > 0) {
      await base44.entities.Ban.update(existingBans[0].id, {
        status: 'banned',
        reason,
        source: existingBans[0].source || 'manual',
        banned_date: new Date().toISOString()
      });
    } else {
      const allUsers = await base44.entities.User.list('-created_date', 500).catch(() => []);
      const u = allUsers.find((x) => x.id === targetId) || {};
      await base44.entities.Ban.create({
        user_id: targetId,
        full_name: u.full_name || '',
        email: u.email || '',
        reason,
        banned_date: new Date().toISOString(),
        status: 'banned',
        source: 'manual'
      });
    }

    return Response.json({ terminated: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}