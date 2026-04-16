'use server';

import { Resend } from 'resend';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { createContactSubmission } from '@/services/contact.service';
import { notifyAdmins } from '@/lib/admin-notify';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  subject: z.enum(['General', 'Church Partnership', 'Feedback', 'Bug Report', 'Other'], {
    error: 'Please select a subject',
  }),
  message: z.string().min(1, 'Message is required').max(2000),
});

export type ContactResult = { success: true } | { error: string };

export async function submitContactAction(
  formData: FormData
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';
  const rateCheck = await checkRateLimit('contact', ip);
  if (!rateCheck.allowed) {
    return { error: 'Too many messages. Please wait before sending again.' };
  }

  const { name, email, subject, message } = parsed.data;

  // Persist the submission to DB first — a Resend outage must not lose the message.
  let dbWriteFailed = false;
  try {
    await createContactSubmission({ name, email, subject, message });
    notifyAdmins({
      subject: 'New contact form submission',
      body: `A new contact form submission was received.\n\nSubject category: ${subject}\n\nReview it in the admin feedback panel.`,
      link: 'https://prayerjar.org/admin/feedback',
    }).catch(() => {});
  } catch (err) {
    console.error('[submitContactAction] DB write failed:', err);
    dbWriteFailed = true;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: 'hello@prayerjar.org',
      replyTo: email,
      subject: `[Contact] ${subject}: from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    });

    return { success: true };
  } catch (err) {
    console.error('[submitContactAction] Resend failed:', err);
    // If we persisted to DB, treat as success — the message is not lost.
    if (!dbWriteFailed) return { success: true };
    return { error: 'Something went wrong. Please try again.' };
  }
}
