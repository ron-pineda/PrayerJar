'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100] as const;
type PresetAmount = (typeof PRESET_AMOUNTS)[number];

const stripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function GivePage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === '1';
  const initialAmount = Number(searchParams.get('amount'));

  const [selected, setSelected] = useState<PresetAmount>(
    PRESET_AMOUNTS.includes(initialAmount as PresetAmount)
      ? (initialAmount as PresetAmount)
      : 10,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when amount changes
  useEffect(() => {
    setError(null);
  }, [selected]);

  async function handleGive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: selected * 100 }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else if (res.status === 503) {
        setError('Donations are not available yet. Check back soon!');
      } else {
        const { error: msg } = await res.json().catch(() => ({}));
        setError(msg ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-4 text-center max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Support the mission
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Support The Prayer Jar
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-12 max-w-sm mx-auto">
          PrayerJar is free for everyone — no ads, no paywalls, no data brokers.
          Your gift keeps it that way for every person who arrives carrying something heavy.
        </p>

        {/* Success banner */}
        {success && (
          <div className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-amber-700 dark:text-amber-300">
            <p className="text-lg font-medium">Thank you for your gift! 🙏</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Your generosity helps keep PrayerJar free and running for everyone.
            </p>
          </div>
        )}

        {!stripeConfigured ? (
          /* Stripe not configured */
          <div className="rounded-xl border border-border bg-muted/30 px-8 py-10 text-center">
            <p className="text-2xl mb-3">🙏</p>
            <p className="font-medium text-foreground mb-2">Donations coming soon</p>
            <p className="text-sm text-muted-foreground">
              We&apos;re setting up secure giving. Check back shortly — every gift will go
              directly toward keeping this platform free for all.
            </p>
          </div>
        ) : (
          /* Donation form */
          <div className="flex flex-col items-center gap-8">
            {/* Preset amounts */}
            <fieldset className="w-full">
              <legend className="sr-only">Select a donation amount</legend>
              <div className="flex flex-wrap justify-center gap-3">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelected(amount)}
                    aria-pressed={selected === amount}
                    className={[
                      'min-w-[64px] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selected === amount
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/50',
                    ].join(' ')}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Error */}
            {error && (
              <p role="alert" className="text-sm text-destructive text-center">
                {error}
              </p>
            )}

            {/* CTA */}
            <Button
              size="lg"
              onClick={handleGive}
              disabled={loading}
              className="min-w-[180px]"
            >
              {loading ? 'Redirecting…' : `Give $${selected}`}
            </Button>

            <p className="text-xs text-muted-foreground">
              Secure payment via Stripe. No account required.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
