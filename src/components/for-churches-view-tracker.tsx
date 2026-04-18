'use client';

import { useEffect } from 'react';
import { trackForChurchesView } from '@/lib/analytics';

/**
 * Invisible client component that fires the `for_churches_view` funnel event
 * once per page mount. Drop inside the server-component `ForChurchesPage`.
 *
 * Reads UTM params from the client URL so the server component needs no
 * additional props. `isAuthenticated` is derived from a session cookie
 * check on mount (cookie presence only — no server round-trip).
 *
 * Spec: docs/analytics/church-funnel-spec.md §3.1
 */
export function ForChurchesViewTracker() {
  useEffect(() => {
    // Truncate referrer to domain only — no path, no query string.
    let referrer: string | null = null;
    if (document.referrer) {
      try {
        referrer = new URL(document.referrer).hostname;
      } catch {
        referrer = null;
      }
    }

    const params = new URLSearchParams(window.location.search);

    // Check for an auth session cookie presence (name used by next-auth / Auth.js).
    // This is a best-effort check — we never send the cookie value itself.
    const isAuthenticated =
      document.cookie.includes('next-auth.session-token') ||
      document.cookie.includes('__Secure-next-auth.session-token') ||
      document.cookie.includes('authjs.session-token');

    trackForChurchesView({
      referrer,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      is_authenticated: isAuthenticated,
    });
  // Run once on mount only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
