# Sprint 15 — Stability & Quality Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a safety net sized to actual past failure modes so the next `fix:` commit originates from Sentry or CI, not from a user report.

**Architecture:** Prevention-first. Architect performs bug archaeology on the last ~100 `fix:` commits to tag failure classes and map each to a specific safety-net control. Engineers then implement observability (Sentry + Better Stack), E2E tests (Playwright across browser + UA matrix), integration tests (real Neon preview branches), and CI gates (test/typecheck/Lighthouse + post-deploy smoke). Sprint closes when each of six failure buckets has a failing-test-that-now-passes proof.

**Tech Stack:** Next.js 16.2.2 App Router, NextAuth v5 beta, Drizzle ORM + Neon (neon-http), Vitest (existing), Playwright (new), `@sentry/nextjs` (new), Better Stack (Vercel integration), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-16-sprint-15-stability-hardening-design.md` (commit `050b7ae`).

---

## Phase / Workstream Overview

| Workstream | Tasks | Owner | Depends on |
|---|---|---|---|
| A — Bug archaeology | 1 | Architect | — |
| B — Observability | 2–7 | Backend Engineer | A |
| C — E2E Playwright | 8–17 | Frontend Engineer | A |
| D — Integration tests | 18–22 | Backend + Database Engineer | A |
| E — CI gates + smoke | 23–27 | Backend Engineer | B, C partial |
| F — Archaeology proof + sign-off | 28–29 | Reviewer | B, C, D, E |

A is blocking. B–E run in parallel. F closes the sprint.

---

## Workstream A — Bug Archaeology

### Task 1: Produce the archaeology matrix

**Files:**
- Create: `docs/superpowers/specs/2026-04-16-sprint-15-bug-archaeology.md`

- [ ] **Step 1: Collect the fix commits**

Run:
```bash
git log --since="2026-01-01" --pretty=format:"%h|%s|%ci" | grep -iE "^[a-f0-9]+\|fix[:(]" > /tmp/fix-commits.txt
wc -l /tmp/fix-commits.txt
```
Expected: ~90–100 lines.

- [ ] **Step 2: For each fix, tag failure class and safety-net control**

Produce a table with columns: `commit | subject | failure class | safety-net control | workstream`.

Failure classes are fixed — pick from these six buckets:
1. `oauth-cookie` — OAuth / cookie edge cases (Safari ITP, in-app browsers, PKCE, trustHost)
2. `driver-data` — Driver / data-layer mismatches (neon-http vs websocket, raw SQL pitfalls)
3. `prod-drift` — Missing env / tables / providers that ship to prod
4. `dialog-state` — Dialog / client state bugs on user actions
5. `interaction-side-effect` — Double-fire, stuck side effects, SSE issues
6. `authz-moderation` — Permission / moderation gating

If a commit doesn't fit any bucket, tag `out-of-scope` with a one-line reason (don't expand the bucket list).

- [ ] **Step 3: Write the archaeology doc**

The doc must contain:
1. Summary counts per bucket
2. Full commit-tagged table
3. For each bucket: representative commit + one-sentence root-cause pattern + safety-net control assignment
4. Explicit mapping: bucket N → which task(s) in this plan own its safety-net proof

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-16-sprint-15-bug-archaeology.md
git commit -m "docs(s15): bug archaeology matrix — 6 failure buckets mapped to safety-net controls"
```

- [ ] **Step 5: Update tasks.json + handoffs.md**

Set `pj-s15-archaeology` to `done`. Add handoff: `Architect → Backend/Frontend/Database/Reviewer: archaeology matrix ready, 6 buckets confirmed, proceed in parallel`.

---

## Workstream B — Observability

### Task 2: Install Sentry for Next.js

**Files:**
- Modify: `package.json`
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `next.config.ts`
- Modify: `instrumentation.ts` (create if missing)

- [ ] **Step 1: Install**

Run:
```bash
npm install --save @sentry/nextjs
```
Expected: Package added. Do NOT use the `npx @sentry/wizard` CLI — it rewrites configs interactively; we want explicit files.

- [ ] **Step 2: Write `sentry.client.config.ts`**

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
});
```

- [ ] **Step 3: Write `sentry.server.config.ts`**

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

- [ ] **Step 4: Write `sentry.edge.config.ts`**

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

- [ ] **Step 5: Add instrumentation hook**

Create or modify `instrumentation.ts` at repo root:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export { onRequestError } from '@sentry/nextjs';
```

- [ ] **Step 6: Wrap next.config.ts with Sentry**

```ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
});
```

- [ ] **Step 7: Add env vars to Vercel**

