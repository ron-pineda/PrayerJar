import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/services/email.service', () => ({
  sendPrayerNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendEncouragementEmail: vi.fn().mockResolvedValue(undefined),
  sendBadgeEmail: vi.fn().mockResolvedValue(undefined),
}));

import { createNotification, markAllRead } from './notification.service';

describe('notification.service', () => {
  it('exports createNotification and markAllRead', () => {
    expect(createNotification).toBeDefined();
    expect(markAllRead).toBeDefined();
  });
});
