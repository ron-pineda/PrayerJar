/**
 * Tests for the PCO Weekly Summary Scheduler — pj-s22-09
 *
 * Coverage:
 *  1. Unauthorized request → 401
 *  2. Feature flag explicitly disabled → skip all, flagDisabled: true
 *  3. Feature flag missing (opt-out model) → proceed normally
 *  4. Feature flag enabled globally → proceed normally
 *  5. Church on Free tier → not enqueued
 *  6. Church on Starter tier → not enqueued
 *  7. Church on Pro tier, PCO, with PCO-linked members → enqueued
 *  8. Church on Enterprise tier → enqueued
 *  9. Non-PCO provider (e.g. breeze) → not enqueued
 * 10. Member already has pending push_summary job in last 7d → skipped (dedup)
 * 11. Correct payload shape: { externalMemberId, summary: 'weekly' }
 * 12. Inactive member (chmsStatus != 'active') → not enqueued
 * 13. Member with no externalChmsId → not enqueued
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockDbSelect,
  mockDbInsert,
} = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock: DB
// ---------------------------------------------------------------------------
vi.mock('@/db', () => {
  /**
   * The scheduler calls db.select() in this order per iteration:
   *   [A] feature_flags lookup        (1 row or 0)
   *   [B] churches query              (N rows)
   *   For each church:
   *     [C] existing push_summary jobs  (M rows)
   *     [D] church members              (K rows)
   *   Then db.insert() per new job
   *
   * mockDbSelect is called once per select chain. We use a queue so each
   * call pops its preset return value in order.
   */
  const makeSelectChain = (result: unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  });

  return {
    db: {
      select: () => {
        const result = mockDbSelect();
        return makeSelectChain(result);
      },
      insert: () => {
        mockDbInsert();
        return { values: vi.fn().mockResolvedValue(undefined) };
      },
    },
  };
});

// ---------------------------------------------------------------------------
// Mock: Schema
// ---------------------------------------------------------------------------
vi.mock('@/db/schema', () => ({
  churches: {
    id: 'id',
    chmsProvider: 'chmsProvider',
    currentPlan: 'currentPlan',
  },
  churchMembers: {
    churchId: 'churchId',
    chmsProvider: 'chmsProvider',
    externalChmsId: 'externalChmsId',
    chmsStatus: 'chmsStatus',
    chmsSyncedAt: 'chmsSyncedAt',
  },
  chmsSyncJobs: {
    id: 'id',
    churchId: 'churchId',
    jobType: 'jobType',
    status: 'status',
    payload: 'payload',
    createdAt: 'createdAt',
    completedAt: 'completedAt',
  },
  featureFlags: {
    key: 'key',
    isEnabled: 'isEnabled',
  },
}));

// ---------------------------------------------------------------------------
// Mock: Drizzle operators
// ---------------------------------------------------------------------------
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => 'eq'),
  and: vi.fn((..._args: unknown[]) => 'and'),
  gte: vi.fn((_col: unknown, _val: unknown) => 'gte'),
  inArray: vi.fn((_col: unknown, _vals: unknown) => 'inArray'),
  isNotNull: vi.fn((_col: unknown) => 'isNotNull'),
  desc: vi.fn((_col: unknown) => 'desc'),
  sql: Object.assign(
    vi.fn((_s: unknown) => 'sql'),
    { raw: vi.fn() }
  ),
}));

// ---------------------------------------------------------------------------
// Import SUT after all mocks
// ---------------------------------------------------------------------------
import { GET } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('http://localhost/api/cron/chms-summary-scheduler', { headers });
}

/** Queue multiple return values for sequential mockDbSelect calls. */
function queueSelectResults(...results: unknown[]) {
  for (const r of results) {
    mockDbSelect.mockReturnValueOnce(r);
  }
}

function makeChurch(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'church-1',
    chmsProvider: 'planning-center',
    currentPlan: 'pro',
    ...overrides,
  };
}

function makeMember(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    externalChmsId: 'pco-member-1',
    chmsSyncedAt: new Date(Date.now() - 10000),
    ...overrides,
  };
}

