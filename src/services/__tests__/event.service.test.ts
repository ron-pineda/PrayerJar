import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

// createEvent now gates on the church's plan tier (free = 0 events).
// Mock the tier lookup so event tests exercise event logic, not billing.
const { mockGetChurchTier } = vi.hoisted(() => ({
  mockGetChurchTier: vi.fn().mockResolvedValue('pro'),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchTier: mockGetChurchTier,
}));

import {
  createEvent,
  getEvent,
  getChurchEvents,
  updateEventStatus,
  submitEventPrayer,
  getEventPrayers,
  moderateEventPrayer,
  getSpotlightedPrayer,
  getEventStats,
} from '../event.service';
import { db } from '@/db';

// ---------------------------------------------------------------------------
// Chainable query builder mock factory
// ---------------------------------------------------------------------------

function makeChain(finalValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'from', 'where', 'limit', 'orderBy',
    'insert', 'values', 'returning', 'update', 'set', 'delete',
    'and', 'eq', 'desc',
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
    resolve(finalValue);
  return chain;
}

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

describe('createEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserts an event and returns it', async () => {
    const fakeEvent = {
      id: 'evt-1',
      churchId: 'church-1',
      name: 'Sunday Service',
      description: null,
      status: 'draft',
      displayMode: 'stream',
      eventLicenseId: null,
      startsAt: null,
      endsAt: null,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // tier is 'pro' (limit 12) → createEvent counts non-ended events first
    (db as Record<string, unknown>).select = vi.fn(() => makeChain([{ value: 0 }]));

    const chain = makeChain([fakeEvent]);
    (db as Record<string, unknown>).insert = vi.fn(() => chain);

    const result = await createEvent({
      churchId: 'church-1',
      name: 'Sunday Service',
      createdBy: 'user-1',
    });

    expect(result).toEqual(fakeEvent);
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it('rejects event creation on the free tier', async () => {
    mockGetChurchTier.mockResolvedValueOnce('free');
    const insertMock = vi.fn(() => makeChain([]));
    (db as Record<string, unknown>).insert = insertMock;

    await expect(
      createEvent({ churchId: 'church-1', name: 'Sunday Service', createdBy: 'user-1' }),
    ).rejects.toThrow('Starter plan or higher');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getEvent
// ---------------------------------------------------------------------------

describe('getEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the event when found', async () => {
    const fakeEvent = { id: 'evt-1', name: 'Test Event', status: 'active' };
    const chain = makeChain([fakeEvent]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getEvent('evt-1');
    expect(result).toEqual(fakeEvent);
  });

  it('returns undefined when not found', async () => {
    const chain = makeChain([]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getEvent('missing');
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getChurchEvents
// ---------------------------------------------------------------------------

describe('getChurchEvents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a list of events for a church', async () => {
    const fakeEvents = [
      { id: 'evt-1', churchId: 'church-1', name: 'Event A' },
      { id: 'evt-2', churchId: 'church-1', name: 'Event B' },
    ];
    const chain = makeChain(fakeEvents);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getChurchEvents('church-1');
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// updateEventStatus
// ---------------------------------------------------------------------------

describe('updateEventStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls db.update with the new status', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await updateEventStatus('evt-1', 'active');
    expect(db.update).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// submitEventPrayer
// ---------------------------------------------------------------------------

describe('submitEventPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects content that is too short', async () => {
    // getEvent select mock — event is active
    const activeEvent = { id: 'evt-1', churchId: 'church-1', status: 'active' };
    const selectChain = makeChain([activeEvent]);
    (db as Record<string, unknown>).select = vi.fn(() => selectChain);

    await expect(
      submitEventPrayer({
        eventId: 'evt-1',
        churchId: 'church-1',
        content: 'hi',
        isAnonymous: false,
      }),
    ).rejects.toThrow('5 and 500');
  });

  it('rejects prayer when event is not active', async () => {
    const draftEvent = { id: 'evt-1', churchId: 'church-1', status: 'draft' };
    const selectChain = makeChain([draftEvent]);
    (db as Record<string, unknown>).select = vi.fn(() => selectChain);

    await expect(
      submitEventPrayer({
        eventId: 'evt-1',
        churchId: 'church-1',
        content: 'Please pray for my family',
        isAnonymous: false,
      }),
    ).rejects.toThrow('not accepting');
  });

  it('inserts and returns the prayer when event is active and content is valid', async () => {
    const activeEvent = { id: 'evt-1', churchId: 'church-1', status: 'active' };
    const fakePrayer = {
      id: 'prayer-1',
      eventId: 'evt-1',
      content: 'Please pray for my family',
      status: 'pending',
    };

    let selectCalled = false;
    (db as Record<string, unknown>).select = vi.fn(() => {
      selectCalled = true;
      return makeChain([activeEvent]);
    });

    const insertChain = makeChain([fakePrayer]);
    (db as Record<string, unknown>).insert = vi.fn(() => insertChain);

    const result = await submitEventPrayer({
      eventId: 'evt-1',
      churchId: 'church-1',
      content: 'Please pray for my family',
      isAnonymous: false,
    });

    expect(selectCalled).toBe(true);
    expect(result).toEqual(fakePrayer);
  });
});

// ---------------------------------------------------------------------------
// getEventPrayers
// ---------------------------------------------------------------------------

describe('getEventPrayers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns approved prayers by default', async () => {
    const prayers = [{ id: 'p-1', status: 'approved' }];
    const chain = makeChain(prayers);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getEventPrayers('evt-1');
    expect(result).toEqual(prayers);
  });

  it('accepts a custom status filter', async () => {
    const prayers = [{ id: 'p-2', status: 'pending' }];
    const chain = makeChain(prayers);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getEventPrayers('evt-1', { status: 'pending' });
    expect(result).toEqual(prayers);
  });
});

// ---------------------------------------------------------------------------
// moderateEventPrayer
// ---------------------------------------------------------------------------

describe('moderateEventPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls db.update to set moderation status', async () => {
    const chain = makeChain(undefined);
    (db as Record<string, unknown>).update = vi.fn(() => chain);

    await moderateEventPrayer('prayer-1', 'mod-user-1', 'approved');
    expect(db.update).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// getSpotlightedPrayer
// ---------------------------------------------------------------------------

describe('getSpotlightedPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the spotlighted prayer when one exists', async () => {
    const prayer = { id: 'p-1', status: 'spotlighted' };
    const chain = makeChain([prayer]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getSpotlightedPrayer('evt-1');
    expect(result).toEqual(prayer);
  });

  it('returns undefined when none are spotlighted', async () => {
    const chain = makeChain([]);
    (db as Record<string, unknown>).select = vi.fn(() => chain);

    const result = await getSpotlightedPrayer('evt-1');
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getEventStats
// ---------------------------------------------------------------------------

describe('getEventStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns aggregated counts for an event', async () => {
    let callCount = 0;
    const counts = [5, 2, 2, 1, 0]; // total, pending, approved, spotlighted, hidden
    (db as Record<string, unknown>).select = vi.fn(() => {
      const idx = callCount++;
      return makeChain([{ value: counts[idx] ?? 0 }]);
    });

    const result = await getEventStats('evt-1');
    expect(result.total).toBe(5);
    expect(result.pending).toBe(2);
    expect(result.approved).toBe(2);
    expect(result.spotlighted).toBe(1);
    expect(result.hidden).toBe(0);
  });
});
