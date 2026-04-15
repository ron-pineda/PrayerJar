import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getNotificationsForUser, markAllRead } from '@/services/notification.service';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Bell } from 'lucide-react';
import { NotificationGroup, type NotificationItem } from './notification-group';

export const metadata: Metadata = { title: 'Notifications | The Prayer Jar' };

function groupByDate(notifications: NotificationItem[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  for (const n of notifications) {
    const d = new Date(n.createdAt as string);
    if (d >= todayStart) today.push(n);
    else if (d >= weekStart) thisWeek.push(n);
    else older.push(n);
  }

  return { today, thisWeek, older };
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const notifications = await getNotificationsForUser(session.user.id, 50);
  const { today, thisWeek, older } = groupByDate(
    notifications as NotificationItem[]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
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
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">You&apos;re all caught up!</p>
          <p className="text-sm mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {today.length > 0 && (
            <NotificationGroup label="Today" items={today} />
          )}
          {thisWeek.length > 0 && (
            <NotificationGroup label="This Week" items={thisWeek} />
          )}
          {older.length > 0 && (
            <NotificationGroup label="Older" items={older} />
          )}
        </div>
      )}
    </main>
  );
}
