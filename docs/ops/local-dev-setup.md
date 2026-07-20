# Local dev & build — Windows setup

`npm run dev` and `npm run build` both failed on the primary dev machine from roughly
April to July 2026, which forced all visual verification through Vercel preview URLs.
Fixed 2026-07-20 (task pj-s24-05). There were **three stacked causes** — each one hid the
next, which is why it looked like a single intractable failure.

## Cause 1 — stale `.next` type validators

`next build` compiled fine, then failed typechecking generated files:

```
.next/dev/types/validator.ts:62:39
Type error: Cannot find module '../../../src/app/(church)/church/[slug]/admin/audit/page.js'
```

Those validators were generated before the church admin routes moved into the `(admin)`
route group, so they referenced paths that no longer exist. Nothing in `src/` was wrong.

**Fix:** `rm -rf .next` before building. Do this after any route-group or directory move.

## Cause 2 — `ADMIN_EMAILS` missing from `.env.local`

```
Error: ADMIN_EMAILS must be set in production
```

`next build` runs with `NODE_ENV=production`, which trips the deliberate startup assertion in
`src/lib/env.ts`. The guard is correct and should stay — it prevents deploying without admins.
`.env.local` simply never had the value.

**Fix:** set `ADMIN_EMAILS=you@example.com` in `.env.local`.

## Cause 3 — `CHMS_CONFIG_ENCRYPTION_KEY` missing

```
Error: CHMS_CONFIG_ENCRYPTION_KEY must be a 64-character hex string
```

Asserted at module load during page-data collection.

**Fix:** generate a throwaway local key — never reuse the production one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Verified working state (2026-07-20)

- `npx next build` — compiles in ~10s, TypeScript passes in ~14s, full route table emitted.
- `npx next dev` — ready in under a second, homepage returns 200.

Both env vars are documented in `.env.local.example`. `.env.local` is gitignored, so each
machine needs its own copy.
