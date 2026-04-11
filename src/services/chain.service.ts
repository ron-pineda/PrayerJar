import { db } from '@/db';
import { prayerChains, chainParticipants, users } from '@/db/schema';
import { eq, and, count, lte, gte, desc } from 'drizzle-orm';
import { addHours } from 'date-fns';

export class SlotTakenError extends Error {
  constructor() {
    super('slot_taken');
    this.name = 'SlotTakenError';
  }
}

export async function createChain(prayerId: string, createdBy: string, startsAt: Date) {
  const endsAt = addHours(startsAt, 24);
  const [chain] = await db
    .insert(prayerChains)
    .values({ prayerId, createdBy, startsAt, endsAt })
    .returning();
  return chain;
}

export async function joinChain(chainId: string, userId: string, slotHour: number) {
  const taken = await isSlotTaken(chainId, slotHour);
  if (taken) throw new SlotTakenError();

  const [participant] = await db
    .insert(chainParticipants)
    .values({ chainId, userId, slotHour })
    .returning();
  return participant;
}

export async function getChain(chainId: string) {
  const rows = await db
    .select({
      chain: prayerChains,
      participantCount: count(chainParticipants.id),
    })
    .from(prayerChains)
    .leftJoin(chainParticipants, eq(chainParticipants.chainId, prayerChains.id))
    .where(eq(prayerChains.id, chainId))
    .groupBy(prayerChains.id)
    .limit(1);
  return rows[0] ?? null;
}

export async function getChainParticipants(chainId: string) {
  const rows = await db
    .select({
      participant: chainParticipants,
      nameInitial: users.name,
    })
    .from(chainParticipants)
    .leftJoin(users, eq(chainParticipants.userId, users.id))
    .where(eq(chainParticipants.chainId, chainId))
    .orderBy(chainParticipants.slotHour);
  return rows.map(row => ({
    ...row,
    nameInitial: (row.nameInitial ?? '?').charAt(0).toUpperCase(),
  }));
}

export async function isSlotTaken(chainId: string, slotHour: number): Promise<boolean> {
  const rows = await db
    .select({ id: chainParticipants.id })
    .from(chainParticipants)
    .where(
      and(
        eq(chainParticipants.chainId, chainId),
        eq(chainParticipants.slotHour, slotHour),
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function getChainByPrayer(prayerId: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(prayerChains)
    .where(
      and(
        eq(prayerChains.prayerId, prayerId),
        lte(prayerChains.startsAt, now),
        gte(prayerChains.endsAt, now),
      )
    )
    .orderBy(desc(prayerChains.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
