import { NextResponse } from 'next/server';
import { db } from '@/db';
import { collections, collectionPrayers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET() {
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

  // Fetch prayer counts for each collection
  const counts = await db
    .select({
      collectionId: collectionPrayers.collectionId,
      prayerCount: count(collectionPrayers.prayerId),
    })
    .from(collectionPrayers)
    .groupBy(collectionPrayers.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, Number(c.prayerCount)]));

  const result = rows.map((c) => ({
    ...c,
    prayerCount: countMap.get(c.id) ?? 0,
  }));

  return NextResponse.json(result);
}
