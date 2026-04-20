import { describe, it, expect } from 'vitest';
import { recommendTier } from './pricing-calculator';

// Boundaries:
//   free:       0 – 50   (PLANS.free.limits.members = 50)
//   starter:   51 – 150  (PLANS.starter.limits.members = 150)
//   pro:      151 – 500  (PLANS.pro.limits.members = null, threshold = 500)
//   enterprise: 501+     (ENTERPRISE_THRESHOLD = 500)

describe('recommendTier', () => {
  it('returns "free" for 0 members', () => {
    expect(recommendTier(0)).toBe('free');
  });

  it('returns "free" for 75 members (at the free cap)', () => {
    expect(recommendTier(75)).toBe('free');
  });

  it('returns "starter" for 76 members (just above free cap)', () => {
    expect(recommendTier(76)).toBe('starter');
  });

  it('returns "starter" for 150 members (at the starter cap)', () => {
    expect(recommendTier(150)).toBe('starter');
  });

  it('returns "pro" for 151 members (just above starter cap)', () => {
    expect(recommendTier(151)).toBe('pro');
  });

  it('returns "pro" for 500 members (at the enterprise threshold)', () => {
    expect(recommendTier(500)).toBe('pro');
  });

  it('returns "enterprise" for 501 members (just above enterprise threshold)', () => {
    expect(recommendTier(501)).toBe('enterprise');
  });

  it('returns "enterprise" for 2000 members (well above enterprise threshold)', () => {
    expect(recommendTier(2000)).toBe('enterprise');
  });
});
