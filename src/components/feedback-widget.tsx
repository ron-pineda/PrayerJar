'use client';

import { useState } from 'react';

type FeedbackType = 'bug' | 'feature' | 'general' | 'praise';
type UIState = 'idle' | 'loading' | 'success' | 'error';

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'general',  label: 'General' },
  { value: 'bug',      label: 'Bug' },
  { value: 'feature',  label: 'Feature Request' },
  { value: 'praise',   label: 'Praise' },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [uiState, setUiState] = useState<UIState>('idle');

  function handleOpen() {
    setOpen(true);
    setUiState('idle');
    setMessage('');
    setType('general');
  }

  function handleClose() {
    setOpen(false);
    setUiState('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setUiState('loading');

    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          page: window.location.pathname,
        }),
      });

      if (res.ok) {
        setUiState('success');
        setTimeout(() => setOpen(false), 1800);
      } else {
        setUiState('error');
      }
    } catch {
      setUiState('error');
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium shadow-md hover:bg-muted transition-colors"
        aria-label="Open feedback form"
      >
        💬 Feedback
      </button>

      {/* Overlay + dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Send Feedback</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {uiState === 'success' ? (
              <p className="py-4 text-center text-sm font-medium text-green-700 dark:text-green-400">
                Thanks for your feedback!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type select */}
                <div className="space-y-1.5">
                  <label htmlFor="feedback-type" className="text-sm font-medium">
                    Type
                  </label>
                  <select
                    id="feedback-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={uiState === 'loading'}
                  >
                    {TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Message textarea */}
                <div className="space-y-1.5">
                  <label htmlFor="feedback-message" className="text-sm font-medium">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={1000}
                    required
                    rows={4}
                    placeholder="Tell us what you think..."
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={uiState === 'loading'}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {message.length}/1000
                  </p>
                </div>

                {uiState === 'error' && (
                  <p className="text-xs text-destructive">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={uiState === 'loading' || !message.trim()}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {uiState === 'loading' ? 'Sending…' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
