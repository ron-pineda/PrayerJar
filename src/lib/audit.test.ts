import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditRetentionDays } from './plans';

// ---------------------------------------------------------------------------
// Mock the db module before importing logAuditEvent
// ---------------------------------------------------------------------------

// We need to mock @/db so logAuditEvent uses a fake insert.
let insertValues: ReturnType<typeof vi.fn>;
let shouldThrow = false;

vi.mock('@/db', () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    chain['values'] = vi.fn(() => chain);
    // Make the chain thenable
    (chain as Record<string, unknown>).then = (
      resolve: (v: unknown) => void,
      reject: (e: Error) => void,
    ) => {
      if (shouldThrow) {
        reject(new Error('DB error'));
      } else {
        resolve(undefined);
      }
    };
    return chain;
  };

  return {
    db: {
      insert: vi.fn(() => {
        const chain = makeChain();
        insertValues = chain.values as ReturnType<typeof vi.fn>;
        return chain;
      }),
    },
  };
});

// Import AFTER the mock is set up
import { logAuditEvent } from './audit';
import { db } from '@/db';

// ---------------------------------------------------------------------------
// (a) logAuditEvent inserts correct row
// ---------------------------------------------------------------------------

describe('logAuditEvent — inserts correct row', () => {
  beforeEach(() => {
    shouldThrow = false;
    vi.clearAllMocks();
  });

  it('calls db.insert and values with the correct payload', async () => {
    await logAuditEvent({
      churchId: 'church-1',
      actorUserId: 'user-1',
      action: 'member.add',
      targetType: 'user',
      targetId: 'user-2',
      metadata: { role: 'pastor' },
    });

    expect((db as any).insert).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: 'church-1',
        actorUserId: 'user-1',
        action: 'member.add',
        targetType: 'user',
        targetId: 'user-2',
        metadata: { role: 'pastor' },
      }),
    );
  });

  it('uses null for optional fields when not provided', async () => {
    await logAuditEvent({
      churchId: 'church-2',
      action: 'plan.change',
    });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: 'church-2',
        actorUserId: null,
        action: 'plan.change',
        targetType: null,
        targetId: null,
        metadata: {},
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// (b) logAuditEvent swallows errors without throwing
// ---------------------------------------------------------------------------

describe('logAuditEvent — swallows errors', () => {
  beforeEach(() => {
    shouldThrow = true;
    vi.clearAllMocks();
  });

  it('does not throw when the db insert fails', async () => {
    await expect(
      logAuditEvent({
        churchId: 'church-3',
        action: 'member.remove',
      }),
    ).resolves.toBeUndefined();
  });

  it('logs the error to console.error when the db insert fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await logAuditEvent({
      churchId: 'church-4',
      action: 'prayer.delete',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[audit]'),
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// (c) auditRetentionDays returns correct values per tier
// ---------------------------------------------------------------------------

describe('auditRetentionDays', () => {
  it('returns 90 for free tier', () => {
    expect(auditRetentionDays('free')).toBe(90);
  });

  it('returns 90 for starter (Small Church) tier', () => {
    expect(auditRetentionDays('starter')).toBe(90);
  });

  it('returns 365 for pro (Growing Church) tier', () => {
    expect(auditRetentionDays('pro')).toBe(365);
  });

  it('returns 1095 for enterprise (Network) tier', () => {
    expect(auditRetentionDays('enterprise')).toBe(1095);
  });
});
