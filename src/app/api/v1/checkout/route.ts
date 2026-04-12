import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/services/billing.service';
import { auth } from '@/lib/auth';

const schema = z.object({
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
  const origin = req.headers.get('origin') ?? 'https://prayerjar.org';

  try {
    const url = await createCheckoutSession({
      userId,
      amountCents: result.data.amountCents,
      successUrl: `${origin}/give?success=1`,
      cancelUrl: `${origin}/give`,
    });
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'STRIPE_SECRET_KEY not configured') {
      return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
