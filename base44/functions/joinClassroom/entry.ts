import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const code = (body?.join_code || '').toString().trim().toUpperCase();
    if (!code) return Response.json({ error: 'Please enter a join code.' }, { status: 400 });

    // Find the classroom by join code (service role — student can't read classrooms they're not in yet)
    const classrooms = await base44.asServiceRole.entities.Classroom.filter({ join_code: code });
    if (!classrooms.length) return Response.json({ error: 'Invalid join code.' }, { status: 404 });
    const classroom = classrooms[0];

    // Check for existing membership by email or user_id
    const existing = await base44.asServiceRole.entities.ClassroomMembership.filter({
      classroom_id: classroom.id,
      student_email: user.email
    });
    let membership = existing[0];

    if (membership && membership.status === 'joined' && membership.user_id === user.id) {
      return Response.json({ classroom, already_joined: true });
    }

    // Enforce a maximum of 10 joined classrooms per student (only when not already joined here).
    if (!membership || membership.status !== 'joined') {
      const myJoined = await base44.asServiceRole.entities.ClassroomMembership.filter({
        student_email: user.email,
        status: 'joined'
      });
      if (myJoined.length >= 10) {
        return Response.json({
          error: 'You can only be in up to 10 classes at a time. Leave one before joining another.'
        }, { status: 400 });
      }
    }

    if (membership) {
      // Update invited → joined
      membership = await base44.asServiceRole.entities.ClassroomMembership.update(membership.id, {
        user_id: user.id,
        status: 'joined'
      });
    } else {
      // No invite was sent — create a new membership (self-join via code)
      membership = await base44.asServiceRole.entities.ClassroomMembership.create({
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        student_email: user.email,
        user_id: user.id,
        status: 'joined'
      });
    }

    // Add user to classroom.member_user_ids
    const memberIds = classroom.member_user_ids || [];
    const memberUserIds = memberIds.includes(user.id) ? memberIds : [...memberIds, user.id];
    if (memberUserIds !== memberIds) {
      await base44.asServiceRole.entities.Classroom.update(classroom.id, {
        member_user_ids: memberUserIds
      });
    }

    // Add user to classroom_members on all decks in this classroom, and keep
    // each deck's cards' denormalized deck_classroom_members in sync so the new
    // member can read the cards (Card read RLS uses that field).
    const decks = await base44.asServiceRole.entities.Deck.filter({ classroom_id: classroom.id });
    if (decks.length) {
      await base44.asServiceRole.entities.Deck.bulkUpdate(
        decks.map(d => ({
          id: d.id,
          classroom_members: Array.from(new Set([...(d.classroom_members || []), user.id]))
        }))
      );
      for (const d of decks) {
        const newMembers = Array.from(new Set([...(d.classroom_members || []), user.id]));
        const cards = await base44.asServiceRole.entities.Card.filter({ deck_id: d.id }, undefined, 1000);
        if (cards.length) {
          await base44.asServiceRole.entities.Card.bulkUpdate(
            cards.map(c => ({
              id: c.id,
              deck_classroom_members: newMembers,
              deck_is_public: !!d.is_public
            }))
          );
        }
      }
    }

    // Keep assignments' denormalized classroom_members in sync so the new
    // member can read assignments for this class (Assignment read RLS uses it).
    const assignments = await base44.asServiceRole.entities.Assignment.filter({ classroom_id: classroom.id });
    if (assignments.length) {
      await base44.asServiceRole.entities.Assignment.bulkUpdate(
        assignments.map(a => ({
          id: a.id,
          classroom_members: memberUserIds
        }))
      );
    }

    return Response.json({ classroom, membership });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}