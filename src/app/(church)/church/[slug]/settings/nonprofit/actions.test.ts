import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/db', () => ({ db: { select: vi.fn(), insert: vi.fn() } }));

// Vercel Blob mock — put() returns { url }
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.vercel.com/fake.pdf' }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: () => null })),
}));

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { put } from '@vercel/blob';
import { submitNonprofitVerification } from './actions';

function mockSession(userId = 'user-1') {
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: userId } });
}

function mockNoSession() {
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
}

function mockMembership(role: string) {
  const limit = vi.fn().mockResolvedValue([{ role }]);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from });
}

function mockNoMembership() {
  const limit = vi.fn().mockResolvedValue([]);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from });
}

function mockInsert(returnRows = [{ id: 'verif-1' }]) {
  const returning = vi.fn().mockResolvedValue(returnRows);
  const values = vi.fn().mockReturnValue({ returning });
  (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values });
  return { values, returning };
}

function makePdfFormData(sizeBytes = 5000): FormData {
  const content = new Uint8Array(sizeBytes);
  const file = new File([content], 'determination.pdf', { type: 'application/pdf' });
  const fd = new FormData();
  fd.append('determination_letter', file);
  fd.append('ein', '12-3456789');
  fd.append('legal_name', 'Grace Chapel 501c3');
  return fd;
}

describe('submitNonprofitVerification()', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns error when not signed in', async () => {
    mockNoSession();
    const result = await submitNonprofitVerification('church-1', makePdfFormData());
    expect(result).toEqual({ error: expect.stringContaining('signed in') });
  });

  it('returns error when user is not admin/pastor', async () => {
    mockSession();
    mockMembership('member');
    const result = await submitNonprofitVerification('church-1', makePdfFormData());
    expect(result).toEqual({ error: expect.stringContaining('administrators') });
  });

  it('returns error when no file is provided', async () => {
    mockSession();
    mockMembership('admin');
    const fd = new FormData(); // no file
    const result = await submitNonprofitVerification('church-1', fd);
    expect(result).toEqual({ error: expect.stringContaining('No file') });
  });

  it('returns error when file is not a PDF', async () => {
    mockSession();
    mockMembership('admin');
    const file = new File(['hello'], 'photo.jpg', { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('determination_letter', file);
    const result = await submitNonprofitVerification('church-1', fd);
    expect(result).toEqual({ error: expect.stringContaining('PDF') });
  });

  it('returns error when file is too large (> 10 MB)', async () => {
    mockSession();
    mockMembership('admin');
    const fd = makePdfFormData(11 * 1024 * 1024);
    const result = await submitNonprofitVerification('church-1', fd);
    expect(result).toEqual({ error: expect.stringContaining('large') });
  });

  it('uploads PDF and inserts verification row on success', async () => {
    mockSession('admin-user');
    mockMembership('admin');
    const { values } = mockInsert();

    const result = await submitNonprofitVerification('church-1', makePdfFormData());
    expect(result).toEqual({ success: true, verificationId: 'verif-1' });
    expect(put).toHaveBeenCalledWith(
      expect.stringContaining('nonprofit-verifications/church-1/'),
      expect.any(File),
      expect.objectContaining({ contentType: 'application/pdf' }),
    );
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: 'church-1',
        determinationLetterUrl: 'https://blob.vercel.com/fake.pdf',
        status: 'pending',
      }),
    );
  });

  it('also succeeds for pastor role', async () => {
    mockSession('pastor-user');
    mockMembership('pastor');
    mockInsert();
    const result = await submitNonprofitVerification('church-1', makePdfFormData());
    expect(result).toEqual({ success: true, verificationId: 'verif-1' });
  });

  it('returns error when no membership row found', async () => {
    mockSession();
    mockNoMembership();
    const result = await submitNonprofitVerification('church-1', makePdfFormData());
    expect(result).toEqual({ error: expect.stringContaining('administrators') });
  });
});
