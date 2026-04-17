export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
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

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: 'free',
    name: 'Free',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      'Up to 25 members',
      '1 group',
      'Public prayer wall',
      'Basic notifications',
    ],
    limits: { members: 25, groups: 1, events: 0, admins: 1 },
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    monthlyPriceCents: 1900,   // $19/mo
    yearlyPriceCents: 18000,   // $180/yr (save ~21%)
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? null,
    features: [
      'Up to 150 members',
      '5 groups',
      'Private church prayer wall',
      'Custom welcome message',
      'Email digest for pastors',
      'Basic analytics',
    ],
    limits: { members: 150, groups: 5, events: 2, admins: 3 },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPriceCents: 4900,   // $49/mo
    yearlyPriceCents: 46800,   // $468/yr (save ~20%)
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    features: [
      'Unlimited members',
      'Unlimited groups',
      'Live event prayer wall',
      'Pastoral dashboard',
      'AI-flagged prayer care',
      'Custom branding',
      'Advanced analytics & PDF reports',
      'Priority support',
    ],
    limits: { members: null, groups: null, events: 12, admins: 10 },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyPriceCents: 0,      // custom pricing, contact sales
    yearlyPriceCents: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      'Everything in Pro',
      'Unlimited events',
      'Unlimited admins',
      'Custom subdomain (coming soon)',
      'SSO / SAML (coming soon)',
      'Custom agreement available',
    ],
    limits: { members: null, groups: null, events: null, admins: 999 },
  },
};

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier];
}

export function getPlanByStripePriceId(priceId: string): PlanDefinition | null {
  return Object.values(PLANS).find(
    p => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId
  ) ?? null;
}
