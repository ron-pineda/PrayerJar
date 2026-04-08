import { describe, it, expect } from 'vitest';
import { users, prayers, prayerInteractions, notifications, badges, reports } from './schema';

describe('schema', () => {
  it('exports all required tables', () => {
    expect(users).toBeDefined();
    expect(prayers).toBeDefined();
    expect(prayerInteractions).toBeDefined();
    expect(notifications).toBeDefined();
    expect(badges).toBeDefined();
    expect(reports).toBeDefined();
  });
});
