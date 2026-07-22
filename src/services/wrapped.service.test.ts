import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

import { getWrappedStats } from './wrapped.service';
import { db as dbImpl } from '@/db';

// `@/db` is mocked as an empty object above; the real `db` export is typed as
// an opaque NeonHttpDatabase which no longer structurally overlaps with a
// plain record, so re-type the mocked binding to the writable shape these
// tests assign method mocks onto.
const db = dbImpl as unknown as Record<string, unknown>;

// Helper to build a chainable Drizzle-like query mock that resolves to `rows`
function mockQuery(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'selectDistinct', 'from', 'where', 'groupBy', 'orderBy', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Make the chain thenable so `await db.select(...).from(...).where(...)` works
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(rows).then(resolve);
  return chain;
}

describe('getWrappedStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no prayers exist for that year', async () => {
    // First call (prayer count) returns 0
    const zeroCount = mockQuery([{ value: 0 }]);
    vi.mocked(db as Record<string, unknown>).select = vi.fn(() => zeroCount);
    (db as Record<string, unknown>).select = vi.fn(() => zeroCount);

    const result = await getWrappedStats('user-1', 2025);
    expect(result).toBeNull();
  });

  it('returns correct totalPrayers count when prayers exist', async () => {
    let callCount = 0;

    // We need to return different values for different select calls.
    // Call order in getWrappedStats:
    //   0: prayer count         → [{ value: 5 }]
    //   1: interaction count    → [{ value: 3 }]
    //   2: category groupby     → [{ category: 'health', value: 3 }]
    //   3: answered count       → [{ value: 1 }]
    //   4: date rows (distinct) → [{ day: '2025-01-01T00:00:00Z' }, { day: '2025-01-02T00:00:00Z' }]
    //   5: partner rows (userId side)       → []
    //   6: partner rows (partnerId side)    → []
    //   7: group count          → [{ value: 2 }]

    const responses = [
      [{ value: 5 }],
      [{ value: 3 }],
      [{ category: 'health', value: 3 }],
      [{ value: 1 }],
      [{ day: '2025-01-01T00:00:00Z' }, { day: '2025-01-02T00:00:00Z' }],
      [],
      [],
      [{ value: 2 }],
    ];

    function makeChain() {
      const idx = callCount++;
      const rows = responses[idx] ?? [];
      return mockQuery(rows);
    }

    (db as Record<string, unknown>).select = vi.fn(() => makeChain());
    (db as Record<string, unknown>).selectDistinct = vi.fn(() => makeChain());

    const result = await getWrappedStats('user-1', 2025);

    expect(result).not.toBeNull();
    expect(result!.year).toBe(2025);
    expect(result!.totalPrayers).toBe(5);
    expect(result!.totalInteractions).toBe(3);
    expect(result!.topCategory).toBe('health');
    expect(result!.answeredCount).toBe(1);
    expect(result!.longestStreak).toBe(2);
    expect(result!.partnerCount).toBe(0);
    expect(result!.groupCount).toBe(2);
  });

  it('computes longestStreak correctly for non-consecutive days', async () => {
    let callCount = 0;

    // Days: Jan 1, Jan 2, Jan 3, (gap), Jan 5, Jan 6 → longest streak = 3
    const responses = [
      [{ value: 5 }],
      [{ value: 0 }],
      [{ category: 'other', value: 5 }],
      [{ value: 0 }],
      [
        { day: '2025-01-01T00:00:00Z' },
        { day: '2025-01-02T00:00:00Z' },
        { day: '2025-01-03T00:00:00Z' },
        { day: '2025-01-05T00:00:00Z' },
        { day: '2025-01-06T00:00:00Z' },
      ],
      [],
      [],
      [{ value: 0 }],
    ];

    function makeChain() {
      const idx = callCount++;
      const rows = responses[idx] ?? [];
      return mockQuery(rows);
    }

    (db as Record<string, unknown>).select = vi.fn(() => makeChain());
    (db as Record<string, unknown>).selectDistinct = vi.fn(() => makeChain());

    const result = await getWrappedStats('user-1', 2025);
    expect(result).not.toBeNull();
    expect(result!.longestStreak).toBe(3);
  });
});
