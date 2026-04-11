import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Notifications | The Prayer Jar' };
import { getNotificationsForUser, markAllRead } from '@/services/notification.service';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { EmptyState } from '@/components/empty-state';
import { Bell } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  someone_prayed: 'Someone prayed for your request',
  message_received: 'You received an encouragement message',
  prayer_answered: 'A prayer you prayed for was answered',
  badge_earned: 'You earned a new badge!',
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const notifications = await getNotificationsForUser(session.user.id, 50);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <form
          action={async () => {
            'use server';
            await markAllRead(session.user.id);
            revalidatePath('/notifications');
          }}
        >
          <Button variant="ghost" size="sm" type="submit">
            Mark all read
          </Button>
        </form>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title="No notifications yet"
          description="You'll be notified when someone prays for you or leaves a message."
        />
      ) : (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li key={n.id} className={`py-4 ${n.read ? 'opacity-60' : ''}`}>
              <p className={n.read ? '' : 'font-medium'}>{TYPE_LABELS[n.type] ?? n.type}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
