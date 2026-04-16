'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface PrayerCardMenuProps {
  variant: 'own' | 'community';
  onEdit?: () => void;
  onRenew?: () => void;
  onMarkAnswered?: () => void;
  onDelete?: () => void;
  onAdopt?: () => void;
  onReport?: () => void;
}

export function PrayerCardMenu({
  variant,
  onEdit,
  onRenew,
  onMarkAnswered,
  onDelete,
  onAdopt,
  onReport,
}: PrayerCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Prayer actions" />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {variant === 'own' && (
          <>
            {onEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
            {onRenew && <DropdownMenuItem onClick={onRenew}>Renew for 30 days</DropdownMenuItem>}
            {onMarkAnswered && <DropdownMenuItem onClick={onMarkAnswered}>Mark as Answered</DropdownMenuItem>}
            {onDelete && (
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            )}
          </>
        )}
        {variant === 'community' && (
          <>
            {onAdopt && <DropdownMenuItem onClick={onAdopt}>Adopt this prayer</DropdownMenuItem>}
            {onReport && <DropdownMenuItem onClick={onReport}>Report</DropdownMenuItem>}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
