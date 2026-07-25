/**
 * Signup-source attribution — first-touch.
 *
 * WHY THIS IS THE ATTRIBUTION SYSTEM (and not Vercel Web Analytics)
 * -----------------------------------------------------------------
 * PrayerJar is on the Vercel Hobby plan. Per
 * https://vercel.com/docs/analytics/limits-and-pricing, Hobby gets pageviews
 * only: **Custom Events are not included, and UTM Parameters are a Web
 * Analytics *Plus* add-on** (not even base Pro). So neither `track()` calls
 * nor UTM breakdown can answer "which channel produced a signup" on this plan.
 *
 * This module does, in our own database, at zero vendor cost:
 *   1. `src/proxy.ts` stamps a first-touch cookie on the first page a visitor
 *      lands on.
 *   2. `events.createUser` in `src/lib/auth.ts` reads that cookie and writes
 *      the values onto the new `users` row (migration 0033).
 *
 * PRIVACY POSTURE
 * ---------------
 * Nothing user-authored is captured. The referrer is reduced to
 * origin + pathname (query string dropped — a search-engine referrer query can
 * carry the user's search terms), and the landing path is redacted through the
 * same rules the analytics pipeline uses, so a signup that started on a prayer
 * permalink stores `/p/[id]`, never the prayer ID.
 */

import { redactAnalyticsUrl } from '@/lib/analytics-redact';

/** Name of the first-touch cookie set by the proxy. */
export const ATTRIBUTION_COOKIE = 'pj_attr';

/**
 * 90 days. Long enough to cover a "saw it, signed up weeks later" path, short
 * enough that the value still means something when it is finally read.
 */
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/**
 * Coarse channel buckets. Mirrors the vocabulary already used by
 * `churches.acquisitionSource` (schema.ts) so church-side and user-side
 * attribution can be reported together.
 */
export type AcquisitionSource =
  | 'direct'
  | 'organic_search'
  | 'social'
  | 'email'
  | 'paid'
  | 'referral'
  | 'campaign';

export interface Attribution {
  acquisitionSource: AcquisitionSource;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  /** Referrer reduced to origin + pathname. Null for direct traffic. */
  referrer: string | null;
  /** Redacted path of the first page seen. */
  landingPath: string;
}

const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'duckduckgo.com',
  'search.yahoo.',
  'yahoo.com',
  'ecosia.org',
  'search.brave.com',
  'startpage.com',
  'baidu.com',
  'yandex.',
  'qwant.com',
];

const SOCIAL_HOSTS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  't.co',
  'linkedin.com',
  'lnkd.in',
  'reddit.com',
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'pinterest.com',
  'whatsapp.com',
  'threads.net',
  'nextdoor.com',
  'discord.com',
];

/** Paid-intent UTM mediums, per the de-facto GA convention. */
const PAID_MEDIUMS = new Set([
  'cpc',
  'ppc',
  'paid',
  'paidsearch',
  'paid_search',
  'paid-search',
  'display',
  'cpm',
  'banner',
  'retargeting',
]);

const EMAIL_MEDIUMS = new Set(['email', 'e-mail', 'newsletter', 'drip']);
const SOCIAL_MEDIUMS = new Set(['social', 'social-network', 'paid-social', 'sm']);

function hostMatches(host: string, needles: string[]): boolean {
  const h = host.toLowerCase();
  return needles.some((n) => h === n || h.endsWith(n) || h.includes(n));
}

/** Trims and length-caps a free-form value; returns null for empties. */
function clean(value: string | null | undefined, maxLength = 128): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/**
 * Derives first-touch attribution from the landing URL and the `referer`
 * header of the very first request in a session.
 *
 * @param rawUrl   Absolute URL of the landing request.
 * @param referer  Raw `referer` header, if any.
 * @param selfHost Host of this deployment, used to ignore internal referrers.
 */
