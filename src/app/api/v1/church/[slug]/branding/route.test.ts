import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchBySlug: vi.fn(),
  getChurchMembers: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    update: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  churches: { id: 'id' },
}));

import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
} from '@/services/church-platform.service';
import { db } from '@/db';
import { PUT } from './route';

const mockChurch = {
  id: 'church-1',
  slug: 'grace-chapel-ab12',
  name: 'Grace Chapel',
  description: null,
  welcomeMessage: 'Welcome!',
  logoUrl: null,
  subdomain: null,
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

// Mock the Drizzle chained query builder: db.update(...).set(...).where(...)
function mockDbUpdateChain() {
  const chain = {
    set: vi.fn(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  chain.set.mockReturnValue(chain);
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/v1/church/grace-chapel-ab12/branding', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/v1/church/[slug]/branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getChurchBySlug).mockResolvedValue(mockChurch);
    vi.mocked(getChurchMembers).mockResolvedValue([adminMember, memberOnly, pastorMember]);
    mockDbUpdateChain();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await PUT(
      makeRequest({ primaryColor: '#ff0000' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 403 when user is a plain member', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ primaryColor: '#ff0000' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 200 and calls db.update when user is admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ primaryColor: '#aabbcc', logoUrl: 'https://example.com/logo.png', subdomain: 'grace' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(db.update).toHaveBeenCalled();
  });

  it('returns 200 when user is pastor', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-3', name: 'Pastor Carol', email: 'carol@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ primaryColor: '#aabbcc' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid color format', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ primaryColor: 'notacolor' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost/api/v1/church/grace-chapel-ab12/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await PUT(req, { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid logoUrl', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await PUT(
      makeRequest({ logoUrl: 'not-a-url' }),
      { params: Promise.resolve({ slug: 'grace-chapel-ab12' }) },
    );

    expect(res.status).toBe(400);
  });
});
