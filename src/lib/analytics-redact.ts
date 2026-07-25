/**
 * PII redaction for Vercel Web Analytics pageview URLs.
 *
 * WHY THIS EXISTS
 * ---------------
 * `@vercel/analytics/next` sends BOTH a `route` (the Next.js route pattern,
 * e.g. `/p/[id]`) AND a `path` (the raw resolved URL, e.g.
 * `/p/8f3c...-uuid`) on every pageview. See
 * `node_modules/@vercel/analytics/dist/next/index.mjs` — `useRoute()` builds
 * `computeRoute(path, params)` for `route` but passes `usePathname()` through
 * untouched for `path`.
 *
 * That means the raw prayer / testimony ID leaves the browser unless we
 * intercept it. Sprint 26 constraint: prayer content, prayer IDs, testimony
 * text and user email must never reach an analytics destination. `beforeSend`
 * is the documented interception point
 * (https://vercel.com/docs/analytics/redacting-sensitive-data).
 *
 * This module is deliberately pure and framework-free so it can be unit
 * tested without a browser. The client wrapper lives in
 * `src/components/web-analytics.tsx`.
 */

/** Canonical v4-ish UUID shape used by every `uuid()` primary key in schema.ts. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Path segments whose *immediately following* segment is a record identifier.
 *
 * The UUID rule below already catches today's IDs, but IDs change shape over
 * time (short codes, nanoids, slugs). These routes are named explicitly so the
 * redaction survives an ID-format change without anyone remembering to update
 * this file.
 */
const ID_PARENT_SEGMENTS = new Set([
  'p', // /p/[id]              — prayer permalink
  'testimony', // /testimony/[id]      — testimony permalink
  'groups', // /groups/[id]
  'events', // /church/[slug]/events/[eventId]
  'chains', // prayer chains
  'prayer', // /api/og/prayer/[id]
  'wrapped', // /wrapped/[year] and /api/og/wrapped/[userId]
]);

/**
 * Query parameters that are safe to forward. Everything else is dropped —
 * search boxes, share tokens and OG `?text=` payloads can all carry prayer
 * content, so an allowlist is the only safe default.
 *
 * Note: UTM breakdown is a Web Analytics *Plus* feature and is not collected
 * on Hobby (see docs/analytics/events.md). These are kept anyway so the data
 * is already correct if the plan ever changes, and because they are campaign
 * labels we authored — never user content.
 */
const ALLOWED_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref',
]);

/** Replaces a single path segment with its route-pattern placeholder. */
function redactPathname(pathname: string): string {
  const segments = pathname.split('/');

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;

    // Rule 1 — any UUID-shaped segment is an opaque record ID. Never send it.
    if (UUID_RE.test(segment)) {
      segments[i] = '[id]';
      continue;
    }

    // Rule 2 — explicitly sensitive parents, regardless of ID format.
    const parent = segments[i - 1];
    if (parent && ID_PARENT_SEGMENTS.has(parent.toLowerCase())) {
      // `/wrapped/2026` is a year, not an identifier — keep it readable.
      if (parent.toLowerCase() === 'wrapped' && /^\d{4}$/.test(segment)) {
        continue;
      }
      segments[i] = '[id]';
    }
  }

  return segments.join('/');
}

/**
 * Strips identifiers and unsafe query params from an absolute analytics URL.
 *
 * Returns the input unchanged if it cannot be parsed — an unparseable URL is
 * not a reason to crash the page, and the caller drops the event on throw.
 */
export function redactAnalyticsUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  url.pathname = redactPathname(url.pathname);

  for (const key of [...url.searchParams.keys()]) {
    if (!ALLOWED_QUERY_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  // Fragments never reach the server but Vercel's script reads `location.href`.
  url.hash = '';

  return url.toString();
}

/** Shape of the object `@vercel/analytics` hands to `beforeSend`. */
export type RedactableEvent = { type: 'pageview' | 'event'; url: string };

/**
 * `beforeSend` handler. Returning `null` would drop the event entirely; we
 * only ever rewrite, so pageview volume stays accurate while IDs do not leave.
 */
export function redactAnalyticsEvent<T extends RedactableEvent>(event: T): T {
  return { ...event, url: redactAnalyticsUrl(event.url) };
}
