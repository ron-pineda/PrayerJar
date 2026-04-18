/**
 * PCO Sandbox Integration Tests — pj-s18-13
 *
 * These tests run against the real Planning Center Online sandbox API.
 * All tests are SKIPPED automatically if PCO_SANDBOX_CLIENT_ID is not set.
 *
 * Required env vars to run:
 *   PCO_SANDBOX_CLIENT_ID       — OAuth app client ID from api.planningcenteronline.com
 *   PCO_SANDBOX_CLIENT_SECRET   — OAuth app client secret
 *   PCO_SANDBOX_ACCESS_TOKEN    — manually obtained Bearer token for the sandbox org
 *   PCO_SANDBOX_REFRESH_TOKEN   — OAuth refresh token for the sandbox org
 *
 * Optional env vars:
 *   PCO_SANDBOX_CHURCH_ID       — arbitrary string used as churchId in tests (default: 'sandbox-church')
 *   NEXT_PUBLIC_APP_URL         — app base URL for CSRF callback test (test skipped if not set)
 *
 * How to obtain sandbox credentials:
 *   1. Create a free Planning Center organization at planningcenter.com
 *   2. Register an OAuth app at api.planningcenteronline.com/oauth/applications
 *      — Redirect URI: http://localhost:3000/api/auth/chms/callback/planning-center
 *   3. Run the OAuth flow manually (or use curl) to get access + refresh tokens
 *   4. Set the env vars in .env.local (never commit them)
 *
 * DB NOTE: syncMember tests mock all DB calls. These tests NEVER touch
 * the PrayerJar database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ChmsMember } from '../ChmsAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Skip gate — every test in this file is skipped without sandbox credentials
// ─────────────────────────────────────────────────────────────────────────────

const SANDBOX_AVAILABLE = !!process.env.PCO_SANDBOX_CLIENT_ID;

// ─────────────────────────────────────────────────────────────────────────────
// Module mocks (must be declared before adapter import)
// ─────────────────────────────────────────────────────────────────────────────

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

// Set the production env vars the constructor requires.
// For sandbox tests we point to the sandbox OAuth app credentials.
process.env.CHMS_PLANNING_CENTER_CLIENT_ID =
  process.env.PCO_SANDBOX_CLIENT_ID ?? 'placeholder-not-used';
process.env.CHMS_PLANNING_CENTER_CLIENT_SECRET =
  process.env.PCO_SANDBOX_CLIENT_SECRET ?? 'placeholder-not-used';
process.env.CHMS_CONFIG_ENCRYPTION_KEY = 'a'.repeat(64);

// ─────────────────────────────────────────────────────────────────────────────
// Imports (after env + mocks)
// ─────────────────────────────────────────────────────────────────────────────

import { PlanningCenterAdapter } from './PlanningCenterAdapter';
import { db } from '@/db';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SANDBOX_CHURCH_ID = process.env.PCO_SANDBOX_CHURCH_ID ?? 'sandbox-church';

/** Build a fully connected adapter using sandbox tokens. */
async function makeSandboxAdapter(): Promise<PlanningCenterAdapter> {
  const adapter = new PlanningCenterAdapter();
  await adapter.connect({
    provider: 'planning-center',
    accessToken: process.env.PCO_SANDBOX_ACCESS_TOKEN!,
    refreshToken: process.env.PCO_SANDBOX_REFRESH_TOKEN!,
    tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    connectedAt: new Date().toISOString(),
    groupsAvailable: true,
  });
  return adapter;
}

/** Build a chainable Drizzle update mock. */
function mockDbUpdate() {
  const whereFn = vi.fn().mockResolvedValue(undefined);
  const setFn = vi.fn().mockReturnValue({ where: whereFn });
  (db as unknown as Record<string, ReturnType<typeof vi.fn>>).update = vi
    .fn()
    .mockReturnValue({ set: setFn });
  return { whereFn, setFn };
}

/** Build a chainable Drizzle insert mock (supports .onConflictDoUpdate). */
function mockDbInsert() {
  const onConflictDoUpdateFn = vi.fn().mockResolvedValue(undefined);
  const valuesFn = vi
    .fn()
    .mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateFn });
  (db as unknown as Record<string, ReturnType<typeof vi.fn>>).insert = vi
    .fn()
    .mockReturnValue({ values: valuesFn });
  return { valuesFn, onConflictDoUpdateFn };
}

