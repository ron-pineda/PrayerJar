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

import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { assignPrayer } from '@/services/pastoral.service';
import { POST } from './route';

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
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminMember = {
  member: { id: 'm1', churchId: 'church-1', userId: 'user-1', role: 'admin' as const, joinedAt: new Date() },
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
};

const pastorMember = {
  member: { id: 'm3', churchId: 'church-1', userId: 'user-3', role: 'pastor' as const, joinedAt: new Date() },
  user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
};

const memberOnly = {
  member: { id: 'm2', churchId: 'church-1', userId: 'user-2', role: 'member' as const, joinedAt: new Date() },
  user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
};

const validPrayerId = '550e8400-e29b-41d4-a716-446655440000';
const validAssignedTo = '660e8400-e29b-41d4-a716-446655440001';

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
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
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
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ prayerId: validPrayerId, assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(assignPrayer).toHaveBeenCalledWith({
      churchId: 'church-1',
      prayerId: validPrayerId,
      assignedTo: validAssignedTo,
      assignedBy: 'user-1',
      notes: undefined,
    });
  });

  it('returns 200 and passes notes when pastor assigns with notes', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
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
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ prayerId: 'not-a-uuid', assignedTo: validAssignedTo }), routeParams);

    expect(res.status).toBe(400);
    expect(assignPrayer).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost/api/v1/church/grace-chapel-ab12/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });
});
