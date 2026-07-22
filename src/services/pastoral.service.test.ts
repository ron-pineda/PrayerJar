import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

import {
  getFlaggedPrayers,
  flagPrayer,
  reviewFlag,
  getPastoralNotes,
  createPastoralNote,
  getChurchAssignments,
  getMemberAssignments,
  assignPrayer,
  updateAssignmentStatus,
  getPastoralStats,
} from './pastoral.service';
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
    'select', 'from', 'where', 'limit', 'orderBy', 'innerJoin',
    'insert', 'values', 'returning', 'update', 'set', 'delete',
    'onConflictDoNothing',
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
}

// ---------------------------------------------------------------------------
// getPastoralStats
// ---------------------------------------------------------------------------

describe('getPastoralStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns correct shape with all four counters', async () => {
    let callCount = 0;
    // getPastoralStats fires 4 sequential selects
    (db as Record<string, unknown>).select = vi.fn(() => {
      callCount++;
      const value = callCount; // 1, 2, 3, 4
      return makeChain([{ value }]);
    });

    const result = await getPastoralStats('church-1');

    expect(result).toEqual({
      activePrayers: 1,
      pendingFlags: 2,
      openAssignments: 3,
      memberCount: 4,
    });
    expect((db as Record<string, unknown>).select).toHaveBeenCalledTimes(4);
  });

  it('returns zeros when db returns empty results', async () => {
    (db as Record<string, unknown>).select = vi.fn(() => makeChain([]));

    const result = await getPastoralStats('church-1');

    expect(result).toEqual({
      activePrayers: 0,
      pendingFlags: 0,
      openAssignments: 0,
      memberCount: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// flagPrayer
// ---------------------------------------------------------------------------

describe('flagPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls db.insert once', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await flagPrayer('prayer-1', 'church-1', 'crisis');

    expect((db as Record<string, unknown>).insert).toHaveBeenCalledTimes(1);
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        prayerId: 'prayer-1',
        churchId: 'church-1',
        reason: 'crisis',
      }),
    );
  });

  it('passes aiConfidence when provided', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await flagPrayer('prayer-2', 'church-1', 'self_harm', 0.92);

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ aiConfidence: 0.92 }),
    );
  });

  it('sets aiConfidence to null when not provided', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await flagPrayer('prayer-3', 'church-1', 'spam');

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ aiConfidence: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// reviewFlag
// ---------------------------------------------------------------------------

describe('reviewFlag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls db.update and sets status, reviewedBy, reviewedAt', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await reviewFlag('flag-1', 'reviewer-1', 'reviewed');

    expect((db as Record<string, unknown>).update).toHaveBeenCalledTimes(1);
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'reviewed',
        reviewedBy: 'reviewer-1',
        reviewedAt: expect.any(Date),
      }),
    );
  });

  it('includes notes in the set call when provided', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await reviewFlag('flag-2', 'reviewer-1', 'escalated', 'Needs pastoral follow-up');

    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'escalated',
        notes: 'Needs pastoral follow-up',
      }),
    );
  });

  it('does not include notes key when notes is undefined', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await reviewFlag('flag-3', 'reviewer-1', 'dismissed');

    const setArg = (chain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(setArg).not.toHaveProperty('notes');
  });
});

// ---------------------------------------------------------------------------
// createPastoralNote
// ---------------------------------------------------------------------------

describe('createPastoralNote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserts and returns the created note', async () => {
    const fakeNote = {
      id: 'note-1',
      churchId: 'church-1',
      prayerId: 'prayer-1',
      memberId: null,
      authorId: 'user-1',
      content: 'Follow up needed',
      isPrivate: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const chain = makeChain([fakeNote]);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    const result = await createPastoralNote({
      churchId: 'church-1',
      prayerId: 'prayer-1',
      authorId: 'user-1',
      content: 'Follow up needed',
    });

    expect(result).toEqual({
      id: 'note-1',
      prayerId: 'prayer-1',
      memberId: null,
      authorId: 'user-1',
      content: 'Follow up needed',
      isPrivate: true,
      createdAt: fakeNote.createdAt,
      updatedAt: fakeNote.updatedAt,
    });
    expect((db as Record<string, unknown>).insert).toHaveBeenCalledTimes(1);
  });

  it('defaults isPrivate to true when not specified', async () => {
    const fakeNote = {
      id: 'note-2',
      churchId: 'church-1',
      prayerId: null,
      memberId: null,
      authorId: 'user-1',
      content: 'Note',
      isPrivate: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chain = makeChain([fakeNote]);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await createPastoralNote({
      churchId: 'church-1',
      authorId: 'user-1',
      content: 'Note',
    });

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: true }),
    );
  });
});

