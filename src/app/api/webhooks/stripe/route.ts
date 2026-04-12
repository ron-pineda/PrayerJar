import { NextRequest, NextResponse } from 'next/server';
import { constructStripeEvent } from '@/services/billing.service';
import { evaluateDonorBadge } from '@/services/badge.service';
import { db } from '@/db';
import { donations } from '@/db/schema';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const payload = await req.text();

  let event;
  try {
    event = constructStripeEvent(payload, sig);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId || null;
    const amountCents = session.amount_total ?? 0;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id);

    await db.insert(donations).values({
      userId: userId || null,
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      currency: session.currency ?? 'usd',
      status: 'succeeded',
    });

    if (userId) {
      await evaluateDonorBadge(userId);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
