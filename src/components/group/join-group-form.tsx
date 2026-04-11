'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function JoinGroupForm() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setPending(true);
    setError('');

    try {
      // join returns { member } which has groupId
      const res = await fetch('/api/v1/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) setError('Invalid invite code. Please check and try again.');
        else if (res.status === 409) setError('You are already a member of this group.');
        else setError(data.error ?? 'Something went wrong.');
        return;
      }

      // Redirect to the group page
      router.push(`/groups/${data.member.groupId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
        Join with code
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter invite code"
            className="w-40"
            disabled={pending}
            maxLength={20}
          />
          <Button type="submit" variant="outline" disabled={pending || !code.trim()}>
            {pending ? 'Joining…' : 'Join'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setOpen(false); setCode(''); setError(''); }}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </form>
  );
}