// ---------------------------------------------------------------------------
// assignPrayer
// ---------------------------------------------------------------------------

describe('assignPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls db.insert with onConflictDoNothing', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await assignPrayer({
      churchId: 'church-1',
      prayerId: 'prayer-1',
      assignedTo: 'user-2',
      assignedBy: 'user-1',
      notes: 'Please pray urgently',
    });

    expect((db as Record<string, unknown>).insert).toHaveBeenCalledTimes(1);
    expect(chain.onConflictDoNothing).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: 'church-1',
        prayerId: 'prayer-1',
        assignedTo: 'user-2',
        assignedBy: 'user-1',
        notes: 'Please pray urgently',
      }),
    );
  });

  it('sets notes to null when not provided', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    await assignPrayer({
      churchId: 'church-1',
      prayerId: 'prayer-2',
      assignedTo: 'user-3',
      assignedBy: 'user-1',
    });

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// updateAssignmentStatus
// ---------------------------------------------------------------------------

describe('updateAssignmentStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls db.update and passes both assignmentId and userId as ownership guard', async () => {
    const testUserId = 'user-1';
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await updateAssignmentStatus('assign-1', testUserId, 'accepted');

    expect((db as Record<string, unknown>).update).toHaveBeenCalledTimes(1);
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
    );
    // The WHERE clause must include the userId ownership guard — not just the assignment id.
    // Walk the drizzle condition tree (which has circular refs so JSON.stringify fails)
    // and collect all primitive values to verify testUserId is present.
    expect(chain.where).toHaveBeenCalled();
    const collectValues = (obj: unknown, seen = new Set<unknown>()): string[] => {
      if (obj === null || obj === undefined) return [];
      if (seen.has(obj)) return [];
      if (typeof obj === 'string' || typeof obj === 'number') return [String(obj)];
      if (typeof obj !== 'object') return [];
      seen.add(obj);
      return Object.values(obj as Record<string, unknown>).flatMap((v) => collectValues(v, seen));
    };
    const allValues = collectValues((chain.where as ReturnType<typeof vi.fn>).mock.calls[0]);
    expect(allValues).toContain(testUserId);
  });

  it('sets the correct status', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await updateAssignmentStatus('assign-2', 'user-2', 'praying');

    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'praying' }),
    );
  });
});

// ---------------------------------------------------------------------------
// getPastoralNotes
// ---------------------------------------------------------------------------

describe('getPastoralNotes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns notes filtered by churchId', async () => {
    const fakeNotes = [
      {
        id: 'n1',
        churchId: 'church-1',
        prayerId: null,
        memberId: null,
        authorId: 'u1',
        content: 'Note 1',
        isPrivate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const chain = makeChain(fakeNotes);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getPastoralNotes('church-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
  });

  it('returns empty array when no notes found', async () => {
    const chain = makeChain([]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getPastoralNotes('church-none');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getFlaggedPrayers
// ---------------------------------------------------------------------------

describe('getFlaggedPrayers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns mapped flagged prayers', async () => {
    const fakeRows = [
      {
        flagId: 'flag-1',
        reason: 'crisis',
        aiConfidence: 0.95,
        status: 'pending',
        notes: null,
        createdAt: new Date(),
        prayerId: 'prayer-1',
        prayerContent: 'Please pray for me',
        prayerCategory: 'health',
        prayerIsAnonymous: false,
        authorId: 'user-1',
        authorName: 'Alice',
      },
    ];

    const chain = makeChain(fakeRows);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getFlaggedPrayers('church-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      flagId: 'flag-1',
      reason: 'crisis',
      aiConfidence: 0.95,
      status: 'pending',
      notes: null,
      createdAt: fakeRows[0].createdAt,
      prayer: {
        id: 'prayer-1',
        content: 'Please pray for me',
        category: 'health',
        isAnonymous: false,
      },
      author: { id: 'user-1', name: 'Alice' },
    });
  });

  it('returns empty array when no pending flags', async () => {
    const chain = makeChain([]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getFlaggedPrayers('church-empty');
    expect(result).toEqual([]);
  });
});
