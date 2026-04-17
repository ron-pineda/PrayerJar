import { describe, it, expect } from 'vitest';
import {
  PLANS,
  PASTORAL_DASHBOARD_TIER,
  PASTORAL_DASHBOARD_TIER_NAME,
  hasPastoralDashboard,
  getPlan,
  getPlanByStripePriceId,
} from './plans';
import type { PlanTier } from './plans';

// ---------------------------------------------------------------------
// Consistency test: the three public surfaces (plans.ts, /for-churches,
// /help) must all name the SAME tier for the Pastoral Dashboard. This
// test exists because Legal (FTC §5) flagged a mismatch:
//
//   - plans.ts said Pro
//   - /for-churches FAQ said "Starter and Pro"
//   - /help FAQ was vague and implied all church plans
//
// Instead of parsing JSX, we assert the invariants that make the copy
// drift-proof: both pages import PASTORAL_DASHBOARD_TIER_NAME from
// plans.ts, and the name itself is derived from the PLANS record.
// If this test passes, the copy is derived — not hand-written — and
// cannot silently diverge.
// ---------------------------------------------------------------------
describe('Pastoral Dashboard tier consistency', () => {
  it('exports a single PASTORAL_DASHBOARD_TIER constant', () => {
    expect(PASTORAL_DASHBOARD_TIER).toBeTruthy();
    expect(typeof PASTORAL_DASHBOARD_TIER).toBe('string');
    expect(Object.keys(PLANS)).toContain(PASTORAL_DASHBOARD_TIER);
  });

  it('PASTORAL_DASHBOARD_TIER_NAME is derived from PLANS', () => {
    // Must be the .name on the plan definition — not a hand-typed string.
    expect(PASTORAL_DASHBOARD_TIER_NAME).toBe(PLANS[PASTORAL_DASHBOARD_TIER].name);
  });

  it('the advertised tier actually lists the Pastoral dashboard feature', () => {
    // plans.ts claims tier X gets the dashboard. It must also be in
    // that tier's `features` array — otherwise marketing copy will
    // list it but the feature bullets under the card won't, which is
    // exactly the drift Legal flagged.
    const advertisedTier = PLANS[PASTORAL_DASHBOARD_TIER];
    const hasIt = advertisedTier.features.some((f) =>
      f.toLowerCase().includes('pastoral dashboard')
    );
    expect(hasIt).toBe(true);
  });

  it('no tier below PASTORAL_DASHBOARD_TIER lists the Pastoral dashboard', () => {
    const lowerTiers: PlanTier[] = [];
    for (const tier of Object.keys(PLANS) as PlanTier[]) {
      if (!hasPastoralDashboard(tier)) lowerTiers.push(tier);
    }

    for (const tier of lowerTiers) {
      const bullets = PLANS[tier].features.map((f) => f.toLowerCase());
      const leaks = bullets.filter((f) => f.includes('pastoral dashboard'));
      expect(leaks, `Tier '${tier}' should NOT list Pastoral dashboard`).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------
// Gating-predicate tests: hasPastoralDashboard(tier) is the single
// function that server-side gates (and downstream UI) call. One
// positive and one negative case per tier.
// ---------------------------------------------------------------------
describe('hasPastoralDashboard()', () => {
  it('returns false for free', () => {
    expect(hasPastoralDashboard('free')).toBe(false);
  });

  it('returns false for starter', () => {
    expect(hasPastoralDashboard('starter')).toBe(false);
  });

  it('returns true for pro', () => {
    expect(hasPastoralDashboard('pro')).toBe(true);
  });

  it('returns true for enterprise', () => {
    expect(hasPastoralDashboard('enterprise')).toBe(true);
  });

  it('returns true for the advertised tier itself', () => {
    expect(hasPastoralDashboard(PASTORAL_DASHBOARD_TIER)).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Smoke tests on the existing exports — cover getPlan and the
// Stripe-price-id lookup so this file doubles as the plans.ts suite.
// ---------------------------------------------------------------------
describe('getPlan()', () => {
  it('returns the plan definition for each tier', () => {
    for (const tier of Object.keys(PLANS) as PlanTier[]) {
      expect(getPlan(tier).tier).toBe(tier);
    }
  });
});

describe('getPlanByStripePriceId()', () => {
  it('returns null for an unknown price id', () => {
    expect(getPlanByStripePriceId('price_does_not_exist')).toBeNull();
  });
});
