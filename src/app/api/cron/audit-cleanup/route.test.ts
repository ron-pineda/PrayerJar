import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── mutable state shared between mock and tests ────────────────────────────

/** What db.select(...).from(churches) returns */
let mockChurches: Array<{ id: string; currentPlan: string }> = [];

/** Return values for each db.delete call in order */
let mockDeleteResults: Array<{ id: string }[]> = [];
let deleteCallIndex = 0;

// ── db mock ────────────────────────────────────────────────────────────────

vi.mock('@/db', () => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    // select chain resolves via .then (thenable)
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(mockChurches).then(resolve, reject);
    },
  };

  const makeDeleteChain = () => {
    const result = mockDeleteResults[deleteCallIndex++] ?? [];
    return {
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(result),
    };
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(selectChain),
      delete: vi.fn().mockImplementation(() => makeDeleteChain()),
    },
  };
});

vi.mock('@/db/schema', () => ({
  auditEvents: { churchId: 'church_id', createdAt: 'created_at', id: 'id' },
  churches: { id: 'id', currentPlan: 'current_plan' },
}));

vi.mock('@/lib/plans', () => ({
  auditRetentionDays: vi.fn((tier: string) => {
    if (tier === 'pro') return 365;
    if (tier === 'enterprise') return 1095;
    return 90; // free + starter
  }),
}));

// Drizzle operator stubs — just need to be callable; db mock ignores args
vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => args,
  inArray: (col: unknown, ids: unknown) => ({ col, ids }),
  lt: (col: unknown, val: unknown) => ({ col, val }),
}));

// ── import after mocks ─────────────────────────────────────────────────────

import { GET } from './route';

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('http://localhost/api/cron/audit-cleanup', { headers });
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('GET /api/cron/audit-cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChurches = [];
    mockDeleteResults = [];
    deleteCallIndex = 0;
    process.env.CRON_SECRET = 'test-secret';
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header has wrong secret', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns { deleted: 0 } when there are no churches', async () => {
    mockChurches = [];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 0 });
  });

  it('deletes rows older than the 90-day window for free/starter churches and returns count', async () => {
    mockChurches = [
      { id: 'church-free', currentPlan: 'free' },
      { id: 'church-starter', currentPlan: 'starter' },
    ];
    // Both map to 90 days → one delete call with 2 deleted rows
    mockDeleteResults = [
      [{ id: 'row-1' }, { id: 'row-2' }],
    ];

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 2 });
  });

  it('deletes rows per tier window and leaves recent rows (counts only what returning() gives back)', async () => {
    mockChurches = [
      { id: 'church-free',       currentPlan: 'free' },
      { id: 'church-pro',        currentPlan: 'pro' },
      { id: 'church-enterprise', currentPlan: 'enterprise' },
    ];
    // 3 separate buckets → 3 delete calls
    // free: 1 old row deleted; pro: 2 old rows deleted; enterprise: 0 old rows
    mockDeleteResults = [
      [{ id: 'old-free-1' }],
      [{ id: 'old-pro-1' }, { id: 'old-pro-2' }],
      [],
    ];

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 3 });
  });

  it('returns { deleted: N } with correct total across multiple buckets', async () => {
    mockChurches = [
      { id: 'church-a', currentPlan: 'starter' },
      { id: 'church-b', currentPlan: 'pro' },
    ];
    mockDeleteResults = [
      Array.from({ length: 5 }, (_, i) => ({ id: `row-starter-${i}` })),
      Array.from({ length: 3 }, (_, i) => ({ id: `row-pro-${i}` })),
    ];

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 8 });
  });
});
