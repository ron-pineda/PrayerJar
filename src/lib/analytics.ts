'use client';

import { track } from '@vercel/analytics';

export { track };

export function trackPrayer(category: string) {
  track('prayer_submitted', { category });
}

export function trackTestimony() {
  track('testimony_shared');
}

export function trackPartnerMatch() {
  track('partner_matched');
}
