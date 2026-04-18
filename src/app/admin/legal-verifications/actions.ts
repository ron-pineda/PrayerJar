'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { nonprofitVerifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function reviewNonprofitVerification(
  verificationId: string,
  decision: 'verified' | 'rejected',
  notes?: string,
): Promise<{ success: true } | { error: string }> {
  const { email } = await requireAdmin();

  try {
    await db
      .update(nonprofitVerifications)
      .set({
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: email,
        reviewNotes: notes ?? null,
      })
      .where(eq(nonprofitVerifications.id, verificationId));

    return { success: true };
  } catch {
    return { error: 'Failed to update verification record.' };
  }
}
