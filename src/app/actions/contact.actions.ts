'use server';

import { Resend } from 'resend';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

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
    console.error('[submitContactAction]', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
