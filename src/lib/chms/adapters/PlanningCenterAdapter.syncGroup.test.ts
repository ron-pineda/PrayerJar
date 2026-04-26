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
    delete: vi.fn(),
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
import { db } from '@/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdapter(): PlanningCenterAdapter {
  const adapter = new PlanningCenterAdapter();
  (adapter as any).config = {
    provider: 'planning-center',
    accessToken: 'at-test',
    refreshToken: 'rt-test',
    connectedAt: new Date().toISOString(),
  };
  (adapter as any).churchId = 'church-test';
  return adapter;
}

/**
 * Build a chainable Drizzle insert mock that supports:
 *   db.insert(table).values({}).onConflictDoUpdate({}).returning()  →  resolves rows
 *   db.insert(table).values({}).onConflictDoNothing()               →  resolves undefined
 */
function mockDbInsertReturning(returningRows: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(returningRows);
  const onConflictDoUpdateFn = vi.fn().mockReturnValue({ returning: returningFn });
  const onConflictDoNothingFn = vi.fn().mockResolvedValue(undefined);
  const valuesFn = vi.fn().mockReturnValue({
    onConflictDoUpdate: onConflictDoUpdateFn,
    onConflictDoNothing: onConflictDoNothingFn,
  });
  (db as any).insert = vi.fn().mockReturnValue({ values: valuesFn });
  return { valuesFn, onConflictDoUpdateFn, onConflictDoNothingFn, returningFn };
}

/**
 * Build a chainable Drizzle select mock:
 *   db.select({}).from(table).where(condition)  →  resolves rows
 *
 * For calls that chain further (.where().limit() etc.), extend as needed.
 */
function mockDbSelectOnce(rows: unknown[]) {
  const whereFn = vi.fn().mockResolvedValue(rows);
  const fromFn = vi.fn().mockReturnValue({ where: whereFn });
  (db as any).select = vi.fn().mockReturnValue({ from: fromFn });
  return { whereFn, fromFn };
}

/**
 * Create a select mock that returns different rows on successive calls.
 */
function mockDbSelectSequence(rowSets: unknown[][]) {
  let call = 0;
  const mock = vi.fn().mockImplementation(() => {
    const rows = rowSets[call] ?? [];
    call++;
    const whereFn = vi.fn().mockResolvedValue(rows);
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    return { from: fromFn };
  });
  (db as any).select = mock;
  return mock;
}

