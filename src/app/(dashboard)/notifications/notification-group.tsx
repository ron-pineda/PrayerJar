'use client';

import Link from 'next/link';
import { Bell, Heart, Users, UserMinus, Link2, Users2, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReactNode } from 'react';

const TYPE_CONFIG: Record<string, { label: string; icon: ReactNode }> = {
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

export type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date | string;
  relatedPrayerId?: string | null;
};

export function NotificationGroup({
  label,
  items,
}: {
  label: string;
  items: NotificationItem[];
}) {
  function markRead(id: string) {
    fetch(`/api/v1/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {label}
      </p>
      <ul className="divide-y rounded-xl border overflow-hidden">
        {items.map((n) => {
          const config = TYPE_CONFIG[n.type];
          const href = n.relatedPrayerId ? `/p/${n.relatedPrayerId}` : null;
          const inner = (
            <>
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
            </>
          );
          const cls = `flex items-start gap-3 px-4 py-3 ${n.read ? 'bg-card' : 'bg-accent/40'} ${href ? 'hover:bg-accent/70 transition-colors' : ''}`;
          return (
            <li key={n.id}>
              {href ? (
                <Link href={href} className={cls} onClick={() => markRead(n.id)}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
