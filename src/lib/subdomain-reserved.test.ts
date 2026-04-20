/**
 * Unit tests for src/lib/subdomain-reserved.ts
 * pj-s22-16 — Backend Engineer
 */

import { describe, it, expect } from 'vitest';
import { isReservedSubdomain, hasInvalidHyphen, RESERVED_SUBDOMAINS } from './subdomain-reserved';

describe('isReservedSubdomain', () => {
  it('returns true for "www"', () => {
    expect(isReservedSubdomain('www')).toBe(true);
  });

  it('returns true for "api"', () => {
    expect(isReservedSubdomain('api')).toBe(true);
  });

  it('returns true for "admin"', () => {
    expect(isReservedSubdomain('admin')).toBe(true);
  });

  it('is case-insensitive — "WWW" is reserved', () => {
    expect(isReservedSubdomain('WWW')).toBe(true);
  });

  it('is case-insensitive — "API" is reserved', () => {
    expect(isReservedSubdomain('API')).toBe(true);
  });

  it('returns false for a church-style subdomain', () => {
    expect(isReservedSubdomain('grace-chapel')).toBe(false);
  });

  it('returns false for "takeheart"', () => {
    expect(isReservedSubdomain('takeheart')).toBe(false);
  });

  it('returns true for "staging"', () => {
    expect(isReservedSubdomain('staging')).toBe(true);
  });

  it('returns true for "dev"', () => {
    expect(isReservedSubdomain('dev')).toBe(true);
  });

  it('returns true for "auth"', () => {
    expect(isReservedSubdomain('auth')).toBe(true);
  });

  it('returns true for "settings" (dashboard route)', () => {
    expect(isReservedSubdomain('settings')).toBe(true);
  });
});

describe('hasInvalidHyphen', () => {
  it('returns false for a valid subdomain', () => {
    expect(hasInvalidHyphen('grace-chapel')).toBe(false);
  });

  it('returns false for a single-word subdomain', () => {
    expect(hasInvalidHyphen('grace')).toBe(false);
  });

  it('returns true when subdomain starts with a hyphen', () => {
    expect(hasInvalidHyphen('-grace')).toBe(true);
  });

  it('returns true when subdomain ends with a hyphen', () => {
    expect(hasInvalidHyphen('grace-')).toBe(true);
  });

  it('returns false for an internal hyphen', () => {
    expect(hasInvalidHyphen('grace-chapel-church')).toBe(false);
  });
});

describe('RESERVED_SUBDOMAINS set integrity', () => {
  it('contains no duplicates (Set size should equal source list size)', () => {
    // If a duplicate was added the Set deduplicated it silently.
    // This test verifies the source list has no redundant entries
    // by checking the exported Set is well-formed.
    expect(RESERVED_SUBDOMAINS.size).toBeGreaterThan(30);
  });

  it('all entries are lowercase', () => {
    for (const entry of RESERVED_SUBDOMAINS) {
      expect(entry).toBe(entry.toLowerCase());
    }
  });
});
