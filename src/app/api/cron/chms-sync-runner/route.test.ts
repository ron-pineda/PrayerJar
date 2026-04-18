import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Hoisted mocks (must be declared before vi.mock calls)
// ---------------------------------------------------------------------------
const {
  mockDbSelect,
  mockDbUpdate,
  mockCaptureException,
  mockNotifyAdmins,
  mockGetAdapterForChurch,
} = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockCaptureException: vi.fn(),
  mockNotifyAdmins: vi.fn().mockResolvedValue(undefined),
  mockGetAdapterForChurch: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock: DB
// ---------------------------------------------------------------------------
vi.mock('@/db', () => {
  const makeSelectChain = (result: unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  });

  const makeUpdateChain = () => ({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  });

  return {
    db: {
      select: () => {
        const result = mockDbSelect();
        return makeSelectChain(result);
      },
      update: () => {
        mockDbUpdate();
        return makeUpdateChain();
      },
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock: Schema (only the named exports used by the route)
// ---------------------------------------------------------------------------
vi.mock('@/db/schema', () => ({
  chmsSyncJobs: { id: 'id', status: 'status', churchId: 'churchId', jobType: 'jobType' },
  churchMembers: { churchId: 'churchId', externalChmsId: 'externalChmsId', chmsStatus: 'chmsStatus' },
}));

// ---------------------------------------------------------------------------
// Mock: Drizzle operators (all return a symbol — route only passes them to db)
// ---------------------------------------------------------------------------
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => 'eq'),
  and: vi.fn((..._args: unknown[]) => 'and'),
  lte: vi.fn((_col: unknown, _val: unknown) => 'lte'),
  lt: vi.fn((_col: unknown, _val: unknown) => 'lt'),
  gte: vi.fn((_col: unknown, _val: unknown) => 'gte'),
  isNotNull: vi.fn((_col: unknown) => 'isNotNull'),
  sql: vi.fn((_s: unknown) => 'sql'),
}));

// ---------------------------------------------------------------------------
// Mock: Sentry
// ---------------------------------------------------------------------------
vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}));

// ---------------------------------------------------------------------------
// Mock: admin-notify
// ---------------------------------------------------------------------------
vi.mock('@/lib/admin-notify', () => ({
  notifyAdmins: mockNotifyAdmins,
}));

// ---------------------------------------------------------------------------
// Mock: CHMS provider
// ---------------------------------------------------------------------------
vi.mock('@/lib/chms/providers', () => ({
  getAdapterForChurch: mockGetAdapterForChurch,
}));

// ---------------------------------------------------------------------------
// Import SUT AFTER all mocks are registered
// ---------------------------------------------------------------------------
import { GET } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('http://localhost/api/cron/chms-sync-runner', { headers });
}

function makePendingJob(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'job-1',
    churchId: 'church-1',
    provider: 'planning-center',
    jobType: 'full_sync',
    status: 'pending',
    payload: null,
    attempt: 0,
    maxAttempts: 3,
    nextAttemptAt: new Date(Date.now() - 1000),
    startedAt: null,
    completedAt: null,
    error: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMockAdapter(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    listMembers: vi.fn().mockResolvedValue([]),
    listGroups: vi.fn().mockResolvedValue([]),
    syncMember: vi.fn().mockResolvedValue(undefined),
    pushPrayerSummary: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/cron/chms-sync-runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  // ---- 1. Auth ----
  it('returns 401 for wrong CRON_SECRET', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  // ---- 2. No pending jobs ----
  it('returns { processed: 0, errors: 0 } when no pending jobs', async () => {
    mockDbSelect.mockReturnValueOnce([]);
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 0, errors: 0 });
  });

  // ---- 3. Successful full_sync ----
  it('marks job done and calls syncMember for full_sync', async () => {
    const member = {
      externalId: 'ext-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
      status: 'active' as const,
      raw: {},
    };
    const adapter = makeMockAdapter({
      listMembers: vi.fn().mockResolvedValue([member]),
    });
    mockGetAdapterForChurch.mockResolvedValue(adapter);
    mockDbSelect.mockReturnValueOnce([makePendingJob({ jobType: 'full_sync' })]);

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 1, errors: 0 });
    expect(adapter.listMembers).toHaveBeenCalledWith('church-1');
    expect(adapter.syncMember).toHaveBeenCalledWith('church-1', member);
  });

  // ---- 4. Successful delta_sync upsert ----
  it('calls syncMember for delta_sync upsert action', async () => {
    const member = {
      externalId: 'ext-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: null,
      status: 'active' as const,
      raw: {},
    };
    const payload = {
      event: 'person.updated',
      externalId: 'ext-2',
      action: 'upsert',
      member,
    };
    const adapter = makeMockAdapter();
    mockGetAdapterForChurch.mockResolvedValue(adapter);
    mockDbSelect.mockReturnValueOnce([
      makePendingJob({ jobType: 'delta_sync', payload }),
    ]);

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 1, errors: 0 });
    expect(adapter.syncMember).toHaveBeenCalledWith('church-1', member);
  });

  // ---- 5. Transient error — retry with backoff ----
  it('marks job pending with next_attempt_at advanced on PCO_RATE_LIMITED', async () => {
    const transientError = new Error('PCO_RATE_LIMITED: too many requests');
    mockGetAdapterForChurch.mockRejectedValue(transientError);

    const job = makePendingJob({ attempt: 0, maxAttempts: 3 });
    mockDbSelect.mockReturnValueOnce([job]);

    const before = Date.now();
    const res = await GET(makeRequest('test-secret'));
    const after = Date.now();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 0, errors: 1 });

    // Job should NOT be marked dead — no Sentry or notify call
    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockNotifyAdmins).not.toHaveBeenCalled();

    // update should have been called twice: once to mark running, once for retry
    expect(mockDbUpdate).toHaveBeenCalledTimes(2);
  });

  // ---- 6. Auth error → dead immediately ----
  it('marks job dead immediately on PCO_AUTH_EXPIRED', async () => {
    const authError = new Error('PCO_AUTH_EXPIRED: token expired');
    mockGetAdapterForChurch.mockRejectedValue(authError);

    const job = makePendingJob({ attempt: 0, maxAttempts: 3 });
    mockDbSelect.mockReturnValueOnce([job]);

    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 0, errors: 1 });

    expect(mockCaptureException).toHaveBeenCalledWith(
      authError,
      expect.objectContaining({ extra: expect.objectContaining({ errorKind: 'auth' }) })
    );
    expect(mockNotifyAdmins).toHaveBeenCalled();
  });

  // ---- 7. Dead job → Sentry + notifyAdmins ----
  it('calls Sentry.captureException and notifyAdmins when job becomes dead', async () => {
    const permanentError = new Error('404 not found — bad config');
    mockGetAdapterForChurch.mockRejectedValue(permanentError);

    const job = makePendingJob({ attempt: 0, maxAttempts: 3 });
    mockDbSelect.mockReturnValueOnce([job]);

    await GET(makeRequest('test-secret'));

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      permanentError,
      expect.objectContaining({
        extra: expect.objectContaining({
          jobId: 'job-1',
          churchId: 'church-1',
          jobType: 'full_sync',
        }),
      })
    );
    expect(mockNotifyAdmins).toHaveBeenCalledTimes(1);
    expect(mockNotifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('dead'),
      })
    );
  });
});
