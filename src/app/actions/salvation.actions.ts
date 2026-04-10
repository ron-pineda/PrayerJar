'use server';

import { db } from '@/db';
import { salvationDecisions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function logSalvationDecisionAction(name?: string): Promise<number> {
  const session = await auth();
  const headersList = await headers();

  const ip = headersList.get('x-forwarded-for') ?? 'unknown';
  const identifier = session?.user?.id ?? ip;
  const rateCheck = await checkRateLimit('salvation', identifier);
  if (!rateCheck.allowed) {
    throw new Error('Too many requests. Please try again later.');
  }

  const country =
    headersList.get('cf-ipcountry') ??
    headersList.get('x-vercel-ip-country') ??
    null;

  await db.insert(salvationDecisions).values({
    userId: session?.user?.id ?? null,
    name: name ?? null,
    country,
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salvationDecisions);

  return Number(count);
}