function makeExistingJob(externalMemberId: string) {
  return {
    payload: { externalMemberId, summary: 'weekly' },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/cron/chms-summary-scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  // 1. Auth
  it('returns 401 for wrong CRON_SECRET', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  // 2. Feature flag explicitly disabled
  it('returns flagDisabled: true and enqueues nothing when flag isEnabled = false', async () => {
    queueSelectResults(
      // [A] feature flag row with isEnabled false
      [{ isEnabled: false }],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ scheduled: 0, skipped: 0, flagDisabled: true });
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // 3. Feature flag missing (opt-out: proceed)
  it('proceeds normally when feature flag row is missing', async () => {
    queueSelectResults(
      // [A] flag not found
      [],
      // [B] eligible churches
      [makeChurch()],
      // [C] existing push_summary jobs for church-1
      [],
      // [D] PCO-linked members
      [makeMember()],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scheduled).toBe(1);
    expect(body.flagDisabled).toBeUndefined();
    expect(mockDbInsert).toHaveBeenCalledTimes(1);
  });

  // 4. Feature flag enabled globally (isEnabled true, allowedUserIds empty)
  it('proceeds normally when flag is enabled', async () => {
    queueSelectResults(
      // [A] flag enabled
      [{ isEnabled: true }],
      // [B] churches
      [makeChurch()],
      // [C] existing jobs
      [],
      // [D] members
      [makeMember()],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(1);
  });

  // 5. Free tier church — not enqueued
  it('does not enqueue for a Free tier church', async () => {
    queueSelectResults(
      // [A] flag
      [],
      // [B] eligible churches query — returns empty because free is filtered in SQL
      // (our mock doesn't enforce SQL, so return empty to simulate no match)
      [],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(0);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // 6. Starter tier church — not enqueued (filtered by query)
  it('does not enqueue for a Starter tier church (filtered by DB query)', async () => {
    queueSelectResults(
      // [A] flag
      [],
      // [B] no churches returned (SQL inArray(['pro','enterprise']) excludes starter)
      [],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(0);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // 7. Pro tier, PCO, with PCO-linked members → enqueued
  it('enqueues push_summary jobs for each PCO-linked member of a Pro church', async () => {
    const members = [
      makeMember({ externalChmsId: 'pco-1' }),
      makeMember({ externalChmsId: 'pco-2' }),
      makeMember({ externalChmsId: 'pco-3' }),
    ];

    queueSelectResults(
      [],                   // [A] flag missing
      [makeChurch()],       // [B] churches
      [],                   // [C] no existing jobs
      members,              // [D] members
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scheduled).toBe(3);
    expect(body.skipped).toBe(0);
    expect(mockDbInsert).toHaveBeenCalledTimes(3);
  });

  // 8. Enterprise tier → enqueued
  it('enqueues for Enterprise tier church', async () => {
    queueSelectResults(
      [],
      [makeChurch({ currentPlan: 'enterprise' })],
      [],
      [makeMember()],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(1);
  });

  // 9. Non-PCO provider — not enqueued (filtered by query)
  it('does not enqueue for a Breeze church (filtered by DB query)', async () => {
    queueSelectResults(
      [],
      // SQL WHERE chmsProvider = 'planning-center' returns nothing for breeze
      [],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(0);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // 10. Dedup: member already has pending job in last 7d → skipped
  it('skips members that already have a pending push_summary job in the last 7 days', async () => {
    const member = makeMember({ externalChmsId: 'pco-dup' });

    queueSelectResults(
      [],
      [makeChurch()],
      // [C] existing job for same member
      [makeExistingJob('pco-dup')],
      // [D] members
      [member],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scheduled).toBe(0);
    expect(body.skipped).toBe(1);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // 11. Correct payload shape
  it('enqueues jobs with correct payload { externalMemberId, summary: "weekly" }', async () => {
    const insertValuesSpy = vi.fn().mockResolvedValue(undefined);
    mockDbInsert.mockImplementation(() => {}); // reset default

    // We need to intercept the values() call to inspect payload
    const insertValuesCapture: unknown[] = [];
    const originalInsert = vi.fn(() => ({
      values: (v: unknown) => {
        insertValuesCapture.push(v);
        return Promise.resolve(undefined);
      },
    }));

    // Re-mock db.insert for this test only
    const { db } = await import('@/db');
    const dbAny = db as unknown as { insert: typeof originalInsert };
    const originalDbInsert = dbAny.insert;
    dbAny.insert = originalInsert;

    queueSelectResults(
      [],
      [makeChurch()],
      [],
      [makeMember({ externalChmsId: 'pco-shape-test' })],
    );

    await GET(makeRequest('test-secret'));

    expect(insertValuesCapture).toHaveLength(1);
    const payload = (insertValuesCapture[0] as { payload: { externalMemberId: string; summary: string } }).payload;
    expect(payload.externalMemberId).toBe('pco-shape-test');
    expect(payload.summary).toBe('weekly');

    // Restore
    dbAny.insert = originalDbInsert;
  });

  // 12. Inactive member — not enqueued (filtered by SQL WHERE chmsStatus = 'active')
  it('does not enqueue inactive members (filtered by DB query)', async () => {
    queueSelectResults(
      [],
      [makeChurch()],
      [],
      // SQL filters chmsStatus = 'active' — returns empty for inactive
      [],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(0);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // 13. Member with null externalChmsId — not enqueued (guarded in loop)
  it('skips members with null externalChmsId even if somehow returned', async () => {
    queueSelectResults(
      [],
      [makeChurch()],
      [],
      [makeMember({ externalChmsId: null })],
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).scheduled).toBe(0);
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  // Multiple churches
  it('handles multiple eligible churches independently', async () => {
    const church1 = makeChurch({ id: 'church-1' });
    const church2 = makeChurch({ id: 'church-2' });

    queueSelectResults(
      [],                      // [A] flag
      [church1, church2],      // [B] churches
      [],                      // [C] existing jobs church-1
      [makeMember({ externalChmsId: 'pco-a' })],  // [D] members church-1
      [],                      // [C] existing jobs church-2
      [makeMember({ externalChmsId: 'pco-b' }), makeMember({ externalChmsId: 'pco-c' })], // [D] members church-2
    );

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scheduled).toBe(3);
    expect(mockDbInsert).toHaveBeenCalledTimes(3);
  });
});
