'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const confirmed = confirmation === 'DELETE';

  function handleDelete() {
    if (!confirmed) return;
    startTransition(async () => {
      const res = await fetch('/api/v1/account/delete', { method: 'DELETE' });
      if (!res.ok) {
        setError('Something went wrong. Please try again or contact hello@prayerjar.org.');
        return;
      }
      // Sign out by redirecting to the sign-out endpoint
      router.push('/api/auth/signout?callbackUrl=/');
    });
  }

  if (!open) {
    return (
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete My Account
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 space-y-4">
      <p className="text-sm font-medium text-destructive">
        This will permanently delete your account, all your prayer requests, messages, and activity. This cannot be undone.
      </p>
      <div className="space-y-2">
        <label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
          Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={confirmation}
          onChange={(e) => { setConfirmation(e.target.value); setError(null); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
          placeholder="DELETE"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button
          variant="destructive"
          disabled={!confirmed || isPending}
          onClick={handleDelete}
        >
          {isPending ? 'Deleting…' : 'Permanently Delete Account'}
        </Button>
        <Button variant="outline" onClick={() => { setOpen(false); setConfirmation(''); setError(null); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
