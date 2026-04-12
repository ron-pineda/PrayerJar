import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth and service before importing the route
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/services/church-platform.service', () => ({
  createChurch: vi.fn().mockResolvedValue({
    id: 'church-1',
    slug: 'test-church-ab12',
    name: 'Test Church',
    description: null,
    welcomeMessage: null,
    logoUrl: null,
    primaryColor: '#d4a843',
    createdBy: 'user-1',
    subscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

describe('POST /api/v1/church', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 with slug for valid input', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const { POST } = await import('./route');

    const req = new Request('http://localhost/api/v1/church', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Church',
        description: 'A community of believers',
        welcomeMessage: 'Welcome to our prayer wall!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('slug', 'test-church-ab12');
  });

  it('returns 401 when unauthenticated', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const { POST } = await import('./route');

    const req = new Request('http://localhost/api/v1/church', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Church' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 400 when name is too short', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const { POST } = await import('./route');

    const req = new Request('http://localhost/api/v1/church', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
