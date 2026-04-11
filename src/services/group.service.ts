import { db } from '@/db';
import {
  groups, groupMembers, prayers, users,
  type Group, type GroupMember,
} from '@/db/schema';
import { eq, and, sql, desc, isNull, count } from 'drizzle-orm';
import crypto from 'crypto';
import { addDays } from 'date-fns';
import type { CategoryValue } from '@/db/schema';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class GroupNotFoundError extends Error {
  constructor() { super('Group not found'); this.name = 'GroupNotFoundError'; }
}

export class AlreadyMemberError extends Error {
  constructor() { super('Already a member of this group'); this.name = 'AlreadyMemberError'; }
}

export class OwnerHasMembersError extends Error {
  constructor() { super('Transfer ownership before leaving'); this.name = 'OwnerHasMembersError'; }
}

export class NotOwnerError extends Error {
  constructor() { super('Only the group owner can perform this action'); this.name = 'NotOwnerError'; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex');
}

// ---------------------------------------------------------------------------
// Task pj-s2.3-37: Group CRUD + membership
// ---------------------------------------------------------------------------

export async function createGroup(
  userId: string,
  name: string,
  description?: string,
): Promise<Group> {
  const inviteCode = generateInviteCode();

  const [group] = await db
    .insert(groups)
    .values({ name, description: description ?? null, createdBy: userId, inviteCode })
    .returning();

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId,
    role: 'owner',
  });

  return group;
}

export async function joinGroup(userId: string, inviteCode: string): Promise<GroupMember> {
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.inviteCode, inviteCode))
    .limit(1);

  if (!group) throw new GroupNotFoundError();

  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId)))
    .limit(1);

  if (existing) throw new AlreadyMemberError();

  const [member] = await db
    .insert(groupMembers)
    .values({ groupId: group.id, userId, role: 'member' })
    .returning();

  return member;
}

export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);

  if (!membership) return; // not a member — silently succeed

  if (membership.role === 'owner') {
    const [{ memberCount }] = await db
      .select({ memberCount: count() })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), sql`${groupMembers.userId} != ${userId}`));

    if (Number(memberCount) > 0) throw new OwnerHasMembersError();
  }

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}

export async function getGroupsForUser(userId: string) {
  const rows = await db
    .select({
      group: groups,
      memberCount: count(groupMembers.id),
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .where(
      sql`${groups.id} IN (
        SELECT group_id FROM group_members WHERE user_id = ${userId}
      )`
    )
    .groupBy(groups.id);

  return rows.map((r) => ({ ...r.group, memberCount: Number(r.memberCount) }));
}

export async function getGroupMembers(groupId: string) {
  return db
    .select({
      member: groupMembers,
      userName: users.name,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));
}

export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const rows = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  return group ?? null;
}

export async function getGroupMembership(
  userId: string,
  groupId: string,
): Promise<GroupMember | null> {
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return membership ?? null;
}

export async function deleteGroup(groupId: string, requestingUserId: string): Promise<void> {
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, requestingUserId),
        eq(groupMembers.role, 'owner'),
      )
    )
    .limit(1);

  if (!membership) throw new NotOwnerError();

  // Cascade deletes groupMembers; prayers get groupId set to NULL via FK onDelete: 'set null'
  await db.delete(groups).where(eq(groups.id, groupId));
}

// ---------------------------------------------------------------------------
// Task pj-s2.3-38: Group prayers
// ---------------------------------------------------------------------------

export async function getGroupPrayers(groupId: string) {
  return db
    .select()
    .from(prayers)
    .where(eq(prayers.groupId, groupId))
    .orderBy(desc(prayers.createdAt));
}

export async function postGroupPrayer(
  userId: string,
  groupId: string,
  content: string,
  category: CategoryValue,
) {
  const [prayer] = await db
    .insert(prayers)
    .values({
      authorId: userId,
      content,
      category,
      isAnonymous: false,
      isUrgent: false,
      groupId,
      expiresAt: addDays(new Date(), 30),
    })
    .returning();
  return prayer;
}

// ---------------------------------------------------------------------------
// Task pj-s2.3-39: Group activity feed
// ---------------------------------------------------------------------------

export type ActivityItem = {
  type: 'prayer_posted' | 'prayer_answered' | 'member_joined';
  userId: string;
  userName: string | null;
  prayerId?: string;
  prayerContent?: string;
  date: Date;
};

export async function getGroupActivity(groupId: string, limit = 20): Promise<ActivityItem[]> {
  const [recentPrayers, answeredPrayers, recentJoins] = await Promise.all([
    // 1. Recent group prayers
    db
      .select({
        id: prayers.id,
        authorId: prayers.authorId,
        content: prayers.content,
        createdAt: prayers.createdAt,
        userName: users.name,
      })
      .from(prayers)
      .leftJoin(users, eq(users.id, prayers.authorId))
      .where(eq(prayers.groupId, groupId))
      .orderBy(desc(prayers.createdAt))
      .limit(limit),

    // 2. Recent answered group prayers
    db
      .select({
        id: prayers.id,
        authorId: prayers.authorId,
        content: prayers.content,
        answeredAt: prayers.answeredAt,
        userName: users.name,
      })
      .from(prayers)
      .leftJoin(users, eq(users.id, prayers.authorId))
      .where(and(eq(prayers.groupId, groupId), eq(prayers.status, 'answered')))
      .orderBy(desc(prayers.answeredAt))
      .limit(limit),

    // 3. Recent member joins
    db
      .select({
        userId: groupMembers.userId,
        joinedAt: groupMembers.joinedAt,
        userName: users.name,
      })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(desc(groupMembers.joinedAt))
      .limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...recentPrayers.map((p) => ({
      type: 'prayer_posted' as const,
      userId: p.authorId ?? '',
      userName: p.userName ?? null,
      prayerId: p.id,
      prayerContent: p.content,
      date: p.createdAt,
    })),
    ...answeredPrayers.map((p) => ({
      type: 'prayer_answered' as const,
      userId: p.authorId ?? '',
      userName: p.userName ?? null,
      prayerId: p.id,
      prayerContent: p.content,
      date: p.answeredAt ?? new Date(0),
    })),
    ...recentJoins.map((m) => ({
      type: 'member_joined' as const,
      userId: m.userId,
      userName: m.userName ?? null,
      date: m.joinedAt,
    })),
  ];

  // Merge, sort by date desc, slice to limit
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items.slice(0, limit);
}
