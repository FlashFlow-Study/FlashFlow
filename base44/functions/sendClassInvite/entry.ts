import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { waitUntil } from 'base44:runtime';
import { withEmailFooter } from '../../shared/emailFooter.ts';

// Sends a FlashFlow invitation email to each newly-invited student in a class.
// Best-effort: memberships are already created client-side; this just notifies.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const classroom_id = (payload?.classroom_id ?? '').toString().trim();
    const emails = Array.isArray(payload?.emails) ? payload.emails : [];

    if (!classroom_id) {
      return Response.json({ error: 'classroom_id is required' }, { status: 400 });
    }
    if (emails.length > 100) {
      return Response.json({ error: 'Too many recipients' }, { status: 400 });
    }

    // Look up the classroom server-side; only its owner may send invitations.
    // The email uses the classroom's real name and join code and the teacher's
    // authenticated name — nothing client-supplied is trusted for the contents.
    const classroom = await base44.asServiceRole.entities.Classroom.get(classroom_id).catch(() => null);
    if (!classroom) return Response.json({ error: 'Classroom not found' }, { status: 404 });
    if (classroom.created_by_id !== user.id) {
      return Response.json({ error: 'Only the classroom owner can send invitations' }, { status: 403 });
    }

    const classroomName = classroom.name || 'your class';
    const teacherName = user.full_name || user.email || 'Your teacher';
    const joinCode = (classroom.join_code || '').toUpperCase();

    const valid = emails
      .map((e) => (e ?? '').toString().trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (!valid.length) {
      return Response.json({ ok: true, queued: 0 });
    }

    const subject = `You've been invited to join ${classroomName} on FlashFlow`;

    const sendAll = async () => {
      for (const email of valid) {
        const text = withEmailFooter(
`Hi,

${teacherName} has invited you to join their class "${classroomName}" on FlashFlow.

FlashFlow is a free study tool that helps you learn faster with custom flashcard decks. Your teacher can assign decks for you to study, and you can practice them through flashcards, quizzes, typing, and spoken revision — then track your progress as you go.

To accept the invitation:
1. Create a free account at https://flashflowstudy.com
2. Open the "Join a class" page
3. Enter this join code: ${joinCode}

Happy studying!`
        );
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject,
            text,
            from_name: 'FlashFlow Mailbot'
          });
        } catch {
          /* skip individual send failures */
        }
      }
    };

    // Send in the background so the teacher isn't kept waiting.
    waitUntil(sendAll());

    return Response.json({ ok: true, queued: valid.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}