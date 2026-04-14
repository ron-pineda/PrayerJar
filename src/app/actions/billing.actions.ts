'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { createSubscriptionCheckout } from '@/services/billing.service';
import { PLANS } from '@/lib/plans';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org';

export type BillingActionResult = { url: string } | { error: string };

export async function createCheckoutAction(
  tier: string,
  billing: 'monthly' | 'yearly'
): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'Payments are not configured.' };
  }

  const plan = PLANS[tier as keyof typeof PLANS];
  if (!plan) return { error: 'Invalid plan.' };

  const stripePriceId =
    billing === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

  if (!stripePriceId) {
    return { error: 'This plan is not available for purchase. Please contact sales.' };
  }

  try {
    const url = await createSubscriptionCheckout({
      userId,
      stripePriceId,
      successUrl: `${origin}/billing?success=1`,
      cancelUrl: `${origin}/billing`,
    });
    return { url };
  } catch (err) {
    console.error('[createCheckoutAction]', err);
    if ((err as any)?.type?.startsWith('Stripe')) {
      return { error: 'Payment provider error. Please try again.' };
    }
    return { error: 'Something went wrong. Please try again.' };
  }
}

export type CancelResult = { success: true } | { error: string };

export async function cancelSubscriptionAction(): Promise<CancelResult> {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'Payments are not configured.' };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    ),
  });

  if (!subscription) {
    return { error: 'No active subscription found.' };
  }

  if (subscription.cancelAtPeriodEnd) {
    return { error: 'Subscription is already scheduled for cancellation.' };
  }

  try {
    const stripe = getStripe();
    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // current_period_end is present at runtime but the SDK Response<T> wrapper
    // doesn't expose it in its type — cast to access it safely.
    const periodEnd = (updated as unknown as { current_period_end: number }).current_period_end;

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    revalidatePath('/billing');
    return { success: true };
  } catch (err) {
    console.error('[cancelSubscriptionAction]', err);
    if ((err as any)?.type?.startsWith('Stripe')) {
      return { error: 'Payment provider error. Please try again.' };
    }
    return { error: 'Something went wrong. Please try again.' };
  }
}
