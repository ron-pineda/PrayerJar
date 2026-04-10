import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { sql } from 'drizzle-orm';

const WINDOWS: Record<string, { limit: number; windowMs: number }> = {
  submit: { limit: 5, windowMs: 60 * 60 * 1000 },
  pray: { limit: 20, windowMs: 60 * 60 * 1000 },
  message: { limit: 10, windowMs: 60 * 60 * 1000 },
  salvation: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
  church_search: { limit: 30, windowMs: 60 * 60 * 1000 },
  church_geocode: { limit: 20, windowMs: 60 * 60 * 1000 },
  church_claim: { limit: 3, windowMs: 60 * 60 * 1000 },
  church_claim_verify: { limit: 10, windowMs: 60 * 60 * 1000 },
};

export async function checkRateLimit(
  action: keyof typeof WINDOWS,
  identifier: string
): Promise<{ allowed: boolean; remaining: number }> {
  const { limit, windowMs } = WINDOWS[action];
  const key = `${action}:${identifier}`;
  const windowStart = new Date(Date.now() - windowMs);

  const [row] = await db
    .select()
    .from(rateLimits)
    .where(sql`key = ${key} AND window_start > ${windowStart}`)
    .limit(1);

  if (!row) {
    await db.insert(rateLimits).values({ key }).onConflictDoNothing();
    return { allowed: true, remaining: limit - 1 };
  }

  if (row.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await db
    .update(rateLimits)
    .set({ count: sql`count + 1` })
    .where(sql`id = ${row.id}`);

  return { allowed: true, remaining: limit - row.count - 1 };
}
