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

// Sprint 27 (pj-s27-02): trackPricingView and trackCalculatorInteracted are
// deleted. Their only call sites were the tier cards and the pricing calculator,
// both removed with the paid tiers. There is no pricing view left to instrument.

export function trackSignupStart(props: {
  signup_method: string;
  plan_intent: string | null;
  source_page: string;
}) {
  track('signup_start', props);
}
