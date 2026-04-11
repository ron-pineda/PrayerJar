import { db } from '@/db';
import { checkIns } from '@/db/schema';
import type { CheckIn } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type CheckInMood = 'struggling' | 'okay' | 'better' | 'breakthrough';

export async function getCheckInStatus(prayerId: string): Promise<CheckIn | null> {
  const [row] = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.prayerId, prayerId))
    .limit(1);
  return row ?? null;
}

export async function saveCheckIn(prayerId: string, mood: CheckInMood): Promise<CheckIn> {
  const [row] = await db
    .insert(checkIns)
    .values({ prayerId, mood })
    .returning();
  return row;
}
