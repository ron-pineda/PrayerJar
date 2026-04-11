import { db } from '@/db';
import {
  prayerPartnerships, prayers, prayerInteractions, users,
  type PrayerPartnership,
} from '@/db/schema';
import { eq, or, and, sql, gte, inArray } from 'drizzle-orm';
import { addDays, subDays } from 'date-fns';
import type { User } from '@/db/schema';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Return the caller's current active partnership, or null. */
export async function getActivePartnership(userId: string): Promise<PrayerPartnership | null> {
  const rows = await db
    .select()
    .from(prayerPartnerships)
    .where(
      and(
        or(
          eq(prayerPartnerships.userId, userId),
          eq(prayerPartnerships.partnerId, userId),
        ),
        eq(prayerPartnerships.status, 'active'),
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Return all partnerships (any status) a user has ever been part of. */
export async function getPartnerHistory(userId: string): Promise<PrayerPartnership[]> {
  return db
    .select()
    .from(prayerPartnerships)
    .where(
      or(
        eq(prayerPartnerships.userId, userId),
        eq(prayerPartnerships.partnerId, userId),
      )
    );
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Mark a partnership as ended. */
export async function endPartnership(partnershipId: string, endedBy: string): Promise<void> {
  await db
    .update(prayerPartnerships)
    .set({ status: 'ended', endedAt: new Date(), endedBy })
    .where(eq(prayerPartnerships.id, partnershipId));
}

/** Create a new 28-day partnership. */
export async function createPartnership(
  userId: string,
  partnerId: string,
): Promise<PrayerPartnership> {
  const [partnership] = await db
    .insert(prayerPartnerships)
    .values({
      userId,
      partnerId,
      status: 'active',
      expiresAt: addDays(new Date(), 28),
    })
    .returning();
  return partnership;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score two users for matching (0–100).
 *
 * Weights:
 *   40%  category overlap  (intersection/union of last-10-prayers categories)
 *   20%  streak similarity (based on 7-day interaction counts)
 *   20%  timezone proximity (notifHour preference, treated as timezone proxy)
 *   20%  never-matched bonus
 */
export async function scoreMatchPair(
  userA: User,
  userB: User,
  history: PrayerPartnership[],
): Promise<number> {
  const [catScore, streakScore, tzScore, neverScore] = await Promise.all([
    categoryOverlapScore(userA.id, userB.id),
    streakSimilarityScore(userA.id, userB.id),
    timezoneProximityScore(userA, userB),
    neverMatchedBonus(userA.id, userB.id, history),
  ]);

  return Math.round(catScore * 40 + streakScore * 20 + tzScore * 20 + neverScore * 20);
}

// ---------------------------------------------------------------------------
// Score helpers (each returns 0–1)
// ---------------------------------------------------------------------------

async function categoryOverlapScore(userAId: string, userBId: string): Promise<number> {
  const [rowsA, rowsB] = await Promise.all([
    db
      .select({ category: prayers.category })
      .from(prayers)
      .where(eq(prayers.authorId, userAId))
      .orderBy(sql`created_at DESC`)
      .limit(10),
    db
      .select({ category: prayers.category })
      .from(prayers)
      .where(eq(prayers.authorId, userBId))
      .orderBy(sql`created_at DESC`)
      .limit(10),
  ]);

  const setA = new Set(rowsA.map((r) => r.category));
  const setB = new Set(rowsB.map((r) => r.category));

  if (setA.size === 0 && setB.size === 0) return 0.5; // neutral when no data

  const intersection = [...setA].filter((c) => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;

  return union === 0 ? 0 : intersection / union;
}

async function streakSimilarityScore(userAId: string, userBId: string): Promise<number> {
  const since = subDays(new Date(), 7);

  const [countA, countB] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(prayerInteractions)
      .where(
        and(
          eq(prayerInteractions.userId, userAId),
          gte(prayerInteractions.createdAt, since),
        )
      ),
    db
      .select({ n: sql<number>`count(*)` })
      .from(prayerInteractions)
      .where(
        and(
          eq(prayerInteractions.userId, userBId),
          gte(prayerInteractions.createdAt, since),
        )
      ),
  ]);

  const a = Number(countA[0]?.n ?? 0);
  const b = Number(countB[0]?.n ?? 0);
  const maxVal = Math.max(a, b, 1);

  return 1 - Math.abs(a - b) / maxVal;
}

async function timezoneProximityScore(userA: User, userB: User): Promise<number> {
  // Use quietHoursStart as a proxy for the user's preferred active hour (timezone signal).
  // Fall back to 0 (midnight) if not set.
  const hourA = userA.quietHoursStart ?? 0;
  const hourB = userB.quietHoursStart ?? 0;

  const diff = Math.abs(hourA - hourB);
  // Hours wrap around 24; take the shorter arc.
  const circularDiff = Math.min(diff, 24 - diff);
  return Math.max(0, 1 - circularDiff / 12);
}

function neverMatchedBonus(
  userAId: string,
  userBId: string,
  history: PrayerPartnership[],
): number {
  const everMatched = history.some(
    (p) =>
      (p.userId === userAId && p.partnerId === userBId) ||
      (p.userId === userBId && p.partnerId === userAId),
  );
  return everMatched ? 0 : 1;
}
