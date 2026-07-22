import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchBySlug: vi.fn(),
  getChurchMembers: vi.fn(),
}));

vi.mock('@/services/pastoral.service', () => ({
  assignPrayer: vi.fn(),
}));

import type { Session } from 'next-auth';
import { auth as authImpl } from '@/lib/auth';
// NextAuth's `auth` is an intersection of five call signatures, so
// `ReturnType<typeof auth>` resolves to its middleware overload. Re-type the
// binding to the no-arg overload these tests use so `vi.mocked(auth)` and
// `Awaited<ReturnType<typeof auth>>` resolve to `Session | null`.
const auth = authImpl as () => Promise<Session | null>;
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { assignPrayer } from '@/services/pastoral.service';
import { POST } from './route';

// Use UUIDs for user IDs so they pass z.string().uuid() in assignedTo
const ADMIN_ID    = '110e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID   = '220e8400-e29b-41d4-a716-446655440002';
const PASTOR_ID   = '330e8400-e29b-41d4-a716-446655440003';

const mockChurch = {
  id: 'church-1',
  slug: 'grace-chapel-ab12',
  name: 'Grace Chapel',
  description: null,
  welcomeMessage: null,
  logoUrl: null,
  primaryColor: '#d4a843',
  createdBy: ADMIN_ID,
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
  member: { id: 'm1', churchId: 'church-1', userId: ADMIN_ID, role: 'admin' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: ADMIN_ID, name: 'Alice', email: 'alice@example.com' },
};

const pastorMember = {
  member: { id: 'm3', churchId: 'church-1', userId: PASTOR_ID, role: 'pastor' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: PASTOR_ID, name: 'Pastor Carol', email: 'carol@example.com' },
};

const memberOnly = {
  member: { id: 'm2', churchId: 'church-1', userId: MEMBER_ID, role: 'member' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: MEMBER_ID, name: 'Bob', email: 'bob@example.com' },
};

const validPrayerId  = '550e8400-e29b-41d4-a716-446655440000';
// assignedTo must be a UUID that matches a church member
const validAssignedTo = ADMIN_ID;

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/v1/church/grace-chapel-ab12/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) };

describe('POST /api/v1/church/[slug]/assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getChurchBySlug).mockResolvedValue(mockChurch);
    vi.mocked(getChurchMembers).mockResolvedValue([adminMember, memberOnly, pastorMember]);
    vi.mocked(assignPrayer).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ prayerId: validPrayerId, assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 403 when user is a plain member', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: MEMBER_ID, name: 'Bob', email: 'bob@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ prayerId: validPrayerId, assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 403 when user is not a member at all', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-99', name: 'Stranger', email: 'stranger@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ prayerId: validPrayerId, assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(403);
  });

  it('returns 200 and calls assignPrayer when admin assigns', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: ADMIN_ID, name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ prayerId: validPrayerId, assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(assignPrayer).toHaveBeenCalledWith({
      churchId: 'church-1',
      prayerId: validPrayerId,
      assignedTo: validAssignedTo,
      assignedBy: ADMIN_ID,
      notes: undefined,
    });
  });

  it('returns 200 and passes notes when pastor assigns with notes', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: PASTOR_ID, name: 'Pastor Carol', email: 'carol@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(
      makeRequest({ prayerId: validPrayerId, assignedTo: validAssignedTo, notes: 'Please pray urgently' }),
      routeParams,
    );

    expect(res.status).toBe(200);
    expect(assignPrayer).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Please pray urgently' }),
    );
  });

  it('returns 400 when prayerId is not a valid UUID', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: ADMIN_ID, name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ prayerId: 'not-a-uuid', assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(400);
    expect(assignPrayer).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: ADMIN_ID, name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost/api/v1/church/grace-chapel-ab12/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 400 when assignedTo user is not a member of this church', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: ADMIN_ID, name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const outsiderId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // valid UUID, not in members
    const res = await POST(
      makeRequest({ prayerId: validPrayerId, assignedTo: outsiderId }),
      routeParams,
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'User is not a member of this church');
    expect(assignPrayer).not.toHaveBeenCalled();
  });
});
