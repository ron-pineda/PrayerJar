'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface GroupRenameFormProps {
  groupId: string;
  initialName: string;
  initialDescription?: string | null;
}

export function GroupRenameForm({ groupId, initialName, initialDescription }: GroupRenameFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required.'); return; }
    setPending(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to save.');
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError('Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setEditing(true)}
        aria-label="Rename group"
      >
        <Pencil className="h-4 w-4 mr-1" />
        Rename
      </Button>
    );
  }

  return (
    <div className="space-y-2 w-full max-w-sm">
      <input
        className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Group name"
        autoFocus
      />
      <input
        className="w-full border rounded-md px-3 py-1.5 text-sm bg-background text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
        placeholder="Description (optional)"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(initialName); setDescription(initialDescription ?? ''); }} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
