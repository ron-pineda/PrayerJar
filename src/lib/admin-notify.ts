import { Resend } from 'resend';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';

/**
 * notifyAdmins — fire-and-forget email to every address in ADMIN_EMAILS.
 *
 * Reads ADMIN_EMAILS env var (comma-separated). Never throws — callers use
 * `.catch(() => {})` so a Resend outage never blocks a user-facing response.
 *
 * Email body must NOT contain user-submitted content (no content_snippet).
 * Include only the category/type + a deep link to the admin panel.
 */
export async function notifyAdmins(opts: {
  subject: string;
  body: string;   // plain text — no user-submitted content
  link?: string;  // absolute URL to admin panel
}): Promise<void> {
  try {
    const raw = process.env.ADMIN_EMAILS ?? '';
    const recipients = raw
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      console.warn('[notifyAdmins] ADMIN_EMAILS is not set or empty — skipping.');
      return;
    }

    const text = opts.link
      ? `${opts.body}\n\nView in admin: ${opts.link}`
      : opts.body;

    // Send a single email with all admins in the `to` field.
    // Simple, no BCC privacy concern for internal addresses.
    await resend.emails.send({
      from: FROM,
      to: recipients,
      subject: opts.subject,
      text,
    });
  } catch (err) {
    console.error('[notifyAdmins] Failed to send admin notification:', err);
  }
}
