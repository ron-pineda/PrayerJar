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
  contact: { limit: 3, windowMs: 60 * 60 * 1000 },
  report: { limit: 10, windowMs: 60 * 60 * 1000 },
};

// Global daily cap for Google Places API calls to stay within free tier.
// 150 searches/day × $0.037/search ≈ $5.55/day max → well within $200/month credit.
const GLOBAL_DAILY_SEARCH_LIMIT = 150;
const GLOBAL_SEARCH_KEY = 'church_search:global';

export async function checkRateLimit(
  action: keyof typeof WINDOWS,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
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
    const retryAfterMs = row.windowStart.getTime() + windowMs - Date.now();
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  await db
    .update(rateLimits)
    .set({ count: sql`count + 1` })
    .where(sql`id = ${row.id}`);

  return { allowed: true, remaining: limit - row.count - 1 };
}

export async function checkGlobalChurchSearchLimit(): Promise<boolean> {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [row] = await db
    .select()
    .from(rateLimits)
    .where(sql`key = ${GLOBAL_SEARCH_KEY} AND window_start > ${windowStart}`)
    .limit(1);

  if (!row) {
    await db.insert(rateLimits).values({ key: GLOBAL_SEARCH_KEY }).onConflictDoNothing();
    return true;
  }

  if (row.count >= GLOBAL_DAILY_SEARCH_LIMIT) return false;

  await db
    .update(rateLimits)
    .set({ count: sql`count + 1` })
    .where(sql`id = ${row.id}`);

  return true;
}
