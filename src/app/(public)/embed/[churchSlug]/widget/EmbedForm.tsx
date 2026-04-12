'use client';

import { useState } from 'react';

const CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'financial', label: 'Financial' },
  { value: 'grief', label: 'Grief' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'guidance', label: 'Guidance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'work_career', label: 'Work / Career' },
  { value: 'spiritual_growth', label: 'Spiritual Growth' },
  { value: 'other', label: 'Other' },
] as const;

export function EmbedForm() {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch('/api/v1/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), category, isAnonymous, isUrgent: false, expiresAt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Submission failed');
      }
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-center text-sm text-green-700 font-medium py-4">
        Your prayer has been submitted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        className="w-full rounded-md border bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
        rows={4}
        placeholder="Share your prayer request…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        maxLength={2000}
      />

      <select
        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="rounded"
        />
        Submit anonymously
      </label>

      {status === 'error' && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Prayer'}
      </button>
    </form>
  );
}
