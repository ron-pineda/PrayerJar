'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface ExtendBannerProps {
  partnershipId: string;
  daysLeft: number;
  /** null = neither has requested; currentUserId = I requested; partnerId = partner requested */
  extendRequestedBy: string | null;
  currentUserId: string;
  partnerId: string;
}

export function ExtendBanner({
  partnershipId,
  daysLeft,
  extendRequestedBy,
  currentUserId,
  partnerId,
}: ExtendBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRequestedBy, setLocalRequestedBy] = useState(extendRequestedBy);

  if (dismissed) return null;

  const iAlreadyRequested = localRequestedBy === currentUserId;
  const partnerRequested = localRequestedBy === partnerId;

  async function handleExtend() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/partners/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnershipId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to request extension');
      }
      setLocalRequestedBy(currentUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-2 flex-1">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {iAlreadyRequested ? (
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <span className="font-medium">Waiting for your partner to confirm…</span>{' '}
              <span className="text-amber-700 dark:text-amber-400">
                You've requested to extend. Your partner needs to confirm too.
              </span>
            </p>
          ) : partnerRequested ? (
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <span className="font-medium">Your partner wants to extend!</span>{' '}
              <span className="text-amber-700 dark:text-amber-400">
                Confirm to keep your partnership going for 28 more days.
              </span>
            </p>
          ) : (
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <span className="font-medium">Your partnership ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.</span>{' '}
              <span className="text-amber-700 dark:text-amber-400">Would you like to continue?</span>
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!iAlreadyRequested && (
          <Button size="sm" onClick={handleExtend} disabled={loading}>
            {loading ? 'Extending…' : 'Extend 28 more days'}
          </Button>
        )}
        {!partnerRequested && !iAlreadyRequested && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground"
          >
            Let it expire
          </Button>
        )}
      </div>
    </div>
  );
}
