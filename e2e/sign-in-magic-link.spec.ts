import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e+${Date.now()}@prayerjar-test.local`;

// NOTE: This test requires SENTRY_DEBUG_TOKEN env var and a running dev server with
// real Resend credentials (or a preview environment). It is skipped locally unless
// E2E_BASE_URL is set pointing to a preview with valid Resend configuration.
// Magic-link sign-in won't deliver to .local domains via Resend in production mode.
test.skip(
  !process.env.SENTRY_DEBUG_TOKEN,
  'Skipped: SENTRY_DEBUG_TOKEN not set — magic-link test requires debug token + preview env with Resend'
);

test('magic-link sign-in flow reaches the app', async ({ page, request }) => {
  await page.goto('/sign-in');
  // Label verified from src/app/(auth)/sign-in/page.tsx: "Email address"
  await page.getByLabel(/email address/i).fill(TEST_EMAIL);
  // Button text verified: "Send sign-in link"
  await page.getByRole('button', { name: /send sign-in link/i }).click();
  await expect(page).toHaveURL(/\/sign-in\?verify=1/);

  const res = await request.get(
    `/api/debug/magic-link?token=${process.env.SENTRY_DEBUG_TOKEN}&email=${encodeURIComponent(TEST_EMAIL)}`
  );
  expect(res.ok()).toBe(true);
  const { token } = await res.json();

  await page.goto(`/api/auth/callback/resend?token=${token}&email=${encodeURIComponent(TEST_EMAIL)}`);
  await expect(page).toHaveURL(/\/$|\/my-prayers|\/pray/);
});
