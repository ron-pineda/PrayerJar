import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

// NextAuth's `auth` is an intersection of five call signatures, so
// `ReturnType<typeof auth>` resolves to its middleware overload. Each test
// re-types the dynamically-imported binding to the no-arg `Promise<Session |
// null>` overload it actually uses.

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
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    acquisitionSource: 'direct',
    firstPaidAt: null,
    currentPlan: 'free' as const,
    previousPlan: null,
    chmsProvider: null,
    chmsConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

describe('POST /api/v1/church', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 with slug for valid input', async () => {
    const { auth: authImpl } = await import('@/lib/auth');
    // Re-type to the no-arg overload (see note at top of file).
    const auth = authImpl as () => Promise<Session | null>;
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
    const { auth: authImpl } = await import('@/lib/auth');
    // Re-type to the no-arg overload (see note at top of file).
    const auth = authImpl as () => Promise<Session | null>;
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
    const { auth: authImpl } = await import('@/lib/auth');
    // Re-type to the no-arg overload (see note at top of file).
    const auth = authImpl as () => Promise<Session | null>;
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

  // ---------------------------------------------------------------------------
  // UTM attribution — AC4 (pj-s17-mrr-dashboard)
  // Simulates a church-creation call with UTM params and asserts that
  // createChurch() is called with utmSource, utmMedium, utmCampaign set, and
  // that acquisitionSource would be derived as utm_source (handled inside the
  // service, but the route must pass the raw UTMs through).
  // ---------------------------------------------------------------------------

  it('passes UTM fields from request body to createChurch', async () => {
    const { auth: authImpl } = await import('@/lib/auth');
    // Re-type to the no-arg overload (see note at top of file).
    const auth = authImpl as () => Promise<Session | null>;
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const { createChurch } = await import('@/services/church-platform.service');
    const { POST } = await import('./route');

    const req = new Request('http://localhost/api/v1/church', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Grace Community Church',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring-launch',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // Assert createChurch was called with the UTM fields so we know the service
    // layer (which writes to the DB) will receive the attribution data.
    expect(vi.mocked(createChurch)).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring-launch',
        createdBy: 'user-1',
      }),
    );
  });

  it('passes UTM fields from URL query params when not in body', async () => {
    const { auth: authImpl } = await import('@/lib/auth');
    // Re-type to the no-arg overload (see note at top of file).
    const auth = authImpl as () => Promise<Session | null>;
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const { createChurch } = await import('@/services/church-platform.service');
    const { POST } = await import('./route');

    const req = new Request(
      'http://localhost/api/v1/church?utm_source=directory&utm_medium=organic&utm_campaign=church-finder',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hope Fellowship' }),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(201);

    expect(vi.mocked(createChurch)).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: 'directory',
        utmMedium: 'organic',
        utmCampaign: 'church-finder',
        createdBy: 'user-1',
      }),
    );
  });

  it('uses acquisition_source = "direct" when no UTM params are present', async () => {
    const { auth: authImpl } = await import('@/lib/auth');
    // Re-type to the no-arg overload (see note at top of file).
    const auth = authImpl as () => Promise<Session | null>;
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const { createChurch } = await import('@/services/church-platform.service');
    const { POST } = await import('./route');

    const req = new Request('http://localhost/api/v1/church', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'River Church' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // When no UTMs are present, the route passes undefined utm* values, and
    // church-platform.service.ts derives acquisitionSource = 'direct'.
    expect(vi.mocked(createChurch)).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: undefined,
        utmMedium: undefined,
        utmCampaign: undefined,
      }),
    );

    // The mock returns acquisitionSource: 'direct' — confirm the response is ok.
    const body = await res.json();
    expect(body).toHaveProperty('slug');
  });
});
