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

vi.mock('@/lib/admin-notify', () => ({
  notifyAdmins: vi.fn().mockResolvedValue(undefined),
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
import { notifyAdmins } from '@/lib/admin-notify';

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
 *   also supports .values({}).onConflictDoUpdate({})  →  resolves undefined
 */
function mockDbInsert() {
  const onConflictDoUpdateFn = vi.fn().mockResolvedValue(undefined);
  const valuesFn = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateFn });
  (db as any).insert = vi.fn().mockReturnValue({ values: valuesFn });
  return { valuesFn, onConflictDoUpdateFn };
}

/**
 * Build a chainable Drizzle select mock:
 *   db.select({}).from(table).where(condition)  →  resolves rows
 */
function mockDbSelect(rows: unknown[]) {
  const whereFn = vi.fn().mockResolvedValue(rows);
  const fromFn = vi.fn().mockReturnValue({ where: whereFn });
  (db as any).select = vi.fn().mockReturnValue({ from: fromFn });
  return { whereFn, fromFn };
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

  // ── 6. listMembers — single page ─────────────────────────────────────────

  describe('listMembers()', () => {
    it('returns ChmsMember array from a single page with no links.next', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'at-list',
        refreshToken: 'rt-list',
        connectedAt: new Date().toISOString(),
      };

      const pageOne = {
        data: [
          {
            id: 'p1',
            attributes: {
              first_name: 'Alice',
              last_name: 'Smith',
              status: 'active',
              primary_email_address: { address: 'alice@example.com' },
            },
          },
          {
            id: 'p2',
            attributes: {
              first_name: 'Bob',
              last_name: 'Jones',
              status: 'inactive',
              primary_email_address: null,
            },
          },
        ],
        links: {},
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => pageOne,
      });

      const members = await adapter.listMembers('church-1');

      expect(members).toHaveLength(2);
      expect(members[0]).toMatchObject({
        externalId: 'p1',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: null,
        status: 'active',
      });
      expect(members[1]).toMatchObject({
        externalId: 'p2',
        firstName: 'Bob',
        lastName: 'Jones',
        email: null,
        status: 'inactive',
      });
    });

    // ── 7. listMembers — two pages ──────────────────────────────────────────

    it('paginates via links.next and returns members from both pages', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'at-paginate',
        refreshToken: 'rt-paginate',
        connectedAt: new Date().toISOString(),
      };

      const makePerson = (id: string) => ({
        id,
        attributes: {
          first_name: `First${id}`,
          last_name: `Last${id}`,
          status: 'active',
          primary_email_address: { address: `${id}@example.com` },
        },
      });

      const pageOne = {
        data: [makePerson('p1'), makePerson('p2')],
        links: { next: 'https://api.planningcenteronline.com/people/v2/people?per_page=100&offset=100' },
      };
      const pageTwo = {
        data: [makePerson('p3'), makePerson('p4')],
        links: {},
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => pageOne })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => pageTwo });

      const members = await adapter.listMembers('church-paginate');

      expect(members).toHaveLength(4);
      expect(members.map((m: { externalId: string }) => m.externalId)).toEqual(['p1', 'p2', 'p3', 'p4']);
    });
  });

  // ── 8. listGroups — 403 sets groupsAvailable=false ───────────────────────

  describe('listGroups()', () => {
    it('sets groupsAvailable=false and returns [] when PCO returns 403', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'at-groups',
        refreshToken: 'rt-groups',
        connectedAt: new Date().toISOString(),
        groupsAvailable: true,
      };
      adapter.churchId = 'church-groups-403';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ errors: [{ status: '403' }] }),
      });

      mockDbUpdate();

      const groups = await adapter.listGroups('church-groups-403');

      expect(groups).toEqual([]);
      expect(adapter.config.groupsAvailable).toBe(false);
      expect((db as any).update).toHaveBeenCalledOnce();
    });

    // ── 9. listGroups — happy path ────────────────────────────────────────

    it('returns ChmsGroup with memberExternalIds from memberships endpoint', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'at-groups-ok',
        refreshToken: 'rt-groups-ok',
        connectedAt: new Date().toISOString(),
        groupsAvailable: true,
      };

      const groupsPage = {
        data: [
          { id: 'g1', attributes: { name: 'Small Group A', description: 'A small group' } },
        ],
        links: {},
      };
      const membershipsPage = {
        data: [
          { relationships: { person: { data: { id: 'p1' } } } },
          { relationships: { person: { data: { id: 'p2' } } } },
        ],
        links: {},
      };

      global.fetch = vi
        .fn()
        // First call: list groups (authRequestRaw)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => groupsPage,
        })
        // Second call: fetch memberships for g1 (authRequest)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => membershipsPage,
        });

      const groups = await adapter.listGroups('church-groups-ok');

      expect(groups).toHaveLength(1);
      expect(groups[0]).toMatchObject({
        externalId: 'g1',
        name: 'Small Group A',
        description: 'A small group',
        memberExternalIds: ['p1', 'p2'],
      });
    });
  });

  // ── 10. syncMember — user already exists ─────────────────────────────────

  describe('syncMember()', () => {
    it('upserts into churchMembers without creating a stub user when email exists', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'at-sync',
        refreshToken: 'rt-sync',
        connectedAt: new Date().toISOString(),
      };

      const member = {
        externalId: 'ext-p1',
        firstName: 'Carol',
        lastName: 'Doe',
        email: 'carol@example.com',
        phone: null,
        status: 'active' as const,
        raw: {},
      };

      // db.select returns an existing user
      mockDbSelect([{ id: 'user-uuid-existing' }]);
      const { valuesFn, onConflictDoUpdateFn } = mockDbInsert();

      await adapter.syncMember('church-sync', member);

      // No stub user created — insert called once (for churchMembers upsert)
      expect((db as any).insert).toHaveBeenCalledOnce();
      // onConflictDoUpdate means it was an upsert
      expect(onConflictDoUpdateFn).toHaveBeenCalledOnce();
      expect(notifyAdmins).not.toHaveBeenCalled();
    });

    // ── 11. syncMember — no user, create stub + notify ─────────────────────

    it('creates stub user and calls notifyAdmins when email not in users table', async () => {
      const adapter = makeAdapter() as any;
      adapter.config = {
        provider: 'planning-center',
        accessToken: 'at-sync-stub',
        refreshToken: 'rt-sync-stub',
        connectedAt: new Date().toISOString(),
      };

      const member = {
        externalId: 'ext-p2',
        firstName: 'Dave',
        lastName: 'New',
        email: 'dave@example.com',
        phone: null,
        status: 'active' as const,
        raw: {},
      };

      // db.select returns no existing user
      mockDbSelect([]);
      const { valuesFn, onConflictDoUpdateFn } = mockDbInsert();

      await adapter.syncMember('church-stub', member);

      // insert called twice: stub user + churchMembers upsert
      expect((db as any).insert).toHaveBeenCalledTimes(2);
      // Both values calls were made
      expect(valuesFn).toHaveBeenCalledTimes(2);

      // First insert: stub user with emailVerified=null
      const stubUserArg = valuesFn.mock.calls[0][0];
      expect(stubUserArg).toMatchObject({
        name: 'Dave New',
        email: 'dave@example.com',
        emailVerified: null,
      });

      // Admin notified
      expect(notifyAdmins).toHaveBeenCalledOnce();
      expect((notifyAdmins as any).mock.calls[0][0].subject).toContain('stub user');
    });
  });
});
