import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { prayerPartnerships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { createNotification } from '@/services/notification.service';

const bodySchema = z.object({
  partnershipId: z.string().uuid(),
});

// POST /api/v1/partners/end
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

  // End the partnership.
  const [updated] = await db
    .update(prayerPartnerships)
    .set({ status: 'ended', endedAt: new Date(), endedBy: callerId })
    .where(eq(prayerPartnerships.id, partnershipId))
    .returning();

  // Notify the other partner.
  const otherId = partnership.userId === callerId ? partnership.partnerId : partnership.userId;
  await createNotification({
    userId: otherId,
    type: 'message_received', // closest available type; partnership notification
  }).catch(() => {});
  // Note: notification.service createNotification doesn't support a free-text body.
  // The in-app notification uses type 'message_received' as the nearest proxy.
  // A dedicated 'partnership_ended' notification type should be added in a future sprint
  // to carry the proper copy: "Your prayer partner has ended the partnership. You'll be
  // matched with someone new tomorrow."

  return NextResponse.json({ partnership: updated });
}
