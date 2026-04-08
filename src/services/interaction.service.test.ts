import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/services/ai.service', () => ({
  moderateContent: vi.fn().mockResolvedValue({ safe: true, selfHarm: false }),
}));
vi.mock('@/services/notification.service', () => ({
  notifyPrayerAuthor: vi.fn().mockResolvedValue(undefined),
  notifyMessageReceived: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/badge.service', () => ({
  evaluateBadgesForUser: vi.fn().mockResolvedValue([]),
  updateStreak: vi.fn().mockResolvedValue(undefined),
}));

import { prayForRequest } from './interaction.service';

describe('prayForRequest', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if message fails moderation', async () => {
    const { moderateContent } = await import('@/services/ai.service');
    vi.mocked(moderateContent).mockResolvedValueOnce({ safe: false, selfHarm: false });

    await expect(
      prayForRequest({
        prayerId: 'prayer-1',
        userId: 'user-1',
        message: 'spam message',
        isAnonymous: false,
      })
    ).rejects.toThrow('moderation');
  });
});
