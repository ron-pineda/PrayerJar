/**
 * Next.js middleware — named proxy.ts per project convention.
 *
 * Execution order:
 *   1. Subdomain tenant resolution  (pj-s22-16 — new)
 *   2. Admin-email gating on /admin/*
 *   3. Protected-prefix redirect to /sign-in
 *
 * Auth cookie note: NextAuth is configured with `trustHost: true` and no
 * explicit `cookies` block (see src/lib/auth.ts). Session cookies are
 * therefore scoped to the exact request host — host-only, not
 * `.prayerjar.org`. This is the correct behaviour for the per-subdomain auth
 * model (§7 of docs/architecture/sprint22-sso-subdomain.md): a session on
 * prayerjar.org is invisible to takeheart.prayerjar.org and vice versa.
 * No NextAuth config change is required or desired.
 *
 * DB note: src/db/index.ts uses drizzle-orm/neon-http (@neondatabase/serverless)
 * which is Edge-compatible — the DB lookup in tenant resolution runs at the
 * Edge without a Node runtime override.
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { churches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isReservedSubdomain } from '@/lib/subdomain-reserved';

const PROTECTED_PREFIXES = ['/my-prayers', '/journal', '/notifications', '/settings', '/badges'];
const ADMIN_PREFIXES = ['/admin'];

/** Matches  <sub>.prayerjar.org  (case-insensitive, 1-32 chars). */
const SUBDOMAIN_RE = /^([a-z0-9-]{1,32})\.prayerjar\.org$/i;

export default auth(async (req: NextRequest & { auth?: { user?: { email?: string | null } } | null }) => {
  const { pathname } = req.nextUrl;

  // ─── Step 1: Subdomain tenant resolution ────────────────────────────────
  //
  // Must run before auth checks so the x-pj-church-id header is available
  // to route handlers on subdomain requests.
  //
  // Feature-flag: SUBDOMAIN_ROUTING=true must be set in Vercel env vars
  // after wildcard DNS + wildcard cert are provisioned.  Until that flag is
  // set the block is a no-op and all traffic falls through to apex routing.

  const host = req.headers.get('host') ?? '';
  const subMatch = host.match(SUBDOMAIN_RE);

  if (subMatch) {
    const sub = subMatch[1].toLowerCase();

    // Reserved word → 404 (defense-in-depth; save path also blocks these).
    if (isReservedSubdomain(sub)) {
      return new NextResponse(null, { status: 404 });
    }

    const subdomainRoutingEnabled = process.env.SUBDOMAIN_ROUTING === 'true';

    if (subdomainRoutingEnabled) {
      // DB lookup: resolve subdomain → church.
      // neon-http is Edge-compatible; this is a single indexed point-read.
      const rows = await db
        .select({ id: churches.id, slug: churches.slug })
        .from(churches)
        .where(eq(churches.subdomain, sub))
        .limit(1);

      if (rows.length === 0) {
        // Unknown subdomain → redirect to apex home with banner query param.
        // Force pathname to '/' — subdomain paths like /wall don't exist on apex.
        const apexUrl = new URL(req.url);
        apexUrl.hostname = 'prayerjar.org';
        apexUrl.port = '';
        apexUrl.pathname = '/';
        apexUrl.searchParams.set('unknown_subdomain', '1');
        return NextResponse.redirect(apexUrl, 302);
      }

      const church = rows[0];

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-pj-church-id', church.id);
      requestHeaders.set('x-pj-church-slug', church.slug);
      // x-pj-subdomain = the hostname subdomain (e.g. "testchurch"), distinct
      // from church.slug (e.g. "test-church-7l78"). Used by the sign-in page to
      // construct absolute callbackUrls.
      requestHeaders.set('x-pj-subdomain', sub);

      const url = req.nextUrl.clone();
      const originalPath = url.pathname;

      // /sign-in and its subpaths (/sign-in/verify) live at the apex routes, not
      // under /church/<slug>/. Pass through without the slug prefix. Strip
      // /church/<slug> from callbackUrl so that protected-page redirects resolve
      // correctly after sign-in.
      if (originalPath === '/sign-in' || originalPath.startsWith('/sign-in/')) {
        const callbackUrl = url.searchParams.get('callbackUrl');
        if (callbackUrl?.startsWith(`/church/${church.slug}`)) {
          url.searchParams.set(
            'callbackUrl',
            callbackUrl.slice(`/church/${church.slug}`.length) || '/',
          );
        }
        // Embed the subdomain as a URL param (fallback) — x-pj-subdomain header
        // is the primary signal, but URL params survive any header-stripping.
        url.searchParams.set('_pj_sub', sub);
        return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
      }

      // Paths already starting with /church/ are apex-style routes (e.g.
      // /church/join, /church/create). Don't double-nest them by prepending
      // the slug — just forward with the church headers.
      if (!originalPath.startsWith('/church/')) {
        url.pathname = `/church/${church.slug}${originalPath === '/' ? '' : originalPath}`;
      }

      return NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
    }

    // Flag not set → fall through to normal routing (apex behaviour).
  }

  // ─── Step 2: Admin-email gating ─────────────────────────────────────────
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
    if (!req.auth?.user?.email || !adminEmails.includes(req.auth.user.email)) {
      // Return 404 (not redirect) to avoid disclosing that this route exists.
      return new NextResponse(null, { status: 404 });
    }
  }

  // ─── Step 3: Protected-prefix redirect ───────────────────────────────────
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !req.auth) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
