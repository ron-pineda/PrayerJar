/**
 * Finance: MRR / churn / acquisition computations (pj-s17-mrr-dashboard).
 *
 * These are pure functions over in-memory rows. The dashboard page fetches
 * the rows (churches + subscriptions) once, passes them in, and this module
 * decides what's new / expansion / contraction / churn for a time window.
 *
 * Price source: we map PlanTier → PLANS[tier].monthlyPriceCents. This means
 * historical MRR re-bases if we reprice a tier — acceptable tradeoff for v1
 * (repricing is a rare, deliberate event; we log the prior tier on the
 * church row via previous_plan so a future version can cross-reference).
 */
import { PLANS, type PlanTier } from '@/lib/plans';

/** Minimal shape we need off the churches table. */
export type ChurchRow = {
  id: string;
  currentPlan: PlanTier;
  previousPlan: PlanTier | null;
  firstPaidAt: Date | null;
  acquisitionSource: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Minimal shape we need off the subscriptions table. */
export type SubscriptionRow = {
  id: string;
  userId: string;
  tier: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MRRBreakdown = {
  /** MRR from subscriptions that started within the window. */
  newMRR: number;
  /** MRR gained from upgrades within the window (contraction expressed separately). */
  expansionMRR: number;
  /** MRR lost to downgrades within the window (positive value, expressed as a loss). */
  contractionMRR: number;
  /** MRR lost to cancellations within the window (positive value, expressed as a loss). */
  churnedMRR: number;
  /** newMRR + expansionMRR - contractionMRR - churnedMRR. */
  netNewMRR: number;
  /** Sum of monthly price of every active subscription at the end of the window. */
  totalMRR: number;
  /** Count of churches with currentPlan != 'free' at window end. */
  payingChurchCount: number;
};

export type AcquisitionBreakdown = {
  source: string;
  payingCount: number;
  totalCount: number;
  /** Fraction of ALL paying churches attributed to this source. */
  shareOfPaying: number;
  /** MRR attributable to this source at window end. */
  mrr: number;
};

export type ChurnStats = {
  churnedCount: number;
  churnedMRR: number;
  /** churnedCount / payingCountAtWindowStart (0 if zero divisor). */
  churnRate: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Monthly recurring revenue in cents for a given tier. Free = 0, Enterprise
 *  returns 0 because our plans.ts has no fixed enterprise price — enterprise
 *  MRR must be added manually once we know the negotiated amount. This is
 *  intentional: the dashboard flags enterprise churches as "MRR unknown"
 *  rather than silently assuming. */
export function tierMonthlyCents(tier: PlanTier): number {
  return PLANS[tier].monthlyPriceCents;
}

/** A church is "paying" if its currentPlan is not free. Enterprise counts. */
export function isPaying(tier: PlanTier): boolean {
  return tier !== 'free';
}

function inWindow(ts: Date | null | undefined, from: Date, to: Date): boolean {
  if (!ts) return false;
  const t = ts.getTime();
  return t >= from.getTime() && t < to.getTime();
}

// ---------------------------------------------------------------------------
// computeMRR: breakdown over a time window
// ---------------------------------------------------------------------------

/**
 * Compute the MRR breakdown for a given window.
 *
 * Rules:
 *   - newMRR: church has firstPaidAt in [from, to) AND currentPlan is paid.
 *   - expansionMRR: previousPlan < currentPlan (both paid) AND updatedAt in window.
 *   - contractionMRR: previousPlan > currentPlan AND both are paid-ish AND updatedAt in window.
 *   - churnedMRR: previousPlan is paid AND currentPlan is free AND updatedAt in window.
 *   - totalMRR: sum of monthlyPriceCents over currentPlan of every paying church at window end.
 *   - payingChurchCount: count of paying churches at window end.
 *
 * We use church rows (not subscription rows) as the source of truth because
 * currentPlan / previousPlan / firstPaidAt are materialized on churches by
 * the Stripe webhook — that gives us one-row-per-church semantics instead of
 * juggling multiple subscription lifecycle events.
 */
export function computeMRR(
  churches: ChurchRow[],
  from: Date,
  to: Date,
): MRRBreakdown {
  let newMRR = 0;
  let expansionMRR = 0;
  let contractionMRR = 0;
  let churnedMRR = 0;
  let totalMRR = 0;
  let payingChurchCount = 0;

  for (const c of churches) {
    const currentCents = tierMonthlyCents(c.currentPlan);
    const prevCents = c.previousPlan ? tierMonthlyCents(c.previousPlan) : 0;

    if (isPaying(c.currentPlan)) {
      totalMRR += currentCents;
      payingChurchCount += 1;
    }

    if (isPaying(c.currentPlan) && inWindow(c.firstPaidAt, from, to)) {
      newMRR += currentCents;
      // A brand-new paying church is "new," not "expansion." Continue — we
      // do NOT also count it as expansion even if previousPlan is set (it
      // shouldn't be, but defensive).
      continue;
    }

    // Plan changed within window — classify as expansion / contraction / churn.
    if (c.previousPlan && c.previousPlan !== c.currentPlan && inWindow(c.updatedAt, from, to)) {
      const delta = currentCents - prevCents;
      if (!isPaying(c.currentPlan) && isPaying(c.previousPlan)) {
        // downgraded all the way to free — that's churn.
        churnedMRR += prevCents;
      } else if (delta > 0) {
        expansionMRR += delta;
      } else if (delta < 0) {
        contractionMRR += -delta;
      }
    }
  }

  const netNewMRR = newMRR + expansionMRR - contractionMRR - churnedMRR;

  return {
    newMRR,
    expansionMRR,
    contractionMRR,
    churnedMRR,
    netNewMRR,
    totalMRR,
    payingChurchCount,
  };
}

// ---------------------------------------------------------------------------
// computeChurn
// ---------------------------------------------------------------------------

/**
 * Counts churches that went from paying → free within [from, to). Rate is
 * relative to the count of churches paying at window start (approximated as
 * payingNow + churned - newInWindow — i.e. what was paying when the window
 * opened).
 */
export function computeChurn(
  churches: ChurchRow[],
  from: Date,
  to: Date,
): ChurnStats {
  let churnedCount = 0;
  let churnedMRR = 0;
  let payingAtEnd = 0;
  let newInWindow = 0;

  for (const c of churches) {
    if (isPaying(c.currentPlan)) payingAtEnd += 1;
    if (isPaying(c.currentPlan) && inWindow(c.firstPaidAt, from, to)) newInWindow += 1;

    const churnedInWindow =
      c.previousPlan &&
      isPaying(c.previousPlan) &&
      !isPaying(c.currentPlan) &&
      inWindow(c.updatedAt, from, to);

    if (churnedInWindow) {
      churnedCount += 1;
      churnedMRR += tierMonthlyCents(c.previousPlan!);
    }
  }

  const payingAtStart = payingAtEnd + churnedCount - newInWindow;
  const churnRate = payingAtStart > 0 ? churnedCount / payingAtStart : 0;

  return { churnedCount, churnedMRR, churnRate };
}

// ---------------------------------------------------------------------------
// computeAcquisitionBreakdown
// ---------------------------------------------------------------------------

/**
 * Group churches by acquisitionSource (null → 'unknown') and return the
 * distribution of paying churches + total churches + MRR per source.
 *
 * We compute "as of now" (window end) — sources are a current-state metric,
 * not a window-delta one. Rows without an acquisitionSource bucket under
 * 'unknown' and are typically churches signed up before attribution existed.
 */
export function computeAcquisitionBreakdown(
  churches: ChurchRow[],
): AcquisitionBreakdown[] {
  const totalPaying = churches.filter((c) => isPaying(c.currentPlan)).length;
  const bySource = new Map<string, { paying: number; total: number; mrr: number }>();

  for (const c of churches) {
    const src = c.acquisitionSource ?? 'unknown';
    const bucket = bySource.get(src) ?? { paying: 0, total: 0, mrr: 0 };
    bucket.total += 1;
    if (isPaying(c.currentPlan)) {
      bucket.paying += 1;
      bucket.mrr += tierMonthlyCents(c.currentPlan);
    }
    bySource.set(src, bucket);
  }

  return Array.from(bySource.entries())
    .map(([source, b]) => ({
      source,
      payingCount: b.paying,
      totalCount: b.total,
      shareOfPaying: totalPaying > 0 ? b.paying / totalPaying : 0,
      mrr: b.mrr,
    }))
    .sort((a, b) => b.mrr - a.mrr || b.payingCount - a.payingCount);
}

// ---------------------------------------------------------------------------
// formatCents: presentation helper shared by dashboard + tests
// ---------------------------------------------------------------------------

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
