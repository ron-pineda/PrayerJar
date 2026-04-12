import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/billing.service', () => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { POST } from './route';
import { createCheckoutSession } from '@/services/billing.service';
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
    // Default: key is configured
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns 200 with url for valid amount', async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue('https://checkout.stripe.com/pay/test');

    const res = await POST(makeRequest({ amountCents: 500 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://checkout.stripe.com/pay/test');
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      amountCents: 500,
      successUrl: 'https://prayerjar.org/give?success=1',
      cancelUrl: 'https://prayerjar.org/give',
    }));
  });

  it('returns 400 when amountCents is too small', async () => {
    const res = await POST(makeRequest({ amountCents: 50 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it('returns 503 when STRIPE_SECRET_KEY is not set', async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const res = await POST(makeRequest({ amountCents: 500 }));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toBe('Payments not configured');
  });
});
