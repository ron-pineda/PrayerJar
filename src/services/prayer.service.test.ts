import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/services/ai.service', () => ({
  categorizePrayer: vi.fn().mockResolvedValue({
    category: 'health',
    tags: ['surgery'],
    verse: 'Isaiah 41:10',
  }),
  moderateContent: vi.fn().mockResolvedValue({ safe: true, selfHarm: false }),
}));

import { createPrayer, getRandomPrayer, getPrayerById } from './prayer.service';
import { db } from '@/db';

describe('createPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects content that fails moderation', async () => {
    const { moderateContent } = await import('@/services/ai.service');
    vi.mocked(moderateContent).mockResolvedValueOnce({ safe: false, reason: 'spam', selfHarm: false });

    await expect(
      createPrayer({ content: 'spam', isAnonymous: false, isUrgent: false, authorId: null })
    ).rejects.toThrow('moderation');
  });

  it('returns selfHarm flag when detected', async () => {
    const { moderateContent } = await import('@/services/ai.service');
    vi.mocked(moderateContent).mockResolvedValueOnce({ safe: false, selfHarm: true });

    await expect(
      createPrayer({ content: 'crisis content', isAnonymous: false, isUrgent: false, authorId: null })
    ).rejects.toThrow('selfHarm');
  });
});
