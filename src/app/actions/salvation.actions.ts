'use server';

import { db } from '@/db';
import { salvationDecisions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function logSalvationDecisionAction(name?: string): Promise<number> {
  const [session, headersList] = await Promise.all([auth(), headers()]);

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
