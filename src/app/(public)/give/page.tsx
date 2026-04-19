'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HandHelping, Lock, Check, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/scroll-reveal';

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
      {/* Hero — render immediately, never ScrollReveal */}
      <section className="pt-20 pb-10 px-4 text-center max-w-xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Keep the jar on the counter.
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
          PrayerJar is free for everyone — no ads, no paywalls, no data brokers.
          Your gift keeps it that way.
        </p>
      </section>

      <section className="pb-20 px-4 text-center max-w-xl mx-auto">
        {/* Success banner */}
        {success && (
          <ScrollReveal delay={0}>
            <div className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-5 text-left">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-lg font-medium text-amber-700 dark:text-amber-300">
                    Thank you.
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Your gift is received. PrayerJar stays free for the next
                    person who needs it tonight. We&apos;re grateful.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* What your gift does */}
        <ScrollReveal delay={0}>
          <div className="mb-8 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <HandHelping className="h-6 w-6 text-amber-600" />
              <h2 className="text-xl font-semibold tracking-tight">
                What your gift does
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Someone opens PrayerJar at 2am carrying something they can&apos;t
              say out loud. Within minutes, real people are praying for them by
              name. Your gift keeps that surface free — for them, and for the
              next person who arrives carrying something heavy. There are no
              ads here because of gifts like yours. There never will be.
            </p>
          </div>
        </ScrollReveal>

        {/* Verse strip — Ps 24:1 */}
        <ScrollReveal delay={80}>
          <div className="border-t border-b py-4 mb-8 max-w-md mx-auto px-4">
            <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
              &ldquo;The earth is the Lord&apos;s, and everything in it, the
              world, and all who live in it.&rdquo;
            </p>
            <p className="text-xs text-primary mt-2 text-center">Psalm 24:1</p>
          </div>
        </ScrollReveal>

        {!stripeConfigured ? (
          /* Coming-soon state */
          <ScrollReveal delay={160}>
            <div className="rounded-xl border border-border bg-muted/30 px-8 py-10 text-center">
              <div className="flex justify-center mb-3">
                <HeartHandshake className="h-6 w-6 text-amber-600" />
              </div>
              <p className="font-medium text-foreground mb-2">
                Giving opens soon
              </p>
              <p className="text-sm text-muted-foreground">
                We&apos;re setting up secure giving through Stripe. Check back
                shortly — every gift will go directly toward keeping PrayerJar
                free for everyone who uses it.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          /* Donation form */
          <>
            <ScrollReveal delay={160}>
              <div className="flex flex-col items-center gap-6">
                {/* Preset amounts */}
                <fieldset className="w-full">
                  <legend className="sr-only">Choose a gift amount</legend>
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
                  {loading ? 'Redirecting to Stripe…' : `Give $${selected}`}
                </Button>
              </div>
            </ScrollReveal>

            {/* Reassurance line */}
            <ScrollReveal delay={240}>
              <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Secure payment through Stripe. No account required. One-time
                gift.
              </p>
            </ScrollReveal>
          </>
        )}

        {/* Footer note */}
        <ScrollReveal delay={stripeConfigured ? 320 : 240}>
          <p className="mt-10 text-xs text-muted-foreground">
            Questions?{' '}
            <Link
              href="/contact"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Contact us
            </Link>
            .
          </p>
        </ScrollReveal>
      </section>
    </main>
  );
}
