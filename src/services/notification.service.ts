import { db } from '@/db';
import {
  notifications, prayerInteractions, prayers, users,
  type BadgeType,
} from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { sendPrayerNotificationEmail, sendEncouragementEmail, sendBadgeEmail } from './email.service';

export async function createNotification(data: {
  userId: string;
  type: typeof notifications.$inferInsert['type'];
  relatedPrayerId?: string;
  relatedInteractionId?: string;
}) {
  const [notification] = await db.insert(notifications).values(data).returning();
  return notification;
}

export async function getNotificationsForUser(userId: string, limit = 20) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return Number(row?.count ?? 0);
}

export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));
}

export async function markNotificationRead(id: string, userId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function notifyPrayerAuthor(prayerId: string) {
  const [prayer] = await db.select().from(prayers).where(eq(prayers.id, prayerId)).limit(1);
  if (!prayer?.authorId) return;

  await createNotification({
    userId: prayer.authorId,
    type: 'someone_prayed',
    relatedPrayerId: prayerId,
  });

  const [user] = await db.select().from(users).where(eq(users.id, prayer.authorId)).limit(1);
  if (user?.email && user.emailPreference !== 'off') {
    sendPrayerNotificationEmail(user.email, prayerId).catch(() => {});
  }
}

export async function notifyMessageReceived(interactionId: string) {
  const [interaction] = await db
    .select()
    .from(prayerInteractions)
    .where(eq(prayerInteractions.id, interactionId))
    .limit(1);
  if (!interaction) return;

  const [prayer] = await db.select().from(prayers).where(eq(prayers.id, interaction.prayerId)).limit(1);
  if (!prayer?.authorId) return;

  await createNotification({
    userId: prayer.authorId,
    type: 'message_received',
    relatedPrayerId: prayer.id,
    relatedInteractionId: interactionId,
  });

  const [user] = await db.select().from(users).where(eq(users.id, prayer.authorId)).limit(1);
  if (user?.email && user.emailPreference !== 'off') {
    sendEncouragementEmail(user.email, interactionId).catch(() => {});
  }
}

export async function notifyBadgeEarned(userId: string, badgeType: BadgeType) {
  await createNotification({ userId, type: 'badge_earned' });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user?.email && user.emailPreference !== 'off') {
    sendBadgeEmail(user.email, badgeType).catch(() => {});
  }
}
