import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @capacitor/core before importing the module under test
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

import { isNative, sharePrayer } from './capacitor';

describe('capacitor bridge utilities', () => {
  describe('isNative()', () => {
    it('returns false in browser environment', () => {
      expect(isNative()).toBe(false);
    });
  });

  describe('sharePrayer()', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls navigator.share in browser environment when available', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      await sharePrayer('Test Title', 'Test text', 'https://prayerjar.org/prayer/1');

      expect(shareMock).toHaveBeenCalledOnce();
      expect(shareMock).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test text',
        url: 'https://prayerjar.org/prayer/1',
      });
    });

    it('does not throw when navigator.share is unavailable in browser', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(
        sharePrayer('Title', 'Text', 'https://prayerjar.org/prayer/1')
      ).resolves.toBeUndefined();
    });
  });
});
