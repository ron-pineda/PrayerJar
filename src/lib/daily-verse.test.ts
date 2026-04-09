import { describe, it, expect } from 'vitest';
import { getDailyVerse, VERSES } from './daily-verse';

describe('daily-verse', () => {
  it('exports a non-empty VERSES array', () => {
    expect(VERSES.length).toBeGreaterThan(0);
  });

  it('each verse has text and reference', () => {
    for (const v of VERSES) {
      expect(typeof v.text).toBe('string');
      expect(typeof v.reference).toBe('string');
      expect(v.text.length).toBeGreaterThan(0);
      expect(v.reference.length).toBeGreaterThan(0);
    }
  });

  it('returns a verse with text and reference', () => {
    const verse = getDailyVerse();
    expect(verse).toHaveProperty('text');
    expect(verse).toHaveProperty('reference');
    expect(typeof verse.text).toBe('string');
    expect(typeof verse.reference).toBe('string');
  });
});
