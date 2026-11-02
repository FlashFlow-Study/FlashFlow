import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { waitUntil } from 'base44:runtime';
import { withEmailFooter } from '../../shared/emailFooter.ts';

// Notifies every FlashFlow user when the Privacy Policy or Terms of Service is
// updated. In test_to mode a single address is mailed. The recipient list for
// the mass-send comes from the documented app-users endpoint
// (GET /api/apps/{app_id}/entities/User) using the BASE44_API_KEY secret,
// because the entities API no longer allows listing the built-in User entity.
const APP_ID = '6aa2f176f13d78a264f4a844';
const POLICY_LINKS = {
  'Privacy Policy': 'https://flashflowstudy.com/privacy',
  'Terms of Service': 'https://flashflowstudy.com/terms'
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const policy = (payload?.policy ?? '').toString().trim();
    const effectiveDate = (payload?.effective_date ?? '').toString().trim();
    const summary = (payload?.summary ?? '').toString().trim();
    const testTo = (payload?.test_to ?? '').toString().trim().toLowerCase();
    const dryRun = payload?.dry_run === true;

    if (!POLICY_LINKS[policy]) {
      return Response.json({ error: 'policy must be "Privacy Policy" or "Terms of Service"' }, { status: 400 });
    }
    if (!effectiveDate) {
      return Response.json({ error: 'effective_date is required' }, { status: 400 });
    }

    // Every call — including test_to — requires an authenticated admin, so the
    // mass-mail infrastructure can't be aimed at an arbitrary address by a
    // non-admin. Same admin check the /admin ban page uses.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build the recipient list. test_to mode: a single address.
    // Otherwise the mass-send goes to every user via the app users endpoint.
    let recipients = [];
    if (testTo) {
      if (!EMAIL_RE.test(testTo)) {
        return Response.json({ error: 'test_to must be a valid email address' }, { status: 400 });
      }
      recipients = [testTo];
    } else {
      const apiKey = process.env.BASE44_API_KEY;
      if (!apiKey) {
        return Response.json({ error: 'BASE44_API_KEY secret is not configured' }, { status: 500 });
      }

      const seen = new Set();
      const collect = (items) => {
        for (const u of items || []) {
          const e = (u?.email ?? '').toString().trim().toLowerCase();
          if (e && EMAIL_RE.test(e) && !seen.has(e)) {
            seen.add(e);
            recipients.push(e);
          }
        }
      };

      // Page through the app users endpoint (limit max 10000).
      let skip = 0;
      while (true) {
        const url = `https://app.base44.com/api/apps/${APP_ID}/entities/User?fields=email&limit=10000&skip=${skip}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          return Response.json({ error: `Failed to list app users (${res.status})` }, { status: 500 });
        }
        const page = await res.json();
        const items = Array.isArray(page) ? page : [];
        collect(items);
        if (items.length < 10000) break;
        skip += items.length;
      }
    }

    if (!recipients.length) {
      return Response.json({ ok: true, queued: 0 });
    }

    if (dryRun) {
      // Lists and counts recipients without sending anything.
      return Response.json({ ok: true, dry_run: true, recipient_count: recipients.length, recipients });
    }

    const link = POLICY_LINKS[policy];
    const subject = `FlashFlow's ${policy} has been updated`;
    const summaryBlock = summary ? `\nIn short: ${summary}\n` : '\n';

    const text = withEmailFooter(
`Hi,

We've updated our ${policy}, effective ${effectiveDate}.

You can read the updated ${policy} here:
${link}
${summaryBlock}Please note: if you continue to use FlashFlow after the effective date above, you are agreeing to the updated ${policy}.

Thanks for studying with FlashFlow!`
    );

    const sendAll = async () => {
      for (const email of recipients) {
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

    // Send in the background so the caller isn't kept waiting.
    waitUntil(sendAll());

    return Response.json({ ok: true, queued: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}