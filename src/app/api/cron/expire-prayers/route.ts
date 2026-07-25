import { NextRequest, NextResponse } from 'next/server';
import { expireOverduePrayers } from '@/services/prayer.service';

/**
 * Prayer expiry is SUSPENDED (Ron, 2026-07-25).
 *
 * Why: 30-day auto-expiry was designed for a populated wall. At cold-start
 * scale it guaranteed an empty one — every prayer in production had expired,
 * so /browse rendered "Be the first to share a prayer" to every new visitor
 * while real prayers sat hidden behind `status: 'expired'`.
 *
 * There are two independent locks, both deliberate:
 *   1. the `expire-prayers` entry is removed from vercel.json, so nothing
 *      invokes this route on a schedule;
 *   2. this env gate, so a manual call or a re-added cron entry is still a
 *      no-op until someone explicitly opts back in.
 *
 * TO RE-ENABLE, read this first: prayers still carry `expiresAt` 30 days out
 * from creation, and nothing has been resetting it. Flipping this on will
 * expire everything already past due in a single pass. Bump `expiresAt` on
 * the prayers you intend to keep BEFORE setting this, or you will empty the
 * wall again in one cron tick — which is the exact failure this suspension
 * exists to undo.
 */
const EXPIRY_ENABLED = process.env.PRAYER_EXPIRY_ENABLED === 'true';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!EXPIRY_ENABLED) {
    return NextResponse.json({
      expired: 0,
      suspended: true,
      reason:
        'Prayer expiry is suspended. Set PRAYER_EXPIRY_ENABLED=true to resume — but bump expiresAt on prayers you intend to keep first.',
    });
  }

  const expired = await expireOverduePrayers();
  return NextResponse.json({ expired: expired.length });
}
