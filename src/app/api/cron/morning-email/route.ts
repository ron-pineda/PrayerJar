import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, prayers, prayerInteractions } from '@/db/schema';
import { eq, and, isNotNull, gte, sql } from 'drizzle-orm';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import MorningEmail from '@/emails/morning-email';
import { getDayVerse } from '@/lib/verses';
import { isInQuietHours } from '@/lib/quiet-hours';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';
const BATCH_SIZE = 50;

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function yesterdayMidnightUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const verse = getDayVerse();
  const date = formatDate();
  const since = yesterdayMidnightUTC();

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      currentStreak: users.currentStreak,
      quietHoursStart: users.quietHoursStart,
      quietHoursEnd: users.quietHoursEnd,
      quietHoursTimezone: users.quietHoursTimezone,
    })
    .from(users)
    .where(and(eq(users.notifyOnDigest, true), isNotNull(users.email)));

  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
    const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (user): Promise<'sent' | 'skipped'> => {
        if (!user.email) return 'skipped';
        if (isInQuietHours(user)) return 'skipped';

        const [receivedRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(prayerInteractions)
          .innerJoin(prayers, eq(prayerInteractions.prayerId, prayers.id))
          .where(
            and(
              eq(prayers.authorId, user.id),
              gte(prayerInteractions.createdAt, since),
            )
          );

        const [encouragementsRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(prayerInteractions)
          .innerJoin(prayers, eq(prayerInteractions.prayerId, prayers.id))
          .where(
            and(
              eq(prayers.authorId, user.id),
              gte(prayerInteractions.createdAt, since),
              isNotNull(prayerInteractions.message),
            )
          );

        const prayerRows = await db
          .select({
            content: prayers.content,
            category: prayers.category,
            prayerCount: prayers.prayerCount,
          })
          .from(prayers)
          .where(eq(prayers.status, 'active'))
          .orderBy(sql`RANDOM()`)
          .limit(3);

        if (prayerRows.length === 0) return 'skipped';

        const html = await render(
          MorningEmail({
            userName: user.name ?? undefined,
            date,
            verse,
            activity: {
              prayersReceived: receivedRow?.count ?? 0,
              encouragements: encouragementsRow?.count ?? 0,
              streak: user.currentStreak,
            },
            prayers: prayerRows,
          })
        );

        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: `Good morning — ${date}`,
          html,
        });

        return 'sent';
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value === 'sent') {
        sent++;
      } else {
        if (result.status === 'rejected') Sentry.captureException(result.reason);
        skipped++;
      }
    }
  }

  return NextResponse.json({ sent, skipped });
}
