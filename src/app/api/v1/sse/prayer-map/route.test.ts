import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Sample rows the DB mock will return
const sampleRows = [
  {
    id: 'abc-123',
    latitude: 37.7749,
    longitude: -122.4194,
    country: 'US',
    createdAt: new Date('2026-04-11T12:00:00Z'),
    category: 'health' as const,
  },
];

// Mock @/db before importing the route
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(sampleRows),
        }),
      }),
    }),
  },
}));

// Mock @/db/schema — just needs to export the table references
vi.mock('@/db/schema', () => ({
  prayerInteractions: { id: 'id', latitude: 'latitude', longitude: 'longitude', country: 'country', createdAt: 'createdAt', prayerId: 'prayerId' },
  prayers: { id: 'id', category: 'category' },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  isNotNull: vi.fn((col) => ({ type: 'isNotNull', col })),
  gte: vi.fn((col, val) => ({ type: 'gte', col, val })),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', args })),
}));

describe('GET /api/v1/sse/prayer-map', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responds with Content-Type: text/event-stream', async () => {
    const { GET } = await import('./route');

    const controller = new AbortController();
    const req = new NextRequest('http://localhost/api/v1/sse/prayer-map', {
      signal: controller.signal,
    });

    const response = await GET(req);

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Abort to clean up the interval
    controller.abort();
  });

  it('emits a data chunk containing a points array', async () => {
    const { GET } = await import('./route');

    const controller = new AbortController();
    const req = new NextRequest('http://localhost/api/v1/sse/prayer-map', {
      signal: controller.signal,
    });

    const response = await GET(req);
    const reader = response.body!.getReader();

    const { value } = await reader.read();
    controller.abort();

    const text = new TextDecoder().decode(value);
    expect(text).toMatch(/^data: /);

    const jsonPart = text.replace(/^data: /, '').trim();
    const parsed = JSON.parse(jsonPart);
    expect(parsed).toHaveProperty('points');
    expect(Array.isArray(parsed.points)).toBe(true);
  });

  it('includes the expected fields in each point', async () => {
    const { GET } = await import('./route');

    const controller = new AbortController();
    const req = new NextRequest('http://localhost/api/v1/sse/prayer-map', {
      signal: controller.signal,
    });

    const response = await GET(req);
    const reader = response.body!.getReader();

    const { value } = await reader.read();
    controller.abort();

    const text = new TextDecoder().decode(value);
    const parsed = JSON.parse(text.replace(/^data: /, '').trim());

    expect(parsed.points).toHaveLength(1);
    const point = parsed.points[0];
    expect(point).toMatchObject({
      id: 'abc-123',
      latitude: 37.7749,
      longitude: -122.4194,
      country: 'US',
      category: 'health',
    });
  });
});
