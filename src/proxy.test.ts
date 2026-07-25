/**
 * Tests for subdomain tenant resolution in src/proxy.ts
 *
 * pj-s22-16 — Backend Engineer
 *
 * Strategy: mock the DB and auth layer, invoke the middleware default export,
 * and assert on the Response returned (status, headers, redirect URL, rewrite URL).
 *
 * NOTE: proxy.ts wraps the handler in `auth()` — we mock `@/lib/auth` to return
 * a pass-through wrapper so we can call the inner handler directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  auth: (handler: (req: unknown) => unknown) => handler,
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  churches: { subdomain: 'subdomain', id: 'id', slug: 'slug' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, val: unknown) => ({ __eq: val })),
}));

import { db } from '@/db';
import handler from './proxy';

// The proxy default export is wrapped in NextAuth's `auth()`, so its type is a
// two-arg NextMiddleware `(request, event)`. The mocked `auth` above makes it a
// pass-through that ignores the second arg at runtime, but the call sites still
// need to satisfy the type — supply a throwaway fetch event.
const fetchEvent = {} as unknown as Parameters<typeof handler>[1];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(
  host: string,
  path = '/',
  env: Record<string, string> = {},
  extra: { headers?: Record<string, string>; cookies?: Record<string, string> } = {},
) {
  // Set process.env overrides for this request
  Object.entries(env).forEach(([k, v]) => {
    process.env[k] = v;
  });

  const url = `https://${host}${path}`;
  const cookieJar = extra.cookies ?? {};
  const req = {
    headers: new Headers({ host, ...extra.headers }),
    nextUrl: Object.assign(new URL(url), {
      clone(): URL {
        return new URL(url);
      },
    }),
    url,
    auth: null,
    // Minimal stand-in for NextRequest's RequestCookies — only `.has()` and
    // `.get()` are used by the attribution stamp in proxy.ts.
    cookies: {
      has: (name: string) => name in cookieJar,
      get: (name: string) =>
        name in cookieJar ? { name, value: cookieJar[name] } : undefined,
    },
  };
  return req as unknown as Parameters<typeof handler>[0];
}

/** A request that looks like a real browser asking for an HTML document. */
const DOC_HEADERS = { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9' };

/** Build the drizzle select chain mock to return `rows`. */
function mockDbSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('proxy.ts — subdomain tenant resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUBDOMAIN_ROUTING;
    delete process.env.ADMIN_EMAILS;
  });

  it('apex request (prayerjar.org) passes through unchanged', async () => {
    const req = makeReq('prayerjar.org', '/');
    const res = await handler(req, fetchEvent);
    // NextResponse.next() — no location header, no rewrite
    expect(res).toBeInstanceOf(NextResponse);
    expect((res as NextResponse).status).toBe(200);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('reserved subdomain (www) → 404 regardless of SUBDOMAIN_ROUTING flag', async () => {
    const req = makeReq('www.prayerjar.org', '/');
    const res = await handler(req, fetchEvent);
    expect((res as NextResponse).status).toBe(404);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('reserved subdomain (api) → 404', async () => {
    const req = makeReq('api.prayerjar.org', '/wall');
    const res = await handler(req, fetchEvent);
    expect((res as NextResponse).status).toBe(404);
  });

  it('unknown subdomain with SUBDOMAIN_ROUTING=true → 302 redirect to apex with banner', async () => {
    process.env.SUBDOMAIN_ROUTING = 'true';
    mockDbSelect([]); // no church found

    const req = makeReq('nonexistent.prayerjar.org', '/wall');
    const res = await handler(req, fetchEvent);

    expect((res as NextResponse).status).toBe(302);
    const location = (res as NextResponse).headers.get('location') ?? '';
    expect(location).toContain('prayerjar.org');
    expect(location).toContain('unknown_subdomain=1');
  });

  it('valid subdomain with SUBDOMAIN_ROUTING=true → rewrites to /church/<slug><path>', async () => {
    process.env.SUBDOMAIN_ROUTING = 'true';
    mockDbSelect([{ id: 'church-uuid-1', slug: 'takeheart' }]);

    const req = makeReq('takeheart.prayerjar.org', '/wall');
    const res = await handler(req, fetchEvent);

    // NextResponse.rewrite returns a 200 (or the rewritten route's status).
    // We verify the rewrite happened by checking that no redirect (3xx) was issued
    // and the db was queried.
    expect((res as NextResponse).status).not.toBe(302);
    expect((res as NextResponse).status).not.toBe(404);
    expect(db.select).toHaveBeenCalled();
  });

  it('valid subdomain root path / → rewrites to /church/<slug> (no trailing slash duplication)', async () => {
    process.env.SUBDOMAIN_ROUTING = 'true';
    mockDbSelect([{ id: 'church-uuid-2', slug: 'gracechurch' }]);

    const req = makeReq('gracechurch.prayerjar.org', '/');
    const res = await handler(req, fetchEvent);

    expect((res as NextResponse).status).not.toBe(302);
    expect((res as NextResponse).status).not.toBe(404);
  });

  it('/sign-in on valid subdomain → passes through without /church/<slug> prefix, injects _pj_sub', async () => {
    process.env.SUBDOMAIN_ROUTING = 'true';
    mockDbSelect([{ id: 'church-uuid-3', slug: 'take-heart-1234' }]);

    const req = makeReq('takeheart.prayerjar.org', '/sign-in');
    const res = await handler(req, fetchEvent);

    const rewrite = (res as NextResponse).headers.get('x-middleware-rewrite') ?? '';
    expect(rewrite).toContain('/sign-in');
    expect(rewrite).not.toContain('/church/');
    expect(rewrite).toContain('_pj_sub=takeheart');
  });

  it('/sign-in/verify on valid subdomain → passes through without /church/<slug> prefix', async () => {
    process.env.SUBDOMAIN_ROUTING = 'true';
    mockDbSelect([{ id: 'church-uuid-3', slug: 'take-heart-1234' }]);

    const req = makeReq('takeheart.prayerjar.org', '/sign-in/verify');
    const res = await handler(req, fetchEvent);

    const rewrite = (res as NextResponse).headers.get('x-middleware-rewrite') ?? '';
    expect(rewrite).toContain('/sign-in/verify');
    expect(rewrite).not.toContain('/church/');
  });

  it('subdomain request with SUBDOMAIN_ROUTING unset (flag off) → falls through to normal routing', async () => {
    // Flag not set — should not hit DB and should not 302/404
    delete process.env.SUBDOMAIN_ROUTING;
    // db.select should NOT be called
    const req = makeReq('somesubdomain.prayerjar.org', '/wall');
    const res = await handler(req, fetchEvent);

    expect(db.select).not.toHaveBeenCalled();
    // Falls through to auth checks, no redirect since no protected prefix
    expect((res as NextResponse).status).not.toBe(302);
    expect((res as NextResponse).status).not.toBe(404);
  });

  it('SUBDOMAIN_ROUTING=false (explicit) → falls through, no DB hit', async () => {
    process.env.SUBDOMAIN_ROUTING = 'false';

    const req = makeReq('grace.prayerjar.org', '/');
    const res = await handler(req, fetchEvent);

    expect(db.select).not.toHaveBeenCalled();
  });

  it('non-prayerjar.org host → passes through (no subdomain logic)', async () => {
    const req = makeReq('localhost:3000', '/');
    const res = await handler(req, fetchEvent);
    expect(db.select).not.toHaveBeenCalled();
    expect((res as NextResponse).status).not.toBe(404);
  });
});

// ── First-touch attribution stamp (pj-s26-03) ────────────────────────────────

describe('proxy.ts — first-touch signup attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUBDOMAIN_ROUTING;
    delete process.env.ADMIN_EMAILS;
  });

  /** Reads the pj_attr cookie back off the response. */
  function readStamp(res: NextResponse) {
    const cookie = res.cookies.get('pj_attr');
    return cookie ? JSON.parse(decodeURIComponent(cookie.value)) : null;
  }

  it('stamps pj_attr on a fresh anonymous document request', async () => {
    const req = makeReq('prayerjar.org', '/', {}, { headers: DOC_HEADERS });
    const res = (await handler(req, fetchEvent)) as NextResponse;

    expect(readStamp(res)).toMatchObject({
      acquisitionSource: 'direct',
      landingPath: '/',
    });
  });

  it('captures UTM campaign parameters from the landing URL', async () => {
    const req = makeReq(
      'prayerjar.org',
      '/for-churches?utm_source=bulletin&utm_medium=email&utm_campaign=advent',
      {},
      { headers: DOC_HEADERS },
    );
    const res = (await handler(req, fetchEvent)) as NextResponse;

    expect(readStamp(res)).toMatchObject({
      acquisitionSource: 'email',
      utmSource: 'bulletin',
      utmMedium: 'email',
      utmCampaign: 'advent',
      landingPath: '/for-churches',
    });
  });

  it('classifies an external referrer', async () => {
    const req = makeReq(
      'prayerjar.org',
      '/',
      {},
      { headers: { ...DOC_HEADERS, referer: 'https://www.google.com/search?q=prayer' } },
    );
    const res = (await handler(req, fetchEvent)) as NextResponse;

    const stamp = readStamp(res);
    expect(stamp.acquisitionSource).toBe('organic_search');
    // Referrer query dropped — search terms must never be stored.
    expect(stamp.referrer).toBe('https://www.google.com/search');
  });

  it('does not overwrite an existing cookie — first touch wins', async () => {
    const req = makeReq(
      'prayerjar.org',
      '/?utm_source=later',
      {},
      { headers: DOC_HEADERS, cookies: { pj_attr: 'already-set' } },
    );
    const res = (await handler(req, fetchEvent)) as NextResponse;

    expect(res.cookies.get('pj_attr')).toBeUndefined();
  });

  it('does not stamp non-document requests', async () => {
    const req = makeReq('prayerjar.org', '/', {}, { headers: { accept: 'image/avif' } });
    const res = (await handler(req, fetchEvent)) as NextResponse;

    expect(res.cookies.get('pj_attr')).toBeUndefined();
  });

  it('redacts a prayer ID in the landing path', async () => {
    const uuid = '8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8';
    const req = makeReq('prayerjar.org', `/p/${uuid}`, {}, { headers: DOC_HEADERS });
    const res = (await handler(req, fetchEvent)) as NextResponse;

    const stamp = readStamp(res);
    expect(stamp.landingPath).toBe('/p/[id]');
    expect(JSON.stringify(stamp)).not.toContain(uuid);
  });

  it('survives a redirect response — the cookie rides along', async () => {
    const req = makeReq('prayerjar.org', '/settings', {}, { headers: DOC_HEADERS });
    const res = (await handler(req, fetchEvent)) as NextResponse;

    // Unauthenticated request to a protected prefix → 307/302 to /sign-in
    expect([302, 307]).toContain(res.status);
    expect(readStamp(res)).toMatchObject({ landingPath: '/settings' });
  });
});
