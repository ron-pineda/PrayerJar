import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { partnerMessages, prayerPartnerships } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@/auth';

// ---------------------------------------------------------------------------
// GET /api/v1/partner-messages?partnershipId=<id>
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const partnershipId = req.nextUrl.searchParams.get('partnershipId');
  if (!partnershipId) {
    return NextResponse.json({ error: 'partnershipId is required' }, { status: 400 });
  }

  // Verify caller is a participant.
  const partnership = await db
    .select()
    .from(prayerPartnerships)
    .where(eq(prayerPartnerships.id, partnershipId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!partnership) {
    return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
  }

  const callerId = session.user.id;
  if (partnership.userId !== callerId && partnership.partnerId !== callerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await db
    .select()
    .from(partnerMessages)
    .where(eq(partnerMessages.partnershipId, partnershipId))
    .orderBy(asc(partnerMessages.createdAt));

  return NextResponse.json({ messages });
}

// ---------------------------------------------------------------------------
// POST /api/v1/partner-messages
// ---------------------------------------------------------------------------

const postSchema = z.object({
  partnershipId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { partnershipId, content } = parsed.data;

  if (content.length > 500) {
    return NextResponse.json({ error: 'Content must be 500 characters or fewer' }, { status: 400 });
  }

  // Verify caller is a participant.
  const partnership = await db
    .select()
    .from(prayerPartnerships)
    .where(eq(prayerPartnerships.id, partnershipId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!partnership) {
    return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
  }

  const callerId = session.user.id;
  if (partnership.userId !== callerId && partnership.partnerId !== callerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (partnership.status !== 'active') {
    return NextResponse.json({ error: 'Partnership is no longer active' }, { status: 400 });
  }

  const [message] = await db
    .insert(partnerMessages)
    .values({ partnershipId, senderId: callerId, content })
    .returning();

  return NextResponse.json({ message }, { status: 201 });
}
