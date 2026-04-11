import { db } from '@/db';
import { collections, collectionPrayers, prayers } from '@/db/schema';
import { eq, count, and, isNull } from 'drizzle-orm';

export async function getPublishedCollections() {
  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      description: collections.description,
      slug: collections.slug,
      coverEmoji: collections.coverEmoji,
    })
    .from(collections)
    .where(eq(collections.isPublished, true));

  const counts = await db
    .select({
      collectionId: collectionPrayers.collectionId,
      prayerCount: count(collectionPrayers.prayerId),
    })
    .from(collectionPrayers)
    .groupBy(collectionPrayers.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, Number(c.prayerCount)]));

  return rows.map((c) => ({ ...c, prayerCount: countMap.get(c.id) ?? 0 }));
}

export async function getCategoryCounts() {
  const rows = await db
    .select({ category: prayers.category, count: count() })
    .from(prayers)
    .where(and(eq(prayers.status, 'active'), isNull(prayers.groupId)))
    .groupBy(prayers.category);

  return rows
    .map((r) => ({ category: r.category, count: Number(r.count) }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}
