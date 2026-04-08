import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/services/notification.service', () => ({
  notifyBadgeEarned: vi.fn().mockResolvedValue(undefined),
}));

import { updateStreak, BADGE_THRESHOLDS } from './badge.service';

describe('BADGE_THRESHOLDS', () => {
  it('defines thresholds for key badges', () => {
    expect(BADGE_THRESHOLDS.intercessor_bronze).toBe(10);
    expect(BADGE_THRESHOLDS.intercessor_silver).toBe(50);
    expect(BADGE_THRESHOLDS.intercessor_gold).toBe(100);
    expect(BADGE_THRESHOLDS.encourager_bronze).toBe(10);
    expect(BADGE_THRESHOLDS.faithful).toBe(7);
    expect(BADGE_THRESHOLDS.devoted).toBe(30);
  });
});
