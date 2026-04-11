import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock @/db before importing the route
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'test-uuid',
            userId: null,
            type: 'general',
            message: 'Test message',
            page: '/test',
            createdAt: new Date(),
          },
        ]),
      }),
    }),
  },
}));

// Mock @/db/schema — just needs to export the feedback table reference
vi.mock('@/db/schema', () => ({
  feedback: { id: 'id', userId: 'user_id', type: 'type', message: 'message', page: 'page', createdAt: 'created_at' },
}));

// Mock @/lib/auth — anonymous by default
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe('POST /api/v1/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 for valid feedback', async () => {
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bug', message: 'Something is broken', page: '/home' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('id');
  });

  it('returns 201 with default type when type is omitted', async () => {
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Just a comment' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('returns 400 when message is missing', async () => {
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 400 when message is empty string', async () => {
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'feature', message: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts authenticated user feedback', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-123', name: 'Test', email: 'test@example.com' } } as Awaited<ReturnType<typeof auth>>);

    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'praise', message: 'Love this app!' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
