import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/church-platform.service', () => ({
  getChurchBySlug: vi.fn(),
  getChurchMembers: vi.fn(),
}));

vi.mock('@/services/event.service', () => ({
  getEvent: vi.fn(),
  getEventPrayers: vi.fn(),
}));

import type { Session } from 'next-auth';
import { auth as authImpl } from '@/lib/auth';
// NextAuth's `auth` is an intersection of five call signatures, so
// `ReturnType<typeof auth>` resolves to its middleware overload. Re-type the
// binding to the no-arg overload these tests use so `vi.mocked(auth)` and
// `Awaited<ReturnType<typeof auth>>` resolve to `Session | null`.
const auth = authImpl as () => Promise<Session | null>;
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getEvent, getEventPrayers } from '@/services/event.service';
import { GET } from './route';

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

const mockEvent = {
  id: 'event-1',
  churchId: 'church-1',
  name: 'Sunday Prayer',
  description: null,
  status: 'ended' as const,
  displayMode: 'stream' as const,
  eventLicenseId: null,
  startsAt: new Date(),
  endsAt: new Date(),
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminMember = {
  member: { id: 'm1', churchId: 'church-1', userId: 'user-1', role: 'admin' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
};

const memberOnly = {
  member: { id: 'm2', churchId: 'church-1', userId: 'user-2', role: 'member' as const, joinedAt: new Date(), externalChmsId: null, chmsProvider: null, chmsStatus: null, chmsSyncedAt: null },
  user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
};

function makeRequest() {
  return new Request(
    'http://localhost/api/v1/church/grace-chapel-ab12/events/event-1/report.csv',
    { method: 'GET' },
  );
}

describe('GET /api/v1/church/[slug]/events/[eventId]/report.csv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getChurchBySlug).mockResolvedValue(mockChurch);
    vi.mocked(getChurchMembers).mockResolvedValue([adminMember, memberOnly]);
    vi.mocked(getEvent).mockResolvedValue(mockEvent);
    vi.mocked(getEventPrayers).mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await GET(makeRequest(), {
      params: Promise.resolve({ slug: 'grace-chapel-ab12', eventId: 'event-1' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('returns 403 when user is a plain member', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await GET(makeRequest(), {
      params: Promise.resolve({ slug: 'grace-chapel-ab12', eventId: 'event-1' }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 200 with text/csv content-type when user is admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    } as Awaited<ReturnType<typeof auth>>);

    const res = await GET(makeRequest(), {
      params: Promise.resolve({ slug: 'grace-chapel-ab12', eventId: 'event-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('event-report-event-1.csv');

    const text = await res.text();
    expect(text).toContain('id,content,submitterName,isAnonymous,category,status,createdAt');
  });
});
