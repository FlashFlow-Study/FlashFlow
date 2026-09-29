import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { waitUntil } from 'base44:runtime';
import { withEmailFooter } from '../../shared/emailFooter.ts';

// Notifies every FlashFlow user when the Privacy Policy or Terms of Service is
// updated. In test_to mode a single address is mailed and no auth is required;
// the full mass-send is admin-only (same check the /admin ban page uses).
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

    if (!POLICY_LINKS[policy]) {
      return Response.json({ error: 'policy must be "Privacy Policy" or "Terms of Service"' }, { status: 400 });
    }
    if (!effectiveDate) {
      return Response.json({ error: 'effective_date is required' }, { status: 400 });
    }

    // Build the recipient list. test_to mode: a single address, no auth.
    // Otherwise the mass-send requires an authenticated admin.
    let recipients = [];
    if (testTo) {
      if (!EMAIL_RE.test(testTo)) {
        return Response.json({ error: 'test_to must be a valid email address' }, { status: 400 });
      }
      recipients = [testTo];
    } else {
      let user = null;
      try {
        user = await base44.auth.me();
      } catch {
        user = null;
      }
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Walk every user via cursor pagination and collect unique emails.
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

      let page = await base44.asServiceRole.entities.User.list({ limit: 1000 });
      collect(page.items);
      while (page.has_more && page.next_cursor) {
        page = await base44.asServiceRole.entities.User.list({
          cursor: page.next_cursor,
          limit: 1000
        });
        collect(page.items);
      }
    }

    if (!recipients.length) {
      return Response.json({ ok: true, queued: 0 });
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