import { describe, it, expect } from 'vitest';
import { compressImage, MAX_FILE_SIZE, ACCEPTED_TYPES } from './image-utils';

describe('image-utils', () => {
  it('exports constants', () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(ACCEPTED_TYPES).toContain('image/jpeg');
    expect(ACCEPTED_TYPES).toContain('image/png');
    expect(ACCEPTED_TYPES).toContain('image/webp');
  });

  it('exports compressImage function', () => {
    expect(typeof compressImage).toBe('function');
  });
});
