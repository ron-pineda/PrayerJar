import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { prayerPartnerships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addDays } from 'date-fns';
import { auth } from '@/lib/auth';

const bodySchema = z.object({
  partnershipId: z.string().uuid(),
});

// POST /api/v1/partners/extend
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { partnershipId } = parsed.data;
  const callerId = session.user.id;

  const partnership = await db
    .select()
    .from(prayerPartnerships)
    .where(eq(prayerPartnerships.id, partnershipId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!partnership) {
    return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
  }

  if (partnership.userId !== callerId && partnership.partnerId !== callerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (partnership.status !== 'active') {
    return NextResponse.json({ error: 'Partnership is no longer active' }, { status: 400 });
  }

  // Determine the other partner's ID.
  const otherId = partnership.userId === callerId ? partnership.partnerId : partnership.userId;

  let updated;

  if (!partnership.extendRequestedBy) {
    // First request — record who asked.
    [updated] = await db
      .update(prayerPartnerships)
      .set({ extendRequestedBy: callerId })
      .where(eq(prayerPartnerships.id, partnershipId))
      .returning();

    return NextResponse.json({
      partnership: updated,
      message: 'Extension requested. Waiting for your partner to confirm.',
    });
  }

  if (partnership.extendRequestedBy === callerId) {
    // Caller already requested — idempotent, nothing to do.
    return NextResponse.json({
      partnership,
      message: 'You have already requested an extension. Waiting for your partner.',
    });
  }

  // The OTHER partner already requested — both have confirmed, extend now.
  if (partnership.extendRequestedBy === otherId) {
    [updated] = await db
      .update(prayerPartnerships)
      .set({
        expiresAt: addDays(partnership.expiresAt, 28),
        extendRequestedBy: null,
      })
      .where(eq(prayerPartnerships.id, partnershipId))
      .returning();

    return NextResponse.json({
      partnership: updated,
      message: 'Partnership extended by 28 days.',
    });
  }

  // Unexpected state — extendRequestedBy is set but is neither caller nor other partner.
  return NextResponse.json({ error: 'Unexpected partnership state' }, { status: 500 });
}
