import { db } from '@/db';
import { churches, churchMembers, prayers, groups, users, subscriptions } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Church, ChurchMember } from '@/db/schema';
import { PLANS } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';
import { logAuditEvent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Slug helper — converts "First Baptist" → "first-baptist-a3f2"
function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------

export async function getChurchTier(churchId: string): Promise<PlanTier> {
  const [row] = await db
    .select({ tier: subscriptions.tier, status: subscriptions.status })
    .from(churches)
    .leftJoin(subscriptions, eq(subscriptions.id, churches.subscriptionId))
    .where(eq(churches.id, churchId))
    .limit(1);

  if (row?.tier && row.status === 'active') return row.tier as PlanTier;
  return 'free';
}

// ---------------------------------------------------------------------------
// Task pj-s5.1-64: Church platform service
// ---------------------------------------------------------------------------

// Create a new church and add creator as admin member
export async function createChurch(params: {
  name: string;
  description?: string;
  welcomeMessage?: string;
  createdBy: string;
  /** UTM attribution fields — written at signup from the request URL or form. */
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}): Promise<Church> {
  const slug = generateSlug(params.name);

  // Derive acquisition_source from utm_source. Falls back to 'direct' when no
  // UTM is present so every church has a non-null source bucket in the dashboard.
  const acquisitionSource = params.utmSource ?? 'direct';

  const [church] = await db
    .insert(churches)
    .values({
      slug,
      name: params.name,
      description: params.description ?? null,
      welcomeMessage: params.welcomeMessage ?? null,
      createdBy: params.createdBy,
      utmSource: params.utmSource ?? null,
      utmMedium: params.utmMedium ?? null,
      utmCampaign: params.utmCampaign ?? null,
      acquisitionSource,
    })
    .returning();

  await db.insert(churchMembers).values({
    churchId: church.id,
    userId: params.createdBy,
    role: 'admin',
  });

  return church;
}

// Get church by ID (returns null if not found)
export async function getChurchById(id: string): Promise<Church | null> {
  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, id))
    .limit(1);
  return church ?? null;
}

// Get church by slug (returns null if not found)
export async function getChurchBySlug(slug: string): Promise<Church | null> {
  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);
  return church ?? null;
}

// Get the church a user admins or is a member of (first active church)
export async function getChurchForUser(
  userId: string,
): Promise<{ church: Church; role: string } | null> {
  const [row] = await db
    .select({
      church: churches,
      role: churchMembers.role,
    })
    .from(churchMembers)
    .innerJoin(churches, eq(churches.id, churchMembers.churchId))
    .where(eq(churchMembers.userId, userId))
    .limit(1);

  if (!row) return null;
  return { church: row.church, role: row.role };
}

// Get the platform church administered by a specific user (by userId).
// Used to link a Google Places claim to a platform church via the claimer's
// userId — the user who claimed the Google Places listing is expected to
// also be an admin of the corresponding platform church.
export async function getChurchByAdminUserId(
  userId: string,
): Promise<Church | null> {
  const [row] = await db
    .select({ church: churches })
    .from(churchMembers)
    .innerJoin(churches, eq(churches.id, churchMembers.churchId))
    .where(and(eq(churchMembers.userId, userId), eq(churchMembers.role, 'admin')))
    .limit(1);

  return row?.church ?? null;
}

// Add a user to a church (default role: 'member'). No-op if already a member.
// actorUserId is the admin/pastor performing the action (for audit logging).
export async function addChurchMember(
  churchId: string,
  userId: string,
  role: 'admin' | 'pastor' | 'member' = 'member',
  actorUserId?: string,
): Promise<void> {
  const tier = await getChurchTier(churchId);
  const limit = PLANS[tier].limits.members;

  if (limit !== null) {
    const [{ value: currentCount }] = await db
      .select({ value: count() })
      .from(churchMembers)
      .where(eq(churchMembers.churchId, churchId));
    if (Number(currentCount) >= limit) {
      throw new Error('Member limit reached for your plan. Upgrade to add more members.');
    }
  }

  await db
    .insert(churchMembers)
    .values({ churchId, userId, role })
    .onConflictDoNothing();

  await logAuditEvent({
    churchId,
    actorUserId: actorUserId ?? null,
    action: 'member.add',
    targetType: 'user',
    targetId: userId,
    metadata: { role },
  });
}

// Remove a user from a church
// actorUserId is the admin/pastor performing the removal (for audit logging).
export async function removeChurchMember(
  churchId: string,
  userId: string,
  actorUserId?: string,
): Promise<void> {
  await db
    .delete(churchMembers)
    .where(and(eq(churchMembers.churchId, churchId), eq(churchMembers.userId, userId)));

  await logAuditEvent({
    churchId,
    actorUserId: actorUserId ?? null,
    action: 'member.remove',
    targetType: 'user',
    targetId: userId,
  });
}

// Change a church member's role (admin/pastor/member).
// actorUserId is the admin performing the change (for audit logging).
export async function updateChurchMemberRole(
  churchId: string,
  userId: string,
  newRole: 'admin' | 'pastor' | 'member',
  actorUserId?: string,
): Promise<void> {
  await db
    .update(churchMembers)
    .set({ role: newRole })
    .where(and(eq(churchMembers.churchId, churchId), eq(churchMembers.userId, userId)));

  await logAuditEvent({
    churchId,
    actorUserId: actorUserId ?? null,
    action: 'role.change',
    targetType: 'user',
    targetId: userId,
    metadata: { newRole },
  });
}

// Delete a prayer on behalf of a church admin (bypasses owner check).
// actorUserId is the admin performing the deletion (for audit logging).
export async function deleteChurchPrayerAsAdmin(
  churchId: string,
  prayerId: string,
  actorUserId?: string,
): Promise<boolean> {
  const result = await db
    .delete(prayers)
    .where(and(eq(prayers.id, prayerId), eq(prayers.churchId, churchId)))
    .returning({ id: prayers.id });

  if (result.length > 0) {
    await logAuditEvent({
      churchId,
      actorUserId: actorUserId ?? null,
      action: 'prayer.delete',
      targetType: 'prayer',
      targetId: prayerId,
    });
  }

  return result.length > 0;
}

// Update welcome message
export async function updateWelcomeMessage(churchId: string, message: string): Promise<void> {
  await db
    .update(churches)
    .set({ welcomeMessage: message, updatedAt: new Date() })
    .where(eq(churches.id, churchId));
}

// Get all members of a church with their user info
export async function getChurchMembers(
  churchId: string,
): Promise<Array<{ member: ChurchMember; user: { id: string; name: string | null; email: string | null } }>> {
  const rows = await db
    .select({
      member: churchMembers,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(churchMembers)
    .innerJoin(users, eq(users.id, churchMembers.userId))
    .where(eq(churchMembers.churchId, churchId));

  return rows;
}

// Get prayers scoped to a church (most recent first, limit 50)
export async function getChurchPrayers(
  churchId: string,
): Promise<typeof prayers.$inferSelect[]> {
  return db
    .select()
    .from(prayers)
    .where(eq(prayers.churchId, churchId))
    .orderBy(desc(prayers.createdAt))
    .limit(50);
}

// Get groups scoped to a church
export async function getChurchGroups(
  churchId: string,
): Promise<typeof groups.$inferSelect[]> {
  return db
    .select()
    .from(groups)
    .where(eq(groups.churchId, churchId));
}