export function deriveAttribution(
  rawUrl: string,
  referer: string | null | undefined,
  selfHost?: string | null,
): Attribution {
  let landingUrl: URL | null = null;
  try {
    landingUrl = new URL(rawUrl);
  } catch {
    landingUrl = null;
  }

  const params = landingUrl?.searchParams;
  const utmSource = clean(params?.get('utm_source'));
  const utmMedium = clean(params?.get('utm_medium'));
  const utmCampaign = clean(params?.get('utm_campaign'));

  // Referrer → origin + pathname only. A search-engine referrer's query string
  // can contain the user's search terms; we have no use for them and no right
  // to store them.
  let referrer: string | null = null;
  let referrerHost: string | null = null;
  if (referer) {
    try {
      const r = new URL(referer);
      referrerHost = r.hostname;
      const isSelf =
        !!selfHost && r.hostname.toLowerCase() === selfHost.toLowerCase();
      if (!isSelf) {
        referrer = clean(`${r.origin}${r.pathname}`, 256);
      } else {
        referrerHost = null;
      }
    } catch {
      referrer = null;
    }
  }

  const acquisitionSource = classify(utmMedium, utmSource, referrerHost);

  const landingPath = landingUrl
    ? new URL(redactAnalyticsUrl(landingUrl.toString())).pathname
    : '/';

  return {
    acquisitionSource,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    landingPath: landingPath.slice(0, 256),
  };
}

function classify(
  utmMedium: string | null,
  utmSource: string | null,
  referrerHost: string | null,
): AcquisitionSource {
  // UTMs are the strongest signal — we authored them, so they beat inference.
  if (utmMedium) {
    const m = utmMedium.toLowerCase();
    if (PAID_MEDIUMS.has(m)) return 'paid';
    if (EMAIL_MEDIUMS.has(m)) return 'email';
    if (SOCIAL_MEDIUMS.has(m)) return 'social';
    if (m === 'organic') return 'organic_search';
    if (m === 'referral') return 'referral';
    return 'campaign';
  }
  if (utmSource) return 'campaign';

  if (referrerHost) {
    if (hostMatches(referrerHost, SEARCH_HOSTS)) return 'organic_search';
    if (hostMatches(referrerHost, SOCIAL_HOSTS)) return 'social';
    return 'referral';
  }

  return 'direct';
}

/**
 * Serialises attribution for the cookie. `encodeURIComponent` keeps the value
 * inside the cookie-safe character set without pulling in base64 (which is not
 * available identically across Edge and Node).
 */
export function encodeAttribution(attribution: Attribution): string {
  return encodeURIComponent(JSON.stringify(attribution));
}

/**
 * Parses a cookie value that may have been percent-encoded 0, 1 or 2 times.
 *
 * Both `encodeAttribution` above AND Next's `ResponseCookies.set` encode the
 * value, so the wire format is double-encoded; `RequestCookies.get` strips one
 * layer before we see it. Rather than depend on exactly how many layers a
 * given runtime removed, peel until it parses. Verified against a live dev
 * server: the Set-Cookie header carries `%257B…` and the read side receives
 * `%7B…`.
 */
function parseMaybeEncoded(raw: string): unknown {
  let candidate = raw;
  for (let i = 0; i < 3; i++) {
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const next = decodeURIComponent(candidate);
        if (next === candidate) return null;
        candidate = next;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Inverse of {@link encodeAttribution}. Returns null on any malformed input. */
export function decodeAttribution(raw: string | null | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const parsed: unknown = parseMaybeEncoded(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Record<string, unknown>;
    if (typeof p.acquisitionSource !== 'string') return null;
    return {
      acquisitionSource: p.acquisitionSource as AcquisitionSource,
      utmSource: typeof p.utmSource === 'string' ? p.utmSource : null,
      utmMedium: typeof p.utmMedium === 'string' ? p.utmMedium : null,
      utmCampaign: typeof p.utmCampaign === 'string' ? p.utmCampaign : null,
      referrer: typeof p.referrer === 'string' ? p.referrer : null,
      landingPath: typeof p.landingPath === 'string' ? p.landingPath : '/',
    };
  } catch {
    return null;
  }
}

/**
 * True when this request should be stamped with a first-touch cookie.
 *
 * Deliberately conservative — we only want the *first HTML document* an
 * anonymous visitor sees. Prefetches, asset fetches and already-authenticated
 * sessions would all either overwrite a good value or record a meaningless one.
 */
export function shouldStampAttribution(opts: {
  hasExistingCookie: boolean;
  isAuthenticated: boolean;
  accept: string | null;
  isPrefetch: boolean;
  pathname: string;
}): boolean {
  if (opts.hasExistingCookie) return false; // first touch wins, always
  if (opts.isAuthenticated) return false;
  if (opts.isPrefetch) return false;
  if (!opts.accept?.includes('text/html')) return false;
  if (opts.pathname.startsWith('/api/')) return false;
  return true;
}
