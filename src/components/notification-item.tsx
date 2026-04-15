'use client';

import Link from 'next/link';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface NotificationItemProps {
  id: string;
  label: string;
  read: boolean;
  relatedPrayerId: string | null;
}

export function NotificationItem({ id, label, read, relatedPrayerId }: NotificationItemProps) {
  const href = relatedPrayerId ? `/p/${relatedPrayerId}` : null;

  function markRead() {
    fetch(`/api/v1/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }

  if (href) {
    return (
      <DropdownMenuItem
        className={read ? 'opacity-60' : 'font-medium'}
        render={<Link href={href} onClick={markRead} />}
      >
        {label}
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem className={read ? 'opacity-60' : 'font-medium'}>
      {label}
    </DropdownMenuItem>
  );
}
