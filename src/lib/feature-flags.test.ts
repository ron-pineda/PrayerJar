import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFeatureEnabled, FLAGS } from './feature-flags';

// Mock the db module
vi.mock('@/db', () => ({
  db: {
    query: {
      featureFlags: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { db } from '@/db';

describe('feature-flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when flag is not found', async () => {
    vi.mocked(db.query.featureFlags.findFirst).mockResolvedValueOnce(undefined);

    const result = await isFeatureEnabled('unknown_flag', 'user-123');

    expect(result).toBe(false);
  });

  it('returns false when flag exists but isEnabled is false', async () => {
    vi.mocked(db.query.featureFlags.findFirst).mockResolvedValueOnce({
      id: 'flag-1',
      key: 'test_flag',
      description: 'Test flag',
      isEnabled: false,
      allowedUserIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await isFeatureEnabled('test_flag', 'user-123');

    expect(result).toBe(false);
  });

  it('returns true when flag is enabled and allowedUserIds is empty (enabled for everyone)', async () => {
    const mockFlag = {
      id: 'flag-1',
      key: 'prayer_map',
      description: 'Prayer map feature',
      isEnabled: true,
      allowedUserIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.query.featureFlags.findFirst).mockResolvedValue(mockFlag);

    const result1 = await isFeatureEnabled('prayer_map', 'user-123');
    expect(result1).toBe(true);

    const result2 = await isFeatureEnabled('prayer_map', 'user-456');
    expect(result2).toBe(true);

    // Also works without userId
    const result3 = await isFeatureEnabled('prayer_map');
    expect(result3).toBe(true);
  });

  it('returns true when flag is enabled and userId is in allowedUserIds', async () => {
    vi.mocked(db.query.featureFlags.findFirst).mockResolvedValueOnce({
      id: 'flag-1',
      key: 'wrapped',
      description: 'Wrapped feature',
      isEnabled: true,
      allowedUserIds: ['user-123', 'user-456'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await isFeatureEnabled('wrapped', 'user-123');

    expect(result).toBe(true);
  });

  it('returns false when flag is enabled but userId is NOT in allowedUserIds', async () => {
    vi.mocked(db.query.featureFlags.findFirst).mockResolvedValueOnce({
      id: 'flag-1',
      key: 'wrapped',
      description: 'Wrapped feature',
      isEnabled: true,
      allowedUserIds: ['user-123', 'user-456'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await isFeatureEnabled('wrapped', 'user-789');

    expect(result).toBe(false);
  });

  it('returns false when flag is enabled with allowedUserIds but no userId provided', async () => {
    vi.mocked(db.query.featureFlags.findFirst).mockResolvedValueOnce({
      id: 'flag-1',
      key: 'wrapped',
      description: 'Wrapped feature',
      isEnabled: true,
      allowedUserIds: ['user-123', 'user-456'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await isFeatureEnabled('wrapped');

    expect(result).toBe(false);
  });

  describe('FLAGS constant', () => {
    it('exports predefined flag keys', () => {
      expect(FLAGS.PRAYER_MAP).toBe('prayer_map');
      expect(FLAGS.WRAPPED).toBe('wrapped');
      expect(FLAGS.WORLD_PRAYER).toBe('world_prayer');
      expect(FLAGS.CAMPAIGNS).toBe('campaigns');
    });
  });
});
