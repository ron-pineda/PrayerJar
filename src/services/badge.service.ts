import { db } from '@/db';
import { badges, prayerInteractions, prayers, users, type BadgeType } from '@/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { notifyBadgeEarned } from './notification.service';
import { format } from 'date-fns';

export const BADGE_THRESHOLDS: Partial<Record<BadgeType, number>> = {
  intercessor_bronze: 10,
  intercessor_silver: 50,
  intercessor_gold: 100,
  encourager_bronze: 10,
  encourager_silver: 50,
  encourager_gold: 100,
  faithful: 7,
  devoted: 30,
};

async function hasBadge(userId: string, type: BadgeType): Promise<boolean> {
  const result = await db
    .select()
    .from(badges)
    .where(and(eq(badges.userId, userId), eq(badges.type, type)))
    .limit(1);
  return result.length > 0;
}

async function awardBadge(userId: string, type: BadgeType) {
  if (await hasBadge(userId, type)) return;
  await db.insert(badges).values({ userId, type });
  notifyBadgeEarned(userId, type).catch(() => {});
}

export async function updateStreak(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;

  const todayUTC = format(new Date(), 'yyyy-MM-dd');
  if (user.lastPrayedDate === todayUTC) return;

  const yesterdayUTC = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const newStreak = user.lastPrayedDate === yesterdayUTC ? user.currentStreak + 1 : 1;

  await db
    .update(users)
    .set({ currentStreak: newStreak, lastPrayedDate: todayUTC })
    .where(eq(users.id, userId));

  if (newStreak >= 30) await awardBadge(userId, 'devoted');
  else if (newStreak >= 7) await awardBadge(userId, 'faithful');
}

export async function evaluateBadgesForUser(userId: string) {
  const [prayerCountRow] = await db
    .select({ count: count() })
    .from(prayerInteractions)
    .where(eq(prayerInteractions.userId, userId));

  const [messageCountRow] = await db
    .select({ count: count() })
    .from(prayerInteractions)
    .where(and(eq(prayerInteractions.userId, userId), sql`message IS NOT NULL`));

  const prayCount = Number(prayerCountRow?.count ?? 0);
  const msgCount = Number(messageCountRow?.count ?? 0);

  if (prayCount === 1) await awardBadge(userId, 'first_prayer');
  if (prayCount >= 100) await awardBadge(userId, 'intercessor_gold');
  else if (prayCount >= 50) await awardBadge(userId, 'intercessor_silver');
  else if (prayCount >= 10) await awardBadge(userId, 'intercessor_bronze');

  if (msgCount >= 100) await awardBadge(userId, 'encourager_gold');
  else if (msgCount >= 50) await awardBadge(userId, 'encourager_silver');
  else if (msgCount >= 10) await awardBadge(userId, 'encourager_bronze');
}

export async function evaluatePrayerSubmissionBadge(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(eq(prayers.authorId, userId));

  if (Number(row?.count ?? 0) === 1) await awardBadge(userId, 'first_light');
}

export async function evaluateWitnessBadge(userId: string) {
  await awardBadge(userId, 'witness');
}

export async function evaluateTestimonyBadge(userId: string) {
  await awardBadge(userId, 'testimony');
}

export async function getBadgesForUser(userId: string) {
  return db.select().from(badges).where(eq(badges.userId, userId)).orderBy(badges.awardedAt);
}

export async function evaluateDonorBadge(userId: string) {
  await awardBadge(userId, 'donor');
}
