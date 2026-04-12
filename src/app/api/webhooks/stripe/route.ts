import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { constructStripeEvent } from '@/services/billing.service';
import { evaluateDonorBadge } from '@/services/badge.service';
import { getPlanByStripePriceId } from '@/lib/plans';
import { db } from '@/db';
import { donations, subscriptions, eventLicenses } from '@/db/schema';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

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
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId || null;
    const type = session.metadata?.type;

    if (type === 'subscription') {
      if (!userId) {
        console.error('Subscription checkout completed without userId');
        return NextResponse.json({ received: true });
      }
      try {
        const stripe = getStripe();
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const item = stripeSubscription.items.data[0];
        const plan = getPlanByStripePriceId(item.price.id);
        await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: item.price.id,
          tier: plan?.tier ?? 'starter',
          status: 'active',
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
        }).onConflictDoNothing();
      } catch (err) {
        console.error('Webhook subscription processing error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }
    } else if (type === 'event_license') {
      if (!userId) {
        console.error('Event license checkout completed without userId');
        return NextResponse.json({ received: true });
      }
      const eventName = session.metadata?.eventName ?? '';
      const attendeeCapacity = parseInt(session.metadata?.attendeeCapacity ?? '100', 10);
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? session.id);

      try {
        const now = new Date();
        const validUntil = new Date(now);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        await db.insert(eventLicenses).values({
          userId,
          stripePaymentIntentId: paymentIntentId,
          eventName,
          attendeeCapacity,
          validFrom: now,
          validUntil,
        }).onConflictDoNothing();
      } catch (err) {
        console.error('Webhook event license processing error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }
    } else {
      // donation (default)
      const amountCents = session.amount_total ?? 0;
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? session.id);

      const existing = await db.query.donations.findFirst({
        where: eq(donations.stripePaymentIntentId, paymentIntentId),
      });
      if (existing) return NextResponse.json({ received: true });

      try {
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
      } catch (err) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }
    }
  } else if (event.type === 'customer.subscription.updated') {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    const item = stripeSubscription.items.data[0];
    try {
      const result = await db
        .update(subscriptions)
        .set({
          status: stripeSubscription.status as (typeof subscriptions.$inferSelect)['status'],
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
        .returning({ id: subscriptions.id });

      if (result.length === 0) {
        console.error(`subscription.updated: no subscription found for ${stripeSubscription.id}`);
        // Return 200 so Stripe doesn't retry — this may be a race with checkout.session.completed
        return NextResponse.json({ received: true });
      }
    } catch (err) {
      console.error('Webhook subscription update error:', err);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    try {
      await db
        .update(subscriptions)
        .set({ status: 'canceled', updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));
    } catch (err) {
      console.error('Webhook subscription delete error:', err);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
