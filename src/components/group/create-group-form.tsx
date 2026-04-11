'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function CreateGroupForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setPending(true);
    setError('');

    try {
      const res = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      router.push(`/groups/${data.group.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Group name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tuesday Morning Prayer"
          maxLength={50}
          disabled={pending}
          required
        />
        <p className="text-xs text-muted-foreground text-right">{name.length}/50</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this group for?"
          maxLength={200}
          rows={3}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground text-right">{description.length}/200</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? 'Creating…' : 'Create group'}
        </Button>
        <Button type="button" variant="ghost" render={<Link href="/groups" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
