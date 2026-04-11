import { db } from '@/db';
import { prayerAdoptions, prayers } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';

export async function adoptPrayer(userId: string, prayerId: string): Promise<void> {
  await db
    .insert(prayerAdoptions)
    .values({ userId, prayerId })
    .onConflictDoNothing();
}

export async function unadoptPrayer(userId: string, prayerId: string): Promise<void> {
  await db
    .delete(prayerAdoptions)
    .where(and(eq(prayerAdoptions.userId, userId), eq(prayerAdoptions.prayerId, prayerId)));
}

export async function getAdoptedPrayers(userId: string) {
  return db
    .select({
      adoption: prayerAdoptions,
      prayer: prayers,
    })
    .from(prayerAdoptions)
    .innerJoin(prayers, eq(prayerAdoptions.prayerId, prayers.id))
    .where(eq(prayerAdoptions.userId, userId))
    .orderBy(sql`${prayerAdoptions.adoptedAt} DESC`);
}

export async function getAdoptionCount(prayerId: string): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(prayerAdoptions)
    .where(eq(prayerAdoptions.prayerId, prayerId));
  return Number(rows[0]?.count ?? 0);
}

export async function isAdopted(userId: string, prayerId: string): Promise<boolean> {
  const rows = await db
    .select({ id: prayerAdoptions.id })
    .from(prayerAdoptions)
    .where(and(eq(prayerAdoptions.userId, userId), eq(prayerAdoptions.prayerId, prayerId)))
    .limit(1);
  return rows.length > 0;
}
