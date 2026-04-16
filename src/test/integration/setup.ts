import { afterAll } from 'vitest';

if (!process.env.DATABASE_URL) {
  throw new Error('Integration tests require DATABASE_URL pointing to a Neon preview branch');
}
if (process.env.VERCEL_ENV === 'production') {
  throw new Error('Refusing to run integration tests against production database');
}

afterAll(() => {
  // Neon branch cleanup is handled by the neon-branch.yml workflow on PR close.
});
