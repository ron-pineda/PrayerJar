import { db } from '@/db';
import { events, eventPrayers } from '@/db/schema';
import { eq, and, desc, count, inArray, ne } from 'drizzle-orm';
import { getChurchTier } from '@/services/church-platform.service';
import { PLANS } from '@/lib/plans';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Event = typeof events.$inferSelect;
export type EventPrayer = typeof eventPrayers.$inferSelect;
export type EventStatus = 'draft' | 'active' | 'paused' | 'ended';
export type EventPrayerStatus = 'pending' | 'approved' | 'spotlighted' | 'hidden';

// ---------------------------------------------------------------------------
// Event management
// ---------------------------------------------------------------------------

export async function createEvent(input: {
  churchId: string;
  name: string;
  description?: string;
  eventLicenseId?: string;
  startsAt?: Date;
  endsAt?: Date;
  createdBy: string;
}): Promise<Event> {
  const tier = await getChurchTier(input.churchId);
  const limit = PLANS[tier].limits.events;

  // Sprint 27 (pj-s27-03): this stays a hard stop, and it is a lock, not a price.
  // `POST /api/v1/church/[slug]/events` is a live, admin-reachable endpoint, but
  // live events have no create, edit or delete UI. This throw is the only thing
  // keeping an unfinished feature shut. Only the message changed — it used to
  // name a plan that no longer exists.
  if (limit === 0) {
    throw new Error('Live events are not available yet.');
  }
  if (limit !== null) {
    const [{ value: currentCount }] = await db
      .select({ value: count() })
      .from(events)
      .where(and(eq(events.churchId, input.churchId), ne(events.status, 'ended')));
    if (Number(currentCount) >= limit) {
      throw new Error('Event limit reached.');
    }
  }

  const [created] = await db
    .insert(events)
    .values({
      churchId: input.churchId,
      name: input.name,
      description: input.description ?? null,
      eventLicenseId: input.eventLicenseId ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      createdBy: input.createdBy,
    })
    .returning();

  return created;
}

export async function getEvent(eventId: string): Promise<Event | undefined> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  return event;
}

export async function getChurchEvents(churchId: string): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.churchId, churchId))
    .orderBy(desc(events.createdAt))
    .limit(50);
}

export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
): Promise<void> {
  await db
    .update(events)
    .set({ status, updatedAt: new Date() })
    .where(eq(events.id, eventId));
}

export async function updateDisplayMode(
  eventId: string,
  mode: 'stream' | 'spotlight' | 'category',
): Promise<void> {
  await db
    .update(events)
    .set({ displayMode: mode, updatedAt: new Date() })
    .where(eq(events.id, eventId));
}

// ---------------------------------------------------------------------------
// Event prayer management
// ---------------------------------------------------------------------------

export async function submitEventPrayer(input: {
  eventId: string;
  churchId: string;
  content: string;
  submitterName?: string;
  isAnonymous: boolean;
  category?: string;
}): Promise<EventPrayer> {
  // Validate content length
  if (input.content.length < 5 || input.content.length > 500) {
    throw new Error('Prayer content must be between 5 and 500 characters');
  }

  // Check event is active
  const event = await getEvent(input.eventId);
  if (!event || event.status !== 'active') {
    throw new Error('Event is not accepting prayers');
  }

  const [created] = await db
    .insert(eventPrayers)
    .values({
      eventId: input.eventId,
      churchId: input.churchId,
      content: input.content,
      submitterName: input.submitterName ?? null,
      isAnonymous: input.isAnonymous,
      category: (input.category as EventPrayer['category']) ?? 'other',
    })
    .returning();

  return created;
}

export async function getEventPrayers(
  eventId: string,
  options?: { status?: EventPrayerStatus; limit?: number },
): Promise<EventPrayer[]> {
  const status = options?.status ?? 'approved';
  const limit = options?.limit ?? 50;

  return db
    .select()
    .from(eventPrayers)
    .where(
      and(
        eq(eventPrayers.eventId, eventId),
        eq(eventPrayers.status, status),
      ),
    )
    .orderBy(desc(eventPrayers.createdAt))
    .limit(limit);
}

export async function moderateEventPrayer(
  prayerId: string,
  moderatorId: string,
  status: 'approved' | 'spotlighted' | 'hidden',
): Promise<void> {
  await db
    .update(eventPrayers)
    .set({ status, moderatedBy: moderatorId })
    .where(eq(eventPrayers.id, prayerId));
}

export async function getSpotlightedPrayer(
  eventId: string,
): Promise<EventPrayer | undefined> {
  const [prayer] = await db
    .select()
    .from(eventPrayers)
    .where(
      and(
        eq(eventPrayers.eventId, eventId),
        eq(eventPrayers.status, 'spotlighted'),
      ),
    )
    .orderBy(desc(eventPrayers.createdAt))
    .limit(1);

  return prayer;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getEventStats(eventId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  spotlighted: number;
  hidden: number;
}> {
  const [totalResult] = await db
    .select({ value: count() })
    .from(eventPrayers)
    .where(eq(eventPrayers.eventId, eventId));

  const [pendingResult] = await db
    .select({ value: count() })
    .from(eventPrayers)
    .where(and(eq(eventPrayers.eventId, eventId), eq(eventPrayers.status, 'pending')));

  const [approvedResult] = await db
    .select({ value: count() })
    .from(eventPrayers)
    .where(and(eq(eventPrayers.eventId, eventId), eq(eventPrayers.status, 'approved')));

  const [spotlightedResult] = await db
    .select({ value: count() })
    .from(eventPrayers)
    .where(and(eq(eventPrayers.eventId, eventId), eq(eventPrayers.status, 'spotlighted')));

  const [hiddenResult] = await db
    .select({ value: count() })
    .from(eventPrayers)
    .where(and(eq(eventPrayers.eventId, eventId), eq(eventPrayers.status, 'hidden')));

  return {
    total: Number(totalResult?.value ?? 0),
    pending: Number(pendingResult?.value ?? 0),
    approved: Number(approvedResult?.value ?? 0),
    spotlighted: Number(spotlightedResult?.value ?? 0),
    hidden: Number(hiddenResult?.value ?? 0),
  };
}
