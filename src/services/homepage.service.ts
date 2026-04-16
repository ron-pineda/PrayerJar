import { db } from '@/db';
import { prayers, prayerInteractions } from '@/db/schema';
import { eq, and, gt, lt, or, isNull, ne, sql, count, inArray } from 'drizzle-orm';
import { addDays } from 'date-fns';

// Count of interactions on the user's prayers in the last 7 days
export async function getPrayedForMeCount(userId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const userPrayers = db
    .select({ id: prayers.id })
    .from(prayers)
    .where(eq(prayers.authorId, userId));

  const [row] = await db
    .select({ count: count() })
    .from(prayerInteractions)
    .where(
      and(
        // interaction is on one of the user's prayers
        inArray(prayerInteractions.prayerId, userPrayers),
        gt(prayerInteractions.createdAt, sevenDaysAgo),
      ),
    );

  return Number(row?.count ?? 0);
}

// Count of the user's active prayers expiring within 7 days
export async function getExpiringPrayerCount(userId: string): Promise<number> {
  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);

  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        eq(prayers.status, 'active'),
        gt(prayers.expiresAt, now),
        lt(prayers.expiresAt, sevenDaysFromNow),
      ),
    );

  return Number(row?.count ?? 0);
}

// Count of user's active prayers
export async function getActivePrayerCount(userId: string): Promise<number> {
  const now = new Date();

  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        eq(prayers.status, 'active'),
        gt(prayers.expiresAt, now),
      ),
    );

  return Number(row?.count ?? 0);
}

// One random community prayer (excluding user's own) for the action card
export async function getCommunityPrayerSnippet(userId: string): Promise<{ id: string; content: string } | null> {
  const now = new Date();

  const results = await db
    .select({ id: prayers.id, content: prayers.content })
    .from(prayers)
    .where(
      and(
        eq(prayers.status, 'active'),
        gt(prayers.expiresAt, now),
        isNull(prayers.groupId),
        isNull(prayers.churchId),
        // authorId is nullable — NULL != x evaluates to NULL in SQL, so we must
        // explicitly allow anonymous (NULL-authored) prayers through.
        or(isNull(prayers.authorId), ne(prayers.authorId, userId))!,
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return results[0] ?? null;
}

export async function getHomepageData(userId: string) {
  const [prayedForMeCount, expiringCount, activePrayerCount, communityPrayer] = await Promise.all([
    getPrayedForMeCount(userId),
    getExpiringPrayerCount(userId),
    getActivePrayerCount(userId),
    getCommunityPrayerSnippet(userId),
  ]);
  return { prayedForMeCount, expiringCount, activePrayerCount, communityPrayer };
}
