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

import { createPrayer, getRandomPrayer, getPrayerById, renewPrayer } from './prayer.service';
import { db } from '@/db';

const dbMock = db as unknown as Record<string, unknown>;

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

describe('renewPrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * Regression guard. renewPrayer previously set `expiresAt` only, so renewing
   * an expired prayer left it `status: 'expired'` — hidden from every wall, with
   * the button appearing to do nothing. Every prayer in production had expired,
   * and this was the mechanism meant to bring them back.
   */
  it('restores status to active, not just the expiry date', async () => {
    let captured: Record<string, unknown> = {};
    dbMock.update = vi.fn(() => ({
      set: (values: Record<string, unknown>) => {
        captured = values;
        return { where: () => ({ returning: async () => [{ id: 'p1' }] }) };
      },
    }));

    const result = await renewPrayer('p1', 'author-1');

    expect(captured.status).toBe('active');
    expect(captured.expiresAt).toBeInstanceOf(Date);
    expect(result).toEqual({ id: 'p1' });
  });

  it('returns null when nothing matched (e.g. an answered prayer)', async () => {
    dbMock.update = vi.fn(() => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }));

    await expect(renewPrayer('answered-1', 'author-1')).resolves.toBeNull();
  });
});
