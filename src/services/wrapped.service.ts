import { db } from '@/db';
import { prayers, prayerInteractions, prayerPartnerships, groupMembers } from '@/db/schema';
import { and, gte, lt, eq, count, sql } from 'drizzle-orm';

export type WrappedStats = {
  year: number;
  totalPrayers: number;
  totalInteractions: number;
  topCategory: string | null;
  answeredCount: number;
  longestStreak: number;
  partnerCount: number;
  groupCount: number;
};

export async function getWrappedStats(userId: string, year: number): Promise<WrappedStats | null> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  // Total prayers created by user in that year
  const [prayerCountRow] = await db
    .select({ value: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        gte(prayers.createdAt, start),
        lt(prayers.createdAt, end),
      ),
    );

  const totalPrayers = prayerCountRow?.value ?? 0;

  // Return null if no prayers that year
  if (totalPrayers === 0) {
    return null;
  }

  // Total interactions created by user in that year
  const [interactionCountRow] = await db
    .select({ value: count() })
    .from(prayerInteractions)
    .where(
      and(
        eq(prayerInteractions.userId, userId),
        gte(prayerInteractions.createdAt, start),
        lt(prayerInteractions.createdAt, end),
      ),
    );

  const totalInteractions = interactionCountRow?.value ?? 0;

  // Top category (category with most prayers that year)
  const categoryRows = await db
    .select({ category: prayers.category, value: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        gte(prayers.createdAt, start),
        lt(prayers.createdAt, end),
      ),
    )
    .groupBy(prayers.category)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  const topCategory = categoryRows[0]?.category ?? null;

  // Answered count
  const [answeredRow] = await db
    .select({ value: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        eq(prayers.status, 'answered'),
        gte(prayers.createdAt, start),
        lt(prayers.createdAt, end),
      ),
    );

  const answeredCount = answeredRow?.value ?? 0;

  // Longest streak: get all distinct UTC dates user created prayers that year
  const dateRows = await db
    .selectDistinct({
      day: sql<string>`date_trunc('day', ${prayers.createdAt} AT TIME ZONE 'UTC')`,
    })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        gte(prayers.createdAt, start),
        lt(prayers.createdAt, end),
      ),
    )
    .orderBy(sql`date_trunc('day', ${prayers.createdAt} AT TIME ZONE 'UTC')`);

  const longestStreak = computeLongestStreak(dateRows.map((r) => r.day));

  // Partner count: distinct partner IDs from both sides of prayerPartnerships where matchedAt in year
  const partnerRows = await db
    .selectDistinct({ partnerId: prayerPartnerships.partnerId })
    .from(prayerPartnerships)
    .where(
      and(
        eq(prayerPartnerships.userId, userId),
        gte(prayerPartnerships.matchedAt, start),
        lt(prayerPartnerships.matchedAt, end),
      ),
    );

  const partnerRowsOtherSide = await db
    .selectDistinct({ partnerId: prayerPartnerships.userId })
    .from(prayerPartnerships)
    .where(
      and(
        eq(prayerPartnerships.partnerId, userId),
        gte(prayerPartnerships.matchedAt, start),
        lt(prayerPartnerships.matchedAt, end),
      ),
    );

  const distinctPartners = new Set([
    ...partnerRows.map((r) => r.partnerId),
    ...partnerRowsOtherSide.map((r) => r.partnerId),
  ]);

  const partnerCount = distinctPartners.size;

  // Group count: distinct groups user is/was a member of (joined that year or before, still active)
  const [groupCountRow] = await db
    .select({ value: count(sql`distinct ${groupMembers.groupId}`) })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, userId),
        lt(groupMembers.joinedAt, end),
      ),
    );

  const groupCount = groupCountRow?.value ?? 0;

  return {
    year,
    totalPrayers,
    totalInteractions,
    topCategory,
    answeredCount,
    longestStreak,
    partnerCount,
    groupCount,
  };
}

function computeLongestStreak(sortedDayStrings: string[]): number {
  if (sortedDayStrings.length === 0) return 0;

  // Parse dates from ISO-like strings (e.g. "2025-01-01T00:00:00.000Z" or "2025-01-01 00:00:00+00")
  const dates = sortedDayStrings.map((s) => {
    const d = new Date(s);
    // Normalize to UTC midnight epoch in days
    return Math.floor(d.getTime() / 86400000);
  });

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const diff = dates[i] - dates[i - 1];
    if (diff === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else if (diff > 1) {
      currentStreak = 1;
    }
    // diff === 0 means duplicate — shouldn't happen with selectDistinct, but handle gracefully
  }

  return maxStreak;
}
