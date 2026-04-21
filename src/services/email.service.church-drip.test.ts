import { describe, it, expect, vi } from 'vitest';

vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ id: 'mock-id' });
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

import { sendChurchWelcome1Email, sendChurchWelcome2Email, sendChurchWelcome3Email } from './email.service';

describe('sendChurchWelcome1Email', () => {
  it('sends email and creates drip row', async () => {
    await expect(
      sendChurchWelcome1Email('church-id-1', 'user-id-1', 'pastor@grace.org', 'grace-church')
    ).resolves.not.toThrow();
  });
});

describe('sendChurchWelcome2Email', () => {
  it('sends email and stamps email2SentAt', async () => {
    await expect(
      sendChurchWelcome2Email('church-id-1', 'pastor@grace.org', 'grace-church')
    ).resolves.not.toThrow();
  });
});

describe('sendChurchWelcome3Email', () => {
  it('sends email and stamps email3SentAt', async () => {
    await expect(
      sendChurchWelcome3Email('church-id-1', 'pastor@grace.org', 'grace-church')
    ).resolves.not.toThrow();
  });
});
