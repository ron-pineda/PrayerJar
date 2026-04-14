import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession({
  userId,
  amountCents,
  successUrl,
  cancelUrl,
}: {
  userId?: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Donation to The Prayer Jar' },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: userId ?? '' },
  });
  return session.url!;
}

export async function createSubscriptionCheckout({
  userId,
  churchId,
  stripePriceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  churchId: string | null;
  stripePriceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: stripePriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, type: 'subscription', churchId: churchId ?? '' },
  });
  return session.url!;
}

export async function createEventLicenseCheckout({
  userId,
  eventName,
  attendeeCapacity,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  eventName: string;
  attendeeCapacity: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  // Price: $99 for up to 100 attendees, $199 for up to 500, $499 for unlimited
  const amountCents = attendeeCapacity <= 100 ? 9900 : attendeeCapacity <= 500 ? 19900 : 49900;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Event License: ${eventName}` },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, type: 'event_license', eventName, attendeeCapacity: String(attendeeCapacity) },
  });
  return session.url!;
}

export function constructStripeEvent(payload: string, sig: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  return Stripe.webhooks.constructEvent(payload, sig, secret);
}