Instruct human to add in Vercel project settings (production + preview):
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN` (same value)
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (for sourcemap upload)

Also add locally to `.env.local` (do NOT commit).

- [ ] **Step 8: Commit**

```bash
git add sentry.*.config.ts instrumentation.ts next.config.ts package.json package-lock.json
git commit -m "feat(s15): install @sentry/nextjs with client/server/edge configs"
```

### Task 3: Add a synthetic-error endpoint to verify capture

**Files:**
- Create: `src/app/api/debug/sentry/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SENTRY_DEBUG_TOKEN) {
    return new NextResponse('not found', { status: 404 });
  }
  throw new Error('sentry-debug: synthetic error from /api/debug/sentry');
}
```

- [ ] **Step 2: Add `SENTRY_DEBUG_TOKEN` to Vercel env**

Human adds to production + preview. Use a long random string.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/debug/sentry/route.ts
git commit -m "feat(s15): add /api/debug/sentry endpoint to verify error capture"
```

- [ ] **Step 4: After deploy, trigger and confirm**

```bash
curl "https://prayerjar.org/api/debug/sentry?token=<token>"
```

Expected: Event appears in Sentry dashboard within 60s with correct release hash and environment=`production`.

### Task 4: Wire Better Stack log drain via Vercel integration

**Files:**
- Create: `docs/superpowers/runbooks/better-stack-setup.md`

- [ ] **Step 1: Configure in Vercel dashboard (manual)**

Doc the steps:
1. Vercel → Integrations → Browse Marketplace → Better Stack
2. Install → select `prayer-jar` project
3. Better Stack: create a new "Source" of type "Vercel"
4. Paste the source token into the Vercel integration config
5. Verify logs stream within 5 min at `https://logs.betterstack.com`

- [ ] **Step 2: Write the runbook**

