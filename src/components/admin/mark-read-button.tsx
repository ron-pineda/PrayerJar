'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { markFeedbackReadAction } from '@/app/actions/admin.actions';

export function MarkReadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(() => markFeedbackReadAction(id));
      }}
    >
      {isPending ? 'Marking…' : 'Mark as read'}
    </Button>
  );
}
