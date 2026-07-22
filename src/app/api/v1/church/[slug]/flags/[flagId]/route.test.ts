import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchBySlug: vi.fn(),
  getChurchMembers: vi.fn(),
}));

vi.mock('@/services/pastoral.service', () => ({
  reviewFlag: vi.fn(),
}));

const mockDbSelect = vi.fn();
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: mockDbSelect,
      }),
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  prayerFlags: { id: 'id', churchId: 'churchId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

import type { Session } from 'next-auth';
import { auth as authImpl } from '@/lib/auth';
// NextAuth's `auth` is an intersection of five call signatures, so
// `ReturnType<typeof auth>` resolves to its middleware overload. Re-type the
// binding to the no-arg overload these tests use so `vi.mocked(auth)` and
// `Awaited<ReturnType<typeof auth>>` resolve to `Session | null`.
const auth = authImpl as () => Promise<Session | null>;
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { reviewFlag } from '@/services/pastoral.service';
import { PUT } from './route';

const mockChurch = {
  id: 'church-1',
  slug: 'grace-chapel-ab12',
  name: 'Grace Chapel',
  description: null,
  welcomeMessage: null,
  logoUrl: null,
  primaryColor: '#d4a843',
  createdBy: 'user-1',
  subscriptionId: null,
  subdomain: null,
  acquisitionSource: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  firstPaidAt: null,
  currentPlan: 'free' as const,
  previousPlan: null,
  chmsProvider: null,
  chmsConfig: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminMember = {
  member: { id: 'm1', churchId: 'church-1', userId: 'user-1', role: 'admin' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
};

const pastorMember = {
  member: { id: 'm3', churchId: 'church-1', userId: 'user-3', role: 'pastor' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
};

const memberOnly = {
  member: { id: 'm2', churchId: 'church-1', userId: 'user-2', role: 'member' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/v1/church/grace-chapel-ab12/flags/flag-123', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ slug: 'grace-chapel-ab12', flagId: 'flag-123' }) };

describe('PUT /api/v1/church/[slug]/flags/[flagId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getChurchBySlug).mockResolvedValue(mockChurch);
    vi.mocked(getChurchMembers).mockResolvedValue([adminMember, memberOnly, pastorMember]);
    vi.mocked(reviewFlag).mockResolvedValue(undefined);
    mockDbSelect.mockResolvedValue([{ id: 'flag-123' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await PUT(makeRequest({ status: 'reviewed' }), routeParams);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 403 when user is a plain member', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(makeRequest({ status: 'reviewed' }), routeParams);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 403 when user is not a member at all', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-99', name: 'Stranger', email: 'stranger@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(makeRequest({ status: 'reviewed' }), routeParams);

    expect(res.status).toBe(403);
  });

  it('returns 200 and calls reviewFlag when admin dismisses', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(makeRequest({ status: 'dismissed' }), routeParams);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(reviewFlag).toHaveBeenCalledWith('flag-123', 'user-1', 'dismissed', undefined);
  });

  it('returns 200 and calls reviewFlag when pastor escalates with notes', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(makeRequest({ status: 'escalated', notes: 'Needs senior pastor' }), routeParams);

    expect(res.status).toBe(200);
    expect(reviewFlag).toHaveBeenCalledWith('flag-123', 'user-3', 'escalated', 'Needs senior pastor');
  });

  it('returns 400 for invalid status value', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(makeRequest({ status: 'deleted' }), routeParams);

    expect(res.status).toBe(400);
    expect(reviewFlag).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost/api/v1/church/grace-chapel-ab12/flags/flag-123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 404 when flag does not belong to this church', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);
    mockDbSelect.mockResolvedValueOnce([]);

    const res = await PUT(makeRequest({ status: 'reviewed' }), routeParams);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Flag not found');
    expect(reviewFlag).not.toHaveBeenCalled();
  });
});
