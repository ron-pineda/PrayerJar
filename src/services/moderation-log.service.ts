import { db } from '@/db';
import {
  moderationLogs,
  adminActions,
  type ModerationLog,
} from '@/db/schema';
import { eq, isNull, isNotNull, desc, lt } from 'drizzle-orm';
import { notifyAdmins } from '@/lib/admin-notify';

// Derive types from the schema enums so they stay in sync automatically.
type ModerationContentType = ModerationLog['contentType'];
type ModerationCategory = ModerationLog['category'];

export type LogModerationRejectionInput = {
  userId?: string | null;
  contentType: ModerationContentType;
  contentSnippet?: string | null;
  category: ModerationCategory;
  aiConfidence?: number | null;
  sourceRoute: string;
};

/**
 * logModerationRejection — insert a row into moderation_logs.
 * Fire-and-forget safe: callers should call `.catch(() => {})`.
 * A failure here must never block the user-facing 422.
 */
export async function logModerationRejection(
  input: LogModerationRejectionInput
): Promise<void> {
  await db.insert(moderationLogs).values({
    userId: input.userId ?? null,
    contentType: input.contentType,
    contentSnippet: input.contentSnippet ?? null,
    category: input.category,
    aiConfidence: input.aiConfidence != null ? String(input.aiConfidence) : null,
    sourceRoute: input.sourceRoute,
  });

  if (input.category === 'selfHarm') {
    notifyAdmins({
      subject: '[URGENT] Self-harm content flagged',
      body: `The AI moderation system flagged a ${input.contentType} submission as self-harm (category: selfHarm).\n\nSource route: ${input.sourceRoute}\n\nReview immediately in the admin moderation panel.`,
      link: 'https://prayerjar.org/admin/moderation?category=selfHarm',
    }).catch(() => {});
  }
}

export type ListModerationLogsOptions = {
  category?: ModerationCategory;
  resolved?: boolean;
  limit?: number;
  cursor?: string; // created_at ISO string for keyset pagination
};

/**
 * listModerationLogs — paginated query ordered by created_at desc.
 */
export async function listModerationLogs(
  opts: ListModerationLogsOptions = {}
): Promise<ModerationLog[]> {
  const { category, resolved, limit = 50, cursor } = opts;

  const conditions = [];

  if (category !== undefined) {
    conditions.push(eq(moderationLogs.category, category));
  }

  if (resolved === true) {
    conditions.push(isNotNull(moderationLogs.resolvedAt));
  } else if (resolved === false) {
    conditions.push(isNull(moderationLogs.resolvedAt));
  }

  if (cursor) {
    conditions.push(lt(moderationLogs.createdAt, new Date(cursor)));
  }

  const query = db
    .select()
    .from(moderationLogs)
    .orderBy(desc(moderationLogs.createdAt))
    .limit(limit);

  if (conditions.length > 0) {
    const { and } = await import('drizzle-orm');
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * acknowledgeLog — mark a moderation log as resolved and write an audit row.
 */
export async function acknowledgeLog(
  id: string,
  adminEmail: string
): Promise<void> {
  const now = new Date();

  await db
    .update(moderationLogs)
    .set({ resolvedAt: now, resolvedBy: adminEmail })
    .where(eq(moderationLogs.id, id));

  // Write audit row. If this fails after the update above, log to console but
  // do not roll back — per spec §9, accept the gap rather than breaking the UX.
  try {
    await db.insert(adminActions).values({
      adminEmail,
      action: 'acknowledge_moderation_log',
      targetType: 'moderation_log',
      targetId: id,
    });
  } catch (err) {
    console.error('[acknowledgeLog] failed to write admin_actions row:', err);
  }
}
