import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

import {
  createChurch,
  getChurchBySlug,
  addChurchMember,
  getChurchForUser,
} from './church-platform.service';
import { db } from '@/db';

// ---------------------------------------------------------------------------
// Chainable query builder mock factory
// ---------------------------------------------------------------------------

function makeChain(finalValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'from', 'where', 'limit', 'orderBy', 'innerJoin',
    'insert', 'values', 'returning', 'update', 'set', 'delete',
    'onConflictDoNothing',
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // make the chain thenable so `await db.insert(...).values(...).onConflictDoNothing()` resolves
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
}

// ---------------------------------------------------------------------------
// createChurch
// ---------------------------------------------------------------------------

describe('createChurch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserts a church and adds the creator as admin member', async () => {
    const fakeChurch = {
      id: 'church-1',
      slug: 'test-church-ab12',
      name: 'Test Church',
      description: null,
      logoUrl: null,
      welcomeMessage: null,
      primaryColor: '#d4a843',
      createdBy: 'user-1',
      subscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // First db call: insert churches → returning([fakeChurch])
    // Second db call: insert churchMembers
    let callCount = 0;
    (db as Record<string, unknown>).insert = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        // church insert — .values().returning() resolves with [fakeChurch]
        const chain = makeChain([fakeChurch]);
        return chain;
      }
      // member insert — .values().onConflictDoNothing() resolves with undefined
      return makeChain(undefined);
    });

    const result = await createChurch({
      name: 'Test Church',
      createdBy: 'user-1',
    });

    expect(result).toEqual(fakeChurch);
    expect((db as Record<string, unknown>).insert).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// getChurchBySlug
// ---------------------------------------------------------------------------

describe('getChurchBySlug', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no church is found', async () => {
    // .select().from().where().limit() resolves with []
    const chain = makeChain([]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getChurchBySlug('nonexistent-slug');
    expect(result).toBeNull();
  });

  it('returns the church when found', async () => {
    const fakeChurch = { id: 'c1', slug: 'my-church-ab12', name: 'My Church' };
    const chain = makeChain([fakeChurch]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getChurchBySlug('my-church-ab12');
    expect(result).toEqual(fakeChurch);
  });
});

// ---------------------------------------------------------------------------
// addChurchMember
// ---------------------------------------------------------------------------

describe('addChurchMember', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onConflictDoNothing to make the insert idempotent', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await addChurchMember('church-1', 'user-1');

    expect((db as Record<string, unknown>).insert).toHaveBeenCalledTimes(1);
    expect(chain.onConflictDoNothing).toHaveBeenCalled();
  });

  it('uses the provided role', async () => {
    const chain = makeChain(undefined);
    const insertMock = vi.fn(() => chain);
    (db as Record<string, unknown>).insert = insertMock;

    await addChurchMember('church-1', 'user-2', 'pastor');

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'pastor', churchId: 'church-1', userId: 'user-2' })
    );
  });
});

// ---------------------------------------------------------------------------
// getChurchForUser
// ---------------------------------------------------------------------------

describe('getChurchForUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when the user has no church membership', async () => {
    const chain = makeChain([]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getChurchForUser('user-with-no-church');
    expect(result).toBeNull();
  });

  it('returns church and role when membership exists', async () => {
    const fakeChurch = { id: 'c1', slug: 'grace-abc', name: 'Grace Church' };
    const chain = makeChain([{ church: fakeChurch, role: 'admin' }]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getChurchForUser('user-1');
    expect(result).toEqual({ church: fakeChurch, role: 'admin' });
  });
});
