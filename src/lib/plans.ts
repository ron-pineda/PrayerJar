export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  yearlyMonthlyEquivalentCents?: number; // display helper: yearlyPriceCents/12 rounded
  displayPrice?: string;                  // UI display override (e.g. enterprise)
  stripePriceIdMonthly: string | null;  // populated from env vars
  stripePriceIdYearly: string | null;
  features: string[];
  limits: {
    members: number | null;       // null = unlimited
    groups: number | null;
    events: number | null;
    admins: number;
  };
};

/** Annual discount percentage applied to yearly pricing (15%). */
export const ANNUAL_DISCOUNT_PERCENT = 15;

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: 'free',
    name: 'Free',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      'Up to 75 members',
      '3 groups',
      'Public prayer wall',
      'Basic notifications',
    ],
    limits: { members: 75, groups: 3, events: 0, admins: 1 },
  },
  starter: {
    tier: 'starter',
    name: 'Small Church',
    monthlyPriceCents: 1900,          // $19/mo
    yearlyPriceCents: 19380,          // $193.80/yr (15% off monthly × 12)
    yearlyMonthlyEquivalentCents: 1615, // $16.15/mo when billed annually
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? null,
    features: [
      'Up to 150 members',
      '5 groups',
      'Private church prayer wall (coming soon)',
      'Custom welcome message',
      'Email digest for pastors',
      'Member growth analytics',
      'Prayer analytics (coming soon)',
      'Pastoral dashboard',
      'Pastoral care inbox',
    ],
    limits: { members: 150, groups: 5, events: 2, admins: 3 },
  },
  pro: {
    tier: 'pro',
    name: 'Growing Church',
    monthlyPriceCents: 4900,          // $49/mo
    yearlyPriceCents: 49980,          // $499.80/yr (15% off monthly × 12)
    yearlyMonthlyEquivalentCents: 4165, // $41.65/mo when billed annually
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    features: [
      'Unlimited members',
      'Unlimited groups',
      'Pastoral dashboard',
      'Pastoral care inbox',
      'Prayer team assignments',
      'Testimony approval queue (coming soon)',
      'Live event prayer wall (coming soon)',
      'Custom branding',
      'Advanced analytics (coming soon)',
      'Priority support',
    ],
    limits: { members: null, groups: null, events: 12, admins: 10 },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Network',
    monthlyPriceCents: 0,      // custom pricing, contact sales
    yearlyPriceCents: 0,
    displayPrice: 'Starting at $199/mo',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      'Everything in Growing Church',
      'Unlimited events',
      'Unlimited admins',
      'Custom subdomain (coming soon)',
      'Enterprise login (coming soon)',
      'Custom analytics reports (coming soon)',
      'Custom agreement available',
    ],
    limits: { members: null, groups: null, events: null, admins: 999 },
  },
};

/**
 * True when a `PlanDefinition.features` entry is labelled as not yet
 * shipped, using the codebase's honest-label convention (pj-s26-01):
 * the literal suffix `(coming soon)`.
 *
 * Tier cards and the /docs/paid plan cards render feature lists straight
 * from `PLANS`. Both must call this — a checkmark beside "(coming soon)"
 * still reads as included, which is the thing pj-s26-09 exists to stop.
 */
export function isComingSoonFeature(feature: string): boolean {
  return feature.toLowerCase().includes('(coming soon)');
}

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier];
}

export function getPlanByStripePriceId(priceId: string): PlanDefinition | null {
  return Object.values(PLANS).find(
    p => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId
  ) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Feature → tier constants (single source of truth)                  */
/* ------------------------------------------------------------------ */
//
// These constants exist so that marketing copy (/for-churches, /help,
// /docs/...) and server-side gating resolve to the SAME tier string.
// Legal (FTC §5) surfaced an inconsistency where plans.ts said Pro,
// the /for-churches FAQ said "Starter and Pro", and the dashboard
// page enforced no plan gate at all. Keep all three in sync by
// reading from here.
//
// Sprint 17 (pj-s17-tier-redesign): Pastoral Dashboard and Pastoral
// Care Inbox moved from 'pro' to 'starter'. Prayer Team Assignments
// and Testimony Approval Queue added as new 'pro'-tier constants.

/** Ordered from least to most privileged. */
export const TIER_RANK: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

/** The minimum plan tier that unlocks the Pastoral Dashboard. */
export const PASTORAL_DASHBOARD_TIER: PlanTier = 'starter';

/**
 * Returns true if the given plan tier grants access to the Pastoral
 * Dashboard. Server-side gating code and marketing pages must both
 * derive their answer from this predicate.
 */
export function hasPastoralDashboard(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[PASTORAL_DASHBOARD_TIER];
}

/**
 * Human-readable tier name for the Pastoral Dashboard gate, suitable
 * for rendering directly in marketing copy. Derived from PLANS so
 * there is exactly one place to edit.
 */
export const PASTORAL_DASHBOARD_TIER_NAME: string =
  PLANS[PASTORAL_DASHBOARD_TIER].name;

/** The minimum plan tier that unlocks the Pastoral Care Inbox. */
export const PASTORAL_CARE_INBOX_TIER: PlanTier = 'starter';

/**
 * Returns true if the given plan tier grants access to the Pastoral
 * Care Inbox.
 */
export function hasPastoralCareInbox(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[PASTORAL_CARE_INBOX_TIER];
}

/** The minimum plan tier that unlocks Prayer Team Assignments. */
export const PRAYER_TEAM_ASSIGNMENTS_TIER: PlanTier = 'pro';

/**
 * Returns true if the given plan tier grants access to Prayer Team
 * Assignments.
 */
export function hasPrayerTeamAssignments(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[PRAYER_TEAM_ASSIGNMENTS_TIER];
}

/** The minimum plan tier that unlocks the Testimony Approval Queue. */
export const TESTIMONY_APPROVAL_QUEUE_TIER: PlanTier = 'pro';

/**
 * Returns true if the given plan tier grants access to the Testimony
 * Approval Queue.
 */
export function hasTestimonyApprovalQueue(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[TESTIMONY_APPROVAL_QUEUE_TIER];
}

/** The minimum plan tier that grants the Custom Subdomain feature. pj-s22-16 */
export const CUSTOM_SUBDOMAIN_TIER: PlanTier = 'pro';

/**
 * Returns true if the given plan tier can claim a custom subdomain.
 * Server-side gating (branding route) and UI (BrandingForm) both derive
 * from this predicate so they stay in sync.
 *
 * Tier floor: Growing Church (pro) and above.
 */
export function hasCustomSubdomain(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[CUSTOM_SUBDOMAIN_TIER];
}

/**
 * Returns the number of days audit events are retained for a given plan tier.
 *
 * Tier mapping (pj-s17-audit-log):
 *   free     →  90 days  (same bucket as Small Church — no paid plan)
 *   starter  →  90 days  (Small Church)
 *   pro      → 365 days  (Growing Church)
 *   enterprise → 1095 days (Network — 3 years)
 */
export function auditRetentionDays(tier: PlanTier): number {
  switch (tier) {
    case 'free':
    case 'starter':
      return 90;
    case 'pro':
      return 365;
    case 'enterprise':
      return 1095;
  }
}
