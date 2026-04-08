import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn((opts) => opts),
  },
}));

import { generateText } from 'ai';
import { categorizePrayer, moderateContent } from './ai.service';

describe('categorizePrayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns category, tags, and verse', async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: {
        category: 'health',
        tags: ['surgery', 'family'],
        verse: 'Isaiah 41:10',
      },
    } as any);

    const result = await categorizePrayer('Please pray for my mom\'s surgery');

    expect(result.category).toBe('health');
    expect(result.tags).toContain('surgery');
    expect(result.verse).toBe('Isaiah 41:10');
  });
});

describe('moderateContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns safe: true for clean content', async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: { safe: true },
    } as any);

    const result = await moderateContent('Please pray for my family');
    expect(result.safe).toBe(true);
    expect(result.selfHarm).toBe(false);
  });

  it('returns safe: false for harmful content', async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: { safe: false, reason: 'spam', selfHarm: false },
    } as any);

    const result = await moderateContent('BUY CHEAP FOLLOWERS NOW!!!');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('spam');
  });
});
