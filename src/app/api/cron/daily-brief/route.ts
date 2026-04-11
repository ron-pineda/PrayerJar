import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, prayers } from '@/db/schema';
import { eq, and, isNotNull, inArray, sql } from 'drizzle-orm';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import DailyBriefEmail from '@/emails/daily-brief';
import { isInQuietHours } from '@/lib/quiet-hours';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';

const BATCH_SIZE = 50;

function formatDateSubject() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
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

    await Promise.allSettled(
      batch.map(async (user) => {
        if (!user.email) {
          skipped++;
          return;
        }

        if (isInQuietHours(user)) {
          skipped++;
          return;
        }

        const prayerRows = await db
          .select({
            content: prayers.content,
            category: prayers.category,
            prayCount: prayers.prayerCount,
          })
          .from(prayers)
          .where(eq(prayers.status, 'active'))
          .orderBy(sql`RANDOM()`)
          .limit(3);

        if (prayerRows.length === 0) {
          skipped++;
          return;
        }

        const html = await render(
          DailyBriefEmail({ prayers: prayerRows, userName: user.name ?? undefined })
        );

        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: `Your morning prayers — ${formatDateSubject()}`,
          html,
        });

        sent++;
      })
    );
  }

  return NextResponse.json({ sent, skipped });
}