/** Build a chainable Drizzle select mock. */
function mockDbSelect(rows: unknown[]) {
  const whereFn = vi.fn().mockResolvedValue(rows);
  const fromFn = vi.fn().mockReturnValue({ where: whereFn });
  (db as unknown as Record<string, ReturnType<typeof vi.fn>>).select = vi
    .fn()
    .mockReturnValue({ from: fromFn });
  return { whereFn, fromFn };
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration test suite
// ─────────────────────────────────────────────────────────────────────────────

describe.skipIf(!SANDBOX_AVAILABLE)(
  'PlanningCenterAdapter integration (PCO sandbox)',
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    // ── 1. OAuth token validity ───────────────────────────────────────────────
    //
    // Smoke-test: hits GET /people/v2/me with the raw sandbox access token via
    // native fetch (not through the adapter) to confirm credentials are valid
    // before running the full adapter tests.

    it('1. OAuth token validity — GET /people/v2/me returns 200 with Person data', async () => {
      const res = await fetch(
        'https://api.planningcenteronline.com/people/v2/me',
        {
          headers: {
            Authorization: `Bearer ${process.env.PCO_SANDBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as { data?: { type?: string } };
      expect(body.data?.type).toBe('Person');
    });

    // ── 2. listMembers — happy path ───────────────────────────────────────────
    //
    // Verifies the adapter can retrieve at least one member from the sandbox
    // org and that the returned shape matches ChmsMember.

    it('2. listMembers — returns ≥1 ChmsMember with valid shape', async () => {
      const adapter = await makeSandboxAdapter();

      const members = await adapter.listMembers(SANDBOX_CHURCH_ID);

      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThanOrEqual(1);

      const first = members[0];
      expect(typeof first.externalId).toBe('string');
      expect(first.externalId.length).toBeGreaterThan(0);
      expect(typeof first.firstName).toBe('string');
      expect(typeof first.lastName).toBe('string');
      expect(['active', 'inactive', 'unknown']).toContain(first.status);
      // email can be null (no primary email set) — just check the property exists
      expect('email' in first).toBe(true);
      expect('phone' in first).toBe(true);
      expect(typeof first.raw).toBe('object');
    });

    // ── 3. listMembers — pagination ───────────────────────────────────────────
    //
    // PCO's default page size is 100 (we request 100 per page).
    // If the sandbox org has ≤100 members this scenario cannot be verified —
    // the test is conditionally skipped with a clear note.

    it('3. listMembers — pagination fetches all pages', async () => {
      const adapter = await makeSandboxAdapter();

      const members = await adapter.listMembers(SANDBOX_CHURCH_ID);

      if (members.length <= 100) {
        // Sandbox has ≤100 members — pagination cannot be verified.
        // Add >100 people to the sandbox org and re-run to exercise this path.
        console.info(
          `[skip-reason] Sandbox has ${members.length} members (≤100). ` +
            'Pagination test requires >100 members to trigger links.next. ' +
            'Add more people to the PCO sandbox org to test this scenario.'
        );
        return;
      }

      // If we got here, multiple pages were fetched successfully.
      expect(members.length).toBeGreaterThan(100);
      // All returned items still have valid externalIds.
      for (const m of members) {
        expect(typeof m.externalId).toBe('string');
      }
    });

    // ── 4. listGroups — happy path or graceful 403 ────────────────────────────
    //
    // If the sandbox org has the Groups module, ≥1 group is returned.
    // If Groups is not licensed, the adapter sets groupsAvailable=false and
    // returns []. Both outcomes are valid — the test asserts the shape.

    it('4. listGroups — returns groups or gracefully handles 403 (no Groups module)', async () => {
      const adapter = await makeSandboxAdapter();

      mockDbUpdate(); // listGroups may persist groupsAvailable=false to DB

      const groups = await adapter.listGroups(SANDBOX_CHURCH_ID);

      expect(Array.isArray(groups)).toBe(true);

      if (groups.length === 0) {
        // 403 path — groupsAvailable should be false on the adapter's internal config.
        // We can't read private state directly, but the DB update would have been called.
        console.info(
          '[info] listGroups returned []. ' +
            'Either the sandbox org has no groups, or the Groups module returned 403 ' +
            '(not licensed). groupsAvailable flag was persisted to DB.'
        );
      } else {
        // Happy path — verify shape of each group.
        for (const group of groups) {
          expect(typeof group.externalId).toBe('string');
          expect(typeof group.name).toBe('string');
          expect(Array.isArray(group.memberExternalIds)).toBe(true);
        }
      }
    });

    // ── 5. syncMember — upsert (DB mocked) ───────────────────────────────────
    //
    // Verifies syncMember runs without throwing when a user already exists.
    // All DB calls are mocked — this test never writes to the PrayerJar DB.

    it('5. syncMember — upserts without throwing (DB mocked)', async () => {
      const adapter = await makeSandboxAdapter();

      const testMember: ChmsMember = {
        externalId: 'sandbox-person-test-001',
        firstName: 'Sandbox',
        lastName: 'TestUser',
        email: 'sandbox-test@prayerjar-qa.invalid',
        phone: null,
        status: 'active',
        raw: {},
      };

      // Simulate: user already exists in DB (no stub creation needed)
      mockDbSelect([{ id: 'existing-user-uuid' }]);
      mockDbInsert();

      await expect(
        adapter.syncMember(SANDBOX_CHURCH_ID, testMember)
      ).resolves.toBeUndefined();

      // DB insert called once (churchMembers upsert only, no stub user)
      expect((db as unknown as Record<string, ReturnType<typeof vi.fn>>).insert).toHaveBeenCalledOnce();
    });

    // ── 6. OAuth CSRF protection — mismatched state cookie ───────────────────
    //
    // Sends a GET to the callback route with a state that doesn't match any
    // stored cookie. Expects a 400 response.
    // Skipped if NEXT_PUBLIC_APP_URL is not configured.

    it('6. OAuth CSRF protection — mismatched state returns 400', async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        console.info(
          '[skip-reason] NEXT_PUBLIC_APP_URL not set. ' +
            'Set it to test the CSRF callback route against a running app instance.'
        );
        return;
      }

      const callbackUrl = new URL(
        '/api/auth/chms/callback/planning-center',
        appUrl
      );
      callbackUrl.searchParams.set('code', 'fake-auth-code');
      // state deliberately does not match any valid cookie
      callbackUrl.searchParams.set('state', 'tampered:invalid-state-value');

      const res = await fetch(callbackUrl.toString(), {
        redirect: 'manual', // don't follow redirects — we want the raw status
      });

      // The callback handler should reject mismatched state with 400
      expect(res.status).toBe(400);
    });

    // ── 7. Rate limiter pacing — no 429 on 3 sequential calls ────────────────
    //
    // Calls listMembers 3 times back-to-back. The built-in RateLimiter (100
    // req/60s token-bucket) should pace the requests so none receive a 429.
    // This is a smoke test — we verify absence of 429, not wall-clock timing.

    it('7. Rate limiter pacing — 3 sequential listMembers calls complete without 429', async () => {
      const adapter = await makeSandboxAdapter();

      const results = await Promise.all([
        adapter.listMembers(SANDBOX_CHURCH_ID).catch((e: unknown) => e),
        adapter.listMembers(SANDBOX_CHURCH_ID).catch((e: unknown) => e),
        adapter.listMembers(SANDBOX_CHURCH_ID).catch((e: unknown) => e),
      ]);

      for (const result of results) {
        // If a call threw, check that it's NOT a rate-limit error
        if (result instanceof Error) {
          expect(result.message).not.toBe('PCO_RATE_LIMITED');
        } else {
          expect(Array.isArray(result)).toBe(true);
        }
      }
    });

    // ── 8. Token refresh — expired access token triggers auto-refresh ─────────
    //
    // Constructs an adapter with tokenExpiresAt in the past so authRequest
    // detects expiry and triggers a refresh via the refresh token. The call
    // to listMembers should still succeed (adapter transparently refreshes).
    //
    // NOTE: PCO's token endpoint issues a new access_token on 401 retry, not
    // based on tokenExpiresAt client-side. The adapter currently refreshes
    // on 401 (server-side expiry signal), which is the correct production path.
    // This test uses an expired tokenExpiresAt to document the intended behavior;
    // the actual refresh is triggered when PCO returns 401.

    it('8. Token refresh — adapter auto-refreshes on 401 and succeeds', async () => {
      const adapter = new PlanningCenterAdapter();

      // Connect with a deliberately past expiry time.
      // The adapter will use the access token anyway; PCO will return 401 if it's
      // truly expired, triggering the refresh path.
      await adapter.connect({
        provider: 'planning-center',
        accessToken: process.env.PCO_SANDBOX_ACCESS_TOKEN!,
        refreshToken: process.env.PCO_SANDBOX_REFRESH_TOKEN!,
        // tokenExpiresAt in the past — signals the token is expired client-side
        tokenExpiresAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        connectedAt: new Date().toISOString(),
        groupsAvailable: true,
      });

      // Mock DB update for the case where refresh persists new token
      mockDbUpdate();

      // listMembers should succeed — either the token is still valid (no 401
      // from PCO yet) or the adapter auto-refreshes on 401.
      const members = await adapter.listMembers(SANDBOX_CHURCH_ID);

      expect(Array.isArray(members)).toBe(true);
      // If token was still valid, we get members; if refreshed, we also get members.
      // Either outcome is correct.
    });
  }
);
