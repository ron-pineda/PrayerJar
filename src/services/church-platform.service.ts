import { db } from '@/db';
import { churches, churchMembers, prayers, groups, users, subscriptions } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Church, ChurchMember } from '@/db/schema';
import { PLANS } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

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
}): Promise<Church> {
  const slug = generateSlug(params.name);

  const [church] = await db
    .insert(churches)
    .values({
      slug,
      name: params.name,
      description: params.description ?? null,
      welcomeMessage: params.welcomeMessage ?? null,
      createdBy: params.createdBy,
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

// Add a user to a church (default role: 'member'). No-op if already a member.
export async function addChurchMember(
  churchId: string,
  userId: string,
  role: 'admin' | 'pastor' | 'member' = 'member',
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
}

// Remove a user from a church
export async function removeChurchMember(churchId: string, userId: string): Promise<void> {
  await db
    .delete(churchMembers)
    .where(and(eq(churchMembers.churchId, churchId), eq(churchMembers.userId, userId)));
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
