'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { acknowledgeModerationLogAction } from '@/app/actions/admin.actions';

export function AcknowledgeLogButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(() => acknowledgeModerationLogAction(id));
      }}
    >
      {isPending ? 'Acknowledging…' : 'Acknowledge'}
    </Button>
  );
}