function mockDbDelete() {
  const whereFn = vi.fn().mockResolvedValue(undefined);
  (db as any).delete = vi.fn().mockReturnValue({ where: whereFn });
  return { whereFn };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GROUP_FIXTURE = {
  externalId: 'pco-group-1',
  name: 'Small Group Alpha',
  description: 'A test small group',
  memberExternalIds: ['ext-person-1', 'ext-person-2'],
  raw: { id: 'pco-group-1', type: 'Group' } as Record<string, unknown>,
};

const GROUP_ROW_FIXTURE = {
  id: 'local-group-uuid',
  churchId: 'church-test',
  provider: 'planning-center',
  externalId: 'pco-group-1',
  name: 'Small Group Alpha',
  description: 'A test small group',
  isActive: true,
  raw: GROUP_FIXTURE.raw,
  syncedAt: new Date(),
  createdAt: new Date(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlanningCenterAdapter.syncGroup()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up a default delete mock so tests that don't call mockDbDelete()
    // still have a working db.delete chain.
    const whereFn = vi.fn().mockResolvedValue(undefined);
    (db as any).delete = vi.fn().mockReturnValue({ where: whereFn });
  });

  // ── 1. Creates a new group row ────────────────────────────────────────────

  it('inserts a new chms_groups row with correct fields on first sync', async () => {
    const adapter = makeAdapter();

    const { valuesFn, onConflictDoUpdateFn } = mockDbInsertReturning([GROUP_ROW_FIXTURE]);
    // No existing church_members found for either person
    mockDbSelectSequence([[], []]);

    await adapter.syncGroup('church-test', GROUP_FIXTURE);

    // First insert call should be for chms_groups
    expect((db as any).insert).toHaveBeenCalled();
    const firstInsertValues = valuesFn.mock.calls[0][0];
    expect(firstInsertValues).toMatchObject({
      churchId: 'church-test',
      provider: 'planning-center',
      externalId: 'pco-group-1',
      name: 'Small Group Alpha',
      description: 'A test small group',
      isActive: true,
    });
    expect(onConflictDoUpdateFn).toHaveBeenCalledOnce();
  });

  // ── 2. Updates existing group on re-sync (idempotency) ───────────────────

  it('upserts the group with updated fields on re-sync without error', async () => {
    const adapter = makeAdapter();

    const updatedGroup = { ...GROUP_FIXTURE, name: 'Small Group Alpha (renamed)' };
    const updatedRow = { ...GROUP_ROW_FIXTURE, name: 'Small Group Alpha (renamed)' };

    const { valuesFn, onConflictDoUpdateFn } = mockDbInsertReturning([updatedRow]);
    mockDbSelectSequence([[], []]);

    await adapter.syncGroup('church-test', updatedGroup);

    const setArg = onConflictDoUpdateFn.mock.calls[0][0];
    expect(setArg.set).toMatchObject({
      name: 'Small Group Alpha (renamed)',
      isActive: true,
    });
    // No error thrown — resolves cleanly
  });

  // ── 3. Empty memberExternalIds — no error ────────────────────────────────

  it('handles an empty memberExternalIds array without error or member inserts', async () => {
    const adapter = makeAdapter();
    const emptyGroup = { ...GROUP_FIXTURE, memberExternalIds: [] };

    const { onConflictDoNothingFn } = mockDbInsertReturning([GROUP_ROW_FIXTURE]);
    // select mock is not needed since no members to iterate

    await expect(adapter.syncGroup('church-test', emptyGroup)).resolves.toBeUndefined();

    // Only one insert: the group itself. No member inserts.
    expect((db as any).insert).toHaveBeenCalledOnce();
    expect(onConflictDoNothingFn).not.toHaveBeenCalled();
  });

  // ── 4. Links group members to church_members when they exist ─────────────

  it('links group members to local church_member rows when they exist', async () => {
    const adapter = makeAdapter();

    const { valuesFn, onConflictDoNothingFn } = mockDbInsertReturning([GROUP_ROW_FIXTURE]);

    // First member found in church_members, second is not
    mockDbSelectSequence([
      [{ id: 'local-member-uuid-1' }],
      [],
    ]);

    await adapter.syncGroup('church-test', GROUP_FIXTURE);

    // Group insert + 2 member inserts = 3 total insert calls
    expect((db as any).insert).toHaveBeenCalledTimes(3);
    expect(onConflictDoNothingFn).toHaveBeenCalledTimes(2);

    // First member insert: church_member_id linked
    const firstMemberInsertValues = valuesFn.mock.calls[1][0];
    expect(firstMemberInsertValues).toMatchObject({
      groupId: 'local-group-uuid',
      churchMemberId: 'local-member-uuid-1',
      externalMemberId: 'ext-person-1',
    });

    // Second member insert: church_member_id is null (no local match)
    const secondMemberInsertValues = valuesFn.mock.calls[2][0];
    expect(secondMemberInsertValues).toMatchObject({
      groupId: 'local-group-uuid',
      churchMemberId: null,
      externalMemberId: 'ext-person-2',
    });
  });

  // ── 5. Handles null description without error ────────────────────────────

  it('handles null description gracefully', async () => {
    const adapter = makeAdapter();
    const noDescGroup = { ...GROUP_FIXTURE, description: null, memberExternalIds: [] };
    const noDescRow = { ...GROUP_ROW_FIXTURE, description: null };

    const { valuesFn } = mockDbInsertReturning([noDescRow]);

    await expect(adapter.syncGroup('church-test', noDescGroup)).resolves.toBeUndefined();

    const insertArg = valuesFn.mock.calls[0][0];
    expect(insertArg.description).toBeNull();
  });

  // ── 6. Removes stale members on re-sync ─────────────────────────────────
  it('deletes stale group members not present in the fetched list', async () => {
    const adapter = makeAdapter();

    mockDbInsertReturning([GROUP_ROW_FIXTURE]);
    mockDbSelectSequence([[], []]);
    const { whereFn } = mockDbDelete();

    await adapter.syncGroup('church-test', GROUP_FIXTURE);

    expect((db as any).delete).toHaveBeenCalledOnce();
    expect(whereFn).toHaveBeenCalledOnce();
  });

  // ── 7. Deletes all members when memberExternalIds is empty ───────────────
  it('deletes all group members when the fetched list is empty', async () => {
    const adapter = makeAdapter();
    const emptyGroup = { ...GROUP_FIXTURE, memberExternalIds: [] };

    mockDbInsertReturning([GROUP_ROW_FIXTURE]);
    const { whereFn } = mockDbDelete();

    await adapter.syncGroup('church-test', emptyGroup);

    expect((db as any).delete).toHaveBeenCalledOnce();
    expect(whereFn).toHaveBeenCalledOnce();
  });
});
