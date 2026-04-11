'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface GroupDetailActionsProps {
  groupId: string;
  isOwner: boolean;
  /** Owner and the only remaining member — delete is the only option */
  isSoleOwner: boolean;
}

export function GroupDetailActions({
  groupId,
  isOwner,
  isSoleOwner,
}: GroupDetailActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const actionLabel = isSoleOwner ? 'Delete group' : isOwner ? 'Delete group' : 'Leave group';
  const confirmMessage = isOwner
    ? 'Delete this group? This cannot be undone and all group data will be lost.'
    : 'Leave this group?';

  async function handleAction() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setPending(true);
    setError('');

    try {
      if (isOwner) {
        const res = await fetch(`/api/v1/groups/${groupId}`, { method: 'DELETE' });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? 'Failed to delete group.');
          setConfirming(false);
          return;
        }
        router.push('/groups');
      } else {
        const res = await fetch(`/api/v1/groups/${groupId}/leave`, { method: 'POST' });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? 'Failed to leave group.');
          setConfirming(false);
          return;
        }
        router.push('/groups');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      {confirming ? (
        <div className="flex flex-col items-end gap-2">
          <p className="text-sm text-muted-foreground max-w-[200px] text-right">{confirmMessage}</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleAction}
              disabled={pending}
            >
              {pending ? 'Processing…' : 'Confirm'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant={isOwner ? 'destructive' : 'outline'}
          size="sm"
          onClick={handleAction}
          disabled={pending}
        >
          {actionLabel}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
