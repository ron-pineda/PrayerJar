import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

// ── Hoist spy for email service so vi.mock factory can close over it ──
const { mockSendChurchWelcome1Email } = vi.hoisted(() => ({
  mockSendChurchWelcome1Email: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/email.service', () => ({
  sendChurchWelcome1Email: mockSendChurchWelcome1Email,
}));

vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }));

import {
  createChurch,
  getChurchBySlug,
  addChurchMember,
  getChurchForUser,
} from './church-platform.service';
import { db as dbImpl } from '@/db';

// `@/db` is mocked as an empty object above; the real `db` export is typed as
// an opaque NeonHttpDatabase which no longer structurally overlaps with a
// plain record, so re-type the mocked binding to the writable shape these
// tests assign method mocks onto.
const db = dbImpl as unknown as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Chainable query builder mock factory
// ---------------------------------------------------------------------------

function makeChain(finalValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'from', 'where', 'limit', 'orderBy', 'innerJoin', 'leftJoin',
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
  beforeEach(() => {
    vi.clearAllMocks();

    // Sprint 27 (pj-s27-03): addChurchMember no longer looks up a tier or counts
    // members — the cap is gone. No select() calls happen on this path at all.
    (db as Record<string, unknown>).select = vi.fn(() => makeChain([]));
  });

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

  // Sprint 27 (pj-s27-03) regression guard, inverted from the Sprint 17 version.
  // The member cap used to throw at member 76 and the person who saw the error
  // was the joining congregant, not the church admin. There is no cap now and
  // this test exists to catch one being reintroduced.
  it('admits a member with no cap, however many rows already exist', async () => {
    (db as Record<string, unknown>).select = vi.fn(() => makeChain([{ value: 100_000 }]));
    const chain = makeChain(undefined);
    const insertMock = vi.fn(() => chain);
    (db as Record<string, unknown>).insert = insertMock;

    await expect(addChurchMember('church-1', 'user-3')).resolves.toBeUndefined();
    expect(insertMock).toHaveBeenCalled();
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

// ---------------------------------------------------------------------------
// createChurch — welcome drip trigger
// ---------------------------------------------------------------------------

describe('createChurch — welcome drip trigger', () => {
  const fakeChurch = {
    id: 'church-id-1',
    slug: 'grace-church-a3f2',
    name: 'Grace Church',
    createdBy: 'user-id-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // church insert: .values().returning() → [fakeChurch]
    // member insert: .values().onConflictDoNothing() → resolves
    let insertCallCount = 0;
    (db as Record<string, unknown>).insert = vi.fn(() => {
      insertCallCount++;
      if (insertCallCount === 1) return makeChain([fakeChurch]);
      return makeChain(undefined);
    });

    // select for admin lookup: .select().from().where().limit() → [{ email, name }]
    (db as Record<string, unknown>).select = vi.fn(() =>
      makeChain([{ email: 'pastor@grace.org', name: 'Pastor Sarah' }])
    );
  });

  it('sends welcome email 1 after church is created', async () => {
    await createChurch({ name: 'Grace Church', createdBy: 'user-id-1' });
    expect(mockSendChurchWelcome1Email).toHaveBeenCalledWith(
      'church-id-1',
      'user-id-1',
      'pastor@grace.org',
      'grace-church-a3f2',
      'Pastor Sarah',
    );
  });

  it('does not throw if email send fails', async () => {
    mockSendChurchWelcome1Email.mockRejectedValueOnce(new Error('Resend down'));
    await expect(
      createChurch({ name: 'Grace Church', createdBy: 'user-id-1' })
    ).resolves.not.toThrow();
  });
});
