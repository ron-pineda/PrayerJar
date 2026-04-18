import { describe, it, expect } from 'vitest';
import {
  computeMRR,
  computeChurn,
  computeAcquisitionBreakdown,
  tierMonthlyCents,
  isPaying,
  formatCents,
  type ChurchRow,
} from './mrr';
import { PLANS } from '@/lib/plans';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function d(iso: string): Date {
  return new Date(iso);
}

function church(overrides: Partial<ChurchRow> = {}): ChurchRow {
  return {
    id: overrides.id ?? 'c-' + Math.random().toString(36).slice(2, 8),
    currentPlan: overrides.currentPlan ?? 'free',
    previousPlan: overrides.previousPlan ?? null,
    firstPaidAt: overrides.firstPaidAt ?? null,
    acquisitionSource: overrides.acquisitionSource ?? null,
    createdAt: overrides.createdAt ?? d('2026-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? d('2026-01-01T00:00:00Z'),
  };
}

const WINDOW_FROM = d('2026-04-01T00:00:00Z');
const WINDOW_TO = d('2026-05-01T00:00:00Z');

// ---------------------------------------------------------------------------
// tierMonthlyCents / isPaying — sanity checks so future pricing changes
// break THIS test first rather than silently changing dashboard numbers.
// ---------------------------------------------------------------------------

describe('tierMonthlyCents()', () => {
  it('returns 0 for free', () => {
    expect(tierMonthlyCents('free')).toBe(0);
  });

  it('matches PLANS.starter.monthlyPriceCents', () => {
    expect(tierMonthlyCents('starter')).toBe(PLANS.starter.monthlyPriceCents);
  });

  it('matches PLANS.pro.monthlyPriceCents', () => {
    expect(tierMonthlyCents('pro')).toBe(PLANS.pro.monthlyPriceCents);
  });
});

describe('isPaying()', () => {
  it('returns false for free', () => {
    expect(isPaying('free')).toBe(false);
  });

  it('returns true for paid tiers', () => {
    expect(isPaying('starter')).toBe(true);
    expect(isPaying('pro')).toBe(true);
    expect(isPaying('enterprise')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeMRR — the core scenario coverage
// ---------------------------------------------------------------------------

describe('computeMRR()', () => {
  it('returns zeros for an empty dataset', () => {
    const out = computeMRR([], WINDOW_FROM, WINDOW_TO);
    expect(out.newMRR).toBe(0);
    expect(out.totalMRR).toBe(0);
    expect(out.payingChurchCount).toBe(0);
    expect(out.netNewMRR).toBe(0);
  });

  it('counts newMRR for a church that became paid within the window', () => {
    const rows = [
      church({
        currentPlan: 'starter',
        firstPaidAt: d('2026-04-15T00:00:00Z'),
        updatedAt: d('2026-04-15T00:00:00Z'),
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.newMRR).toBe(PLANS.starter.monthlyPriceCents);
    expect(out.totalMRR).toBe(PLANS.starter.monthlyPriceCents);
    expect(out.payingChurchCount).toBe(1);
  });

  it('does NOT count newMRR for a church that paid before the window', () => {
    const rows = [
      church({
        currentPlan: 'starter',
        firstPaidAt: d('2026-01-15T00:00:00Z'),
        updatedAt: d('2026-01-15T00:00:00Z'),
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.newMRR).toBe(0);
    // but totalMRR still counts the subscription at window end
    expect(out.totalMRR).toBe(PLANS.starter.monthlyPriceCents);
    expect(out.payingChurchCount).toBe(1);
  });

  it('counts expansionMRR when a church upgrades starter → pro within the window', () => {
    const rows = [
      church({
        currentPlan: 'pro',
        previousPlan: 'starter',
        firstPaidAt: d('2026-01-01T00:00:00Z'), // before window
        updatedAt: d('2026-04-10T00:00:00Z'),   // upgrade inside window
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.newMRR).toBe(0);
    const expectedExpansion = PLANS.pro.monthlyPriceCents - PLANS.starter.monthlyPriceCents;
    expect(out.expansionMRR).toBe(expectedExpansion);
    expect(out.totalMRR).toBe(PLANS.pro.monthlyPriceCents);
  });

  it('counts contractionMRR when a church downgrades pro → starter within the window', () => {
    const rows = [
      church({
        currentPlan: 'starter',
        previousPlan: 'pro',
        firstPaidAt: d('2026-01-01T00:00:00Z'),
        updatedAt: d('2026-04-20T00:00:00Z'),
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);
    const expectedContraction = PLANS.pro.monthlyPriceCents - PLANS.starter.monthlyPriceCents;
    expect(out.contractionMRR).toBe(expectedContraction);
    expect(out.churnedMRR).toBe(0);
  });

  it('counts churnedMRR when a church drops to free within the window', () => {
    const rows = [
      church({
        currentPlan: 'free',
        previousPlan: 'starter',
        firstPaidAt: d('2026-01-01T00:00:00Z'),
        updatedAt: d('2026-04-22T00:00:00Z'),
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.churnedMRR).toBe(PLANS.starter.monthlyPriceCents);
    expect(out.payingChurchCount).toBe(0);
    expect(out.totalMRR).toBe(0);
  });

  it('computes netNewMRR = new + expansion - contraction - churn', () => {
    const rows: ChurchRow[] = [
      // +starter ($19)
      church({
        id: 'new-1',
        currentPlan: 'starter',
        firstPaidAt: d('2026-04-03T00:00:00Z'),
        updatedAt: d('2026-04-03T00:00:00Z'),
      }),
      // starter → pro ($30 expansion)
      church({
        id: 'up-1',
        currentPlan: 'pro',
        previousPlan: 'starter',
        firstPaidAt: d('2026-02-01T00:00:00Z'),
        updatedAt: d('2026-04-11T00:00:00Z'),
      }),
      // starter → free ($19 churn)
      church({
        id: 'churn-1',
        currentPlan: 'free',
        previousPlan: 'starter',
        firstPaidAt: d('2026-02-01T00:00:00Z'),
        updatedAt: d('2026-04-19T00:00:00Z'),
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);

    const starter = PLANS.starter.monthlyPriceCents;
    const pro = PLANS.pro.monthlyPriceCents;
    expect(out.newMRR).toBe(starter);
    expect(out.expansionMRR).toBe(pro - starter);
    expect(out.churnedMRR).toBe(starter);
    expect(out.contractionMRR).toBe(0);
    expect(out.netNewMRR).toBe(starter + (pro - starter) - starter);
  });

  it('ignores plan changes that happened outside the window', () => {
    const rows = [
      church({
        currentPlan: 'pro',
        previousPlan: 'starter',
        firstPaidAt: d('2026-01-01T00:00:00Z'),
        updatedAt: d('2026-01-15T00:00:00Z'), // upgrade before window
      }),
    ];
    const out = computeMRR(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.newMRR).toBe(0);
    expect(out.expansionMRR).toBe(0);
    // totalMRR at window end is still the pro price
    expect(out.totalMRR).toBe(PLANS.pro.monthlyPriceCents);
  });
});

// ---------------------------------------------------------------------------
// computeChurn — explicit churn tests
// ---------------------------------------------------------------------------

describe('computeChurn()', () => {
  it('returns zeros when no one has churned', () => {
    const rows = [
      church({ currentPlan: 'starter', firstPaidAt: d('2026-01-01T00:00:00Z') }),
      church({ currentPlan: 'pro', firstPaidAt: d('2026-02-01T00:00:00Z') }),
    ];
    const out = computeChurn(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.churnedCount).toBe(0);
    expect(out.churnedMRR).toBe(0);
    expect(out.churnRate).toBe(0);
  });

  it('counts a single church that went paid → free', () => {
    const rows = [
      church({
        currentPlan: 'starter',
        firstPaidAt: d('2026-01-01T00:00:00Z'),
      }),
      church({
        currentPlan: 'free',
        previousPlan: 'pro',
        firstPaidAt: d('2026-01-01T00:00:00Z'),
        updatedAt: d('2026-04-15T00:00:00Z'),
      }),
    ];
    const out = computeChurn(rows, WINDOW_FROM, WINDOW_TO);
    expect(out.churnedCount).toBe(1);
    expect(out.churnedMRR).toBe(PLANS.pro.monthlyPriceCents);
    // payingAtStart = payingAtEnd(1) + churned(1) - newInWindow(0) = 2
    expect(out.churnRate).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// computeAcquisitionBreakdown
// ---------------------------------------------------------------------------

describe('computeAcquisitionBreakdown()', () => {
  it('buckets unknown when no source is set', () => {
    const rows = [
      church({ currentPlan: 'starter', firstPaidAt: d('2026-01-01T00:00:00Z') }),
    ];
    const out = computeAcquisitionBreakdown(rows);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('unknown');
    expect(out[0].payingCount).toBe(1);
    expect(out[0].totalCount).toBe(1);
    expect(out[0].shareOfPaying).toBe(1);
    expect(out[0].mrr).toBe(PLANS.starter.monthlyPriceCents);
  });

  it('groups across sources and returns shares summing to ~1', () => {
    const rows = [
      church({ currentPlan: 'starter', acquisitionSource: 'organic', firstPaidAt: d('2026-01-01T00:00:00Z') }),
      church({ currentPlan: 'starter', acquisitionSource: 'organic', firstPaidAt: d('2026-01-02T00:00:00Z') }),
      church({ currentPlan: 'pro', acquisitionSource: 'directory', firstPaidAt: d('2026-01-03T00:00:00Z') }),
      church({ currentPlan: 'free', acquisitionSource: 'organic' }),
    ];
    const out = computeAcquisitionBreakdown(rows);

    const organic = out.find((o) => o.source === 'organic')!;
    const directory = out.find((o) => o.source === 'directory')!;

    expect(organic.payingCount).toBe(2);
    expect(organic.totalCount).toBe(3);
    expect(directory.payingCount).toBe(1);

    const total = organic.shareOfPaying + directory.shareOfPaying;
    expect(total).toBeCloseTo(1, 5);

    // Sort order: highest mrr first — pro ($49) > 2×starter ($38)
    expect(out[0].source).toBe('directory');
  });

  it('handles the zero-paying case without divide-by-zero', () => {
    const rows = [church({ currentPlan: 'free', acquisitionSource: 'organic' })];
    const out = computeAcquisitionBreakdown(rows);
    expect(out[0].shareOfPaying).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatCents
// ---------------------------------------------------------------------------

describe('formatCents()', () => {
  it('formats whole dollars with USD symbol', () => {
    expect(formatCents(1900)).toBe('$19');
    expect(formatCents(123400)).toBe('$1,234');
  });

  it('handles zero', () => {
    expect(formatCents(0)).toBe('$0');
  });
});
