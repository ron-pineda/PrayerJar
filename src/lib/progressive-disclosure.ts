import { db } from '@/db';
import { users, prayers, prayerInteractions } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export type ActivityLevel = 'new' | 'active' | 'power';

// Thresholds:
//   new -> active: 3+ pray interactions OR 1+ prayer submitted
//   active -> power: 10+ pray interactions AND 2+ prayers submitted
export function computeActivityLevel(stats: {
  prayCount: number;
  prayerCount: number;
}): ActivityLevel {
  if (stats.prayCount >= 10 && stats.prayerCount >= 2) return 'power';
  if (stats.prayCount >= 3 || stats.prayerCount >= 1) return 'active';
  return 'new';
}

// Call after any prayer or interaction action to recompute and update the user record
export async function refreshActivityLevel(userId: string): Promise<void> {
  const [prayCountResult, prayerCountResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(prayerInteractions)
      .where(eq(prayerInteractions.userId, userId))
      .then((r) => r[0]?.value ?? 0),
    db
      .select({ value: count() })
      .from(prayers)
      .where(eq(prayers.authorId, userId))
      .then((r) => r[0]?.value ?? 0),
  ]);

  const level = computeActivityLevel({
    prayCount: Number(prayCountResult),
    prayerCount: Number(prayerCountResult),
  });

  await db
    .update(users)
    .set({ activityLevel: level })
    .where(eq(users.id, userId));
}
