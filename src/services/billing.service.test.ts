import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe — must use a class/function constructor pattern
const mockSessionCreate = vi.fn();
vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      checkout: {
        sessions: {
          create: mockSessionCreate,
        },
      },
    };
  };
  return { default: MockStripe };
});

import { createSubscriptionCheckout, createEventLicenseCheckout } from './billing.service';

describe('createSubscriptionCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns a checkout URL', async () => {
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sub/test' });

    const url = await createSubscriptionCheckout({
      userId: 'user-123',
      stripePriceId: 'price_abc',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(url).toBe('https://checkout.stripe.com/sub/test');
    expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      line_items: [{ price: 'price_abc', quantity: 1 }],
      metadata: { userId: 'user-123', type: 'subscription' },
    }));
  });
});

describe('createEventLicenseCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns a checkout URL', async () => {
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/event/test' });

    const url = await createEventLicenseCheckout({
      userId: 'user-123',
      eventName: 'Easter Sunday',
      attendeeCapacity: 50,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(url).toBe('https://checkout.stripe.com/event/test');
  });

  it('uses $99 pricing for up to 100 attendees', async () => {
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/event/test' });

    await createEventLicenseCheckout({
      userId: 'user-123',
      eventName: 'Small Event',
      attendeeCapacity: 100,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({ unit_amount: 9900 }),
      })],
    }));
  });

  it('uses $199 pricing for 101–500 attendees', async () => {
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/event/test' });

    await createEventLicenseCheckout({
      userId: 'user-123',
      eventName: 'Medium Event',
      attendeeCapacity: 500,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({ unit_amount: 19900 }),
      })],
    }));
  });

  it('uses $499 pricing for over 500 attendees', async () => {
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/event/test' });

    await createEventLicenseCheckout({
      userId: 'user-123',
      eventName: 'Large Event',
      attendeeCapacity: 501,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({ unit_amount: 49900 }),
      })],
    }));
  });

  it('includes correct metadata', async () => {
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/event/test' });

    await createEventLicenseCheckout({
      userId: 'user-456',
      eventName: 'Conference',
      attendeeCapacity: 200,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      metadata: {
        userId: 'user-456',
        type: 'event_license',
        eventName: 'Conference',
        attendeeCapacity: '200',
      },
    }));
  });
});
