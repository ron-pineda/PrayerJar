'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS, ANNUAL_DISCOUNT_PERCENT, type PlanTier } from '@/lib/plans';
import { trackPricingView } from '@/lib/analytics';

const TIERS: PlanTier[] = ['free', 'starter', 'pro', 'enterprise'];

const FIT_STATEMENTS: Partial<Record<PlanTier, string>> = {
  starter: 'Best for churches under 150 members.',
  pro: 'Best for churches 150–500 members.',
  enterprise: 'Best for multi-site churches and denominations.',
};

const FOOTER_NOTES: Record<PlanTier, string> = {
  free: 'No credit card required.',
  starter: 'Cancel anytime.',
  pro: 'Cancel anytime.',
  enterprise: 'No self-serve checkout. We set this up with you.',
};

const CTA_LABELS: Record<PlanTier, string> = {
  free: 'Start free',
  starter: 'Start Small Church',
  pro: 'Start Growing Church',
  enterprise: 'Contact for pricing',
};

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

function TierCard({
  tier,
  billing,
}: {
  tier: PlanTier;
  billing: 'monthly' | 'yearly';
}) {
  const plan = PLANS[tier];
  const isFree = tier === 'free';
  const isEnterprise = tier === 'enterprise';
  const fitStatement = FIT_STATEMENTS[tier];

  const monthlyPrice = plan.monthlyPriceCents;
  const yearlyMonthlyEquiv = plan.yearlyMonthlyEquivalentCents;
  const yearlyTotal = plan.yearlyPriceCents;

  const priceDisplay = isEnterprise
    ? plan.displayPrice ?? 'Starting at $199/mo'
    : isFree
    ? '$0'
    : billing === 'yearly' && yearlyMonthlyEquiv
    ? formatDollars(yearlyMonthlyEquiv)
    : formatDollars(monthlyPrice);

  const ctaHref =
    tier === 'enterprise'
      ? '/for-churches/demo'
      : '/church/create';

  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold">{plan.name}</h3>
        {fitStatement && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {fitStatement}
          </p>
        )}
        <div className="mt-2">
          {isEnterprise ? (
            <p className="text-xl font-bold">{plan.displayPrice ?? 'Starting at $199/mo'}</p>
          ) : isFree ? (
            <p className="text-2xl font-bold">
              $0{' '}
              <span className="text-sm font-normal text-muted-foreground">/ mo</span>
            </p>
          ) : (
            <div>
              <p className="text-2xl font-bold">
                {priceDisplay}
                <span className="text-sm font-normal text-muted-foreground"> / mo</span>
              </p>
              {billing === 'yearly' && yearlyTotal > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Billed as {formatDollars(yearlyTotal)}/yr &mdash; Save{' '}
                  {ANNUAL_DISCOUNT_PERCENT}% with annual billing.
                </p>
              )}
              {billing === 'monthly' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Or {formatDollars(yearlyMonthlyEquiv ?? 0)}/mo billed annually.
                </p>
              )}
            </div>
          )}
        </div>
        {isEnterprise && (
          <p className="text-xs text-muted-foreground mt-1">
            Bespoke agreement, contact for pricing.
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1.5 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="text-sm text-muted-foreground flex gap-2 items-start">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="space-y-2">
        {isEnterprise ? (
          <Button
            variant="outline"
            className="w-full"
            render={<a href={ctaHref} />}
          >
            {CTA_LABELS[tier]}
          </Button>
        ) : isFree ? (
          <Button
            variant="outline"
            className="w-full"
            render={<Link href={ctaHref} />}
          >
            {CTA_LABELS[tier]}
          </Button>
        ) : (
          <Button
            className="w-full"
            render={<Link href={ctaHref} />}
          >
            {CTA_LABELS[tier]}
          </Button>
        )}
        <p className="text-xs text-center text-muted-foreground">
          {FOOTER_NOTES[tier]}
        </p>
      </div>
    </div>
  );
}

export function TierCardsSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const sectionRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Fire pricing_view once per session when the tier card section scrolls
    // into view. Uses sessionStorage to prevent re-fires on scroll-back-up.
    const SESSION_KEY = 'pj_pricing_view_fired';
    if (sessionStorage.getItem(SESSION_KEY)) {
      firedRef.current = true;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return;
        const entry = entries[0];
        if (entry?.isIntersecting) {
          firedRef.current = true;
          sessionStorage.setItem(SESSION_KEY, '1');
          trackPricingView({
            page_path: window.location.pathname,
            tier_count: TIERS.length,
            referrer_event: null, // enriched by analytics wrapper in a future sprint
          });
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      {/* Billing toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-lg border p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billing === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly &mdash; Save {ANNUAL_DISCOUNT_PERCENT}%
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => (
          <TierCard key={tier} tier={tier} billing={billing} />
        ))}
      </div>
    </div>
  );
}
