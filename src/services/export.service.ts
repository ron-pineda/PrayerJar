import { db } from '@/db';
import {
  users,
  prayers,
  prayerInteractions,
  checkIns,
  griefDates,
  badges,
} from '@/db/schema';
import type {
  Prayer,
  PrayerInteraction,
  CheckIn,
  GriefDate,
  Badge,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export type UserDataExport = {
  exportedAt: string;
  user: { id: string; name: string | null; email: string | null; createdAt: Date };
  prayers: Prayer[];
  interactions: PrayerInteraction[];
  checkIns: CheckIn[];
  griefDates: GriefDate[];
  badges: Badge[];
};

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const userPrayers = await db
    .select()
    .from(prayers)
    .where(eq(prayers.authorId, userId));

  const interactions = await db
    .select()
    .from(prayerInteractions)
    .where(eq(prayerInteractions.userId, userId));

  // checkIns are linked to prayers, not directly to users
  const prayerIds = userPrayers.map((p) => p.id);
  const userCheckIns: CheckIn[] =
    prayerIds.length > 0
      ? await db.select().from(checkIns).where(inArray(checkIns.prayerId, prayerIds))
      : [];

  const userGriefDates = await db
    .select()
    .from(griefDates)
    .where(eq(griefDates.userId, userId));

  const userBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.userId, userId));

  return {
    exportedAt: new Date().toISOString(),
    user,
    prayers: userPrayers,
    interactions,
    checkIns: userCheckIns,
    griefDates: userGriefDates,
    badges: userBadges,
  };
}
