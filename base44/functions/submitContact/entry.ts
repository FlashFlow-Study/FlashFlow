import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { withEmailFooter } from '../../shared/emailFooter.ts';

// Public contact-form submission endpoint (no user auth — visitors may be
// anonymous), so input is validated and bounded, then the record is created and
// the owner notified via the service role.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const name = (payload?.name ?? '').toString().trim();
    const email = (payload?.email ?? '').toString().trim();
    const subject = (payload?.subject ?? '').toString().trim();
    const message = (payload?.message ?? '').toString().trim();

    if (!name || !email || !message) {
      return Response.json({ error: 'name, email, and message are required' }, { status: 400 });
    }
    if (name.length > 200 || email.length > 200 || subject.length > 300 || message.length > 5000) {
      return Response.json({ error: 'A field is too long' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const submitted_date = new Date().toISOString();

    await base44.asServiceRole.entities.ContactSubmission.create({
      name,
      email,
      subject,
      message,
      submitted_date
    });

    const body = withEmailFooter(
      `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    );

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'fiyinekisola@gmail.com',
      subject: 'New FlashFlow contact form submission',
      text: body,
      from_name: 'FlashFlow Mailbot'
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}