'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FlagActionsProps {
  flagId: string;
  churchSlug: string;
}

export function FlagActions({ flagId, churchSlug }: FlagActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(status: 'reviewed' | 'dismissed' | 'escalated') {
    setPending(status);
    setError(null);

    try {
      const res = await fetch(`/api/v1/church/${churchSlug}/flags/${flagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Request failed');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction('dismissed')}
          disabled={pending !== null}
          className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {pending === 'dismissed' ? 'Dismissing…' : 'Dismiss'}
        </button>
        <button
          onClick={() => handleAction('reviewed')}
          disabled={pending !== null}
          className="text-xs px-3 py-1.5 rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {pending === 'reviewed' ? 'Marking…' : 'Mark Reviewed'}
        </button>
        <button
          onClick={() => handleAction('escalated')}
          disabled={pending !== null}
          className="text-xs px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {pending === 'escalated' ? 'Escalating…' : 'Escalate'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
