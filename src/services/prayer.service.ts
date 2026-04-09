import { db } from '@/db';
import { prayers, type CategoryValue } from '@/db/schema';
import { eq, and, sql, gt } from 'drizzle-orm';
import { addDays } from 'date-fns';
import { categorizePrayer, moderateContent } from './ai.service';

export type CreatePrayerInput = {
  content: string;
  isAnonymous: boolean;
  isUrgent: boolean;
  authorId: string | null;
  imageUrl?: string | null;
};

export class ModerationError extends Error {
  constructor(
    message: string,
    public readonly selfHarm: boolean = false
  ) {
    super(message);
    this.name = 'ModerationError';
  }
}

export async function createPrayer(input: CreatePrayerInput) {
  const [moderation, categorization] = await Promise.all([
    moderateContent(input.content),
    categorizePrayer(input.content),
  ]);

  if (!moderation.safe) {
    throw new ModerationError(
      moderation.selfHarm ? 'selfHarm' : 'moderation',
      moderation.selfHarm
    );
  }

  const [prayer] = await db
    .insert(prayers)
    .values({
      content: input.content,
      isAnonymous: input.isAnonymous,
      isUrgent: input.isUrgent,
      authorId: input.authorId,
      imageUrl: input.imageUrl ?? null,
      category: categorization.category,
      tags: categorization.tags,
      suggestedVerse: categorization.verse,
      expiresAt: addDays(new Date(), 30),
    })
    .returning();

  return prayer;
}

export async function getRandomPrayer(category: CategoryValue | 'any', urgentOnly = false) {
  const now = new Date();
  const conditions = [
    eq(prayers.status, 'active'),
    gt(prayers.expiresAt, now),
  ];

  if (category !== 'any') conditions.push(eq(prayers.category, category));
  if (urgentOnly) conditions.push(eq(prayers.isUrgent, true));

  const results = await db
    .select()
    .from(prayers)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return results[0] ?? null;
}

export async function getPrayerById(id: string) {
  const results = await db.select().from(prayers).where(eq(prayers.id, id)).limit(1);
  return results[0] ?? null;
}

export async function getPrayersByAuthor(authorId: string) {
  return db
    .select()
    .from(prayers)
    .where(eq(prayers.authorId, authorId))
    .orderBy(prayers.createdAt);
}

export async function markPrayerAnswered(id: string, authorId: string, testimony?: string) {
  const [updated] = await db
    .update(prayers)
    .set({ status: 'answered', testimony: testimony ?? null })
    .where(and(eq(prayers.id, id), eq(prayers.authorId, authorId)))
    .returning();
  return updated ?? null;
}

export async function renewPrayer(id: string, authorId: string) {
  const [updated] = await db
    .update(prayers)
    .set({ expiresAt: addDays(new Date(), 30) })
    .where(and(eq(prayers.id, id), eq(prayers.authorId, authorId)))
    .returning();
  return updated ?? null;
}

export async function expireOverduePrayers() {
  return db
    .update(prayers)
    .set({ status: 'expired' })
    .where(and(eq(prayers.status, 'active'), sql`expires_at < NOW()`))
    .returning();
}

export async function getAnsweredPrayers(category?: CategoryValue) {
  const conditions = [eq(prayers.status, 'answered')];
  if (category) conditions.push(eq(prayers.category, category));

  return db
    .select()
    .from(prayers)
    .where(and(...conditions))
    .orderBy(prayers.createdAt);
}
