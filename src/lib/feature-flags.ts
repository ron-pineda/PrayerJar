import { db } from '@/db';
import { featureFlags } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if a feature flag is enabled.
 * A flag is enabled if:
 *   1. isEnabled is true AND allowedUserIds is empty (enabled for everyone), OR
 *   2. isEnabled is true AND userId is in allowedUserIds (enabled for specific users)
 *
 * If the flag key doesn't exist in DB, returns false.
 */
export async function isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
  const flag = await db.query.featureFlags.findFirst({
    where: eq(featureFlags.key, key),
  });

  if (!flag || !flag.isEnabled) return false;

  // If allowedUserIds is empty, enabled for all
  if (flag.allowedUserIds.length === 0) return true;

  // Otherwise, only enabled for listed users
  return userId ? flag.allowedUserIds.includes(userId) : false;
}

// Pre-defined flag keys to avoid magic strings
export const FLAGS = {
  PRAYER_MAP: 'prayer_map',
  WRAPPED: 'wrapped',
  WORLD_PRAYER: 'world_prayer',
  CAMPAIGNS: 'campaigns',
  /** Global kill-switch for the PCO weekly summary scheduler (pj-s22-09).
   *  Opt-out model: missing row = enabled. Set isEnabled = false to pause. */
  PCO_SUMMARY_SCHEDULER: 'pco_summary_scheduler',
} as const;
