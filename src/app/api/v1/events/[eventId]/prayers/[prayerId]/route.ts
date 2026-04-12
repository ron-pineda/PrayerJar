import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getChurchById, getChurchMembers } from '@/services/church-platform.service';
import { getEvent, moderateEventPrayer } from '@/services/event.service';
import { db } from '@/db';
import { eventPrayers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  status: z.enum(['approved', 'spotlighted', 'hidden']),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string; prayerId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, prayerId } = await params;

  // Load event
  const event = await getEvent(eventId);
  if (!event) {
    return Response.json({ error: 'Event not found' }, { status: 404 });
  }

  // Load church and verify user is admin/pastor
  const church = await getChurchById(event.churchId);
  if (!church) {
    return Response.json({ error: 'Church not found' }, { status: 404 });
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (
    !currentMember ||
    (currentMember.member.role !== 'admin' &&
      currentMember.member.role !== 'pastor')
  ) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Load prayer and verify it belongs to this event
  const [prayer] = await db
    .select()
    .from(eventPrayers)
    .where(eq(eventPrayers.id, prayerId))
    .limit(1);

  if (!prayer || prayer.eventId !== eventId) {
    return Response.json({ error: 'Prayer not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  await moderateEventPrayer(prayerId, session.user.id, parsed.data.status);

  return Response.json({ success: true });
}
