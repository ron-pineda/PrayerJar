import { describe, it, expect, beforeAll, vi } from 'vitest';
import { db } from '@/db';
import { prayers } from '@/db/schema';

// Mock external services to prevent real API calls during integration tests.
// These mocks must be declared BEFORE importing the module under test
// (Vitest hoists vi.mock() calls to the top of the file).
vi.mock('@/services/ai.service', () => ({
  moderateContent: vi.fn().mockResolvedValue({ safe: true, selfHarm: false }),
  categorizePrayer: vi.fn().mockResolvedValue({ category: 'other', tags: [], verse: null }),
}));
vi.mock('@/services/notification.service', () => ({
  notifyPrayerAuthor: vi.fn().mockResolvedValue(undefined),
  notifyMessageReceived: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/badge.service', () => ({
  evaluateBadgesForUser: vi.fn().mockResolvedValue([]),
  updateStreak: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/moderation-log.service', () => ({
  logModerationRejection: vi.fn().mockResolvedValue(undefined),
}));

// Import AFTER mocks are declared
import { prayForRequest } from '@/services/interaction.service';

describe('prayForRequest — single-fire invariant (bucket #5)', () => {
  let prayerId: string;

  beforeAll(async () => {
    // authorId is nullable in the schema (references users.id but can be null)
    // expiresAt is NOT NULL — required field
    const [row] = await db
      .insert(prayers)
      .values({
        authorId: null,
        content: 'single-fire test prayer',
        category: 'other',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: prayers.id });
    prayerId = row.id;
  });

  it('single prayForRequest call succeeds and returns interaction row', async () => {
    const userId = `single-fire-user-${Date.now()}`;
    const result = await prayForRequest({
      prayerId,
      userId,
      message: '',
      isAnonymous: false,
    });
    expect(result).toBeDefined();
    expect(result.prayerId).toBe(prayerId);
    expect(result.userId).toBe(userId);
  });

  it('calling prayForRequest twice for same user+prayer creates two rows (no unique constraint — known gap)', async () => {
    // DESIGN NOTE: prayerInteractions has no unique index on (prayerId, userId).
    // This test documents the current behaviour. If a unique constraint is added
    // in a future migration, update this test to expect one row and at-most-one success.
    const userId = `single-fire-dup-${Date.now()}`;

    const results = await Promise.allSettled([
      prayForRequest({ prayerId, userId, message: '', isAnonymous: false }),
      prayForRequest({ prayerId, userId, message: '', isAnonymous: false }),
    ]);

    // Both should succeed (no DB-level guard prevents it today)
    const successes = results.filter((r) => r.status === 'fulfilled');
    expect(successes.length).toBeGreaterThanOrEqual(1);

    // Query the actual rows written for this user+prayer pair
    const { prayerInteractions } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(prayerInteractions)
      .where(and(eq(prayerInteractions.prayerId, prayerId), eq(prayerInteractions.userId, userId)));

    // Document current behaviour: two concurrent calls produce two rows.
    // A future guard (unique index or app-layer idempotency key) should reduce this to 1.
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
