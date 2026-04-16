// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

describe('sentry.server.config', () => {
  it('imports without throwing', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://public@sentry.example/1');
    await expect(import('./sentry.server.config')).resolves.toBeDefined();
  });
});
