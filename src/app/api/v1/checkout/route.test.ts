import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/services/billing.service', () => ({
  createCheckoutSession: vi.fn(),
  createSubscriptionCheckout: vi.fn(),
  createEventLicenseCheckout: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// The subscription flow looks up the caller's admin church membership to
// attach churchId to the checkout session. Default: no membership found.
const { mockFindFirstChurchMember } = vi.hoisted(() => ({
  mockFindFirstChurchMember: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      churchMembers: {
        findFirst: mockFindFirstChurchMember,
      },
    },
  },
}));

import { POST } from './route';
import { createCheckoutSession, createSubscriptionCheckout, createEventLicenseCheckout } from '@/services/billing.service';
import type { Session } from 'next-auth';
import { auth as authImpl } from '@/lib/auth';
// NextAuth's `auth` is an intersection of five call signatures, so
// `ReturnType<typeof auth>` resolves to its middleware overload. Re-type the
// binding to the no-arg overload these tests use so `vi.mocked(auth)` and
// `Awaited<ReturnType<typeof auth>>` resolve to `Session | null`.
const auth = authImpl as () => Promise<Session | null>;
import { NextRequest } from 'next/server';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/v1/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://prayerjar.org', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    vi.mocked(auth).mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  // ── donation ──────────────────────────────────────────────────────────────

  it('returns 200 with url for valid donation amount', async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue('https://checkout.stripe.com/pay/test');

    const res = await POST(makeRequest({ type: 'donation', amountCents: 500 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://checkout.stripe.com/pay/test');
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      amountCents: 500,
      successUrl: 'https://prayerjar.org/give?success=1',
      cancelUrl: 'https://prayerjar.org/give',
    }));
  });

  it('returns 400 when donation amountCents is too small', async () => {
    const res = await POST(makeRequest({ type: 'donation', amountCents: 50 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it('returns 503 when STRIPE_SECRET_KEY is not set', async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const res = await POST(makeRequest({ type: 'donation', amountCents: 500 }));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toBe('Payments not configured');
  });

  it('returns 400 when type is missing', async () => {
    const res = await POST(makeRequest({ amountCents: 500 }));
    expect(res.status).toBe(400);
  });

  // ── withdrawn checkout types ──────────────────────────────────────────────
  // Sprint 27 (pj-s27-02): the `subscription` and `event_license` branches were
  // removed from the schema and the handler. These two tests replace the eight
  // that covered them, and exist so nobody can quietly buy a tier that no longer
  // exists in the product by posting straight at this endpoint.

  it('rejects a subscription checkout — the branch no longer exists', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-456' } } as unknown as Session);

    const res = await POST(makeRequest({ type: 'subscription', stripePriceId: 'price_abc' }));

    expect(res.status).toBe(400);
    expect(createSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it('rejects an event_license checkout — the branch no longer exists', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-456' } } as unknown as Session);

    const res = await POST(
      makeRequest({ type: 'event_license', eventName: 'Easter', attendeeCapacity: 100 }),
    );

    expect(res.status).toBe(400);
    expect(createEventLicenseCheckout).not.toHaveBeenCalled();
  });
});
