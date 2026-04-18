'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PLANS, ANNUAL_DISCOUNT_PERCENT, type PlanTier } from '@/lib/plans';

// Thresholds read from plans.ts where available; pro.limits.members is null
// (no hard cap), so the enterprise boundary is a local business-rule constant.
const FREE_CAP = PLANS.free.limits.members!;         // 50
const STARTER_CAP = PLANS.starter.limits.members!;   // 150
// pro.limits.members === null (Growing Church has no hard cap).
// >500 members signals enterprise (Network) territory.
const ENTERPRISE_THRESHOLD = 500;

/**
 * Determines the recommended plan tier for a given member count.
 * Walks downward from the most-expensive tier so that null caps on pro/enterprise
 * never cause a short-circuit before the enterprise branch is evaluated.
 */
export function recommendTier(memberCount: number): PlanTier {
  if (memberCount > ENTERPRISE_THRESHOLD) return 'enterprise';
  if (memberCount > STARTER_CAP) return 'pro';
  if (memberCount > FREE_CAP) return 'starter';
  return 'free';
}

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

export function PricingCalculator() {
  const [memberCount, setMemberCount] = useState(75);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const tier = recommendTier(memberCount);
  const plan = PLANS[tier];
  const isEnterprise = tier === 'enterprise';
  const isFree = tier === 'free';

  const displayPrice = isEnterprise
    ? plan.displayPrice ?? 'Starting at $199/mo'
    : isFree
    ? 'Free'
    : billing === 'yearly' && plan.yearlyMonthlyEquivalentCents
    ? `${formatDollars(plan.yearlyMonthlyEquivalentCents)}/mo`
    : `${formatDollars(plan.monthlyPriceCents)}/mo`;

  const ctaHref = isEnterprise ? '/for-churches/demo' : '/church/create';
  const ctaLabel = isEnterprise
    ? 'Contact for pricing'
    : isFree
    ? 'Start free'
    : `Start ${plan.name}`;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6 max-w-lg mx-auto">
      <div className="space-y-2">
        <label
          htmlFor="member-count"
          className="text-sm font-medium"
        >
          How many members does your church have?
        </label>
        <div className="flex items-center gap-4">
          <input
            id="member-count"
            type="range"
            min={10}
            max={600}
            step={10}
            value={memberCount}
            onChange={(e) => setMemberCount(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-semibold w-16 text-right">
            {memberCount === 600 ? '500+' : memberCount}
          </span>
        </div>
      </div>

      {!isFree && !isEnterprise && (
        <div className="flex gap-2">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              billing === 'monthly'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              billing === 'yearly'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly — Save {ANNUAL_DISCOUNT_PERCENT}%
          </button>
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Recommended plan
        </p>
        <p className="text-xl font-bold">{plan.name}</p>
        <p className="text-2xl font-bold text-primary">{displayPrice}</p>
        {billing === 'yearly' && !isFree && !isEnterprise && plan.yearlyPriceCents > 0 && (
          <p className="text-xs text-muted-foreground">
            Billed as {formatDollars(plan.yearlyPriceCents)}/yr
          </p>
        )}
        {isEnterprise && (
          <p className="text-xs text-muted-foreground">
            Bespoke agreement — contact us for pricing.
          </p>
        )}
      </div>

      <Button
        className="w-full"
        render={
          isEnterprise ? (
            <a href={ctaHref} />
          ) : (
            <Link href={ctaHref} />
          )
        }
      >
        {ctaLabel}
      </Button>

      {isFree && (
        <p className="text-xs text-center text-muted-foreground">
          No credit card required.
        </p>
      )}
    </div>
  );
}
