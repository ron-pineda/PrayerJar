import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { collections, collectionPrayers, prayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  return adminEmails.includes(email);
}

const addPrayerSchema = z.object({
  prayerId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addPrayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify collection exists
  const [collection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  // Verify prayer exists
  const [prayer] = await db
    .select({ id: prayers.id })
    .from(prayers)
    .where(eq(prayers.id, parsed.data.prayerId))
    .limit(1);

  if (!prayer) {
    return NextResponse.json({ error: 'Prayer not found' }, { status: 404 });
  }

  // Check if already in collection
  const [existing] = await db
    .select({ collectionId: collectionPrayers.collectionId })
    .from(collectionPrayers)
    .where(
      and(
        eq(collectionPrayers.collectionId, id),
        eq(collectionPrayers.prayerId, parsed.data.prayerId)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'Prayer already in collection' }, { status: 409 });
  }

  await db.insert(collectionPrayers).values({
    collectionId: id,
    prayerId: parsed.data.prayerId,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
