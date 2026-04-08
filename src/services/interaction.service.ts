import { db } from '@/db';
import { prayerInteractions, prayers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { moderateContent } from './ai.service';
import { notifyPrayerAuthor, notifyMessageReceived } from './notification.service';
import { evaluateBadgesForUser, updateStreak } from './badge.service';

export type PrayForInput = {
  prayerId: string;
  userId: string | null;
  message?: string;
  isAnonymous: boolean;
};

export class ModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModerationError';
  }
}

export async function prayForRequest(input: PrayForInput) {
  if (input.message) {
    const moderation = await moderateContent(input.message);
    if (!moderation.safe) throw new ModerationError('moderation');
  }

  const [interaction] = await db
    .insert(prayerInteractions)
    .values({
      prayerId: input.prayerId,
      userId: input.userId,
      message: input.message ?? null,
      isAnonymous: input.isAnonymous,
    })
    .returning();

  await db
    .update(prayers)
    .set({ prayerCount: sql`prayer_count + 1` })
    .where(eq(prayers.id, input.prayerId));

  if (input.userId) {
    await updateStreak(input.userId);
    await evaluateBadgesForUser(input.userId);
  }

  // Notify prayer author (non-blocking)
  notifyPrayerAuthor(input.prayerId).catch(() => {});
  if (input.message) {
    notifyMessageReceived(interaction.id).catch(() => {});
  }

  return interaction;
}

export async function getInteractionsForPrayer(prayerId: string) {
  return db
    .select()
    .from(prayerInteractions)
    .where(eq(prayerInteractions.prayerId, prayerId))
    .orderBy(prayerInteractions.createdAt);
}

export async function getInteractionsByUser(userId: string) {
  return db
    .select()
    .from(prayerInteractions)
    .where(eq(prayerInteractions.userId, userId))
    .orderBy(prayerInteractions.createdAt);
}
