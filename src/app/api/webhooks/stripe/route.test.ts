import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';

// Hoist mocks so they are available before vi.mock factories run
const mocks = vi.hoisted(() => {
  const insertOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const insertValues = vi.fn().mockReturnValue({ onConflictDoNothing: insertOnConflictDoNothing });
  const updateReturning = vi.fn().mockResolvedValue([{ id: 'sub-id-1' }]);
  const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const subscriptionsRetrieve = vi.fn();

  return { insertValues, insertOnConflictDoNothing, updateSet, updateWhere, updateReturning, subscriptionsRetrieve };
});

vi.mock('@/services/billing.service', () => ({
  constructStripeEvent: vi.fn(),
}));

vi.mock('@/services/badge.service', () => ({
  evaluateDonorBadge: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/plans', () => ({
  getPlanByStripePriceId: vi.fn().mockReturnValue({ tier: 'starter' }),
}));

vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      subscriptions: {
        retrieve: mocks.subscriptionsRetrieve,
      },
    };
  };
  return { default: MockStripe };
});

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: mocks.insertValues }),
    update: vi.fn().mockReturnValue({ set: mocks.updateSet }),
    query: {
      donations: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));



vi.mock('@/db/schema', () => ({
  donations: {},
  subscriptions: {},
  eventLicenses: {},
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

function makeSubscriptionEvent(
  type: 'customer.subscription.updated' | 'customer.subscription.deleted',
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Event {
  return {
    id: 'evt_sub_test',
    type,
    data: {
      object: {
        id: 'sub_test_123',
        object: 'subscription',
        status: 'active',
        cancel_at_period_end: false,
        items: {
          data: [{
            id: 'si_test',
            price: { id: 'price_starter_monthly' },
            current_period_start: 1700000000,
            current_period_end: 1702592000,
          }],
        },
        ...overrides,
      } as unknown as Stripe.Subscription,
    },
  } as Stripe.Event;
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    // Re-attach hoisted mocks after clearAllMocks resets them
    mocks.insertOnConflictDoNothing.mockResolvedValue(undefined);
    mocks.insertValues.mockReturnValue({ onConflictDoNothing: mocks.insertOnConflictDoNothing });
    mocks.updateReturning.mockResolvedValue([{ id: 'sub-id-1' }]);
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    vi.mocked(db.insert).mockReturnValue({ values: mocks.insertValues } as ReturnType<typeof db.insert>);
    vi.mocked(db.update).mockReturnValue({ set: mocks.updateSet } as ReturnType<typeof db.update>);
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
  });

  // ── donation (default) ────────────────────────────────────────────────────

  it('returns 200 and inserts donation for checkout.session.completed (no type)', async () => {
    const event = makeCheckoutEvent();
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    const res = await POST(makeRequest('{}', 'sig_valid'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
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

    const res = await POST(makeRequest('{}', 'sig_valid'));

    expect(res.status).toBe(200);
    expect(evaluateDonorBadge).not.toHaveBeenCalled();
  });

  // ── subscription checkout ─────────────────────────────────────────────────

  it('inserts subscription record for checkout.session.completed with type=subscription', async () => {
    const event = makeCheckoutEvent({
      subscription: 'sub_test_123',
      metadata: { userId: 'user-abc', type: 'subscription' },
    });
    vi.mocked(constructStripeEvent).mockReturnValue(event);
    mocks.subscriptionsRetrieve.mockResolvedValue({
      id: 'sub_test_123',
      items: {
        data: [{
          price: { id: 'price_starter_monthly' },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        }],
      },
    });

    const res = await POST(makeRequest('{}', 'sig_valid'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-abc',
      stripeSubscriptionId: 'sub_test_123',
      stripePriceId: 'price_starter_monthly',
      tier: 'starter',
      status: 'active',
    }));
    expect(evaluateDonorBadge).not.toHaveBeenCalled();
  });

  it('does not insert donation for subscription checkout', async () => {
    const event = makeCheckoutEvent({
      subscription: 'sub_test_123',
      metadata: { userId: 'user-abc', type: 'subscription' },
    });
    vi.mocked(constructStripeEvent).mockReturnValue(event);
    mocks.subscriptionsRetrieve.mockResolvedValue({
      id: 'sub_test_123',
      items: {
        data: [{
          price: { id: 'price_starter_monthly' },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        }],
      },
    });

    await POST(makeRequest('{}', 'sig_valid'));

    // Should insert into subscriptions, not donations
    const insertCalls = mocks.insertValues.mock.calls;
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0][0]).toHaveProperty('stripeSubscriptionId');
    expect(insertCalls[0][0]).not.toHaveProperty('stripePaymentIntentId');
  });

  // ── event_license checkout ────────────────────────────────────────────────

  it('inserts event license record for checkout.session.completed with type=event_license', async () => {
    const event = makeCheckoutEvent({
      payment_intent: 'pi_event_123',
      metadata: { userId: 'user-abc', type: 'event_license', eventName: 'Easter Sunday', attendeeCapacity: '200' },
    });
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    const res = await POST(makeRequest('{}', 'sig_valid'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-abc',
      stripePaymentIntentId: 'pi_event_123',
      eventName: 'Easter Sunday',
      attendeeCapacity: 200,
    }));
    expect(evaluateDonorBadge).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ────────────────────────────────────────

  it('updates subscription record for customer.subscription.updated', async () => {
    const event = makeSubscriptionEvent('customer.subscription.updated', {
      status: 'past_due',
      cancel_at_period_end: true,
    });
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    const res = await POST(makeRequest('{}', 'sig_valid'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({
      status: 'past_due',
      cancelAtPeriodEnd: true,
    }));
    expect(mocks.updateWhere).toHaveBeenCalled();
  });

  it('updates subscription period dates on customer.subscription.updated', async () => {
    const event = makeSubscriptionEvent('customer.subscription.updated');
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    await POST(makeRequest('{}', 'sig_valid'));

    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({
      currentPeriodStart: new Date(1700000000 * 1000),
      currentPeriodEnd: new Date(1702592000 * 1000),
    }));
  });

  // ── customer.subscription.deleted ────────────────────────────────────────

  it('sets subscription status to canceled for customer.subscription.deleted', async () => {
    const event = makeSubscriptionEvent('customer.subscription.deleted');
    vi.mocked(constructStripeEvent).mockReturnValue(event);

    const res = await POST(makeRequest('{}', 'sig_valid'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({
      status: 'canceled',
    }));
    expect(mocks.updateWhere).toHaveBeenCalled();
  });
});
