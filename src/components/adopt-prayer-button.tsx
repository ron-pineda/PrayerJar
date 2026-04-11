'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

type Props = {
  prayerId: string;
  initialAdopted: boolean;
  initialCount: number;
};

export function AdoptPrayerButton({ prayerId, initialAdopted, initialCount }: Props) {
  const [adopted, setAdopted] = useState(initialAdopted);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleToggle() {
    if (pending) return;
    setPending(true);
    setError('');

    // Optimistic update
    const wasAdopted = adopted;
    setAdopted(!wasAdopted);
    setCount((c) => (wasAdopted ? c - 1 : c + 1));

    try {
      const res = wasAdopted
        ? await fetch(`/api/v1/adoptions?prayerId=${encodeURIComponent(prayerId)}`, {
            method: 'DELETE',
          })
        : await fetch('/api/v1/adoptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prayerId }),
          });

      if (!res.ok) {
        // Revert on error
        setAdopted(wasAdopted);
        setCount((c) => (wasAdopted ? c + 1 : c - 1));
        if (res.status === 401) {
          setError('Sign in to adopt this prayer');
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    } catch {
      // Revert on network error
      setAdopted(wasAdopted);
      setCount((c) => (wasAdopted ? c + 1 : c - 1));
      setError('Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant={adopted ? 'default' : 'outline'}
        onClick={handleToggle}
        disabled={pending}
        className={
          adopted
            ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
            : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30'
        }
        aria-pressed={adopted}
        aria-label={adopted ? 'Unadopt this prayer' : 'Adopt this prayer'}
      >
        <Heart
          className={`h-4 w-4 mr-1.5 transition-transform duration-150 ${adopted ? 'fill-current scale-110' : ''}`}
        />
        {pending ? '...' : adopted ? 'Adopted ✓' : 'Adopt'}
      </Button>

      {count > 0 && (
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? 'person is' : 'people are'} praying daily
        </span>
      )}

      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
