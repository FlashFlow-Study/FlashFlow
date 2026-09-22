// Mandatory sign-off for EVERY transactional email FlashFlow sends.
// The platform's auth emails (verification, password reset) are branded in the
// dashboard Authentication page. For any email the app itself sends via
// SendEmail, import `EMAIL_FOOTER` / `withEmailFooter` and append it to the
// body so the sign-off stays consistent everywhere.

export const EMAIL_FOOTER = `

Sincerely, FlashFlow Mailbot. Beep, beep, boop.
(Do not reply to this email)`;

/** Append the mandatory FlashFlow sign-off to an email body (text or HTML). */
export function withEmailFooter(body: string): string {
  return `${(body ?? "").trimEnd()}${EMAIL_FOOTER}`;
}