'use client';

import { track } from '@vercel/analytics';

export { track };

// ─── Legacy event helpers ──────────────────────────────────────────────────
export function trackPrayer(category: string) {
  track('prayer_submitted', { category });
}

export function trackTestimony() {
  track('testimony_shared');
}

export function trackPartnerMatch() {
  track('partner_matched');
}

// ─── Church Acquisition Funnel — client-side event helpers ─────────────────
// Spec: docs/analytics/church-funnel-spec.md v1.0 (Sprint 17)
// Call sites: see spec §7 for exact trigger locations.

export function trackForChurchesView(props: {
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_authenticated: boolean;
}) {
  track('for_churches_view', props);
}

export function trackPricingView(props: {
  page_path: string;
  tier_count: number;
  referrer_event: string | null;
}) {
  track('pricing_view', props);
}

/**
 * Spec buckets: "1-25" | "26-100" | "101-500" | "500+"
 * Do NOT pass raw member counts — bucket before calling.
 */
export function trackCalculatorInteracted(props: {
  calculator_field: string;
  new_value: string;
  resulting_plan: string | null;
}) {
  track('calculator_interacted', props);
}

export function trackSignupStart(props: {
  signup_method: string;
  plan_intent: string | null;
  source_page: string;
}) {
  track('signup_start', props);
}
