import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @/db before importing the service
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock drizzle-orm operators — eq and inArray are used but don't need real implementations
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  inArray: vi.fn((col, vals) => ({ col, vals })),
}));

// Mock @/db/schema — just needs to export table references as objects
vi.mock('@/db/schema', () => ({
  users: { id: 'id', name: 'name', email: 'email', createdAt: 'created_at' },
  prayers: { id: 'id', authorId: 'author_id' },
  prayerInteractions: { id: 'id', userId: 'user_id' },
  checkIns: { id: 'id', prayerId: 'prayer_id' },
  griefDates: { id: 'id', userId: 'user_id' },
  badges: { id: 'id', userId: 'user_id' },
}));

import { exportUserData } from './export.service';

const mockUser = { id: 'user-1', name: 'Alice', email: 'alice@example.com', createdAt: new Date('2024-01-01') };
const mockPrayers = [{ id: 'prayer-1', authorId: 'user-1', content: 'Lord, guide me' }];
const mockInteractions = [{ id: 'interaction-1', userId: 'user-1', prayerId: 'prayer-1' }];

function makeMockDb(overrides: Record<number, unknown[]> = {}) {
  let callCount = 0;
  const defaults: Record<number, unknown[]> = {
    1: [mockUser],        // users
    2: mockPrayers,       // prayers
    3: mockInteractions,  // prayerInteractions
    4: [],                // checkIns
    5: [],                // griefDates
    6: [],                // badges
  };
  const rows = { ...defaults, ...overrides };

  return vi.fn().mockImplementation(() => {
    callCount++;
    const idx = callCount;
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows[idx] ?? []),
          // also resolve directly (no limit call)
          then: (resolve: (v: unknown) => void) => Promise.resolve(rows[idx] ?? []).then(resolve),
        }),
      }),
    };
  });
}

describe('exportUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an object with exportedAt, user, prayers, and interactions', async () => {
    const { db } = await import('@/db');

    let callCount = 0;
    const allRows: unknown[][] = [
      [mockUser],       // users (with limit)
      mockPrayers,      // prayers
      mockInteractions, // prayerInteractions
      [],               // checkIns (inArray)
      [],               // griefDates
      [],               // badges
    ];

    (db as any).select = vi.fn().mockImplementation(() => {
      const idx = callCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(allRows[idx] ?? []),
            // awaitable without .limit (most queries)
            then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
              Promise.resolve(allRows[idx] ?? []).then(resolve, reject),
            [Symbol.toStringTag]: 'Promise',
          }),
        }),
      };
    });

    const result = await exportUserData('user-1');

    expect(result).toHaveProperty('exportedAt');
    expect(typeof result.exportedAt).toBe('string');
    expect(result.user).toMatchObject({ id: 'user-1', name: 'Alice', email: 'alice@example.com' });
    expect(result.prayers).toEqual(mockPrayers);
    expect(result.interactions).toEqual(mockInteractions);
  });

  it('throws when the user is not found', async () => {
    const { db } = await import('@/db');

    (db as any).select = vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // no user found
        }),
      }),
    }));

    await expect(exportUserData('nonexistent-user')).rejects.toThrow('User not found');
  });
});
