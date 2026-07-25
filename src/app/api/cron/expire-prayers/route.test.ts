import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/services/prayer.service', () => ({
  expireOverduePrayers: vi.fn().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]),
}));

const SECRET = 'test-cron-secret';

function request() {
  return new NextRequest('https://prayerjar.org/api/cron/expire-prayers', {
    headers: { authorization: `Bearer ${SECRET}` },
  });
}

/**
 * The suspension is read at module scope, so each test re-imports the route
 * with the env it wants. Guards the 2026-07-25 decision: expiry stays off
 * until someone explicitly opts back in.
 */
async function loadRoute(expiryEnabled?: string) {
  vi.resetModules();
  process.env.CRON_SECRET = SECRET;
  if (expiryEnabled === undefined) delete process.env.PRAYER_EXPIRY_ENABLED;
  else process.env.PRAYER_EXPIRY_ENABLED = expiryEnabled;
  return import('./route');
}

describe('expire-prayers cron', () => {
  const originalEnv = { ...process.env };
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects an unauthorized caller', async () => {
    const { GET } = await loadRoute('true');
    const res = await GET(
      new NextRequest('https://prayerjar.org/api/cron/expire-prayers', {
        headers: { authorization: 'Bearer wrong' },
      })
    );
    expect(res.status).toBe(401);
  });

  it('is a no-op when PRAYER_EXPIRY_ENABLED is unset', async () => {
    const { GET } = await loadRoute(undefined);
    const { expireOverduePrayers } = await import('@/services/prayer.service');

    const body = await (await GET(request())).json();

    expect(body).toMatchObject({ expired: 0, suspended: true });
    expect(expireOverduePrayers).not.toHaveBeenCalled();
  });

  it('is a no-op when PRAYER_EXPIRY_ENABLED is not exactly "true"', async () => {
    const { GET } = await loadRoute('1');
    const { expireOverduePrayers } = await import('@/services/prayer.service');

    const body = await (await GET(request())).json();

    expect(body.suspended).toBe(true);
    expect(expireOverduePrayers).not.toHaveBeenCalled();
  });

  it('expires overdue prayers only when explicitly enabled', async () => {
    const { GET } = await loadRoute('true');
    const { expireOverduePrayers } = await import('@/services/prayer.service');

    const body = await (await GET(request())).json();

    expect(expireOverduePrayers).toHaveBeenCalledOnce();
    expect(body).toEqual({ expired: 2 });
  });
});
