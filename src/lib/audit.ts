/**
 * Audit logging helper (pj-s17-audit-log).
 *
 * `logAuditEvent` is fire-and-forget from the caller's perspective:
 * it awaits the insert internally but never throws — failures are
 * captured and logged to stderr so the calling action is never
 * interrupted by a logging failure.
 */

import { db } from '@/db';
import { auditEvents } from '@/db/schema';

export type AuditEventInput = {
  churchId: string;
  actorUserId?: string | null;
  action: string;             // e.g. 'member.add', 'member.remove', 'role.change', 'prayer.delete', 'plan.change'
  targetType?: string | null; // e.g. 'user', 'prayer', 'church'
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  try {
    await db
      .insert(auditEvents)
      .values({
        churchId: event.churchId,
        actorUserId: event.actorUserId ?? null,
        action: event.action,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        metadata: event.metadata ?? {},
      });
  } catch (err) {
    console.error('[audit] Failed to log audit event:', err);
  }
}
