import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/push';

export async function saveSubscription(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string }
) {
  await db
    .insert(pushSubscriptions)
    .values({ userId, ...subscription })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: subscription.p256dh, auth: subscription.auth },
    });
}

export async function deleteSubscription(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getSubscriptionsForUser(userId: string) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

export async function sendToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const subs = await getSubscriptionsForUser(userId);
  await Promise.allSettled(subs.map(sub => sendPushNotification(sub, payload)));
}
