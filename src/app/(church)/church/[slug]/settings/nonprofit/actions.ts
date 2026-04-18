'use server';

import { put } from '@vercel/blob';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churchMembers, nonprofitVerifications, churches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB — IRS determination letters can be multi-page

/**
 * submitNonprofitVerification — server action
 *
 * Uploads the IRS determination letter PDF to Vercel Blob and creates a
 * `nonprofit_verifications` row with status='pending'. Admin reviews at
 * /admin/legal-verifications.
 */
export async function submitNonprofitVerification(
  churchId: string,
  formData: FormData,
): Promise<{ success: true; verificationId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be signed in to submit this form.' };
  }
  const userId = session.user.id;

  // Verify user is admin of this church
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

  if (!membership || (membership.role !== 'admin' && membership.role !== 'pastor')) {
    return { error: 'Only church administrators may submit 501(c)(3) verification.' };
  }

  const file = formData.get('determination_letter') as File | null;
  if (!file) {
    return { error: 'No file provided.' };
  }

  if (file.type !== 'application/pdf') {
    return { error: 'Only PDF files are accepted for IRS determination letters.' };
  }

  if (file.size > MAX_PDF_SIZE) {
    return { error: 'File too large. Maximum size is 10 MB.' };
  }

  const ein = (formData.get('ein') as string | null)?.trim() ?? null;
  const legalName = (formData.get('legal_name') as string | null)?.trim() ?? null;

  // Upload to Vercel Blob
  let blobUrl: string;
  try {
    const blob = await put(
      `nonprofit-verifications/${churchId}/${crypto.randomUUID()}.pdf`,
      file,
      { access: 'public', contentType: 'application/pdf' },
    );
    blobUrl = blob.url;
  } catch {
    return { error: 'Upload failed. Please try again.' };
  }

  // Insert verification record
  try {
    const [row] = await db
      .insert(nonprofitVerifications)
      .values({
        churchId,
        submittedByUserId: userId,
        ein: ein ?? undefined,
        legalName: legalName ?? undefined,
        determinationLetterUrl: blobUrl,
        status: 'pending',
      })
      .returning({ id: nonprofitVerifications.id });

    return { success: true, verificationId: row.id };
  } catch {
    return { error: 'Failed to record submission. Please try again.' };
  }
}
