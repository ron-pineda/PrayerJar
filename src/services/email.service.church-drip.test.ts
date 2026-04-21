import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Hoist spy references so vi.mock factories can close over them ──
const { mockEmailSend, mockWhere, mockSet, mockConflictUpdate, mockValues, mockInsert, mockUpdate } = vi.hoisted(() => {
  const mockEmailSend = vi.fn().mockResolvedValue({ id: 'mock-id' });
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockConflictUpdate = vi.fn().mockResolvedValue([]);
  const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockConflictUpdate });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  return { mockEmailSend, mockWhere, mockSet, mockConflictUpdate, mockValues, mockInsert, mockUpdate };
});

// ── Resend mock ──
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockEmailSend };
  },
}));

// ── DB mock ──
vi.mock('@/db', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
  },
}));

import { sendChurchWelcome1Email, sendChurchWelcome2Email, sendChurchWelcome3Email } from './email.service';

beforeEach(() => vi.clearAllMocks());

describe('sendChurchWelcome1Email', () => {
  it('sends email with correct subject and recipient', async () => {
    await sendChurchWelcome1Email('church-1', 'user-1', 'pastor@grace.org', 'grace-church');
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'pastor@grace.org', subject: 'Your church is live on PrayerJar' })
    );
  });

  it('inserts a drip row with email1SentAt', async () => {
    await sendChurchWelcome1Email('church-1', 'user-1', 'pastor@grace.org', 'grace-church');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ churchId: 'church-1', adminUserId: 'user-1' })
    );
  });
});

describe('sendChurchWelcome2Email', () => {
  it('sends email with correct subject and recipient', async () => {
    await sendChurchWelcome2Email('church-1', 'pastor@grace.org', 'grace-church');
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'pastor@grace.org', subject: 'Your prayer wall is waiting' })
    );
  });

  it('updates email2SentAt (not insert)', async () => {
    await sendChurchWelcome2Email('church-1', 'pastor@grace.org', 'grace-church');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe('sendChurchWelcome3Email', () => {
  it('sends email with correct subject and recipient', async () => {
    await sendChurchWelcome3Email('church-1', 'pastor@grace.org', 'grace-church');
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'pastor@grace.org', subject: 'Quick wins before Sunday' })
    );
  });

  it('updates email3SentAt (not insert)', async () => {
    await sendChurchWelcome3Email('church-1', 'pastor@grace.org', 'grace-church');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
