import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks — factories must not reference out-of-scope variables.
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));

vi.mock('@/db', () => ({ db: { select: vi.fn(), insert: vi.fn() } }));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: (name: string) => (name === 'x-forwarded-for' ? '1.2.3.4' : null),
  })),
}));

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { acceptDpa, DPA_VERSION } from './actions';

// ── helpers ────────────────────────────────────────────────────────────────

function mockSession(userId = 'user-1') {
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: userId },
  });
}

function mockNoSession() {
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
}

// Chainable Drizzle mock: db.select().from().where().limit()
function mockDbSelect(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from });
  return { from, where, limit };
}

// Chainable Drizzle mock: db.insert().values()
function mockDbInsert() {
  const values = vi.fn().mockResolvedValue([]);
  (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values });
  return { values };
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('acceptDpa()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when not signed in', async () => {
    mockNoSession();
    const result = await acceptDpa('church-1');
    expect(result).toEqual({ error: expect.stringContaining('signed in') });
  });

  it('returns error when user is not a member', async () => {
    mockSession();
    mockDbSelect([]); // no membership row
    const result = await acceptDpa('church-1');
    expect(result).toEqual({ error: expect.stringContaining('not a member') });
  });

  it('returns error when user is a plain member (not admin/pastor)', async () => {
    mockSession();
    mockDbSelect([{ role: 'member' }]);
    const result = await acceptDpa('church-1');
    expect(result).toEqual({ error: expect.stringContaining('administrators') });
  });

  it('inserts acceptance row and returns success for admin', async () => {
    mockSession('admin-user');
    mockDbSelect([{ role: 'admin' }]);
    const { values } = mockDbInsert();

    const result = await acceptDpa('church-1', DPA_VERSION);
    expect(result).toEqual({ success: true });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: 'church-1',
        userId: 'admin-user',
        documentType: 'dpa',
        documentVersion: DPA_VERSION,
        ipAddress: '1.2.3.4',
      }),
    );
  });

  it('inserts acceptance row and returns success for pastor', async () => {
    mockSession('pastor-user');
    mockDbSelect([{ role: 'pastor' }]);
    mockDbInsert();

    const result = await acceptDpa('church-1');
    expect(result).toEqual({ success: true });
  });

  it('returns error when insert throws', async () => {
    mockSession('admin-user');
    mockDbSelect([{ role: 'admin' }]);
    const values = vi.fn().mockRejectedValue(new Error('DB error'));
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values });

    const result = await acceptDpa('church-1');
    expect(result).toEqual({ error: expect.stringContaining('Failed') });
  });
});
