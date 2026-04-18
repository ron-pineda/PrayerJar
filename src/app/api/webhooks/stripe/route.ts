import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { constructStripeEvent } from '@/services/billing.service';
import { evaluateDonorBadge } from '@/services/badge.service';
import { getPlanByStripePriceId } from '@/lib/plans';
import { db } from '@/db';
import { donations, subscriptions, eventLicenses, churches } from '@/db/schema';
import { logAuditEvent } from '@/lib/audit';
import { trackPlanActivated, trackPlanUpgraded } from '@/lib/analytics.server';

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
      const churchId = session.metadata?.churchId || null;
      try {
        const stripe = getStripe();
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const item = stripeSubscription.items.data[0];
        const plan = getPlanByStripePriceId(item.price.id);
        const resolvedTier = plan?.tier ?? 'starter';
        const [inserted] = await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: item.price.id,
          tier: resolvedTier,
          status: 'active',
          currentPeriodStart: new Date((item as any).current_period_start * 1000),
          currentPeriodEnd: new Date((item as any).current_period_end * 1000),
        }).onConflictDoNothing().returning({ id: subscriptions.id });

        // Link the subscription to the church so getChurchTier() resolves correctly
        // and materialize acquisition/MRR columns (pj-s17-mrr-dashboard).
        if (inserted?.id && churchId) {
          await db
            .update(churches)
            .set({
              subscriptionId: inserted.id,
              firstPaidAt: sql`COALESCE(${churches.firstPaidAt}, NOW())`,
              previousPlan: sql`${churches.currentPlan}`,
              currentPlan: resolvedTier,
              updatedAt: new Date(),
            })
            .where(eq(churches.id, churchId));
        }

        // Funnel event — plan_activated fires on first paid subscription.
        // checkout.session.completed is the authoritative first-payment signal.
        if (inserted?.id) {
          const billingInterval =
            item.price.recurring?.interval === 'year' ? 'annual' : 'monthly';
          void trackPlanActivated({
            user_id: userId,
            church_id: churchId ?? '',
            plan: resolvedTier,
            billing_interval: billingInterval,
            stripe_subscription_id: stripeSubscription.id,
          });
        }
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
      const newPlan = getPlanByStripePriceId(item.price.id);
      const newTier = newPlan?.tier ?? 'starter';

      const result = await db
        .update(subscriptions)
        .set({
          status: stripeSubscription.status as (typeof subscriptions.$inferSelect)['status'],
          tier: newTier,
          stripePriceId: item.price.id,
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
        .returning({ id: subscriptions.id, userId: subscriptions.userId });

      if (result.length === 0) {
        console.error(`subscription.updated: no subscription found for ${stripeSubscription.id}`);
        // Return 200 so Stripe doesn't retry — this may be a race with checkout.session.completed
        return NextResponse.json({ received: true });
      }

      // Materialize plan change + detect downgrade-to-free for the MRR
      // dashboard (pj-s17-mrr-dashboard). We capture previousPlan here so a
      // downgrade surfaces as contraction/churn in the next dashboard read.
      const churchRows = await db
        .update(churches)
        .set({
          previousPlan: sql`${churches.currentPlan}`,
          currentPlan: newTier,
          updatedAt: new Date(),
        })
        .where(eq(churches.subscriptionId, result[0].id))
        .returning({
          id: churches.id,
          currentPlan: churches.currentPlan,
          previousPlan: churches.previousPlan,
          firstPaidAt: churches.firstPaidAt,
        });

      // Tier ordering used to distinguish upgrades from downgrades.
      const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2, enterprise: 3 };
      const subscriptionUserId = result[0].userId;
      const billingIntervalUpdated =
        item.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

      for (const row of churchRows) {
        // Log a structured churn event when a paid church drops to free.
        if (row.previousPlan && row.previousPlan !== 'free' && row.currentPlan === 'free') {
          console.log(JSON.stringify({
            event: 'churn.downgrade',
            churchId: row.id,
            fromTier: row.previousPlan,
            toTier: row.currentPlan,
            source: 'subscription.updated',
          }));
        }

        // Funnel event — plan_upgraded fires when a church moves to a higher tier.
        const prevOrder = TIER_ORDER[row.previousPlan ?? 'free'] ?? 0;
        const nextOrder = TIER_ORDER[row.currentPlan] ?? 0;
        if (
          row.previousPlan &&
          row.previousPlan !== row.currentPlan &&
          nextOrder > prevOrder
        ) {
          const daysSinceActivation = row.firstPaidAt
            ? Math.floor((Date.now() - new Date(row.firstPaidAt).getTime()) / 86_400_000)
            : 0;
          void trackPlanUpgraded({
            user_id: subscriptionUserId ?? '',
            church_id: row.id,
            from_plan: row.previousPlan,
            to_plan: row.currentPlan,
            billing_interval: billingIntervalUpdated,
            days_since_activation: daysSinceActivation,
            stripe_subscription_id: stripeSubscription.id,
          });
        }

        // Audit log the plan change (actorUserId is null — Stripe triggered it).
        await logAuditEvent({
          churchId: row.id,
          actorUserId: null,
          action: 'plan.change',
          targetType: 'church',
          targetId: row.id,
          metadata: {
            fromPlan: row.previousPlan ?? 'unknown',
            toPlan: row.currentPlan,
            source: 'stripe.subscription.updated',
          },
        });
      }
    } catch (err) {
      console.error('Webhook subscription update error:', err);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    try {
      const result = await db
        .update(subscriptions)
        .set({ status: 'canceled', updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
        .returning({ id: subscriptions.id });

      // Drop the church back to free and fire churn event (pj-s17-mrr-dashboard).
      if (result[0]?.id) {
        const churchRows = await db
          .update(churches)
          .set({
            previousPlan: sql`${churches.currentPlan}`,
            currentPlan: 'free',
            updatedAt: new Date(),
          })
          .where(eq(churches.subscriptionId, result[0].id))
          .returning({ id: churches.id, previousPlan: churches.previousPlan });

        for (const row of churchRows) {
          if (row.previousPlan && row.previousPlan !== 'free') {
            console.log(JSON.stringify({
              event: 'churn.canceled',
              churchId: row.id,
              fromTier: row.previousPlan,
              toTier: 'free',
              source: 'subscription.deleted',
            }));
          }
        }
      }
    } catch (err) {
      console.error('Webhook subscription delete error:', err);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
