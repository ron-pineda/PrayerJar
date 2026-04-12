import { db } from '@/db';
import { prayers, prayerInteractions, churchMembers } from '@/db/schema';
import { eq, and, gte, sql, count } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Feature 75: Church Analytics Service
// ---------------------------------------------------------------------------

/**
 * Returns prayer count per day for the last N days.
 */
export async function getPrayerTrend(
  churchId: string,
  days: number = 30,
): Promise<Array<{ date: string; count: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${prayers.createdAt}), 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(prayers)
    .where(and(eq(prayers.churchId, churchId), gte(prayers.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${prayers.createdAt})`)
    .orderBy(sql`date_trunc('day', ${prayers.createdAt})`);

  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
}

/**
 * Returns prayer interaction count per day for the last N days,
 * for interactions on prayers belonging to this church.
 */
export async function getInteractionTrend(
  churchId: string,
  days: number = 30,
): Promise<Array<{ date: string; count: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${prayerInteractions.createdAt}), 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(prayerInteractions)
    .innerJoin(prayers, eq(prayers.id, prayerInteractions.prayerId))
    .where(
      and(
        eq(prayers.churchId, churchId),
        gte(prayerInteractions.createdAt, since),
      ),
    )
    .groupBy(sql`date_trunc('day', ${prayerInteractions.createdAt})`)
    .orderBy(sql`date_trunc('day', ${prayerInteractions.createdAt})`);

  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
}

/**
 * Returns active prayer count per category for this church, ordered by count desc.
 */
export async function getCategoryBreakdown(
  churchId: string,
): Promise<Array<{ category: string; count: number }>> {
  const rows = await db
    .select({
      category: prayers.category,
      count: count(),
    })
    .from(prayers)
    .where(and(eq(prayers.churchId, churchId), eq(prayers.status, 'active')))
    .groupBy(prayers.category)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
}

/**
 * Returns total, answered, and answered rate for this church's prayers.
 */
export async function getAnsweredRate(
  churchId: string,
): Promise<{ total: number; answered: number; rate: number }> {
  const [totalRow] = await db
    .select({ value: count() })
    .from(prayers)
    .where(eq(prayers.churchId, churchId));

  const [answeredRow] = await db
    .select({ value: count() })
    .from(prayers)
    .where(and(eq(prayers.churchId, churchId), eq(prayers.status, 'answered')));

  const total = Number(totalRow?.value ?? 0);
  const answered = Number(answeredRow?.value ?? 0);
  const rate = total === 0 ? 0 : Math.round((answered / total) * 1000) / 10;

  return { total, answered, rate };
}

/**
 * Returns new member count per day for the last N days.
 */
export async function getMemberGrowth(
  churchId: string,
  days: number = 30,
): Promise<Array<{ date: string; count: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${churchMembers.joinedAt}), 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, churchId),
        gte(churchMembers.joinedAt, since),
      ),
    )
    .groupBy(sql`date_trunc('day', ${churchMembers.joinedAt})`)
    .orderBy(sql`date_trunc('day', ${churchMembers.joinedAt})`);

  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
}
