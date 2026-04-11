import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { collections, collectionPrayers, prayers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const [collection] = await db
    .select({
      id: collections.id,
      title: collections.title,
      description: collections.description,
      slug: collections.slug,
      coverEmoji: collections.coverEmoji,
      isPublished: collections.isPublished,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.isPublished, true)))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Total count of non-deleted prayers in this collection
  const [totalRow] = await db
    .select({ total: count(collectionPrayers.prayerId) })
    .from(collectionPrayers)
    .innerJoin(prayers, eq(collectionPrayers.prayerId, prayers.id))
    .where(eq(collectionPrayers.collectionId, collection.id));

  const prayerRows = await db
    .select({
      id: prayers.id,
      content: prayers.content,
      category: prayers.category,
      isAnonymous: prayers.isAnonymous,
      isUrgent: prayers.isUrgent,
      prayerCount: prayers.prayerCount,
      createdAt: prayers.createdAt,
      answeredAt: prayers.answeredAt,
      addedAt: collectionPrayers.addedAt,
    })
    .from(collectionPrayers)
    .innerJoin(prayers, eq(collectionPrayers.prayerId, prayers.id))
    .where(eq(collectionPrayers.collectionId, collection.id))
    .orderBy(collectionPrayers.addedAt)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    collection,
    prayers: prayerRows,
    total: Number(totalRow?.total ?? 0),
    page,
    limit,
  });
}
