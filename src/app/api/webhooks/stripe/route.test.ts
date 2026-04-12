import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';

vi.mock('@/services/billing.service', () => ({
  constructStripeEvent: vi.fn(),
}));

vi.mock('@/services/badge.service', () => ({
  evaluateDonorBadge: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  donations: {},
}));

import { POST } from './route';
import { constructStripeEvent } from '@/services/billing.service';
import { evaluateDonorBadge } from '@/services/badge.service';
import { db } from '@/db';
import { NextRequest } from 'next/server';

function makeRequest(body: string, sig: string) {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': sig,
    },
    body,
  });
}

function makeCheckoutEvent(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Event {
  return {
    id: 'evt_test',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test',
        object: 'checkout.session',
        payment_intent: 'pi_test_123',
        amount_total: 1000,
        currency: 'usd',
        metadata: { userId: 'user-abc' },
        ...overrides,
      } as Stripe.Checkout.Session,
    },
  } as Stripe.Event;
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('returns 200 and inserts donation for checkout.session.completed', async () => {
    const event = makeCheckoutEvent();
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue({ values: insertValuesMock } as ReturnType<typeof db.insert>);

    const res = await POST(makeRequest('{}', 'sig_valid'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(insertValuesMock).toHaveBeenCalledWith(expect.objectContaining({
      stripePaymentIntentId: 'pi_test_123',
      amountCents: 1000,
      status: 'succeeded',
    }));
    expect(evaluateDonorBadge).toHaveBeenCalledWith('user-abc');
  });

  it('returns 400 on invalid signature', async () => {
    vi.mocked(constructStripeEvent).mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await POST(makeRequest('{}', 'sig_bad'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid signature');
  });

  it('returns 200 and does not award badge when userId is empty', async () => {
    const event = makeCheckoutEvent({ metadata: { userId: '' } });
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue({ values: insertValuesMock } as ReturnType<typeof db.insert>);

    const res = await POST(makeRequest('{}', 'sig_valid'));

    expect(res.status).toBe(200);
    expect(evaluateDonorBadge).not.toHaveBeenCalled();
  });
});
