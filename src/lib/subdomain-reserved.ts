/**
 * Reserved subdomain list — single source of truth.
 *
 * Derived from actual route dirs under src/app/(public)/ and
 * src/app/(dashboard)/ so adding a new top-level route cannot
 * silently collide with a church's claimed subdomain.
 *
 * Matched case-insensitively. Enforced at two layers:
 *   1. BrandingForm save path (src/app/api/v1/church/[slug]/branding/route.ts)
 *   2. Edge middleware (src/proxy.ts) — defense in depth
 *
 * pj-s22-16 — Backend Engineer
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  // Infrastructure / apex aliases
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'blog',
  'help',
  'docs',
  'status',
  'support',
  'billing',
  'auth',
  'sso',
  'scim',
  'assets',
  'cdn',
  'static',
  'staging',
  'dev',
  'preview',
  // Public routes — (public) route group
  'events',
  'wall',
  'partners',
  'giving',
  'embed',
  'wrapped',
  'press',
  'trust',
  'map',
  'world-prayer',
  'know-jesus',
  'find-a-church',
  'for-churches',
  'contact',
  'praise-wall',
  'testimony',
  'campaigns',
  'legal',
  'privacy',
  'terms',
  'about',
  'pray',
  'p',
  'browse',
  // Dashboard routes — (dashboard) route group
  'journal',
  'my-prayers',
  'notifications',
  'settings',
  'badges',
  'saved-churches',
  'adopted',
  'partner',
  'prayed-for',
  'profile',
  // Generic error paths
  'error',
  '404',
  'favicon',
]);

/**
 * Returns true if the given subdomain value is reserved.
 * Comparison is always case-insensitive.
 */
export function isReservedSubdomain(value: string): boolean {
  return RESERVED_SUBDOMAINS.has(value.toLowerCase());
}

/**
 * Returns true if the subdomain has a leading or trailing hyphen,
 * which is disallowed by RFC 1035.
 */
export function hasInvalidHyphen(value: string): boolean {
  return /^-|-$/.test(value);
}
