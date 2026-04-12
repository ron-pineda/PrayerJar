import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- DB mock state (captured by reference in the factory, so hoisting is fine) ---
let mockDbResults: unknown[][] = [];
let callIndex = 0;

// --- Mocks ---

vi.mock('@/db', () => {
  const makeChain = (result: unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => Promise.resolve(result)),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  });

  const dbProxy = new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (prop === 'select' || prop === 'selectDistinct') {
        return () => {
          const result = mockDbResults[callIndex++] ?? [];
          return makeChain(result);
        };
      }
      return undefined;
    },
  });

  return { db: dbProxy };
});

vi.mock('resend', () => {
  const send = vi.fn().mockResolvedValue({ id: 'mock-email-id' });
  return {
    Resend: function MockResend() {
      this.emails = { send };
    },
  };
});

vi.mock('@react-email/components', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-email/components')>();
  return { ...original, render: vi.fn().mockResolvedValue('<html>digest</html>') };
});

vi.mock('@/emails/church-digest', () => ({
  default: vi.fn().mockReturnValue(null),
}));

// Import AFTER mocks
import { GET } from './route';

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) {
    headers['authorization'] = `Bearer ${secret}`;
  }
  return new NextRequest('http://localhost/api/cron/church-digest', { headers });
}

describe('GET /api/cron/church-digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResults = [];
    callIndex = 0;
    process.env.CRON_SECRET = 'test-secret';
  });

  it('returns 401 when no authorization header is provided', async () => {
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header has wrong secret', async () => {
    const req = makeRequest('wrong-secret');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns { sent: 0 } when no churches have admins or pastors', async () => {
    // selectDistinct adminRows → empty
    mockDbResults = [[]];
    const req = makeRequest('test-secret');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ sent: 0 });
  });

  it('returns { sent: 1 } on success with one church and one admin', async () => {
    const churchId = 'church-uuid-1';

    // DB call order (see route.ts):
    // 0: selectDistinct adminRows       → [{ churchId }]
    // 1: select churchRows              → [{ id, name }]
    // 2: newPrayers count               → [{ val: 5 }]
    // 3: answeredPrayers count          → [{ val: 2 }]
    // 4: newMembers count               → [{ val: 3 }]
    // 5: flaggedCount                   → [{ val: 1 }]
    // 6: churchPrayers ids              → [{ id: 'p1' }]
    // 7: totalInteractions count        → [{ val: 10 }]
    // 8: topPrayers                     → [{ content, category, prayedCount }]
    // 9: adminEmails                    → [{ email }]
    mockDbResults = [
      [{ churchId }],
      [{ id: churchId, name: 'Grace Church' }],
      [{ val: 5 }],
      [{ val: 2 }],
      [{ val: 3 }],
      [{ val: 1 }],
      [{ id: 'p1' }],
      [{ val: 10 }],
      [{ content: 'Heal my family', category: 'family', prayedCount: 4 }],
      [{ email: 'pastor@grace.org' }],
    ];

    const req = makeRequest('test-secret');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ sent: 1 });
  });
});
