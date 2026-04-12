import { db } from '@/db';
import { prayers, users, type CategoryValue } from '@/db/schema';
import { eq, and, sql, gt, isNull, isNotNull } from 'drizzle-orm';
import { addDays } from 'date-fns';
import { categorizePrayer, moderateContent } from './ai.service';

export type CreatePrayerInput = {
  content: string;
  isAnonymous: boolean;
  isUrgent: boolean;
  authorId: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
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
      audioUrl: input.audioUrl ?? null,
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
    isNull(prayers.groupId),
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

export async function markPrayerAnswered(
  id: string,
  authorId: string,
  testimony?: string,
  imageUrl?: string,
  videoUrl?: string,
  videoDurationSeconds?: number
) {
  const [updated] = await db
    .update(prayers)
    .set({
      status: 'answered',
      testimony: testimony ?? null,
      imageUrl: imageUrl ?? undefined,
      videoUrl: videoUrl ?? undefined,
      videoDurationSeconds: videoDurationSeconds ?? undefined,
      answeredAt: new Date(),
    })
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
  const conditions = [eq(prayers.status, 'answered'), isNull(prayers.groupId)];
  if (category) conditions.push(eq(prayers.category, category));

  return db
    .select()
    .from(prayers)
    .where(and(...conditions))
    .orderBy(prayers.createdAt);
}

export async function searchPrayers(opts: {
  query?: string;
  category?: CategoryValue | 'any';
  urgentOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { query, category, urgentOnly, limit = 20, offset = 0 } = opts;
  const now = new Date();

  const conditions = [
    eq(prayers.status, 'active'),
    gt(prayers.expiresAt, now),
    isNull(prayers.groupId),
  ];

  if (category && category !== 'any') {
    conditions.push(eq(prayers.category, category as CategoryValue));
  }
  if (urgentOnly) {
    conditions.push(eq(prayers.isUrgent, true));
  }
  if (query && query.trim().length > 0) {
    conditions.push(sql`content ILIKE ${'%' + query.trim() + '%'}`);
  }

  return db
    .select()
    .from(prayers)
    .where(and(...conditions))
    .orderBy(prayers.createdAt)
    .limit(limit)
    .offset(offset);
}

export async function getAnsweredPrayersFiltered(
  period: 'week' | 'month' | 'all',
  category?: CategoryValue,
) {
  const conditions = [eq(prayers.status, 'answered'), isNull(prayers.groupId)];
  if (category) conditions.push(eq(prayers.category, category));

  if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    conditions.push(gt(prayers.answeredAt, weekAgo));
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    conditions.push(gt(prayers.answeredAt, monthAgo));
  }
  // 'all' — no date filter

  return db
    .select()
    .from(prayers)
    .where(and(...conditions))
    .orderBy(prayers.createdAt);
}


export async function getTestimonyById(prayerId: string) {
  const [row] = await db
    .select({
      id: prayers.id,
      content: prayers.content,
      testimonyStory: prayers.testimonyStory,
      answeredAt: prayers.answeredAt,
      category: prayers.category,
      authorId: prayers.authorId,
      videoUrl: prayers.videoUrl,
    })
    .from(prayers)
    .where(and(eq(prayers.id, prayerId), isNotNull(prayers.answeredAt)))
    .limit(1);

  if (!row) return null;

  let author: { name: string | null; createdAt: Date } | null = null;
  if (row.authorId) {
    const [user] = await db
      .select({ name: users.name, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, row.authorId))
      .limit(1);
    if (user) {
      author = { name: user.name ? user.name.split(' ')[0] : null, createdAt: user.createdAt };
    }
  }

  return { prayer: { ...row }, author };
}
