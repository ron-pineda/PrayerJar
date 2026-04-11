import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, prayers } from '@/db/schema';
import { eq, and, isNull, isNotNull, gte, lte } from 'drizzle-orm';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import PrayerFollowupEmail from '@/emails/prayer-followup';
import { isInQuietHours } from '@/lib/quiet-hours';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const sixtyEightHoursAgo = new Date(now.getTime() - 68 * 60 * 60 * 1000);
  const eightyHoursAgo = new Date(now.getTime() - 80 * 60 * 60 * 1000);

  const pendingPrayers = await db
    .select({
      id: prayers.id,
      content: prayers.content,
      prayerCount: prayers.prayerCount,
      category: prayers.category,
      authorId: prayers.authorId,
      userEmail: users.email,
      quietHoursStart: users.quietHoursStart,
      quietHoursEnd: users.quietHoursEnd,
      quietHoursTimezone: users.quietHoursTimezone,
    })
    .from(prayers)
    .innerJoin(users, eq(users.id, prayers.authorId))
    .where(
      and(
        eq(prayers.status, 'active'),
        isNull(prayers.followUpSentAt),
        isNotNull(prayers.authorId),
        gte(prayers.createdAt, eightyHoursAgo),
        lte(prayers.createdAt, sixtyEightHoursAgo),
      )
    );

  let sent = 0;

  await Promise.allSettled(
    pendingPrayers.map(async (row) => {
      if (!row.userEmail) return;

      if (isInQuietHours({
        quietHoursStart: row.quietHoursStart,
        quietHoursEnd: row.quietHoursEnd,
        quietHoursTimezone: row.quietHoursTimezone,
      })) {
        return;
      }

      const html = await render(
        PrayerFollowupEmail({
          prayerContent: row.content,
          prayCount: row.prayerCount,
          category: row.category,
          prayerId: row.id,
        })
      );

      await resend.emails.send({
        from: FROM,
        to: row.userEmail,
        subject: "How's your prayer going?",
        html,
      });

      await db
        .update(prayers)
        .set({ followUpSentAt: new Date() })
        .where(eq(prayers.id, row.id));

      sent++;
    })
  );

  return NextResponse.json({ sent });
}
