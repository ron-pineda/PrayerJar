import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchBySlug: vi.fn(),
  getChurchMembers: vi.fn(),
}));

vi.mock('@/services/pastoral.service', () => ({
  createPastoralNote: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { createPastoralNote } from '@/services/pastoral.service';
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

const mockNote = {
  id: 'note-1',
  prayerId: null,
  memberId: null,
  authorId: 'user-1',
  content: 'A pastoral note',
  isPrivate: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/v1/church/grace-chapel-ab12/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) };

describe('POST /api/v1/church/[slug]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getChurchBySlug).mockResolvedValue(mockChurch);
    vi.mocked(getChurchMembers).mockResolvedValue([adminMember, memberOnly, pastorMember]);
    vi.mocked(createPastoralNote).mockResolvedValue(mockNote);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ content: 'A note' }), routeParams);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 403 when user is a plain member', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ content: 'A note' }), routeParams);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 403 when user is not a member at all', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-99', name: 'Stranger', email: 'stranger@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ content: 'A note' }), routeParams);

    expect(res.status).toBe(403);
  });

  it('returns 200 and calls createPastoralNote when admin posts', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ content: 'A pastoral note' }), routeParams);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('note');
    expect(createPastoralNote).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'A pastoral note', authorId: 'user-1', churchId: 'church-1' }),
    );
  });

  it('returns 200 when pastor posts with prayerId', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const prayerId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await POST(makeRequest({ content: 'Prayer note', prayerId }), routeParams);

    expect(res.status).toBe(200);
    expect(createPastoralNote).toHaveBeenCalledWith(
      expect.objectContaining({ prayerId }),
    );
  });

  it('returns 400 for empty content', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ content: '' }), routeParams);

    expect(res.status).toBe(400);
    expect(createPastoralNote).not.toHaveBeenCalled();
  });

  it('returns 400 for content exceeding 2000 chars', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await POST(makeRequest({ content: 'x'.repeat(2001) }), routeParams);

    expect(res.status).toBe(400);
    expect(createPastoralNote).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost/api/v1/church/grace-chapel-ab12/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });
});
