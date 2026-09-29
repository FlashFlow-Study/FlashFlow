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

    // --- Cloudflare Turnstile verification (bot protection gate) ---
    const turnstileToken = payload?.turnstile_token;
    if (typeof turnstileToken !== 'string' || turnstileToken.length === 0 || turnstileToken.length > 2048) {
      return Response.json({ error: 'Bot verification missing or invalid' }, { status: 403 });
    }
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return Response.json({ error: 'Turnstile secret not configured' }, { status: 503 });
    }
    let turnstileOk = false;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10000);
      const form = new URLSearchParams();
      form.append('secret', turnstileSecret);
      form.append('response', turnstileToken);
      const forwarded = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
      if (forwarded) form.append('remoteip', forwarded.split(',')[0].trim());
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: ctrl.signal
      });
      clearTimeout(timeout);
      const data = await verifyRes.json();
      const allowedHosts = ['flashflowstudy.com', 'flashflowstudy.base44.app'];
      if (data && data.success === true && data.action === 'contact' && allowedHosts.includes(data.hostname)) {
        turnstileOk = true;
      }
    } catch (e) {
      turnstileOk = false;
    }
    if (!turnstileOk) {
      return Response.json({ error: 'Bot verification failed' }, { status: 403 });
    }
    // --- end Turnstile verification ---

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