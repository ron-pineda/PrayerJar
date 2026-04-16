import { test, expect } from '@playwright/test';

test.describe('Sign-in Google OAuth redirect', () => {
  test('navigates to Google with correct params and no __Secure- state cookie', async ({ page, context }) => {
    await page.goto('/sign-in');

    const redirectPromise = page.waitForRequest(
      (req) => req.url().startsWith('https://accounts.google.com/o/oauth2/v2/auth'),
      { timeout: 10_000 }
    );

    // Actual button text verified from src/app/(auth)/sign-in/page.tsx: "Continue with Google"
    await page.getByRole('button', { name: /continue with google/i }).click();
    const redirectReq = await redirectPromise;

    const url = new URL(redirectReq.url());
    expect(url.searchParams.get('client_id')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toMatch(/\/api\/auth\/callback\/google$/);
    expect(url.searchParams.get('response_type')).toBe('code');

    // Bucket #1 archaeology: __Secure- prefix bug (commit 32c98cf)
    const cookies = await context.cookies();
    const stateCookies = cookies.filter((c) => c.name.toLowerCase().includes('state'));
    for (const c of stateCookies) {
      expect(c.name.startsWith('__Secure-')).toBe(false);
    }
  });
});
