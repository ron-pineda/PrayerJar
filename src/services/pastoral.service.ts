import { db } from '@/db';
import {
  prayerFlags,
  pastoralNotes,
  prayerAssignments,
  prayers,
  users,
  churchMembers,
} from '@/db/schema';
import { eq, and, inArray, desc, count } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FlaggedPrayer = {
  flagId: string;
  reason: string;
  aiConfidence: number | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  prayer: { id: string; content: string; category: string; isAnonymous: boolean };
  author: { id: string; name: string | null } | null;
};

export type PastoralNoteRecord = {
  id: string;
  prayerId: string | null;
  memberId: string | null;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Assignment = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  prayer: { id: string; content: string; category: string };
  assignedTo: { id: string; name: string | null; email: string | null };
  assignedBy: { id: string; name: string | null };
};

export type PrayerFlagReason =
  | 'self_harm'
  | 'crisis'
  | 'abuse'
  | 'inappropriate'
  | 'spam'
  | 'other';

export type PrayerAssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'praying'
  | 'completed';

// ---------------------------------------------------------------------------
// Aliases for joined user tables (drizzle requires aliased tables for self-joins)
// ---------------------------------------------------------------------------

// We alias users twice when we need both assignedTo and assignedBy columns.
// Drizzle's alias helper works at the ORM level; for the service we use
// explicit select objects to pick the columns we need from each join.

// ---------------------------------------------------------------------------
// Flagged Prayers
// ---------------------------------------------------------------------------

export async function getFlaggedPrayers(churchId: string): Promise<FlaggedPrayer[]> {
  const rows = await db
    .select({
      flagId: prayerFlags.id,
      reason: prayerFlags.reason,
      aiConfidence: prayerFlags.aiConfidence,
      status: prayerFlags.status,
      notes: prayerFlags.notes,
      createdAt: prayerFlags.createdAt,
      prayerId: prayers.id,
      prayerContent: prayers.content,
      prayerCategory: prayers.category,
      prayerIsAnonymous: prayers.isAnonymous,
      authorId: users.id,
      authorName: users.name,
    })
    .from(prayerFlags)
    .innerJoin(prayers, eq(prayers.id, prayerFlags.prayerId))
    .innerJoin(users, eq(users.id, prayers.authorId))
    .where(and(eq(prayerFlags.churchId, churchId), eq(prayerFlags.status, 'pending')))
    .orderBy(desc(prayerFlags.createdAt))
    .limit(100);

  return rows.map((r) => ({
    flagId: r.flagId,
    reason: r.reason,
    aiConfidence: r.aiConfidence,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    prayer: {
      id: r.prayerId,
      content: r.prayerContent,
      category: r.prayerCategory,
      isAnonymous: r.prayerIsAnonymous,
    },
    author: { id: r.authorId, name: r.authorName },
  }));
}

export async function flagPrayer(
  prayerId: string,
  churchId: string,
  reason: PrayerFlagReason,
  aiConfidence?: number,
): Promise<void> {
  await db.insert(prayerFlags).values({
    prayerId,
    churchId,
    reason,
    aiConfidence: aiConfidence ?? null,
  });
}

export async function reviewFlag(
  flagId: string,
  reviewerId: string,
  status: 'reviewed' | 'dismissed' | 'escalated',
  notes?: string,
): Promise<void> {
  await db
    .update(prayerFlags)
    .set({
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      ...(notes !== undefined ? { notes } : {}),
    })
    .where(eq(prayerFlags.id, flagId));
}

// ---------------------------------------------------------------------------
// Pastoral Care Notes
// ---------------------------------------------------------------------------

