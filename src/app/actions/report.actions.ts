'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { notifyAdmins } from '@/lib/admin-notify';

const VALID_REASONS = ['spam', 'inappropriate', 'not_a_prayer', 'harassment', 'other'] as const;

const reportSchema = z.object({
  prayerId: z.string().uuid('Invalid prayer ID'),
  reason: z.enum(VALID_REASONS, { message: 'Invalid reason' }),
});

export type SubmitReportResult = { success: true } | { error: string };

export async function submitReportAction(formData: FormData): Promise<SubmitReportResult> {
  const session = await auth();

  const parsed = reportSchema.safeParse({
    prayerId: formData.get('prayerId'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { prayerId, reason } = parsed.data;

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';
  const identifier = session?.user?.id ?? ip;
  const rateCheck = await checkRateLimit('report', identifier);
  if (!rateCheck.allowed) {
    return { error: 'Too many reports. Please wait before reporting again.' };
  }

  // Prevent duplicate reports from the same user
  if (session?.user?.id) {
    const existing = await db
      .select({ id: reports.id })
      .from(reports)
      .where(and(eq(reports.reporterId, session.user.id), eq(reports.prayerId, prayerId)))
      .limit(1);

    if (existing.length > 0) {
      return { success: true };
    }
  }

  await db.insert(reports).values({
    reporterId: session?.user?.id ?? null,
    prayerId,
    reason,
    status: 'pending',
  });

  if (reason === 'harassment') {
    notifyAdmins({
      subject: '[Admin] Harassment report submitted',
      body: `A user submitted a harassment report against prayer ID: ${prayerId}.\n\nReview it in the admin report queue.`,
      link: 'https://prayerjar.org/admin/queue',
    }).catch(() => {});
  }

  return { success: true };
}
