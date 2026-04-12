'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateNoteFormProps {
  churchSlug: string;
}

export function CreateNoteForm({ churchSlug }: CreateNoteFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [prayerId, setPrayerId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;

    setPending(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { content: content.trim() };
      if (prayerId.trim()) body.prayerId = prayerId.trim();

      const res = await fetch(`/api/v1/church/${churchSlug}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Request failed');
      }

      setContent('');
      setPrayerId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Add a Care Note</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        maxLength={2000}
        rows={4}
        placeholder="Write a pastoral care note…"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="prayer-id" className="text-xs text-muted-foreground">
          Related Prayer ID (optional)
        </label>
        <input
          id="prayer-id"
          type="text"
          value={prayerId}
          onChange={(e) => setPrayerId(e.target.value)}
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </form>
  );
}
