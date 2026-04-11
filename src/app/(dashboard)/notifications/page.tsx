import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getNotificationsForUser, markAllRead } from '@/services/notification.service';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Bell, Heart, Users, UserMinus, Link2, Users2, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Notifications | The Prayer Jar' };

const TYPE_CONFIG: Record<string, { label: string; icon: ReactNode; href?: string }> = {
  someone_prayed: { label: 'Someone prayed for your request', icon: <Heart className="h-4 w-4 text-rose-500" /> },
  message_received: { label: 'You received an encouragement message', icon: <Heart className="h-4 w-4 text-blue-500" /> },
  prayer_answered: { label: 'A prayer you prayed for was answered', icon: <BookOpen className="h-4 w-4 text-amber-500" /> },
  badge_earned: { label: 'You earned a new badge!', icon: <Bell className="h-4 w-4 text-yellow-500" /> },
  partnership_request: { label: 'You have a new prayer partner request', icon: <Users className="h-4 w-4 text-purple-500" /> },
  partnership_ended: { label: 'A prayer partnership has ended', icon: <UserMinus className="h-4 w-4 text-muted-foreground" /> },
  chain_joined: { label: 'Someone joined your prayer chain', icon: <Link2 className="h-4 w-4 text-green-500" /> },
  group_joined: { label: 'Someone joined your prayer group', icon: <Users2 className="h-4 w-4 text-indigo-500" /> },
  testimony_posted: { label: 'A new testimony was shared', icon: <BookOpen className="h-4 w-4 text-amber-500" /> },
};

type NotificationItem = { id: string; type: string; read: boolean; createdAt: Date | string };

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

function NotificationGroup({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: string; type: string; read: boolean; createdAt: Date | string }>;
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {label}
      </p>
      <ul className="divide-y rounded-xl border overflow-hidden">
        {items.map((n) => {
          const config = TYPE_CONFIG[n.type];
          return (
            <li
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 ${
                n.read ? 'bg-card' : 'bg-accent/40'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {config?.icon ?? <Bell className="h-4 w-4 text-muted-foreground" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.read ? 'text-muted-foreground' : 'font-medium'}`}>
                  {config?.label ?? n.type}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt as string), { addSuffix: true })}
                </p>
              </div>
              {!n.read && (
                <span className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
