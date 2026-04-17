import { describe, it, expect } from 'vitest';
import { getDayVerse, verses } from './verses';

describe('verses array', () => {
  it('has at least 365 entries', () => {
    expect(verses.length).toBeGreaterThanOrEqual(365);
  });

  it('every entry has non-empty text and reference', () => {
    for (const [i, verse] of verses.entries()) {
      expect(verse.text.length, `empty text at index ${i}`).toBeGreaterThan(0);
      expect(verse.reference.length, `empty ref at index ${i}`).toBeGreaterThan(0);
    }
  });

  it('has no duplicate references', () => {
    const refs = verses.map(v => v.reference);
    const unique = new Set(refs);
    expect(unique.size).toBe(refs.length);
  });
});

describe('getDayVerse', () => {
  it('returns a valid verse for Jan 1', () => {
    const result = getDayVerse(new Date(2024, 0, 1));
    expect(result.text).toBeTruthy();
    expect(result.reference).toBeTruthy();
  });

  it('returns a valid verse for Dec 31', () => {
    const result = getDayVerse(new Date(2024, 11, 31));
    expect(result.text).toBeTruthy();
    expect(result.reference).toBeTruthy();
  });

  it('returns different verses for consecutive days', () => {
    const day1 = getDayVerse(new Date(2024, 0, 1));
    const day2 = getDayVerse(new Date(2024, 0, 2));
    expect(day1.reference).not.toBe(day2.reference);
  });

  it('returns fallback verse when verses array is emptied', () => {
    const saved = verses.splice(0, verses.length);
    const result = getDayVerse();
    verses.push(...saved);
    expect(result.reference).toBe('1 Peter 5:7');
  });
});
