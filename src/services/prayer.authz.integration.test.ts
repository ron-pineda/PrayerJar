import { describe, it, expect, beforeAll, vi } from 'vitest';
import { db } from '@/db';
import { prayers } from '@/db/schema';

// Mock AI services to prevent real API calls
vi.mock('@/services/ai.service', () => ({
  moderateContent: vi.fn().mockResolvedValue({ safe: true, selfHarm: false }),
  categorizePrayer: vi.fn().mockResolvedValue({ category: 'other', tags: [], verse: null }),
}));
vi.mock('@/services/moderation-log.service', () => ({
  logModerationRejection: vi.fn().mockResolvedValue(undefined),
}));

// DESIGN NOTE on updatePrayer / deletePrayer authorization model:
//
// Both functions use Drizzle's `and(eq(prayers.id, id), eq(prayers.authorId, authorId))`
// WHERE clause to enforce ownership. A non-owner gets no rows back — they do NOT throw.
//
//   updatePrayer(id, authorId, fields) → Prayer | null  (null when no row matches)
//   deletePrayer(id, authorId)         → boolean        (false when no row deleted)
//
// This is a silent-no-op authz pattern. The tests below document and lock in this
// behaviour so that any future refactor introducing throws doesn't silently change
// the contract for callers.

import { updatePrayer, deletePrayer } from '@/services/prayer.service';

describe('prayer service — owner authz (bucket #6)', () => {
  let ownerPrayerId: string;
  const OWNER = `authz-owner-${Date.now()}`;
  const INTRUDER = `authz-intruder-${Date.now()}`;

  beforeAll(async () => {
    // Insert directly — bypass createPrayer (which calls AI services)
    // authorId accepts any string (references users.id but FK is nullable in tests)
    const [row] = await db
      .insert(prayers)
      .values({
        authorId: OWNER,
        content: 'owner authz test prayer',
        category: 'other',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: prayers.id });
    ownerPrayerId = row.id;
  });

  it('non-owner update returns null (silent no-op — not a throw)', async () => {
    // updatePrayer(id, authorId, fields) — WHERE id AND authorId; non-owner returns null
    const result = await updatePrayer(ownerPrayerId, INTRUDER, {
      content: 'hacked',
      isUrgent: false,
      isAnonymous: false,
    });
    expect(result).toBeNull();
  });

  it('non-owner delete returns false (silent no-op — not a throw)', async () => {
    // deletePrayer(id, authorId) — WHERE id AND authorId; non-owner returns false
    const result = await deletePrayer(ownerPrayerId, INTRUDER);
    expect(result).toBe(false);
  });

  it('owner can update prayer content', async () => {
    const result = await updatePrayer(ownerPrayerId, OWNER, {
      content: 'updated by owner',
      isUrgent: false,
      isAnonymous: false,
    });
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.content).toBe('updated by owner');
  });

  it('prayer row unchanged after intruder update attempt', async () => {
    // Confirm the DB row was not mutated by the non-owner call above
    const { eq } = await import('drizzle-orm');
    const rows = await db
      .select({ content: prayers.content })
      .from(prayers)
      .where(eq(prayers.id, ownerPrayerId))
      .limit(1);
    expect(rows[0]?.content).toBe('updated by owner');
  });
});
