import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, prayerInteractions, notifications } from '@/db/schema';
import { eq, and, gte, isNotNull, count, sql } from 'drizzle-orm';
import { sendIntercessorCareEmail } from '@/services/email.service';

const BATCH_SIZE = 50;
const MIN_PRAY_COUNT = 5;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  // Find users with 5+ pray interactions in last 7 days
  const activeIntercessors = await db
    .select({
      userId: prayerInteractions.userId,
      prayCount: count(prayerInteractions.id).as('prayCount'),
    })
    .from(prayerInteractions)
    .where(
      and(
        isNotNull(prayerInteractions.userId),
        gte(prayerInteractions.createdAt, sevenDaysAgo)
      )
    )
    .groupBy(prayerInteractions.userId)
    .having(sql`count(${prayerInteractions.id}) >= ${MIN_PRAY_COUNT}`);

  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < activeIntercessors.length; i += BATCH_SIZE) {
    const batch = activeIntercessors.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (row) => {
        if (!row.userId) {
          skipped++;
          return;
        }

        // Dedup: skip if we sent an intercessor_care notification within 6 days.
        // We store it as a JSON metadata string in the relatedPrayerId column workaround,
        // but since notifications table doesn't have a metadata/type column for custom types,
        // we track by checking if there's a notification whose type maps to a sentinel.
        // Instead, use a simpler approach: check for a notification created in the last 6 days
        // with type 'badge_earned' and a sentinel relatedPrayerId of '00000000-0000-0000-0000-000000000000'.
        // Better: just check the DB for recent prayerInteractions count drop isn't reliable.
        // The cleanest dedup without schema change: query notifications for this user
        // created in last 6 days — but we can't distinguish type.
        // We'll use the relatedPrayerId sentinel UUID approach to mark "intercessor_care sent".
        const INTERCESSOR_CARE_SENTINEL = '00000000-0000-0000-0000-000000000001';

        const [recentNotif] = await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, row.userId),
              eq(notifications.relatedPrayerId, INTERCESSOR_CARE_SENTINEL),
              gte(notifications.createdAt, sixDaysAgo)
            )
          )
          .limit(1);

        if (recentNotif) {
          skipped++;
          return;
        }

        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, row.userId))
          .limit(1);

        if (!user?.email) {
          skipped++;
          return;
        }

        await sendIntercessorCareEmail(user.email, {
          userName: user.name ?? undefined,
          prayerCount: Number(row.prayCount),
        });

        // Record sentinel notification so we don't re-send within 6 days
        await db.insert(notifications).values({
          userId: row.userId,
          type: 'badge_earned', // closest available type; sentinel UUID distinguishes it
          relatedPrayerId: INTERCESSOR_CARE_SENTINEL,
          read: true,
        });

        sent++;
      })
    );
  }

  return NextResponse.json({ sent, skipped });
}
