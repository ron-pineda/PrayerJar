import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_STATE } from './fixtures/auth';

const TEST_EMAIL = 'e2e-seed@prayerjar-test.local';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });

  // If magic-link flow can't work (no SENTRY_DEBUG_TOKEN), skip global setup gracefully
  if (!process.env.SENTRY_DEBUG_TOKEN) {
    console.warn(
      '[global-setup] SENTRY_DEBUG_TOKEN not set — skipping auth setup, authedPage tests will fail'
    );
    fs.writeFileSync(AUTH_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/sign-in`);
  // Label verified from src/app/(auth)/sign-in/page.tsx: "Email address"
  await page.getByLabel(/email address/i).fill(TEST_EMAIL);
  // Button text verified: "Send sign-in link"
  await page.getByRole('button', { name: /send sign-in link/i }).click();
  await expect(page).toHaveURL(/verify=1/);

  const tokenRes = await ctx.request.get(
    `${BASE_URL}/api/debug/magic-link?token=${process.env.SENTRY_DEBUG_TOKEN}&email=${encodeURIComponent(TEST_EMAIL)}`
  );
  const { token } = await tokenRes.json();
  await page.goto(
    `${BASE_URL}/api/auth/callback/resend?token=${token}&email=${encodeURIComponent(TEST_EMAIL)}`
  );
  // Looser check — just wait for redirect away from sign-in
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 15_000 });

  await ctx.storageState({ path: AUTH_STATE });
  await browser.close();
}