export async function getPastoralNotes(
  churchId: string,
  options?: { prayerId?: string; memberId?: string },
): Promise<PastoralNoteRecord[]> {
  const conditions = [eq(pastoralNotes.churchId, churchId)];
  if (options?.prayerId) conditions.push(eq(pastoralNotes.prayerId, options.prayerId));
  if (options?.memberId) conditions.push(eq(pastoralNotes.memberId, options.memberId));

  const rows = await db
    .select()
    .from(pastoralNotes)
    .where(and(...conditions))
    .orderBy(desc(pastoralNotes.createdAt))
    .limit(50);

  return rows.map((r) => ({
    id: r.id,
    prayerId: r.prayerId,
    memberId: r.memberId,
    authorId: r.authorId,
    content: r.content,
    isPrivate: r.isPrivate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function createPastoralNote(note: {
  churchId: string;
  prayerId?: string;
  memberId?: string;
  authorId: string;
  content: string;
  isPrivate?: boolean;
}): Promise<PastoralNoteRecord> {
  const [created] = await db
    .insert(pastoralNotes)
    .values({
      churchId: note.churchId,
      prayerId: note.prayerId ?? null,
      memberId: note.memberId ?? null,
      authorId: note.authorId,
      content: note.content,
      isPrivate: note.isPrivate ?? true,
    })
    .returning();

  return {
    id: created.id,
    prayerId: created.prayerId,
    memberId: created.memberId,
    authorId: created.authorId,
    content: created.content,
    isPrivate: created.isPrivate,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Prayer Assignments
// ---------------------------------------------------------------------------

async function fetchAssignments(
  extraCondition?: Parameters<typeof and>[0],
): Promise<Assignment[]> {
  // We need two aliased user joins. Drizzle supports this via alias().
  // To avoid runtime import complexity in tests, we pull both columns from
  // separate selects. Instead, we do a single join for assignedTo and a
  // separate join for assignedBy using Drizzle's aliased table approach.
  // Since drizzle-orm alias requires importing `alias`, we use inline aliased
  // columns through a slightly different pattern: two separate selects joined.
  //
  // Simplest correct approach: join users once for assignedTo, then resolve
  // assignedBy in a second pass. However that is N+1. The correct drizzle way
  // is to use `alias` from 'drizzle-orm/pg-core'. Let's do that.

  const { alias } = await import('drizzle-orm/pg-core');
  const assignedToUser = alias(users, 'assigned_to_user');
  const assignedByUser = alias(users, 'assigned_by_user');

  const conditions = [extraCondition].filter(Boolean) as Parameters<typeof and>;

  const rows = await db
    .select({
      id: prayerAssignments.id,
      status: prayerAssignments.status,
      notes: prayerAssignments.notes,
      createdAt: prayerAssignments.createdAt,
      prayerId: prayers.id,
      prayerContent: prayers.content,
      prayerCategory: prayers.category,
      assignedToId: assignedToUser.id,
      assignedToName: assignedToUser.name,
      assignedToEmail: assignedToUser.email,
      assignedById: assignedByUser.id,
      assignedByName: assignedByUser.name,
    })
    .from(prayerAssignments)
    .innerJoin(prayers, eq(prayers.id, prayerAssignments.prayerId))
    .innerJoin(assignedToUser, eq(assignedToUser.id, prayerAssignments.assignedTo))
    .innerJoin(assignedByUser, eq(assignedByUser.id, prayerAssignments.assignedBy))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(prayerAssignments.createdAt))
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    prayer: { id: r.prayerId, content: r.prayerContent, category: r.prayerCategory },
    assignedTo: { id: r.assignedToId, name: r.assignedToName, email: r.assignedToEmail },
    assignedBy: { id: r.assignedById, name: r.assignedByName },
  }));
}

export async function getChurchAssignments(churchId: string): Promise<Assignment[]> {
  return fetchAssignments(eq(prayerAssignments.churchId, churchId));
}

export async function getMemberAssignments(
  userId: string,
  churchId: string,
): Promise<Assignment[]> {
  return fetchAssignments(
    and(
      eq(prayerAssignments.churchId, churchId),
      eq(prayerAssignments.assignedTo, userId),
    ),
  );
}

export async function assignPrayer(input: {
  churchId: string;
  prayerId: string;
  assignedTo: string;
  assignedBy: string;
  notes?: string;
}): Promise<void> {
  await db
    .insert(prayerAssignments)
    .values({
      churchId: input.churchId,
      prayerId: input.prayerId,
      assignedTo: input.assignedTo,
      assignedBy: input.assignedBy,
      notes: input.notes ?? null,
    })
    .onConflictDoNothing();
}

export async function updateAssignmentStatus(
  assignmentId: string,
  userId: string,
  status: PrayerAssignmentStatus,
): Promise<void> {
  await db
    .update(prayerAssignments)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(prayerAssignments.id, assignmentId),
        eq(prayerAssignments.assignedTo, userId),
      ),
    );
}

// ---------------------------------------------------------------------------
// Pastoral Dashboard Stats
// ---------------------------------------------------------------------------

export async function getPastoralStats(churchId: string): Promise<{
  activePrayers: number;
  pendingFlags: number;
  openAssignments: number;
  memberCount: number;
}> {
  const now = new Date();

  const [activePrayersResult] = await db
    .select({ value: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.churchId, churchId),
        eq(prayers.status, 'active'),
      ),
    );

  const [pendingFlagsResult] = await db
    .select({ value: count() })
    .from(prayerFlags)
    .where(
      and(
        eq(prayerFlags.churchId, churchId),
        eq(prayerFlags.status, 'pending'),
      ),
    );

  const [openAssignmentsResult] = await db
    .select({ value: count() })
    .from(prayerAssignments)
    .where(
      and(
        eq(prayerAssignments.churchId, churchId),
        inArray(prayerAssignments.status, ['assigned', 'accepted', 'praying']),
      ),
    );

  const [memberCountResult] = await db
    .select({ value: count() })
    .from(churchMembers)
    .where(eq(churchMembers.churchId, churchId));

  return {
    activePrayers: Number(activePrayersResult?.value ?? 0),
    pendingFlags: Number(pendingFlagsResult?.value ?? 0),
    openAssignments: Number(openAssignmentsResult?.value ?? 0),
    memberCount: Number(memberCountResult?.value ?? 0),
  };
}
