'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import {
  churchLegalAcceptances,
  churchMembers,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { DPA_VERSION } from './constants';

/**
 * acceptDpa — server action
 *
 * Records a click-through DPA acceptance by an authenticated church admin or pastor.
 * The user must be an admin or pastor of the given church.
 *
 * Returns { success: true } on success or { error: string } on failure.
 */
export async function acceptDpa(
  churchId: string,
  documentVersion: string = DPA_VERSION,
): Promise<{ success: true } | { error: string }> {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be signed in to accept this agreement.' };
  }
  const userId = session.user.id;

  // Verify the user is admin or pastor of this church
  const [membership] = await db
    .select({ role: churchMembers.role })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, churchId),
        eq(churchMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { error: 'You are not a member of this church.' };
  }

  if (membership.role !== 'admin' && membership.role !== 'pastor') {
    return {
      error:
        'Only church administrators and pastors may accept this agreement on behalf of their church.',
    };
  }

  // Capture IP for legal record
  const headerList = await headers();
  const ipAddress =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  try {
    await db.insert(churchLegalAcceptances).values({
      churchId,
      userId,
      documentType: 'dpa',
      documentVersion,
      ipAddress,
    });

    return { success: true };
  } catch {
    return { error: 'Failed to record acceptance. Please try again.' };
  }
}