Runbook documents the install steps + how to query (`source:vercel level:error`) + escalation.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/runbooks/better-stack-setup.md
git commit -m "docs(s15): better stack runbook"
```

### Task 5: Configure auth-error-rate alert in Sentry

**Files:**
- Create: `docs/superpowers/runbooks/sentry-alerts.md`

- [ ] **Step 1: Create alert rule in Sentry dashboard (manual)**

Rule: **"Auth error rate spike"**
- Filter: `transaction:GET /api/auth/* OR transaction:POST /api/auth/*`
- Condition: `event.count > 10 per 5m window`
- Action: Notify email `ronnel.pineda@gmail.com`

- [ ] **Step 2: Document the rule**

Runbook covers: rule name, filter string, threshold, notification targets, how to test (use debug endpoint), who to add when team grows.

- [ ] **Step 3: Trigger synthetic spike to verify**

Hit `/api/debug/sentry?token=<token>` 11 times within 5 minutes.

Expected: email alert delivered within 10 minutes of the 11th event.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/runbooks/sentry-alerts.md
git commit -m "docs(s15): sentry auth-error-rate alert runbook"
```

### Task 6: Add unit test that server-side Sentry init does not crash at import

**Files:**
- Create: `sentry.server.config.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from 'vitest';

describe('sentry.server.config', () => {
  it('imports without throwing', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://public@sentry.example/1');
    await expect(import('./sentry.server.config')).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- sentry.server.config.test.ts`
Expected: PASS (the config was written in Task 2; this guards against future regressions to module-level init).

- [ ] **Step 3: Commit**

```bash
git add sentry.server.config.test.ts
git commit -m "test(s15): guard sentry.server.config import"
```

### Task 7: Workstream B handoff

- [ ] **Step 1: Update tasks.json**

Set `pj-s15-observability` to `review`. Add note: "Sentry + Better Stack + alert live. Debug endpoint verified in prod."

- [ ] **Step 2: Append to handoffs.md**

```
[2026-04-XX] Backend Engineer → QA: pj-s15-observability — Sentry active on prod (events visible), Better Stack ingesting Vercel logs, auth-error-rate alert fires on synthetic spike.
```

---

## Workstream C — E2E (Playwright)

### Task 8: Install Playwright

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `.gitignore` update (test-results/, playwright-report/)

- [ ] **Step 1: Install**

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium webkit
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
    {
      name: 'messenger-webview',
      use: {
        ...devices['iPhone 14'],
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/430.0]',
      },
    },
    {
      name: 'instagram-webview',
      use: {
        ...devices['iPhone 14'],
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.0',
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
```

- [ ] **Step 3: Append to `.gitignore`**

```
test-results/
playwright-report/
/e2e/.auth/
```

- [ ] **Step 4: Add scripts**

Modify `package.json` scripts:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.ts .gitignore
git commit -m "chore(s15): install playwright with browser+UA matrix"
```

### Task 9: Sign-in test — OAuth redirect assertions (bucket #1 proof)

**Files:**
- Create: `e2e/sign-in-oauth-redirect.spec.ts`

The point: we can't complete real Google OAuth in CI, but the recurring bugs have all been in the *redirect setup* (cookies, params, UA-dependent failures). This test asserts the redirect URL + cookies are correct across the UA matrix.

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';

test.describe('Sign-in Google OAuth redirect', () => {
  test('navigates to Google with correct params and no __Secure- state cookie', async ({ page, context }) => {
    await page.goto('/sign-in');

    // Intercept the Google redirect so we don't leave our domain
    const redirectPromise = page.waitForRequest(
      (req) => req.url().startsWith('https://accounts.google.com/o/oauth2/v2/auth'),
      { timeout: 10_000 }
    );

    await page.getByRole('button', { name: /continue with google/i }).click();
    const redirectReq = await redirectPromise;

    const url = new URL(redirectReq.url());
    expect(url.searchParams.get('client_id')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toMatch(/\/api\/auth\/callback\/google$/);
    expect(url.searchParams.get('response_type')).toBe('code');

    // Bug-archaeology: cookie prefix bug (commit 32c98cf) — state cookie must NOT use __Secure- prefix
    const cookies = await context.cookies();
    const stateCookies = cookies.filter((c) => c.name.toLowerCase().includes('state'));
    for (const c of stateCookies) {
      expect(c.name.startsWith('__Secure-')).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run it**

```bash
npm run test:e2e -- sign-in-oauth-redirect --project=chromium-desktop --project=mobile-safari --project=messenger-webview --project=instagram-webview
```
Expected: 4 projects × 1 test = 4 PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/sign-in-oauth-redirect.spec.ts
git commit -m "test(s15): e2e — google oauth redirect params + cookie prefix assertions"
```

### Task 10: Sign-in test — magic link happy path

**Files:**
- Create: `e2e/sign-in-magic-link.spec.ts`
- Modify: `src/app/api/debug/magic-link/route.ts` (add a test-only endpoint behind `SENTRY_DEBUG_TOKEN` that returns the latest verification token for a test email, only when `VERCEL_ENV !== 'production'`)

- [ ] **Step 1: Create the debug endpoint**

```ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verificationTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse('not found', { status: 404 });
  }
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SENTRY_DEBUG_TOKEN) {
    return new NextResponse('not found', { status: 404 });
  }
  const email = url.searchParams.get('email');
  if (!email) return new NextResponse('email required', { status: 400 });

  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, email))
    .orderBy(desc(verificationTokens.expires))
    .limit(1);

  if (!row) return new NextResponse('no token', { status: 404 });
  return NextResponse.json({ token: row.token, expires: row.expires });
}
```

- [ ] **Step 2: Write the e2e test**

```ts
import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e+${Date.now()}@prayerjar-test.local`;

test('magic-link sign-in flow reaches the dashboard', async ({ page, request }) => {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByRole('button', { name: /send magic link|sign in/i }).click();
  await expect(page).toHaveURL(/\/sign-in\?verify=1/);

  // Retrieve the verification token out of band
  const res = await request.get(
    `/api/debug/magic-link?token=${process.env.SENTRY_DEBUG_TOKEN}&email=${encodeURIComponent(TEST_EMAIL)}`
  );
  expect(res.ok()).toBe(true);
  const { token } = await res.json();

  await page.goto(`/api/auth/callback/resend?token=${token}&email=${encodeURIComponent(TEST_EMAIL)}`);
  await expect(page).toHaveURL(/\/$|\/my-prayers|\/pray/);
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 3: Run it**

```bash
npm run test:e2e -- sign-in-magic-link --project=chromium-desktop --project=mobile-safari
```
Expected: PASS on both.

- [ ] **Step 4: Commit**

```bash
git add e2e/sign-in-magic-link.spec.ts src/app/api/debug/magic-link/route.ts
git commit -m "test(s15): e2e — magic link sign-in flow with debug token endpoint"
```

### Task 11: Authenticated storage-state fixture for logged-in tests

**Files:**
- Create: `e2e/fixtures/auth.ts`
- Modify: `playwright.config.ts` (add global setup)

- [ ] **Step 1: Write global setup that provisions a signed-in state**

```ts
// e2e/fixtures/auth.ts
import { test as base, expect, type Page } from '@playwright/test';
import path from 'path';

export const AUTH_STATE = path.resolve(__dirname, '../.auth/user.json');

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
export { expect };
```

Global setup script `e2e/global-setup.ts`:

```ts
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_STATE } from './fixtures/auth';

const TEST_EMAIL = 'e2e-seed@prayerjar-test.local';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/sign-in`);
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByRole('button', { name: /send magic link|sign in/i }).click();
  await expect(page).toHaveURL(/verify=1/);

  const tokenRes = await ctx.request.get(
    `${BASE_URL}/api/debug/magic-link?token=${process.env.SENTRY_DEBUG_TOKEN}&email=${encodeURIComponent(TEST_EMAIL)}`
  );
  const { token } = await tokenRes.json();
  await page.goto(`${BASE_URL}/api/auth/callback/resend?token=${token}&email=${encodeURIComponent(TEST_EMAIL)}`);
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 15_000 });

  await ctx.storageState({ path: AUTH_STATE });
  await browser.close();
}
```

- [ ] **Step 2: Wire into playwright.config.ts**

Add `globalSetup: require.resolve('./e2e/global-setup')` to the config export.

- [ ] **Step 3: Verify**

```bash
npm run test:e2e -- --project=chromium-desktop
```
Expected: global-setup runs once, writes `e2e/.auth/user.json`, tests proceed.

- [ ] **Step 4: Commit**

```bash
git add e2e/fixtures/auth.ts e2e/global-setup.ts playwright.config.ts
git commit -m "test(s15): playwright global setup — signed-in storage state"
```

### Task 12: Add-prayer from homepage (bucket #4 proof, part 1)

**Files:**
- Create: `e2e/add-prayer-homepage.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from './fixtures/auth';

test('add-prayer dialog opens inline on homepage (not redirect)', async ({ authedPage: page }) => {
  await page.goto('/');

  // Archaeology-linked regression: commit a31b05c — homepage dialog wasn't mounted
  await page.getByRole('button', { name: /add a prayer/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Happy path: fill + submit
  await page.getByLabel(/your prayer/i).fill('e2e test prayer request');
  await page.getByRole('button', { name: /submit|post|share/i }).click();

  // Dialog should close and success state shown
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  await expect(page.getByText(/prayer (added|shared|posted)/i)).toBeVisible();
});

test('add-prayer dialog cancel leaves no ghost state', async ({ authedPage: page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /add a prayer/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});
```

- [ ] **Step 2: Run + commit**

```bash
npm run test:e2e -- add-prayer-homepage
git add e2e/add-prayer-homepage.spec.ts
git commit -m "test(s15): e2e — add-prayer dialog from homepage (happy + cancel)"
```

### Task 13: Add-prayer from My Prayers (bucket #4 proof, part 2)

**Files:**
- Create: `e2e/add-prayer-my-prayers.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from './fixtures/auth';

test('add-prayer from My Prayers opens inline (not homepage redirect)', async ({ authedPage: page }) => {
  await page.goto('/my-prayers');

  // Archaeology-linked regression: commit c990752 — used to redirect to /
  await page.getByRole('button', { name: /add a prayer|new prayer/i }).first().click();

  await expect(page).toHaveURL(/\/my-prayers/);
  await expect(page.getByRole('dialog')).toBeVisible();
});
```

- [ ] **Step 2: Run + commit**

```bash
npm run test:e2e -- add-prayer-my-prayers
git add e2e/add-prayer-my-prayers.spec.ts
git commit -m "test(s15): e2e — add-prayer from My Prayers stays on page"
```

### Task 14: Pray-for on a shared prayer

**Files:**
- Create: `e2e/pray-for.spec.ts`
- Create: `e2e/helpers/seed-prayer.ts`

- [ ] **Step 1: Write seed helper**

```ts
// e2e/helpers/seed-prayer.ts
import { APIRequestContext } from '@playwright/test';

export async function seedPrayer(request: APIRequestContext, text = 'seeded for e2e') {
  const res = await request.post('/api/debug/seed-prayer', {
    headers: { authorization: `Bearer ${process.env.SENTRY_DEBUG_TOKEN}` },
    data: { text },
  });
  if (!res.ok()) throw new Error(`seed-prayer failed: ${res.status()}`);
  return (await res.json()) as { prayerId: string; shareId: string };
}
```

Also create the matching endpoint `src/app/api/debug/seed-prayer/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse('not found', { status: 404 });
  }
  const header = req.headers.get('authorization');
  if (header !== `Bearer ${process.env.SENTRY_DEBUG_TOKEN}`) {
    return new NextResponse('not found', { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('must be signed in (run after global-setup)', { status: 401 });
  }
  const { text } = (await req.json()) as { text?: string };
  const [row] = await db
    .insert(prayers)
    .values({
      authorId: session.user.id,
      text: text ?? 'e2e seeded prayer',
      category: 'other',
    })
    .returning({ id: prayers.id, shareId: prayers.shareId });
  return NextResponse.json({ prayerId: row.id, shareId: row.shareId });
}
```

- [ ] **Step 2: Write the test**

```ts
import { test, expect } from './fixtures/auth';
import { seedPrayer } from './helpers/seed-prayer';

test('pray-for fires exactly once (no double interaction)', async ({ authedPage: page, request }) => {
  const { shareId } = await seedPrayer(request);
  await page.goto(`/p/${shareId}`);

  let prayRequests = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/pray')) prayRequests += 1;
  });

  await page.getByRole('button', { name: /^pray$|i prayed/i }).click();
  await expect(page.getByText(/you prayed|thank you/i)).toBeVisible({ timeout: 5_000 });

  // Archaeology: bucket #5 — double-fire regression (sprint 12 f26884c)
  await page.waitForTimeout(1_000);
  expect(prayRequests).toBe(1);
});
```

- [ ] **Step 3: Run + commit**

```bash
npm run test:e2e -- pray-for
git add e2e/pray-for.spec.ts e2e/helpers/seed-prayer.ts src/app/api/debug/seed-prayer/route.ts
git commit -m "test(s15): e2e — pray-for single-fire invariant"
```

### Task 15: Share prayer flow

**Files:**
- Create: `e2e/share-prayer.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from './fixtures/auth';
import { seedPrayer } from './helpers/seed-prayer';

test('share dialog exposes a valid public link', async ({ authedPage: page, request, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const { shareId } = await seedPrayer(request);
  await page.goto('/my-prayers');

  await page.getByRole('button', { name: /more|options/i }).first().click();
  await page.getByRole('menuitem', { name: /share/i }).click();

  const linkInput = page.getByRole('textbox', { name: /share link|url/i });
  await expect(linkInput).toBeVisible();
  const link = await linkInput.inputValue();
  expect(link).toContain(`/p/${shareId}`);

  const headReq = await request.head(link);
  expect(headReq.status()).toBeLessThan(400);
});
```

- [ ] **Step 2: Run + commit**

```bash
npm run test:e2e -- share-prayer
git add e2e/share-prayer.spec.ts
git commit -m "test(s15): e2e — share dialog exposes working public link"
```

### Task 16: Overflow menu actions

**Files:**
- Create: `e2e/prayer-card-overflow.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from './fixtures/auth';
import { seedPrayer } from './helpers/seed-prayer';

test('overflow menu shows owner-only actions for own prayer', async ({ authedPage: page, request }) => {
  await seedPrayer(request);
  await page.goto('/my-prayers');

  await page.getByRole('button', { name: /more|options/i }).first().click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: /edit/i })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /delete/i })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /share/i })).toBeVisible();
});

test('edit dialog opens, closes cleanly on cancel', async ({ authedPage: page, request }) => {
  await seedPrayer(request);
  await page.goto('/my-prayers');
  await page.getByRole('button', { name: /more|options/i }).first().click();
  await page.getByRole('menuitem', { name: /edit/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
```

- [ ] **Step 2: Run + commit**

```bash
npm run test:e2e -- prayer-card-overflow
git add e2e/prayer-card-overflow.spec.ts
git commit -m "test(s15): e2e — prayer card overflow menu + edit dialog"
```

### Task 17: Workstream C handoff

- [ ] Update tasks.json: `pj-s15-e2e` → `review`. Handoff note: 8 e2e specs green across 4 projects (chromium-desktop, mobile-safari, messenger-webview, instagram-webview where applicable).

---

## Workstream D — Integration Tests (real Neon branch)

### Task 18: Neon branch-per-PR via GitHub Action

**Files:**
- Create: `.github/workflows/neon-branch.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Neon preview DB
on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

jobs:
  create:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    outputs:
      database_url: ${{ steps.branch.outputs.db_url_with_pooler }}
    steps:
      - uses: neondatabase/create-branch-action@v5
        id: branch
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          branch_name: pr-${{ github.event.number }}
          api_key: ${{ secrets.NEON_API_KEY }}
      - run: echo "PR=${{ github.event.number }} DB=${{ steps.branch.outputs.db_url_with_pooler }}"

  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          branch: pr-${{ github.event.number }}
          api_key: ${{ secrets.NEON_API_KEY }}
```

- [ ] **Step 2: Add `NEON_PROJECT_ID` and `NEON_API_KEY` as GitHub Actions secrets**

Human action in GitHub repo settings.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/neon-branch.yml
git commit -m "ci(s15): provision neon preview branch per pr"
```

### Task 19: Integration test harness + driver-quirk test (bucket #2)

**Files:**
- Create: `src/test/integration/setup.ts`
- Create: `src/test/integration/driver-quirks.integration.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Split vitest into two test configs**

Modify `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const isIntegration = process.env.VITEST_MODE === 'integration';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: isIntegration ? 'node' : 'jsdom',
    globals: true,
    setupFiles: isIntegration ? ['./src/test/integration/setup.ts'] : ['./src/test/setup.ts'],
    include: isIntegration
      ? ['src/**/*.integration.test.{ts,tsx}']
      : ['src/**/*.test.{ts,tsx}', '!src/**/*.integration.test.{ts,tsx}'],
    server: { deps: { inline: ['stripe'] } },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
});
```

Add `package.json` scripts:
```json
"test:integration": "VITEST_MODE=integration vitest run"
```

- [ ] **Step 2: Write integration setup**

```ts
// src/test/integration/setup.ts
import { afterAll } from 'vitest';

