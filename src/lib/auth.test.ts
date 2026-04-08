import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

vi.mock('next-auth/providers/resend', () => ({
  default: vi.fn(() => ({ id: 'resend' })),
}));

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/db/schema', () => ({
  users: {},
  accounts: {},
  sessions: {},
  verificationTokens: {},
}));

describe('auth', () => {
  it('exports required NextAuth functions', async () => {
    const { auth, signIn, signOut, handlers } = await import('./auth');
    expect(auth).toBeDefined();
    expect(signIn).toBeDefined();
    expect(signOut).toBeDefined();
    expect(handlers).toBeDefined();
  });
});
