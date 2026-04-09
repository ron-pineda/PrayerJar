import { describe, it, expect } from 'vitest';
import { compressImage, validateImageFile, MAX_FILE_SIZE, ACCEPTED_TYPES } from './image-utils';

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

  it('validates image files correctly', () => {
    const validJpg = new File([], 'test.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(validJpg)).toBeNull();

    const invalidType = new File([], 'test.gif', { type: 'image/gif' });
    expect(validateImageFile(invalidType)).toContain('JPG, PNG, or WebP');

    // Create a file that exceeds 5MB
    const bigBuffer = new Uint8Array(6 * 1024 * 1024);
    const tooLarge = new File([bigBuffer], 'large.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(tooLarge)).toContain('5MB');
  });
});
