'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { completeOnboardingAction } from '@/app/actions/onboarding.actions';
import { cn } from '@/lib/utils';

interface OnboardingOverlayProps {
  showOnboarding: boolean;
}

interface FeaturedPrayer {
  id: string;
  content: string;
  category: string;
  isUrgent: boolean;
}

export function OnboardingOverlay({ showOnboarding }: OnboardingOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);
  const [featured, setFeatured] = useState<FeaturedPrayer | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [prayed, setPrayed] = useState(false);
  const [praying, setPraying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (showOnboarding) setVisible(true);
  }, [showOnboarding]);

  const complete = useCallback(
    async (categories: string[]) => {
      if (completing) return;
      setCompleting(true);
      await completeOnboardingAction(categories);
      setVisible(false);
      router.refresh();
    },
    [completing, router]
  );

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') complete(selected);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, complete, selected]);

  // Fetch a featured prayer when entering step 2 (pray-for-someone)
  useEffect(() => {
    if (step !== 2 || featured || featuredLoading) return;
    setFeaturedLoading(true);
    const category = selected[0] ?? 'any';
    fetch(`/api/v1/prayers/random?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.prayer) {
          setFeatured({
            id: data.prayer.id,
            content: data.prayer.content,
            category: data.prayer.category,
            isUrgent: data.prayer.isUrgent,
          });
        }
      })
      .catch(() => {
        // Non-fatal — user can just skip
      })
      .finally(() => setFeaturedLoading(false));
  }, [step, selected, featured, featuredLoading]);

  function toggleCategory(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handlePrayedClick() {
    if (!featured || praying || prayed) return;
    setPraying(true);
    try {
      const res = await fetch(`/api/v1/prayers/${featured.id}/pray`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAnonymous: true }),
      });
      if (res.ok) setPrayed(true);
    } catch {
      // Swallow — not worth blocking onboarding for
    } finally {
      setPraying(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => complete(selected)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-card border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step
                  ? 'w-6 bg-amber-500'
                  : i < step
                  ? 'w-2 bg-amber-300'
                  : 'w-2 bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-slide-up" key="step-0">
            <div>
              <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight mb-3">
                You&apos;re not alone.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PrayerJar is a place where anyone can ask for prayer — and where ordinary people
                show up to pray for each other. No accounts required to start.
              </p>
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setStep(1)}
            >
              Get Started
            </Button>
          </div>
        )}

        {/* Step 1 — Pick categories */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-slide-up" key="step-1">
            <div>
              <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight mb-3">
                What would you like to pray about?
              </h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll show you prayers in these areas first.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              {PRAYER_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150',
                    selected.includes(cat.value)
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-border bg-background hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={() => setStep(2)}
              >
                Skip
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Pray for someone */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-slide-up" key="step-2">
            <div>
              <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight mb-3">
                Start by praying for someone.
              </h2>
              <p className="text-sm text-muted-foreground">
                A real request from the community. This starts your prayer streak.
              </p>
            </div>

            {featuredLoading && (
              <div className="rounded-xl border bg-muted/30 p-5 animate-pulse text-left">
                <div className="h-3 w-16 bg-muted rounded mb-3" />
                <div className="h-3 w-full bg-muted rounded mb-2" />
                <div className="h-3 w-5/6 bg-muted rounded mb-2" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            )}

            {!featuredLoading && featured && (
              <div className="rounded-xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40 p-5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
                    Anonymous
                  </span>
                  {featured.isUrgent && (
                    <span className="text-[10px] uppercase tracking-widest text-red-600 dark:text-red-400 font-semibold">
                      · Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 line-clamp-6">
                  {featured.content}
                </p>
              </div>
            )}

            {!featuredLoading && !featured && (
              <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                No prayers available right now. You can still continue.
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                className={cn(
                  'w-full text-white',
                  prayed
                    ? 'bg-emerald-600 hover:bg-emerald-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                )}
                onClick={prayed ? () => setStep(3) : handlePrayedClick}
                disabled={!featured || praying}
              >
                {prayed ? '✓ Prayed — Continue' : praying ? 'Praying…' : '🙏 I prayed for this'}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep(3)}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Submit a prayer */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-slide-up" key="step-3">
            <div>
              <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight mb-3">
                Would you like to submit a prayer?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can always do this later. It&apos;s anonymous by default.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={async () => {
                  await complete(selected);
                  router.push('/?open=true');
                }}
                disabled={completing}
              >
                Submit a Prayer
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => complete(selected)}
                disabled={completing}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
