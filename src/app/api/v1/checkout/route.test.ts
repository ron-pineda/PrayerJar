import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/billing.service', () => ({
  createCheckoutSession: vi.fn(),
  createSubscriptionCheckout: vi.fn(),
  createEventLicenseCheckout: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { POST } from './route';
import { createCheckoutSession, createSubscriptionCheckout, createEventLicenseCheckout } from '@/services/billing.service';
import { auth } from '@/lib/auth';
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

  // ── subscription ──────────────────────────────────────────────────────────

  it('returns 401 for subscription when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const res = await POST(makeRequest({ type: 'subscription', stripePriceId: 'price_abc' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBeDefined();
    expect(createSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it('returns 200 with url for valid subscription when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    vi.mocked(createSubscriptionCheckout).mockResolvedValue('https://checkout.stripe.com/sub/test');

    const res = await POST(makeRequest({ type: 'subscription', stripePriceId: 'price_abc' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://checkout.stripe.com/sub/test');
    expect(createSubscriptionCheckout).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-123',
      stripePriceId: 'price_abc',
    }));
  });

  it('returns 400 for subscription with missing stripePriceId', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);

    const res = await POST(makeRequest({ type: 'subscription', stripePriceId: '' }));
    expect(res.status).toBe(400);
  });

  // ── event_license ─────────────────────────────────────────────────────────

  it('returns 401 for event_license when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const res = await POST(makeRequest({ type: 'event_license', eventName: 'Easter', attendeeCapacity: 100 }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(createEventLicenseCheckout).not.toHaveBeenCalled();
  });

  it('returns 200 with url for valid event_license when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-456' } } as any);
    vi.mocked(createEventLicenseCheckout).mockResolvedValue('https://checkout.stripe.com/event/test');

    const res = await POST(makeRequest({ type: 'event_license', eventName: 'Easter Sunday', attendeeCapacity: 200 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://checkout.stripe.com/event/test');
    expect(createEventLicenseCheckout).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-456',
      eventName: 'Easter Sunday',
      attendeeCapacity: 200,
    }));
  });

  it('returns 400 for event_license with missing eventName', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-456' } } as any);

    const res = await POST(makeRequest({ type: 'event_license', eventName: '', attendeeCapacity: 100 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for event_license with attendeeCapacity out of range', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-456' } } as any);

    const res = await POST(makeRequest({ type: 'event_license', eventName: 'Easter', attendeeCapacity: 99999 }));
    expect(res.status).toBe(400);
  });
});
