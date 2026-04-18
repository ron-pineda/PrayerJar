import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/db/schema', () => ({
  prayers: {},
  prayerInteractions: {},
  churchMembers: {},
  churches: {},
}));

import { getMyIntercessionsCount, getMyAnsweredCount, getUserChurch } from './homepage.service';
import { db } from '@/db';

describe('getMyIntercessionsCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 0 when no interactions exist', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 0 }]);

    const result = await getMyIntercessionsCount('user-1');
    expect(result).toBe(0);
  });

  it('returns the intercession count for the user', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 7 }]);

    const result = await getMyIntercessionsCount('user-1');
    expect(result).toBe(7);
  });
});

describe('getMyAnsweredCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns answered prayer count for the user', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 3 }]);

    const result = await getMyAnsweredCount('user-1');
    expect(result).toBe(3);
  });

  it('returns 0 when user has no answered prayers', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 0 }]);

    const result = await getMyAnsweredCount('user-1');
    expect(result).toBe(0);
  });
});

describe('getUserChurch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when user has no church', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).innerJoin = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockReturnThis();
    (db as any).orderBy = vi.fn().mockReturnThis();
    (db as any).limit = vi.fn().mockResolvedValue([]);

    const result = await getUserChurch('user-1');
    expect(result).toBeNull();
  });

  it('returns slug and name when user belongs to a church', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).innerJoin = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockReturnThis();
    (db as any).orderBy = vi.fn().mockReturnThis();
    (db as any).limit = vi.fn().mockResolvedValue([{ slug: 'grace-chapel', name: 'Grace Chapel' }]);

    const result = await getUserChurch('user-1');
    expect(result).toEqual({ slug: 'grace-chapel', name: 'Grace Chapel' });
  });
});
