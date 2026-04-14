import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession, createSubscriptionCheckout, createEventLicenseCheckout } from '@/services/billing.service';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churchMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('donation'),
    amountCents: z.number().int().min(100).max(100000),
  }),
  z.object({
    type: z.literal('subscription'),
    stripePriceId: z.string().min(1),
  }),
  z.object({
    type: z.literal('event_license'),
    eventName: z.string().min(1).max(100),
    attendeeCapacity: z.number().int().min(1).max(10000),
  }),
]);

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org';

  try {
    const data = result.data;

    if (data.type === 'donation') {
      const url = await createCheckoutSession({
        userId,
        amountCents: data.amountCents,
        successUrl: `${origin}/give?success=1`,
        cancelUrl: `${origin}/give`,
      });
      return NextResponse.json({ url }, { status: 200 });
    }

    if (data.type === 'subscription') {
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const membership = await db.query.churchMembers.findFirst({
        where: and(eq(churchMembers.userId, userId), eq(churchMembers.role, 'admin')),
      });
      const url = await createSubscriptionCheckout({
        userId,
        churchId: membership?.churchId ?? null,
        stripePriceId: data.stripePriceId,
        successUrl: `${origin}/billing?success=1`,
        cancelUrl: `${origin}/billing`,
      });
      return NextResponse.json({ url }, { status: 200 });
    }

    // event_license
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const url = await createEventLicenseCheckout({
      userId,
      eventName: data.eventName,
      attendeeCapacity: data.attendeeCapacity,
      successUrl: `${origin}/events?success=1`,
      cancelUrl: `${origin}/events`,
    });
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not configured')) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if ((err as any)?.type?.startsWith('Stripe')) {
      console.error('Stripe error:', (err as any).type, (err as any).message);
      return NextResponse.json({ error: 'Payment provider error. Please try again.' }, { status: 502 });
    }
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
