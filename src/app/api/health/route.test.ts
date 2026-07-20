import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({
  db: { execute: vi.fn() },
}));

import { db } from '@/db';
import { GET } from './route';

const mockExecute = db.execute as ReturnType<typeof vi.fn>;

function mockResendDomain(status: string, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: async () => ({ status }) }),
  );
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RESEND_KEY = 're_test_key';
  });

  it('returns 200 ok when db and email are healthy', async () => {
    mockExecute.mockResolvedValue([{ '?column?': 1 }]);
    mockResendDomain('verified');

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: true, email: true });
  });

  it('returns 503 degraded when the Resend domain is not verified', async () => {
    mockExecute.mockResolvedValue([{ '?column?': 1 }]);
    mockResendDomain('failed');

    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: true, email: false });
  });

  it('returns 503 degraded when the db is unreachable', async () => {
    mockExecute.mockRejectedValue(new Error('connection refused'));
    mockResendDomain('verified');

    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: false, email: true });
  });

  it('returns 503 when AUTH_RESEND_KEY is missing', async () => {
    delete process.env.AUTH_RESEND_KEY;
    mockExecute.mockResolvedValue([{ '?column?': 1 }]);
    mockResendDomain('verified');

    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: true, email: false });
  });
});
