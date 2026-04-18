import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (must be hoisted before imports) ───────────────────────────────────

vi.mock('@/lib/encrypt', () => ({
  encrypt: vi.fn((s: string) => 'enc:' + s),
  decrypt: vi.fn((s: string) => s.replace('enc:', '')),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

// Set required env vars before the module is imported
process.env.CHMS_PLANNING_CENTER_CLIENT_ID = 'test-client-id';
process.env.CHMS_PLANNING_CENTER_CLIENT_SECRET = 'test-client-secret';
process.env.NEXT_PUBLIC_APP_URL = 'https://app.prayerjar.org';
process.env.CHMS_CONFIG_ENCRYPTION_KEY = 'a'.repeat(64);

// ── Imports ──────────────────────────────────────────────────────────────────

import { PlanningCenterAdapter } from './PlanningCenterAdapter';
import { encrypt } from '@/lib/encrypt';
import { db } from '@/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdapter(): PlanningCenterAdapter {
  return new PlanningCenterAdapter();
}

/**
 * Build a chainable Drizzle update mock:
 *   db.update(table).set({}).where(condition)  →  resolves undefined
 */
function mockDbUpdate() {
  const whereFn = vi.fn().mockResolvedValue(undefined);
  const setFn = vi.fn().mockReturnValue({ where: whereFn });
  (db as any).update = vi.fn().mockReturnValue({ set: setFn });
  return { whereFn, setFn };
}

/**
 * Build a chainable Drizzle insert mock:
 *   db.insert(table).values({})  →  resolves undefined
 */
function mockDbInsert() {
  const valuesFn = vi.fn().mockResolvedValue(undefined);
  (db as any).insert = vi.fn().mockReturnValue({ values: valuesFn });
  return { valuesFn };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlanningCenterAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. getAuthorizationUrl ────────────────────────────────────────────────

  describe('getAuthorizationUrl()', () => {
    it('returns a URL containing the client_id and state', () => {
      const adapter = makeAdapter();
      const state = 'church-123:abc456';
      const url = adapter.getAuthorizationUrl(state);

      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(`state=${encodeURIComponent(state)}`);
      expect(url).toContain('https://api.planningcenteronline.com/oauth/authorize');
      expect(url).toContain('scope=people');
      expect(url).toContain(
        encodeURIComponent('/api/auth/chms/callback/planning-center')
      );
    });
  });

  // ── 2. exchangeCodeForTokens ──────────────────────────────────────────────

  describe('exchangeCodeForTokens()', () => {
    it('calls PCO token endpoint, persists encrypted config, inserts sync job, and returns ChmsConfig', async () => {
      const adapter = makeAdapter();
      const churchId = 'church-abc';

      // Mock PCO token response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'at-123',
          refresh_token: 'rt-456',
          expires_in: 3600,
        }),
      });

      mockDbUpdate();
      mockDbInsert();

      const config = await adapter.exchangeCodeForTokens('auth-code-xyz', churchId);

      // Correct shape
      expect(config.provider).toBe('planning-center');
      expect(config.accessToken).toBe('at-123');
      expect(config.refreshToken).toBe('rt-456');
      expect(config.groupsAvailable).toBe(true);
      expect(typeof config.connectedAt).toBe('string');
      expect(typeof config.tokenExpiresAt).toBe('string');

      // encrypt was called with the JSON-serialized config
      expect(encrypt).toHaveBeenCalledOnce();
      const encryptArg = (encrypt as any).mock.calls[0][0] as string;
      const parsed = JSON.parse(encryptArg);
      expect(parsed.accessToken).toBe('at-123');

      // db.update called for churches
      expect((db as any).update).toHaveBeenCalledOnce();

      // db.insert called for chmsSyncJobs
      expect((db as any).insert).toHaveBeenCalledOnce();
      const insertValuesFn = (db as any).insert.mock.results[0].value.values;
      expect(insertValuesFn).toHaveBeenCalledWith(
        expect.objectContaining({
          churchId,
          provider: 'planning-center',
          jobType: 'full_sync',
          status: 'pending',
        })
      );
    });
  });

  // ── 3. disconnect ─────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('calls PCO revoke endpoint and clears chmsConfig + chmsProvider in DB', async () => {
      const adapter = makeAdapter();
      await adapter.connect({
        provider: 'planning-center',
        accessToken: 'at-to-revoke',
        refreshToken: 'rt-xyz',
        connectedAt: new Date().toISOString(),
      });

      const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true });
      global.fetch = fetchMock;

      mockDbUpdate();

      await adapter.disconnect('church-xyz');

      // Revoke endpoint called
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/oauth/revoke',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('at-to-revoke'),
        })
      );

      // DB cleared
      expect((db as any).update).toHaveBeenCalledOnce();
      const setArg = (db as any).update.mock.results[0].value.set.mock.calls[0][0];
      expect(setArg.chmsConfig).toBeNull();
      expect(setArg.chmsProvider).toBeNull();
    });
  });

  // ── 4. authRequest — 401 → refresh → retry → 200 ────────────────────────

  describe('authRequest() — private via (adapter as any)', () => {
    it('retries after 401 if refresh succeeds and second call returns 200', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        connectedAt: new Date().toISOString(),
      };
      adapter.churchId = 'church-refresh-test';

      // PCO token refresh
      const refreshTokenResponse = {
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
      };

      // API call responses: first 401, then 200 after refresh
      const apiResponse200 = {
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      };
      const apiResponse401 = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized' }),
      };

      global.fetch = vi
        .fn()
        // 1st call: API → 401
        .mockResolvedValueOnce(apiResponse401)
        // 2nd call: token refresh → success
        .mockResolvedValueOnce(refreshTokenResponse)
        // 3rd call: API retry → 200
        .mockResolvedValueOnce(apiResponse200);

      mockDbUpdate();

      const result = await adapter.authRequest('GET', 'https://api.planningcenteronline.com/people/v2/people');

      expect(result).toEqual({ data: 'success' });
      // Token was updated
      expect(adapter.config.accessToken).toBe('new-token');
    });

    // ── 5. authRequest — 401 after refresh also 401 → throws PCO_AUTH_EXPIRED ──

    it('throws PCO_AUTH_EXPIRED when retry after refresh also returns 401', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh',
        connectedAt: new Date().toISOString(),
      };
      adapter.churchId = 'church-auth-expired';

      // Refresh succeeds (new token issued) but API still rejects
      const refreshTokenResponse = {
        ok: true,
        json: async () => ({
          access_token: 'still-invalid-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
      };
      const apiResponse401 = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized' }),
      };

      global.fetch = vi
        .fn()
        // 1st call: API → 401
        .mockResolvedValueOnce(apiResponse401)
        // 2nd call: token refresh → success
        .mockResolvedValueOnce(refreshTokenResponse)
        // 3rd call: API retry → 401 again
        .mockResolvedValueOnce(apiResponse401);

      mockDbUpdate();

      await expect(
        adapter.authRequest('GET', 'https://api.planningcenteronline.com/people/v2/people')
      ).rejects.toThrow('PCO_AUTH_EXPIRED');
    });
  });
});
