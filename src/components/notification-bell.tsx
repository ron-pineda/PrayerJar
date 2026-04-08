import { auth } from '@/lib/auth';
import { getNotificationsForUser, getUnreadCount } from '@/services/notification.service';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  someone_prayed: 'Someone prayed for your request',
  message_received: 'You received an encouragement message',
  prayer_answered: 'A prayer you prayed for was answered',
  badge_earned: 'You earned a new badge!',
};

export async function NotificationBell() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(session.user.id, 5),
    getUnreadCount(session.user.id),
  ]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem className="text-muted-foreground">
            No notifications yet
          </DropdownMenuItem>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} className={n.read ? 'opacity-60' : 'font-medium'}>
              {TYPE_LABELS[n.type] ?? n.type}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
