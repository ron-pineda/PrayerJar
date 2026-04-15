import { db } from '@/db';
import {
  contactSubmissions,
  adminActions,
  type ContactSubmission,
} from '@/db/schema';
import { eq, isNull, isNotNull, desc, lt } from 'drizzle-orm';

export type CreateContactSubmissionInput = {
  name: string;
  email: string;
  subject: ContactSubmission['subject'];
  message: string;
};

/**
 * createContactSubmission — insert a contact form row and return it.
 */
export async function createContactSubmission(
  input: CreateContactSubmissionInput
): Promise<ContactSubmission> {
  const [row] = await db
    .insert(contactSubmissions)
    .values({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    })
    .returning();
  return row;
}

export type ListContactSubmissionsOptions = {
  read?: boolean;
  limit?: number;
  cursor?: string; // created_at ISO string for keyset pagination
};

/**
 * listContactSubmissions — paginated, ordered created_at desc.
 */
export async function listContactSubmissions(
  opts: ListContactSubmissionsOptions = {}
): Promise<ContactSubmission[]> {
  const { read, limit = 50, cursor } = opts;

  const conditions = [];

  if (read === true) {
    conditions.push(isNotNull(contactSubmissions.readAt));
  } else if (read === false) {
    conditions.push(isNull(contactSubmissions.readAt));
  }

  if (cursor) {
    conditions.push(lt(contactSubmissions.createdAt, new Date(cursor)));
  }

  const query = db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(limit);

  if (conditions.length > 0) {
    const { and } = await import('drizzle-orm');
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * markContactRead — set read_at and read_by, then write an admin_actions audit row.
 */
export async function markContactRead(
  id: string,
  adminEmail: string
): Promise<void> {
  const now = new Date();

  await db
    .update(contactSubmissions)
    .set({ readAt: now, readBy: adminEmail })
    .where(eq(contactSubmissions.id, id));

  // Write audit row. If this fails, log and accept the gap per spec §9.
  try {
    await db.insert(adminActions).values({
      adminEmail,
      action: 'mark_feedback_read',
      targetType: 'contact_submission',
      targetId: id,
    });
  } catch (err) {
    console.error('[markContactRead] failed to write admin_actions row:', err);
  }
}
