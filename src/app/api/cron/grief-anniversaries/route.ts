import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, griefDates } from '@/db/schema';
import { eq, and, isNull, or, lt, sql } from 'drizzle-orm';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import GriefAnniversaryEmail from '@/emails/grief-anniversary';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';

const BATCH_SIZE = 50;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  // Zero-padded month and day for comparison (MM-DD)
  const todayMMDD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Find grief dates where month+day matches today AND not yet sent this year.
  // anniversaryDate is stored as a date string 'YYYY-MM-DD'; extract MM-DD suffix.
  const dueDates = await db
    .select({
      id: griefDates.id,
      userId: griefDates.userId,
      prayerId: griefDates.prayerId,
      label: griefDates.label,
      lastSentYear: griefDates.lastSentYear,
    })
    .from(griefDates)
    .where(
      and(
        // Match month-day suffix of the stored date string
        sql`TO_CHAR(${griefDates.anniversaryDate}::date, 'MM-DD') = ${todayMMDD}`,
        // Not yet sent this year
        or(
          isNull(griefDates.lastSentYear),
          lt(griefDates.lastSentYear, currentYear)
        )
      )
    );

  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < dueDates.length; i += BATCH_SIZE) {
    const batch = dueDates.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (row) => {
        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, row.userId))
          .limit(1);

        if (!user?.email) {
          skipped++;
          return;
        }

        const html = await render(
          GriefAnniversaryEmail({
            userName: user.name ?? undefined,
            label: row.label,
            prayerId: row.prayerId,
          })
        );

        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: `Remembering ${row.label} with you`,
          html,
        });

        // Mark as sent for this year
        await db
          .update(griefDates)
          .set({ lastSentYear: currentYear })
          .where(eq(griefDates.id, row.id));

        sent++;
      })
    );
  }

  return NextResponse.json({ sent, skipped });
}
