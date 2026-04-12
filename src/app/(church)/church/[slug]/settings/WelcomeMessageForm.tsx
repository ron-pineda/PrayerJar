'use client';

import { useState } from 'react';

interface Props {
  churchId: string;
  slug: string;
  initialMessage: string;
}

export function WelcomeMessageForm({ churchId, slug, initialMessage }: Props) {
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const MAX_LENGTH = 1000;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('saving');
    setErrorText('');

    try {
      const res = await fetch(`/api/v1/church/${slug}/welcome`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorText(body.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('saved');
      // Reset "Saved!" after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setErrorText('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <textarea
          name="welcomeMessage"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === 'saved' || status === 'error') setStatus('idle');
          }}
          rows={6}
          maxLength={MAX_LENGTH}
          placeholder="Welcome to our church prayer wall! We invite you to share your prayer requests and pray for one another…"
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          disabled={status === 'saving'}
        />
        <p className="text-xs text-muted-foreground text-right">
          {message.length} / {MAX_LENGTH}
        </p>
      </div>

      {status === 'error' && errorText && (
        <p role="alert" className="text-sm text-destructive">
          {errorText}
        </p>
      )}

      {status === 'saved' && (
        <p role="status" className="text-sm text-green-600 font-medium">
          Saved!
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-5 py-2 text-sm font-medium transition-colors"
        >
          {status === 'saving' ? 'Saving…' : 'Save message'}
        </button>
      </div>
    </form>
  );
}
