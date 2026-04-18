import { describe, it, expect } from 'vitest';
import { SUBPROCESSORS, SUBPROCESSOR_LIST_LAST_UPDATED, SUBPROCESSOR_LIST_VERSION } from './data';

describe('Sub-processor list data', () => {
  it('exports a non-empty SUBPROCESSORS array', () => {
    expect(Array.isArray(SUBPROCESSORS)).toBe(true);
    expect(SUBPROCESSORS.length).toBeGreaterThan(0);
  });

  it('every entry has required fields', () => {
    for (const p of SUBPROCESSORS) {
      expect(p.name, `${p.name} missing name`).toBeTruthy();
      expect(p.purpose, `${p.name} missing purpose`).toBeTruthy();
      expect(p.dataCategories, `${p.name} missing dataCategories`).toBeTruthy();
      expect(p.region, `${p.name} missing region`).toBeTruthy();
      expect(p.dpaUrl, `${p.name} missing dpaUrl`).toBeTruthy();
    }
  });

  it('includes Vercel as a sub-processor', () => {
    const vercel = SUBPROCESSORS.find((p) => p.name.toLowerCase().includes('vercel'));
    expect(vercel).toBeDefined();
  });

  it('exports SUBPROCESSOR_LIST_LAST_UPDATED as a non-empty string', () => {
    expect(typeof SUBPROCESSOR_LIST_LAST_UPDATED).toBe('string');
    expect(SUBPROCESSOR_LIST_LAST_UPDATED.length).toBeGreaterThan(0);
  });

  it('exports SUBPROCESSOR_LIST_VERSION as a non-empty string', () => {
    expect(typeof SUBPROCESSOR_LIST_VERSION).toBe('string');
    expect(SUBPROCESSOR_LIST_VERSION.length).toBeGreaterThan(0);
  });
});
