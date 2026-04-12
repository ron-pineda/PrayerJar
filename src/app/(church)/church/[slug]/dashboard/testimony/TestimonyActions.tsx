'use client';

import { useState } from 'react';

interface Props {
  testimonyId: string;
  churchSlug: string;
}

export function TestimonyActions({ testimonyId, churchSlug }: Props) {
  const [state, setState] = useState<'idle' | 'rejecting' | 'loading' | 'done' | 'error'>('idle');
  const [rejectNotes, setRejectNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleApprove() {
    setState('loading');
    try {
      const res = await fetch(`/api/v1/church/${churchSlug}/testimony/${testimonyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setState('done');
    } catch {
      setErrorMsg('Failed to approve. Please try again.');
      setState('error');
    }
  }

  async function handleReject() {
    if (!rejectNotes.trim()) {
      setErrorMsg('A rejection reason is required.');
      return;
    }
    setState('loading');
    try {
      const res = await fetch(`/api/v1/church/${churchSlug}/testimony/${testimonyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reviewNotes: rejectNotes.trim() }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setState('done');
    } catch {
      setErrorMsg('Failed to reject. Please try again.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <p className="text-sm text-muted-foreground italic">Review submitted.</p>
    );
  }

  if (state === 'rejecting') {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
          placeholder="Reason for rejection (required)"
          value={rejectNotes}
          onChange={(e) => { setRejectNotes(e.target.value); setErrorMsg(''); }}
        />
        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={state === 'loading'}
            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            Confirm Reject
          </button>
          <button
            onClick={() => { setState('idle'); setErrorMsg(''); setRejectNotes(''); }}
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {errorMsg && <p className="w-full text-xs text-destructive">{errorMsg}</p>}
      <button
        onClick={handleApprove}
        disabled={state === 'loading'}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {state === 'loading' ? 'Saving…' : 'Approve'}
      </button>
      <button
        onClick={() => { setState('rejecting'); setErrorMsg(''); }}
        disabled={state === 'loading'}
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
