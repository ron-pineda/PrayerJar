import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.CRON_SECRET = 'test-secret';

function makeReq() {
  return new NextRequest('http://localhost/api/cron/welcome-drip', {
    headers: { authorization: 'Bearer test-secret' },
  });
}

// ── Spy refs (vi.hoisted so they're available inside vi.mock factories) ──
const { mockSelectChain, mockUpdateChain, mockSendWelcome2, mockSendWelcome3, mockSendChurchWelcome2, mockSendChurchWelcome3 } = vi.hoisted(() => {
  const mockSendWelcome2 = vi.fn().mockResolvedValue(undefined);
  const mockSendWelcome3 = vi.fn().mockResolvedValue(undefined);
  const mockSendChurchWelcome2 = vi.fn().mockResolvedValue(undefined);
  const mockSendChurchWelcome3 = vi.fn().mockResolvedValue(undefined);

  // mockSelectChain: each select chain call returns from a queue.
  // The chain is lazy: the queue is only consumed when the promise is actually awaited (.then called).
  // Supports: .from().innerJoin(), .from().innerJoin().where(),
  //           .from().innerJoin().innerJoin().where(), .from().where()
  const selectResults: object[][] = [];

  // Returns a thenable + chainable object. Queue is consumed lazily on .then().
  function makeChainNode(): any {
    const node: any = {
      then(resolve: any, reject: any) {
        return Promise.resolve(selectResults.shift() ?? []).then(resolve, reject);
      },
      where: vi.fn().mockImplementation(() => Promise.resolve(selectResults.shift() ?? [])),
      innerJoin: vi.fn().mockImplementation(() => makeChainNode()),
    };
    return node;
  }

  const mockFrom = vi.fn().mockImplementation(() => makeChainNode());
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockSelectChain = { select: mockSelect, selectResults };

  const mockUpdateWhere = vi.fn().mockResolvedValue([]);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockUpdateChain = { update: mockUpdate };

  return { mockSelectChain, mockUpdateChain, mockSendWelcome2, mockSendWelcome3, mockSendChurchWelcome2, mockSendChurchWelcome3 };
});

vi.mock('@/db', () => ({
  db: {
    select: mockSelectChain.select,
    update: mockUpdateChain.update,
  },
}));

vi.mock('@/services/email.service', () => ({
  sendWelcome2Email: mockSendWelcome2,
  sendWelcome3Email: mockSendWelcome3,
  sendChurchWelcome2Email: mockSendChurchWelcome2,
  sendChurchWelcome3Email: mockSendChurchWelcome3,
}));

import { GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectChain.selectResults.length = 0;
});

// ── Helper to build a church admin drip row ──
function churchRow(overrides: Partial<{
  churchId: string;
  adminUserId: string;
  adminEmail: string;
  churchSlug: string;
  email2SentAt: Date | null;
  email3SentAt: Date | null;
  createdAt: Date;
}> = {}) {
  return {
    churchId: 'church-1',
    adminUserId: 'user-1',
    adminEmail: 'pastor@grace.org',
    churchSlug: 'grace-church',
    email2SentAt: null,
    email3SentAt: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    ...overrides,
  };
}

describe('welcome-drip cron — existing user drip', () => {
  it('returns 200 with sent counts', async () => {
    // Empty user drip + empty church drip
    mockSelectChain.selectResults.push([], [], []); // welcomeDripStatus rows, email2 candidates, email3 candidates
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('sent2');
    expect(body).toHaveProperty('sent3');
  });
});

describe('welcome-drip cron — church admin drip email 2', () => {
  it('sends email 2 when church is 3+ days old and has no non-admin members', async () => {
    // user drip empty, email2 candidates has 1 row, member count = 0, email3 candidates empty
    mockSelectChain.selectResults.push(
      [],                    // welcomeDripStatus (user drip)
      [churchRow()],         // email2 candidates
      [{ count: 0 }],        // member count for church-1
      [],                    // email3 candidates
    );
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome2).toHaveBeenCalledWith('church-1', 'pastor@grace.org', 'grace-church');
    const body = await res.json();
    expect(body.churchSent2).toBe(1);
  });

  it('stamps email2SentAt without sending when church has non-admin members', async () => {
    mockSelectChain.selectResults.push(
      [],
      [churchRow()],
      [{ count: 1 }],        // 1 non-admin member — skip send
      [],
    );
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome2).not.toHaveBeenCalled();
    expect(mockUpdateChain.update).toHaveBeenCalled();
    const body = await res.json();
    expect(body.churchSent2).toBe(0);
  });
});

describe('welcome-drip cron — church admin drip email 3', () => {
  it('sends email 3 when church is 7+ days old and has no non-admin members', async () => {
    const row = churchRow({
      email2SentAt: new Date(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    });
    mockSelectChain.selectResults.push(
      [],                    // user drip empty
      [],                    // email2 candidates empty
      [row],                 // email3 candidates
      [{ count: 0 }],        // member count = 0
    );
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome3).toHaveBeenCalledWith('church-1', 'pastor@grace.org', 'grace-church');
    const body = await res.json();
    expect(body.churchSent3).toBe(1);
  });

  it('stamps email3SentAt without sending when church has non-admin members', async () => {
    const row = churchRow({
      email2SentAt: new Date(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
    mockSelectChain.selectResults.push([], [], [row], [{ count: 1 }]);
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome3).not.toHaveBeenCalled();
    expect(mockUpdateChain.update).toHaveBeenCalled();
  });
});