if (!process.env.DATABASE_URL) {
  throw new Error('Integration tests require DATABASE_URL pointing to a Neon preview branch');
}
if (process.env.VERCEL_ENV === 'production') {
  throw new Error('Refusing to run integration tests against production');
}

afterAll(() => {
  // Branch cleanup handled by the neon-branch workflow on PR close.
});
```

- [ ] **Step 3: Write driver-quirks test**

```ts
// src/test/integration/driver-quirks.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { inArray, sql } from 'drizzle-orm';

describe('neon-http driver quirks (bucket #2)', () => {
  let ids: string[] = [];

  beforeAll(async () => {
    const rows = await db
      .insert(prayers)
      .values([
        { authorId: 'driver-test-user', text: 'a', category: 'health' },
        { authorId: 'driver-test-user', text: 'b', category: 'health' },
        { authorId: 'driver-test-user', text: 'c', category: 'health' },
      ])
      .returning({ id: prayers.id });
    ids = rows.map((r) => r.id);
  });

  it('inArray works with neon-http (replacement for sql= ANY())', async () => {
    const rows = await db.select().from(prayers).where(inArray(prayers.id, ids));
    expect(rows).toHaveLength(3);
  });

  it('raw sql= ANY() is intentionally not used anywhere in app code', async () => {
    // Source-code guard — not a runtime test, but a drift preventer
    const { default: fs } = await import('node:fs/promises');
    const { default: path } = await import('node:path');
    const appFiles = await import('fast-glob').then((m) => m.default('src/**/*.{ts,tsx}'));
    for (const file of appFiles) {
      const content = await fs.readFile(file, 'utf8');
      expect(content, `${file} uses sql= ANY() which breaks neon-http`).not.toMatch(/sql`.*=\s*ANY\(/);
    }
  });
});
```

- [ ] **Step 4: Install fast-glob**

```bash
npm install --save-dev fast-glob
```

- [ ] **Step 5: Run**

```bash
DATABASE_URL="<preview-branch-url>" npm run test:integration -- driver-quirks
```
Expected: 2 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/test/integration/ vitest.config.ts package.json package-lock.json
git commit -m "test(s15): integration harness + neon-http driver-quirks tests"
```

### Task 20: Interaction single-fire invariant (bucket #5)

**Files:**
- Create: `src/services/interaction.single-fire.integration.test.ts`

- [ ] **Step 1: Write test**

```ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { db } from '@/db';
import { prayers, interactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { prayForRequest } from '@/services/interaction.service';

vi.mock('@/services/ai.service', () => ({
  moderateContent: vi.fn().mockResolvedValue({ safe: true, selfHarm: false }),
}));
vi.mock('@/services/notification.service', () => ({
  notifyPrayerAuthor: vi.fn().mockResolvedValue(undefined),
  notifyMessageReceived: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/badge.service', () => ({
  evaluateBadgesForUser: vi.fn().mockResolvedValue([]),
  updateStreak: vi.fn().mockResolvedValue(undefined),
}));

describe('prayForRequest — single-fire invariant (bucket #5)', () => {
  let prayerId: string;

  beforeAll(async () => {
    const [row] = await db
      .insert(prayers)
      .values({ authorId: 'interaction-test-author', text: 'invariant', category: 'other' })
      .returning({ id: prayers.id });
    prayerId = row.id;
  });

  it('writes exactly one interaction row even if called twice back-to-back', async () => {
    const userId = 'interaction-test-user';
    await Promise.all([
      prayForRequest({ prayerId, userId, message: '', isAnonymous: false }).catch(() => null),
      prayForRequest({ prayerId, userId, message: '', isAnonymous: false }).catch(() => null),
    ]);
    const rows = await db.select().from(interactions).where(eq(interactions.prayerId, prayerId));
    const prayRows = rows.filter((r) => r.userId === userId && r.type === 'prayed');
    expect(prayRows).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run**

```bash
DATABASE_URL=... npm run test:integration -- interaction.single-fire
```
Expected: PASS. If it FAILS, that is the bug we're proving we'd catch.

- [ ] **Step 3: Commit**

```bash
git add src/services/interaction.single-fire.integration.test.ts
git commit -m "test(s15): integration — prayForRequest single-fire invariant"
```

### Task 21: Service-layer authz tests (bucket #6)

**Files:**
- Create: `src/services/prayer.authz.integration.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { updatePrayer, deletePrayer } from '@/services/prayer.service';

describe('prayer service — authz (bucket #6)', () => {
  let ownerPrayerId: string;
  const OWNER = 'authz-owner';
  const INTRUDER = 'authz-intruder';

  beforeAll(async () => {
    const [row] = await db
      .insert(prayers)
      .values({ authorId: OWNER, text: 'owner prayer', category: 'other' })
      .returning({ id: prayers.id });
    ownerPrayerId = row.id;
  });

  it('non-owner cannot edit', async () => {
    await expect(
      updatePrayer({ prayerId: ownerPrayerId, userId: INTRUDER, text: 'hacked' })
    ).rejects.toThrow(/not authorized|not own|forbidden/i);
  });

  it('non-owner cannot delete', async () => {
    await expect(deletePrayer({ prayerId: ownerPrayerId, userId: INTRUDER })).rejects.toThrow(
      /not authorized|not own|forbidden/i
    );
  });

  it('owner can edit', async () => {
    await expect(
      updatePrayer({ prayerId: ownerPrayerId, userId: OWNER, text: 'updated' })
    ).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run**

Expected: 3 PASS (or the failure tells us authz has a hole).

- [ ] **Step 3: Commit**

```bash
git add src/services/prayer.authz.integration.test.ts
git commit -m "test(s15): integration — prayer service authz invariants"
```

### Task 22: Workstream D handoff

- [ ] Update tasks.json: `pj-s15-integration` → `review`. Handoff note: 3 integration tests green against preview Neon branch. Guards buckets 2, 5, 6.

---

## Workstream E — CI Gates + Post-Deploy Smoke

### Task 23: CI pipeline workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write it**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [feature/prayer-jar]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  unit-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test -- --run

  integration:
    runs-on: ubuntu-latest
    needs: unit-and-typecheck
    env:
      # Points to a persistent Neon `integration` branch. Reset weekly by a separate cron workflow.
      # The per-PR branch workflow in neon-branch.yml creates preview DBs; this CI job uses
      # the static integration branch to avoid cross-workflow output plumbing complexity.
      DATABASE_URL: ${{ secrets.NEON_INTEGRATION_DB_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    needs: unit-and-typecheck
    env:
      E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
      SENTRY_DEBUG_TOKEN: ${{ secrets.SENTRY_DEBUG_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(s15): pipeline — unit/typecheck/lint + integration + e2e gates"
```

### Task 24: Lighthouse budget

**Files:**
- Create: `lighthouserc.json`
- Modify: `.github/workflows/ci.yml` (add lighthouse job)

- [ ] **Step 1: Write budget**

```json
{
  "ci": {
    "collect": {
      "url": [
        "https://prayer-jar-git-feature-prayer-jar-ronnelpineda-2818s-projects.vercel.app/",
        "https://prayer-jar-git-feature-prayer-jar-ronnelpineda-2818s-projects.vercel.app/browse",
        "https://prayer-jar-git-feature-prayer-jar-ronnelpineda-2818s-projects.vercel.app/find-a-church"
      ],
      "numberOfRuns": 2
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.7 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.8 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2500 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 4000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

- [ ] **Step 2: Add lighthouse job**

Append to `.github/workflows/ci.yml`:

```yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: unit-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm install -g @lhci/cli@0.14.x
      - run: lhci autorun --config=lighthouserc.json
```

- [ ] **Step 3: Commit**

```bash
git add lighthouserc.json .github/workflows/ci.yml
git commit -m "ci(s15): lighthouse budget on core pages (a11y + cls as hard gates)"
```

### Task 25: Post-deploy smoke (bucket #3 proof)

**Files:**
- Create: `scripts/post-deploy-smoke.mjs`
- Create: `.github/workflows/post-deploy-smoke.yml`

- [ ] **Step 1: Write smoke script**

```js
// scripts/post-deploy-smoke.mjs
const BASE = process.env.SMOKE_BASE_URL ?? 'https://prayerjar.org';

const ROUTES = [
  '/', '/pray', '/browse', '/praise-wall', '/find-a-church', '/know-jesus',
  '/about', '/privacy', '/terms', '/contact', '/sign-in', '/docs', '/for-churches',
  '/give', '/press', '/partners', '/help', '/map',
];

const failures = [];
for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status >= 500 || res.status === 404) {
      failures.push(`${route} -> ${res.status}`);
    }
    console.log(`${res.status.toString().padEnd(4)} ${route}`);
  } catch (err) {
    failures.push(`${route} -> ${err.message}`);
  }
}

if (failures.length) {
  console.error('Smoke failures:', failures);
  process.exit(1);
}
console.log(`OK: ${ROUTES.length} routes reachable`);
```

- [ ] **Step 2: Write workflow**

```yaml
# .github/workflows/post-deploy-smoke.yml
name: Post-deploy smoke
on:
  workflow_run:
    workflows: ['Deploy to Vercel']
    types: [completed]
  schedule:
    - cron: '0 */6 * * *'

jobs:
  smoke:
    if: github.event.workflow_run.conclusion == 'success' || github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: node scripts/post-deploy-smoke.mjs
        env:
          SMOKE_BASE_URL: https://prayerjar.org
```

- [ ] **Step 3: Run locally**

```bash
SMOKE_BASE_URL=https://prayerjar.org node scripts/post-deploy-smoke.mjs
```
Expected: all routes <500, <404 → exit 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/post-deploy-smoke.mjs .github/workflows/post-deploy-smoke.yml
git commit -m "ci(s15): post-deploy smoke on every top-level route"
```

### Task 26: Notify Sentry of GitHub deployments for release tracking

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add Sentry release step**

Append to the deploy job:

```yaml
      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production
          version: ${{ github.sha }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(s15): register sentry release on each production deploy"
```

### Task 27: Workstream E handoff

- [ ] Update tasks.json: `pj-s15-ci-gates` → `review`. Handoff: CI blocks PR on test/typecheck/lint/lighthouse. Post-deploy smoke alerts on any non-200.

---

## Workstream F — Archaeology Proof + Reviewer Sign-Off

### Task 28: Re-introduce each past bug, prove CI catches it

For each of the 6 buckets, the Reviewer pushes a throwaway commit that re-introduces a representative past bug, confirms CI fails, then reverts.

**Proof protocol per bucket:**

- [ ] **Bucket #1 — OAuth cookie prefix**
  - Revert commit `32c98cf` locally (restore `__Secure-` prefix). Expect: `sign-in-oauth-redirect.spec.ts` FAILS on the cookie-name assertion.
  - Revert the revert. Confirm green. Post note in handoffs.

- [ ] **Bucket #2 — Driver mismatch**
  - In a temp commit, swap an `inArray(prayers.id, ids)` usage for `sql\`${prayers.id} = ANY(${ids})\``.
  - Expect: `driver-quirks.integration.test.ts` AST-guard test FAILS.
  - Revert, confirm green.

- [ ] **Bucket #3 — Production drift**
  - Temporarily break a route (`throw` from `src/app/(public)/find-a-church/page.tsx`).
  - Deploy to a preview URL; run smoke against that URL (`SMOKE_BASE_URL=<preview>`).
  - Expect: smoke FAILS. Revert.

- [ ] **Bucket #4 — Dialog state**
  - Unmount the homepage `PrayerDialog` (revert `a31b05c`).
  - Expect: `add-prayer-homepage.spec.ts` FAILS.
  - Revert.

- [ ] **Bucket #5 — Interaction double-fire**
  - Temporarily remove idempotency guard in `interaction.service.ts`.
  - Expect: `interaction.single-fire.integration.test.ts` FAILS.
  - Revert.

- [ ] **Bucket #6 — Authz**
  - Remove owner-check from `updatePrayer`.
  - Expect: `prayer.authz.integration.test.ts` FAILS.
  - Revert.

Each revert/prove cycle gets a single line in handoffs.md:

```
[2026-04-XX] Reviewer: bucket #N proof — <bug reintroduced> → <test that failed> → reverted, green restored.
```

### Task 29: Sprint close

- [ ] All six bucket proofs logged in `handoffs.md`
- [ ] All Workstream B–E tasks marked `done` in `tasks.json`
- [ ] Reviewer posts sprint wrap:

```
[2026-04-XX] Reviewer → PM: Sprint 15 complete — all 6 failure-bucket proofs on record. Observability live, CI gates active, e2e + integration suites green. Next `fix:` commit should originate from Sentry or CI.
```

- [ ] Update sprint registry: `.agent-state/sprints.json` — mark sprint 15 `done`, add sprint 16 shell.

---

## Out-of-Scope Reminders (do NOT do in this sprint)

- `next/image` migration and other Sprint 14 perf-audit items (Sprint 16)
- Session replay beyond the default `replaysOnErrorSampleRate: 1.0` wiring
- Wildcard church subdomains (blocked on 20+ churches)
- Any new user-facing feature

If any task here tempts you into one of these, stop and ask the Architect instead of scope-creeping.
