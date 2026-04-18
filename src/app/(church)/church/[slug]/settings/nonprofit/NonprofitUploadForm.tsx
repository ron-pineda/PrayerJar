'use client';

import { useState } from 'react';
import { submitNonprofitVerification } from './actions';

interface Props {
  churchId: string;
  churchName: string;
}

export function NonprofitUploadForm({ churchId, churchName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    const formData = new FormData(e.currentTarget);
    const result = await submitNonprofitVerification(churchId, formData);
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
        <strong>Submitted.</strong> Your 501(c)(3) determination letter for {churchName} has been
        received. An administrator will review it shortly. You can check the status on this page.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state === 'error' && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="legal_name" className="block text-sm font-medium">
          Legal name of organization (as shown on IRS letter)
        </label>
        <input
          type="text"
          id="legal_name"
          name="legal_name"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={churchName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ein" className="block text-sm font-medium">
          Employer Identification Number (EIN)
        </label>
        <input
          type="text"
          id="ein"
          name="ein"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="12-3456789"
          pattern="\d{2}-\d{7}"
        />
        <p className="text-xs text-muted-foreground">Format: XX-XXXXXXX</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="determination_letter" className="block text-sm font-medium">
          IRS determination letter <span className="text-destructive">*</span>
        </label>
        <input
          type="file"
          id="determination_letter"
          name="determination_letter"
          accept="application/pdf"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm file:mr-3 file:border-0 file:bg-primary/10 file:text-primary file:rounded file:px-2 file:py-1 file:text-xs file:font-medium"
        />
        <p className="text-xs text-muted-foreground">PDF only, max 10 MB.</p>
      </div>

      <button
        type="submit"
        disabled={state === 'loading'}
        className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {state === 'loading' ? 'Uploading…' : 'Submit for verification'}
      </button>
    </form>
  );
}
