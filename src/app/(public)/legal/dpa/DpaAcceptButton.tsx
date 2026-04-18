'use client';

import { useState } from 'react';
import { acceptDpa } from './actions';
import { DPA_VERSION } from './actions';

interface Props {
  churchId: string;
  churchName: string;
}

export function DpaAcceptButton({ churchId, churchName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleAccept() {
    setState('loading');
    const result = await acceptDpa(churchId, DPA_VERSION);
    if ('error' in result) {
      setErrorMsg(result.error);
      setState('error');
    } else {
      setState('done');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 px-4 py-3 text-sm text-green-900 dark:text-green-200">
        <strong>Accepted.</strong> Your acceptance of the Data Processing Addendum
        (version {DPA_VERSION}) on behalf of {churchName} has been recorded.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state === 'error' && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={state === 'loading'}
        className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {state === 'loading'
          ? 'Recording acceptance…'
          : `I accept on behalf of ${churchName}`}
      </button>
      <p className="text-xs text-muted-foreground">
        By clicking above you confirm you have authority to bind {churchName} to
        this Data Processing Addendum (version {DPA_VERSION}).
      </p>
    </div>
  );
}
