'use client';

/**
 * Vercel Web Analytics mount point.
 *
 * `beforeSend` is a function prop, so `<Analytics />` cannot be configured
 * directly from the server-rendered root layout — functions are not
 * serializable across the server/client boundary. This thin client wrapper is
 * the boundary.
 *
 * See `src/lib/analytics-redact.ts` for why redaction is required at all.
 */

import { Analytics } from '@vercel/analytics/next';
import type { BeforeSendEvent } from '@vercel/analytics/next';
import { redactAnalyticsEvent } from '@/lib/analytics-redact';

export function WebAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => redactAnalyticsEvent(event)}
    />
  );
}
