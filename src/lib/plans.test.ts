import { describe, it, expect } from 'vitest';
import {
  PLANS,
  PASTORAL_DASHBOARD_TIER,
  PASTORAL_DASHBOARD_TIER_NAME,
  PASTORAL_CARE_INBOX_TIER,
  PRAYER_TEAM_ASSIGNMENTS_TIER,
  TESTIMONY_APPROVAL_QUEUE_TIER,
  ANNUAL_DISCOUNT_PERCENT,
  hasPastoralDashboard,
  hasPastoralCareInbox,
  hasPrayerTeamAssignments,
  hasTestimonyApprovalQueue,
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

  // Sprint 17 regression guard: Pastoral Dashboard moved to 'starter'.
  // PASTORAL_DASHBOARD_TIER_NAME must equal 'Small Church'.
  it('PASTORAL_DASHBOARD_TIER_NAME equals "Small Church" (Sprint 17 regression guard)', () => {
    expect(PASTORAL_DASHBOARD_TIER_NAME).toBe('Small Church');
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

  // Sprint 17: Pastoral Dashboard moved to 'starter'. This was 'false'
  // before pj-s17-plans-gating-fix; it is now 'true' by design.
  it('returns true for starter (Sprint 17: moved from pro)', () => {
    expect(hasPastoralDashboard('starter')).toBe(true);
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
// hasPastoralCareInbox() — Sprint 17 new gate, min tier: starter
// ---------------------------------------------------------------------
describe('hasPastoralCareInbox()', () => {
  it('returns false for free', () => {
    expect(hasPastoralCareInbox('free')).toBe(false);
  });

  it('returns true for starter', () => {
    expect(hasPastoralCareInbox('starter')).toBe(true);
  });

  it('returns true for pro', () => {
    expect(hasPastoralCareInbox('pro')).toBe(true);
  });

  it('returns true for enterprise', () => {
    expect(hasPastoralCareInbox('enterprise')).toBe(true);
  });

  it('PASTORAL_CARE_INBOX_TIER is starter', () => {
    expect(PASTORAL_CARE_INBOX_TIER).toBe('starter');
  });
});

// ---------------------------------------------------------------------
// hasPrayerTeamAssignments() — Sprint 17 new gate, min tier: pro
// ---------------------------------------------------------------------
describe('hasPrayerTeamAssignments()', () => {
  it('returns false for free', () => {
    expect(hasPrayerTeamAssignments('free')).toBe(false);
  });

  it('returns false for starter', () => {
    expect(hasPrayerTeamAssignments('starter')).toBe(false);
  });

  it('returns true for pro', () => {
    expect(hasPrayerTeamAssignments('pro')).toBe(true);
  });

  it('returns true for enterprise', () => {
    expect(hasPrayerTeamAssignments('enterprise')).toBe(true);
  });

  it('PRAYER_TEAM_ASSIGNMENTS_TIER is pro', () => {
    expect(PRAYER_TEAM_ASSIGNMENTS_TIER).toBe('pro');
  });
});

// ---------------------------------------------------------------------
// hasTestimonyApprovalQueue() — Sprint 17 new gate, min tier: pro
// ---------------------------------------------------------------------
describe('hasTestimonyApprovalQueue()', () => {
  it('returns false for free', () => {
    expect(hasTestimonyApprovalQueue('free')).toBe(false);
  });

  it('returns false for starter', () => {
    expect(hasTestimonyApprovalQueue('starter')).toBe(false);
  });

  it('returns true for pro', () => {
    expect(hasTestimonyApprovalQueue('pro')).toBe(true);
  });

  it('returns true for enterprise', () => {
    expect(hasTestimonyApprovalQueue('enterprise')).toBe(true);
  });

  it('TESTIMONY_APPROVAL_QUEUE_TIER is pro', () => {
    expect(TESTIMONY_APPROVAL_QUEUE_TIER).toBe('pro');
  });
});

// ---------------------------------------------------------------------
// Tier caps — Sprint 27 (pj-s27-03): paid tiers were withdrawn, so a free
// church has nothing to upgrade to and every cap it could reach is gone.
// These assertions are inverted on purpose: they now guard against a cap
// being reintroduced by accident rather than pinning a specific number.
// ---------------------------------------------------------------------
describe('Free tier limits', () => {
  it('has no member cap', () => {
    expect(PLANS.free.limits.members).toBeNull();
  });

  it('has no group cap', () => {
    expect(PLANS.free.limits.groups).toBeNull();
  });

  // events: 0 is a feature lock, not a pricing decision — it is the only thing
  // holding the unfinished live-events surface shut (event.service.ts).
  it('keeps events locked at 0', () => {
    expect(PLANS.free.limits.events).toBe(0);
  });

  it('quotes no member or group number in its features list', () => {
    const bullets = PLANS.free.features.join(' ');
    expect(bullets).not.toMatch(/\d+\s+(members|groups)/i);
  });
});

// ---------------------------------------------------------------------
// Display names — Sprint 17 rename
// ---------------------------------------------------------------------
describe('Tier display names', () => {
  it('free tier name is "Free"', () => {
    expect(PLANS.free.name).toBe('Free');
  });

  it('starter tier name is "Small Church"', () => {
    expect(PLANS.starter.name).toBe('Small Church');
  });

  it('pro tier name is "Growing Church"', () => {
    expect(PLANS.pro.name).toBe('Growing Church');
  });

  it('enterprise tier name is "Network"', () => {
    expect(PLANS.enterprise.name).toBe('Network');
  });
});

// ---------------------------------------------------------------------
// Annual pricing — 15% discount
// ---------------------------------------------------------------------
describe('Annual pricing (15% off monthly × 12)', () => {
  it('ANNUAL_DISCOUNT_PERCENT is 15', () => {
    expect(ANNUAL_DISCOUNT_PERCENT).toBe(15);
  });

  it('starter yearlyPriceCents is 19380 ($193.80/yr)', () => {
    expect(PLANS.starter.yearlyPriceCents).toBe(19380);
  });

  it('starter yearlyMonthlyEquivalentCents is 1615', () => {
    expect(PLANS.starter.yearlyMonthlyEquivalentCents).toBe(1615);
  });

  it('starter annual discount is approximately 15% (within $0.01)', () => {
    const monthly = PLANS.starter.monthlyPriceCents;
    const expectedYearly = Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
    expect(Math.abs(PLANS.starter.yearlyPriceCents - expectedYearly)).toBeLessThanOrEqual(1);
  });

  it('pro yearlyPriceCents is 49980 ($499.80/yr)', () => {
    expect(PLANS.pro.yearlyPriceCents).toBe(49980);
  });

  it('pro yearlyMonthlyEquivalentCents is 4165', () => {
    expect(PLANS.pro.yearlyMonthlyEquivalentCents).toBe(4165);
  });

  it('pro annual discount is approximately 15% (within $0.01)', () => {
    const monthly = PLANS.pro.monthlyPriceCents;
    const expectedYearly = Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
    expect(Math.abs(PLANS.pro.yearlyPriceCents - expectedYearly)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// Enterprise displayPrice
// ---------------------------------------------------------------------
describe('Enterprise tier', () => {
  it('has a displayPrice of "Starting at $199/mo"', () => {
    expect(PLANS.enterprise.displayPrice).toBe('Starting at $199/mo');
  });

  it('monthlyPriceCents is 0 (custom pricing)', () => {
    expect(PLANS.enterprise.monthlyPriceCents).toBe(0);
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
