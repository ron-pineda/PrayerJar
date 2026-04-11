import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { prayerPartnerships, users } from '@/db/schema';
import { eq, and, or, gte, sql } from 'drizzle-orm';
import { subDays } from 'date-fns';
import {
  getActivePartnership,
  scoreMatchPair,
  createPartnership,
} from '@/services/partner.service';
import type { User, PrayerPartnership } from '@/db/schema';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Find all users without an active partnership.
  //    "Active" means they appear as userId OR partnerId on an active row.
  const activePartneredUserIds = await db
    .selectDistinct({ id: sql<string>`UNNEST(ARRAY[user_id::text, partner_id::text])` })
    .from(prayerPartnerships)
    .where(eq(prayerPartnerships.status, 'active'));

  const excludedIds = activePartneredUserIds.map((r) => r.id);

  let eligibleUsers: User[];
  if (excludedIds.length > 0) {
    eligibleUsers = await db
      .select()
      .from(users)
      .where(sql`${users.id} NOT IN (${sql.join(excludedIds.map((id) => sql`${id}`), sql`, `)})`);
  } else {
    eligibleUsers = await db.select().from(users);
  }

  if (eligibleUsers.length < 2) {
    return NextResponse.json({ matched: 0, message: 'Not enough eligible users' });
  }

  // 2. Load full partnership history for all eligible users (for 90-day exclusion + scoring).
  const eligibleIds = eligibleUsers.map((u) => u.id);

  const ninetyDaysAgo = subDays(new Date(), 90);

  // All partnerships involving any eligible user (any status) — used for never-matched bonus.
  const allHistory: PrayerPartnership[] = await db
    .select()
    .from(prayerPartnerships)
    .where(
      or(
        sql`${prayerPartnerships.userId} = ANY(ARRAY[${sql.join(eligibleIds.map((id) => sql`${id}::uuid`), sql`, `)}])`,
        sql`${prayerPartnerships.partnerId} = ANY(ARRAY[${sql.join(eligibleIds.map((id) => sql`${id}::uuid`), sql`, `)}])`,
      )
    );

  // Recent partnerships (last 90 days) — used to exclude re-matching.
  const recentHistory = allHistory.filter(
    (p) => p.matchedAt >= ninetyDaysAgo,
  );

  // Build a set of recently-matched pairs for O(1) lookup: "userId:partnerId" (sorted).
  const recentPairSet = new Set(
    recentHistory.map((p) => sortedPairKey(p.userId, p.partnerId)),
  );

  // 3. Score all valid pairs.
  type ScoredPair = { a: User; b: User; score: number };
  const scoredPairs: ScoredPair[] = [];

  for (let i = 0; i < eligibleUsers.length; i++) {
    for (let j = i + 1; j < eligibleUsers.length; j++) {
      const a = eligibleUsers[i];
      const b = eligibleUsers[j];

      // Skip if matched within last 90 days.
      if (recentPairSet.has(sortedPairKey(a.id, b.id))) continue;

      const score = await scoreMatchPair(a, b, allHistory);
      scoredPairs.push({ a, b, score });
    }
  }

  // 4. Greedy match: highest score first, remove matched users from pool.
  scoredPairs.sort((x, y) => y.score - x.score);

  const matched = new Set<string>();
  const created: string[] = [];

  for (const pair of scoredPairs) {
    if (matched.has(pair.a.id) || matched.has(pair.b.id)) continue;

    await createPartnership(pair.a.id, pair.b.id);
    matched.add(pair.a.id);
    matched.add(pair.b.id);
    created.push(`${pair.a.id}:${pair.b.id}`);
  }

  return NextResponse.json({ matched: created.length });
}

function sortedPairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
}
