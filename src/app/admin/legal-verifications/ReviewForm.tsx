'use client';

import { useState } from 'react';
import { reviewNonprofitVerification } from './actions';

interface Props {
  verificationId: string;
  churchName: string;
}

export function ReviewForm({ verificationId, churchName }: Props) {
  const [notes, setNotes] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleDecision(decision: 'verified' | 'rejected') {
    setState('loading');
    const result = await reviewNonprofitVerification(verificationId, decision, notes || undefined);
    if ('error' in result) {
      setErrorMsg(result.error);
      setState('error');
    } else {
      setState('done');
    }
  }

  if (state === 'done') {
    return (
      <p className="text-sm text-green-700 dark:text-green-400 font-medium">Decision recorded.</p>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      {state === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Review notes (optional)"
        rows={2}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleDecision('verified')}
          disabled={state === 'loading'}
          className="rounded-md bg-green-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => handleDecision('rejected')}
          disabled={state === 'loading'}
          className="rounded-md bg-destructive text-destructive-foreground px-4 py-1.5 text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
