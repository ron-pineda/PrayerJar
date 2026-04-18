'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trackSignupStart } from '@/lib/analytics';

export default function CreateChurchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fire signup_start once per session on first field interaction.
  const signupStartFiredRef = useRef(false);
  function handleSignupStart() {
    if (signupStartFiredRef.current) return;
    signupStartFiredRef.current = true;
    trackSignupStart({
      signup_method: 'email',
      plan_intent: new URLSearchParams(window.location.search).get('plan'),
      source_page: document.referrer
        ? (() => {
            try {
              return new URL(document.referrer).pathname;
            } catch {
              return '/';
            }
          })()
        : '/',
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value || undefined,
      welcomeMessage: (form.elements.namedItem('welcomeMessage') as HTMLTextAreaElement).value || undefined,
    };

    try {
      const res = await fetch('/api/v1/church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Something went wrong. Please try again.');
        return;
      }

      const { slug } = await res.json();
      router.push(`/church/${slug}/setup`);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Create your church</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Set up your church&apos;s prayer community on PrayerJar.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Church name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Church name <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            placeholder="First Baptist Church"
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
            onFocus={handleSignupStart}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            placeholder="A brief description of your church community…"
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Max 500 characters</p>
        </div>

        {/* Welcome message */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="welcomeMessage" className="text-sm font-medium">
            Welcome message <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="welcomeMessage"
            name="welcomeMessage"
            rows={4}
            maxLength={1000}
            placeholder="Welcome to our church prayer wall! We invite you to share your prayer requests and pray for one another…"
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Max 1000 characters</p>
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="self-start bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-5 py-2 text-sm font-medium transition-colors"
        >
          {loading ? 'Creating…' : 'Create church'}
        </button>
      </form>
    </div>
  );
}
