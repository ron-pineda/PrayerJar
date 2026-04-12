import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: 'test-id', keyPrefix: 'pj_12345', keyHash: 'hash', name: 'Test Key', userId: 'user-1', createdAt: new Date(), lastUsedAt: null, revokedAt: null },
        ]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

import { createApiKey, validateApiKey, revokeApiKey } from './api-key.service';

describe('createApiKey', () => {
  it('returns a rawKey starting with pj_', async () => {
    const result = await createApiKey('user-1', 'Test Key');
    expect(result.rawKey).toMatch(/^pj_/);
  });

  it('returns a key object with expected fields', async () => {
    const result = await createApiKey('user-1', 'Test Key');
    expect(result.key).toHaveProperty('id', 'test-id');
    expect(result.key).toHaveProperty('keyPrefix', 'pj_12345');
  });

  it('rawKey has correct format: pj_ + 40 hex chars', async () => {
    const result = await createApiKey('user-1', 'Test Key');
    expect(result.rawKey).toMatch(/^pj_[0-9a-f]{40}$/);
  });
});

describe('validateApiKey', () => {
  it('returns null for an invalid key (empty DB result)', async () => {
    const result = await validateApiKey('pj_invalid_key_that_does_not_exist');
    expect(result).toBeNull();
  });
});

describe('revokeApiKey', () => {
  it('returns null when key not found', async () => {
    const result = await revokeApiKey('nonexistent-id', 'user-1');
    expect(result).toBeNull();
  });
});
