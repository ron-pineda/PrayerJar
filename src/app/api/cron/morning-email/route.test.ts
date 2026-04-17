import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbResults: unknown[][] = [];
let callIndex = 0;

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
    Resend: function MockResend(this: { emails: { send: typeof send } }) {
      this.emails = { send };
    },
  };
});

vi.mock('@react-email/components', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-email/components')>();
  return { ...original, render: vi.fn().mockResolvedValue('<html>morning</html>') };
});

vi.mock('@/emails/morning-email', () => ({
  default: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/verses', () => ({
  getDayVerse: vi.fn().mockReturnValue({ text: 'Test verse.', reference: 'Test 1:1' }),
}));

import { GET } from './route';

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('http://localhost/api/cron/morning-email', { headers });
}

const ELIGIBLE_USER = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Ron',
  currentStreak: 5,
  quietHoursStart: null,
  quietHoursEnd: null,
  quietHoursTimezone: null,
};

const THREE_PRAYERS = [
  { content: 'Pray for my family', category: 'family', prayerCount: 4 },
  { content: 'Heal my friend', category: 'health', prayerCount: 2 },
  { content: 'Guide my career', category: 'work_career', prayerCount: 1 },
];

describe('GET /api/cron/morning-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResults = [];
    callIndex = 0;
    process.env.CRON_SECRET = 'test-secret';
  });

  it('returns 401 when no authorization header is provided', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header has wrong secret', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns { sent: 0, skipped: 0 } when no eligible users', async () => {
    mockDbResults = [[]];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, skipped: 0 });
  });

  it('returns { sent: 1, skipped: 0 } for one user with activity', async () => {
    // DB call order:
    // 0: eligibleUsers
    // 1: prayersReceivedCount  (innerJoin query, resolves via .then)
    // 2: encouragementsCount   (innerJoin query, resolves via .then)
    // 3: prayerRows            (.limit(3), resolves via .limit)
    mockDbResults = [
      [ELIGIBLE_USER],
      [{ count: 3 }],
      [{ count: 1 }],
      THREE_PRAYERS,
    ];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 1, skipped: 0 });
  });

  it('skips user when inside quiet hours (0–23 UTC covers all hours)', async () => {
    mockDbResults = [
      [{ ...ELIGIBLE_USER, quietHoursStart: 0, quietHoursEnd: 23, quietHoursTimezone: 'UTC' }],
    ];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, skipped: 1 });
  });

  it('skips user when no active prayers are available', async () => {
    mockDbResults = [
      [ELIGIBLE_USER],
      [{ count: 0 }],
      [{ count: 0 }],
      [],
    ];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, skipped: 1 });
  });
});
