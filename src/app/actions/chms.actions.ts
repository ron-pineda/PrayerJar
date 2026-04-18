'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { churches, churchMembers, chmsSyncJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAdapterForChurch } from '@/lib/chms/providers';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────
// Auth helper: verify user is admin/pastor of given church
// ─────────────────────────────────────────────────────────────

async function requireChurchAdmin(churchId: string): Promise<{ error: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated.' };

  const members = await db
    .select({ role: churchMembers.role })
    .from(churchMembers)
    .where(eq(churchMembers.churchId, churchId))
    .then((rows) => rows.filter((r) => r.role === 'admin' || r.role === 'pastor'));

  // Find this user's membership
  const allMembersForChurch = await db
    .select({ userId: churchMembers.userId, role: churchMembers.role })
    .from(churchMembers)
    .where(eq(churchMembers.churchId, churchId));

  const currentMember = allMembersForChurch.find((m) => m.userId === session.user!.id);

  if (!currentMember || (currentMember.role !== 'admin' && currentMember.role !== 'pastor')) {
    return { error: 'You do not have permission to manage this church.' };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// disconnectChmsAction
// ─────────────────────────────────────────────────────────────

export async function disconnectChmsAction(
  churchId: string
): Promise<{ success: true } | { error: string }> {
  const authError = await requireChurchAdmin(churchId);
  if (authError) return authError;

  try {
    const adapter = await getAdapterForChurch(churchId);
    await adapter.disconnect(churchId);
    revalidatePath(`/church`); // broad revalidate — slug unknown here
    return { success: true };
  } catch (err) {
    console.error('[disconnectChmsAction]', err);
    return { error: err instanceof Error ? err.message : 'Failed to disconnect.' };
  }
}

// ─────────────────────────────────────────────────────────────
// triggerFullSyncAction
// ─────────────────────────────────────────────────────────────

export async function triggerFullSyncAction(
  churchId: string
): Promise<{ success: true } | { error: string }> {
  const authError = await requireChurchAdmin(churchId);
  if (authError) return authError;

  try {
    // Confirm church has a provider before queuing
    const [church] = await db
      .select({ chmsProvider: churches.chmsProvider })
      .from(churches)
      .where(eq(churches.id, churchId))
      .limit(1);

    if (!church?.chmsProvider) {
      return { error: 'No ChMS provider connected to this church.' };
    }

    await db.insert(chmsSyncJobs).values({
      churchId,
      provider: church.chmsProvider,
      jobType: 'full_sync',
      status: 'pending',
      nextAttemptAt: new Date(),
    });

    revalidatePath(`/church`);
    return { success: true };
  } catch (err) {
    console.error('[triggerFullSyncAction]', err);
    return { error: err instanceof Error ? err.message : 'Failed to queue sync job.' };
  }
}
