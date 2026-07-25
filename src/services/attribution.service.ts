/**
 * Persists first-touch signup attribution onto the users row.
 *
 * Called once, from `events.createUser` in `src/lib/auth.ts`. See
 * `src/lib/attribution.ts` for why this — and not Vercel Web Analytics — is
 * the attribution system of record on the Hobby plan.
 */

import { cookies } from 'next/headers';
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  ATTRIBUTION_COOKIE,
  decodeAttribution,
  type Attribution,
} from '@/lib/attribution';

/**
 * Reads the `pj_attr` cookie and writes it onto the given user.
 *
 * The UPDATE is guarded by `acquisition_source IS NULL` so this is idempotent
 * and genuinely first-touch: a re-run can never overwrite a recorded channel.
 *
 * Returns the attribution written, or null when there was nothing to write
 * (no cookie, or the row was already stamped).
 */
export async function recordSignupAttribution(
  userId: string,
): Promise<Attribution | null> {
  const store = await cookies();
  const attribution = decodeAttribution(store.get(ATTRIBUTION_COOKIE)?.value);
  if (!attribution) return null;

  const updated = await db
    .update(users)
    .set({
      acquisitionSource: attribution.acquisitionSource,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      signupReferrer: attribution.referrer,
      signupLandingPath: attribution.landingPath,
    })
    .where(and(eq(users.id, userId), isNull(users.acquisitionSource)))
    .returning({ id: users.id });

  return updated.length > 0 ? attribution : null;
}
