import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/services/billing.service';
import { auth } from '@/lib/auth';

/**
 * Sprint 27 (pj-s27-02): this used to be a discriminated union over three
 * checkout types. `subscription` and `event_license` are gone; `donation` — which
 * is what /give calls — is all that remains, so the union collapses to one shape.
 *
 * Narrowing the schema is the point, not tidiness. Removing the pricing UI does
 * not make a POST endpoint unreachable: leaving the `subscription` branch in
 * place would let anyone post a Stripe price ID and buy a tier that no longer
 * exists anywhere in the product, with no way to manage or cancel it afterwards.
 *
 * `createSubscriptionCheckout` and `createEventLicenseCheckout` are deliberately
 * left intact in billing.service.ts for the future paid-tier rebuild — only their
 * HTTP entry points are removed.
 */
const schema = z.object({
  type: z.literal('donation'),
  amountCents: z.number().int().min(100).max(100000),
});

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
    const url = await createCheckoutSession({
      userId,
      amountCents: result.data.amountCents,
      successUrl: `${origin}/give?success=1`,
      cancelUrl: `${origin}/give`,
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
