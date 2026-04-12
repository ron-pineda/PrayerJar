'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AssignPrayerFormProps {
  churchSlug: string;
  members: Array<{ id: string; name: string | null }>;
}

export function AssignPrayerForm({ churchSlug, members }: AssignPrayerFormProps) {
  const router = useRouter();
  const [prayerId, setPrayerId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!prayerId.trim() || !assignedTo) return;

    setPending(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        prayerId: prayerId.trim(),
        assignedTo,
      };
      if (notes.trim()) body.notes = notes.trim();

      const res = await fetch(`/api/v1/church/${churchSlug}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Request failed');
      }

      setPrayerId('');
      setAssignedTo('');
      setNotes('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Assign a Prayer</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="prayer-id-assign" className="text-xs text-muted-foreground">
          Prayer ID
        </label>
        <input
          id="prayer-id-assign"
          type="text"
          value={prayerId}
          onChange={(e) => setPrayerId(e.target.value)}
          required
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="assigned-to" className="text-xs text-muted-foreground">
          Assign to
        </label>
        <select
          id="assigned-to"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a member…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name ?? m.id}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="assign-notes" className="text-xs text-muted-foreground">
          Notes (optional)
        </label>
        <textarea
          id="assign-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Any instructions for the prayer team member…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !prayerId.trim() || !assignedTo}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Assigning…' : 'Assign Prayer'}
        </button>
      </div>
    </form>
  );
}
