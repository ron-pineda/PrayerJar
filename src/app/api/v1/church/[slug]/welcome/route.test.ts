import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — factories must not reference variables declared below.
// Use vi.fn() without initial resolved values here; set them in beforeEach.
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchBySlug: vi.fn(),
  getChurchMembers: vi.fn(),
  updateWelcomeMessage: vi.fn(),
}));

import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
  updateWelcomeMessage,
} from '@/services/church-platform.service';
import { PUT } from './route';

const mockChurch = {
  id: 'church-1',
  slug: 'grace-chapel-ab12',
  name: 'Grace Chapel',
  description: null,
  welcomeMessage: 'Welcome!',
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

const memberOnly = {
  member: { id: 'm2', churchId: 'church-1', userId: 'user-2', role: 'member' as const, joinedAt: new Date() },
  user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
};

const pastorMember = {
  member: { id: 'm3', churchId: 'church-1', userId: 'user-3', role: 'pastor' as const, joinedAt: new Date() },
  user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/v1/church/grace-chapel-ab12/welcome', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/v1/church/[slug]/welcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getChurchBySlug).mockResolvedValue(mockChurch);
    vi.mocked(getChurchMembers).mockResolvedValue([adminMember, memberOnly, pastorMember]);
    vi.mocked(updateWelcomeMessage).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await PUT(
      makeRequest({ message: 'Hello' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 404 when church does not exist', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getChurchBySlug).mockResolvedValueOnce(null);

    const res = await PUT(
      makeRequest({ message: 'Hello' }),
      { params: Promise.resolve({ slug: 'nonexistent' }) },
    );

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is a plain member', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ message: 'Hello' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 403 when user is not a member at all', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-99', name: 'Stranger', email: 'stranger@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ message: 'Hello' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(403);
  });

  it('returns 200 and calls updateWelcomeMessage when user is admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ message: 'New welcome message' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(updateWelcomeMessage).toHaveBeenCalledWith('church-1', 'New welcome message');
  });

  it('returns 200 and calls updateWelcomeMessage when user is pastor', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ message: 'Pastoral welcome' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(200);
    expect(updateWelcomeMessage).toHaveBeenCalledWith('church-1', 'Pastoral welcome');
  });

  it('returns 400 when message exceeds 1000 chars', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ message: 'x'.repeat(1001) }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(400);
    expect(updateWelcomeMessage).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost/api/v1/church/grace-chapel-ab12/welcome', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await PUT(req, { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) });
    expect(res.status).toBe(400);
  });
});
