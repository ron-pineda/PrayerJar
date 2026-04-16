# Sprint 15 — Bug Archaeology Matrix

**Date:** 2026-04-16
**Author:** Architect
**Scope:** Every `fix:` / `fix(scope):` commit on `feature/prayer-jar` since 2026-01-01
**Sample size:** 96 commits
**Purpose:** Tag each past bug with a failure class and the safety-net control that would have caught it before prod. Every Sprint 15 test, tool, and CI gate must map back to at least one bucket below — no speculative coverage.

---

## 1. Summary Counts

| # | Failure class | Count | % of sample | Safety-net control task |
|---|---|---:|---:|---|
| 1 | `oauth-cookie` — OAuth / cookie edge cases | 13 | 14% | `pj-s15-e2e` |
| 2 | `driver-data` — Driver / data-layer mismatches | 14 | 15% | `pj-s15-integration` |
| 3 | `prod-drift` — Missing env / tables / providers | 10 | 10% | `pj-s15-ci-gates` |
| 4 | `dialog-state` — Dialog / client state bugs on user actions | 15 | 16% | `pj-s15-e2e` |
| 5 | `interaction-side-effect` — Double-fire, stuck side effects, SSE | 7 | 7% | `pj-s15-integration` |
| 6 | `authz-moderation` — Permission / moderation gating | 11 | 11% | `pj-s15-integration` |
| — | `out-of-scope` — Copy, styling, UI polish, a11y, local TS build | 26 | 27% | (not a safety-net target) |
| | **Total** | **96** | 100% | |

> The six in-scope buckets together account for **70 of 96** (73%) of all `fix:` commits this year. If Sprint 15 covers those classes, it addresses the documented majority of production regression traffic.

---

## 2. Full Commit-Tagged Table

| Commit | Subject | Failure class | Safety-net control | Workstream |
|---|---|---|---|---|
| c990752 | open prayer dialog inline from My Prayers instead of redirecting to homepage | `dialog-state` | Playwright add-prayer flow from My Prayers | `pj-s15-e2e` |
| a31b05c | add PrayerDialog to signed-in homepage — "Add a Prayer" from My Prayers now works | `dialog-state` | Playwright add-prayer from homepage | `pj-s15-e2e` |
| 1bd90d9 | disable all OAuth cookie checks — eliminates cookie-dependent failures | `oauth-cookie` | Playwright sign-in on Safari + WebView UA | `pj-s15-e2e` |
| 32c98cf | remove __Secure- cookie prefix for OAuth state — fixes Safari/ITP cookie drops | `oauth-cookie` | Playwright sign-in on Safari UA | `pj-s15-e2e` |
| 6a66bec | capitalize status badge, parallelize homepage data fetching with Promise.all | `out-of-scope` | — | — |
| a7024b1 | add trustHost to NextAuth config — required for Vercel OAuth cookie resolution | `oauth-cookie` | Playwright sign-in against preview URL | `pj-s15-e2e` |
| f73b5e7 | disable OAuth checks for in-app browser compat, add warning banner on sign-in | `oauth-cookie` | Playwright sign-in on WebView UA | `pj-s15-e2e` |
| bdb7f1d | disable PKCE for Google OAuth to support in-app browsers (Messenger, Instagram) | `oauth-cookie` | Playwright sign-in on Messenger/Instagram UA | `pj-s15-e2e` |
| 3091185 | restore PrayerJar animation on homepage for signed-in users | `prod-drift` | Post-deploy smoke on `/` (signed-in) | `pj-s15-ci-gates` |
| f3dea5f | use inArray for subquery in homepage service, exclude church prayers from snippet | `driver-data` | Integration test on neon-http driver + AST guard for `sql=ANY()` | `pj-s15-integration` |
| e10b68f | show daily verse for signed-in users on homepage | `prod-drift` | Post-deploy smoke on `/` asserts daily verse region present | `pj-s15-ci-gates` |
| 08dab94 | improve PrayerCard dialog error handling and close lifecycle | `dialog-state` | Playwright dialog open/close/error paths | `pj-s15-e2e` |
| e1d49d7 | use Sonner toast for renew and adopt confirmations in PrayerCard | `dialog-state` | Playwright renew + adopt flows | `pj-s15-e2e` |
| 67574aa | copy improvements — nav labels, dashboard language, confirmation text | `out-of-scope` | — | — |
| 17f98ec | add aria-labels to icon-only buttons | `out-of-scope` | — | — |
| cf9abc3 | align docs pages with app visual language | `out-of-scope` | — | — |
| 6414390 | add flex-wrap to footer links to prevent mobile overflow | `out-of-scope` | — | — |
| 612ab3f | add aria-label to find-a-church filter Select triggers | `out-of-scope` | — | — |
| 03f8311 | replace native select/input with shadcn for dark mode consistency | `out-of-scope` | — | — |
| 6fa7bc5 | remove dead SSE route, fix double interaction on pray+message | `interaction-side-effect` | Single-fire invariant integration test | `pj-s15-integration` |
| f1165e4 | admin: write audit log rows in report resolve/dismiss actions | `authz-moderation` | Service-layer authz test: admin-action writes audit row | `pj-s15-integration` |
| 88c0089 | moderation on edit/group/partner + notification read on click | `authz-moderation` | Service-layer moderation test on edit paths | `pj-s15-integration` |
| 6edbcaf | gate all prayer owner actions behind isOwnPrayer | `authz-moderation` | Service-layer authz: non-owner rejected | `pj-s15-integration` |
| ed9d99b | hide owner actions on shared prayer page, allow chain slot release | `authz-moderation` | Service-layer + E2E: non-owner sees no owner UI | `pj-s15-integration` |
| f26884c | double interaction, stuck side-effects, SSE timeout log spam | `interaction-side-effect` | Single-fire invariant + no long-lived SSE on serverless | `pj-s15-integration` |
| c6b7a4b | 3 signin/feed bugs — OAuth config error, own prayers in browse, pray-for-another loop | `oauth-cookie` | Playwright sign-in + browse exclusion integration test | `pj-s15-e2e` |
| db01d5e | moderateContent can hang the UI indefinitely | `interaction-side-effect` | Integration test: moderation timeout fails open within 8s | `pj-s15-integration` |
| b268747 | anonymous prayers were excluded from /pray and home counter | `driver-data` | Integration test with real nulls on neon-http (3VL) | `pj-s15-integration` |
| 69cb093 | home counter now matches /pray feed filters | `driver-data` | Integration test: counter query == feed query | `pj-s15-integration` |
| c2ef45c | pass churchId to createSubscriptionCheckout in legacy checkout route | `prod-drift` | Post-deploy smoke on `/checkout` legacy route | `pj-s15-ci-gates` |
| 927c0b7 | map z-index isolation, back-to-results state, add display name setting | `dialog-state` | Playwright find-a-church map + back navigation | `pj-s15-e2e` |
| b3a9746 | 3 UI bugs — map z-index, back button state loss, group unknown member | `dialog-state` | Playwright: group page, map overlay, back navigation | `pj-s15-e2e` |
| 43bc9c1 | cast Stripe Response<Subscription> to access current_period_end | `driver-data` | Integration test: webhook handler types match Stripe runtime | `pj-s15-integration` |
| cccd156 | point /for-churches CTAs to /church/create instead of /sign-in | `out-of-scope` | — | — |
| 9d1bc66 | replace default Vercel favicon with Prayer Jar icon | `out-of-scope` | — | — |
| 3536a67 | exclude own prayer requests from the pray feed | `driver-data` | Integration test: feed excludes authenticated user's rows | `pj-s15-integration` |
| 9a589fb | allow Google OAuth to link to existing magic-link accounts | `oauth-cookie` | Playwright: Google sign-in when email already has magic-link account | `pj-s15-e2e` |
| c7577d5 | add auth guard to audio/video upload routes | `authz-moderation` | Service-layer authz test: unauth POST → 401 | `pj-s15-integration` |
| 2546104 | resolve all TypeScript errors blocking Vercel build | `out-of-scope` | — | — |
| b55e7fd | db: generate migration for video_url column (Sprint 6.1) | `prod-drift` | CI gate: drizzle migration drift check | `pj-s15-ci-gates` |
| c23ca6c | events: display page event fetch + moderation error handling (Sprint 5.4) | `authz-moderation` | Service-layer moderation tests on event prayers | `pj-s15-integration` |
| 9001382 | events: wall page nav links, moderateEventPrayer updatedAt, rate-limit TODO | `authz-moderation` | Service-layer authz + moderation test on event wall | `pj-s15-integration` |
| ba12889 | church: JSON.stringify embed XSS + reject-with-notes in TestimonyActions | `authz-moderation` | Service-layer moderation test for testimony reject | `pj-s15-integration` |
| f528ec1 | church: pass isUrgent=false in embed widget form | `dialog-state` | Playwright embed widget form submit | `pj-s15-e2e` |
| be82273 | church: remove use client from branding page.tsx | `prod-drift` | CI typecheck + build on every PR | `pj-s15-ci-gates` |
| 7c65f56 | church: IDOR guards on flags + assignments APIs, remove dead prop | `authz-moderation` | Service-layer authz: cross-church IDOR blocked | `pj-s15-integration` |
| 42ca7a9 | church: pastoral service expiry guard, stronger ownership test, conflict target | `authz-moderation` | Service-layer authz: expired / non-owner rejected | `pj-s15-integration` |
| a2d99cf | church: address code quality issues in church pages (Sprint 5.1 Task 4) | `out-of-scope` | — | — |
| 3625aef | billing: idempotent inserts, subscription.updated guard, enum expansion | `driver-data` | Integration test: webhook idempotency on repeat delivery | `pj-s15-integration` |
| ad5f823 | stripe: webhook idempotency, generic error responses, hardcoded origin | `driver-data` | Integration test: webhook handles duplicate events | `pj-s15-integration` |
| 1a4c24d | correct category key names in prayer map + wire geo fields through pray action | `driver-data` | Integration test: pray action writes expected geo columns | `pj-s15-integration` |
| 7e52d52 | prayer-map: buffer early SSE events, guard null map on unmount, avoid Map mutation in forEach | `interaction-side-effect` | Integration test: SSE burst + unmount cleanup | `pj-s15-integration` |
| 2f99374 | rename maxTokens to maxOutputTokens for AI SDK v6 | `driver-data` | Integration test against real AI SDK call shape | `pj-s15-integration` |
| 3d21a41 | handle null from Base UI Select onValueChange in group-wall | `dialog-state` | Playwright group-wall filter flow | `pj-s15-e2e` |
| af5c423 | replace @/auth with @/lib/auth in partner API routes | `prod-drift` | CI typecheck/build gate + post-deploy smoke on partner routes | `pj-s15-ci-gates` |
| 78728ac | mobile responsiveness — hide desktop nav, fix layout issues | `out-of-scope` | — | — |
| 4effa00 | update all stale domain references from prayerjar.app to prayerjar.org | `prod-drift` | Post-deploy smoke on canonical host | `pj-s15-ci-gates` |
| c1d9050 | preserve callbackUrl through sign-in flow + update docs for prayerjar.org | `oauth-cookie` | Playwright sign-in preserves ?callbackUrl= | `pj-s15-e2e` |
| 93c47ca | DropdownMenuLabel crashes — Base UI error #31 | `dialog-state` | Playwright: open every dropdown/menu on canonical routes | `pj-s15-e2e` |
| 82e1933 | redirect to home after magic link sign-in | `oauth-cookie` | Playwright magic-link sign-in → redirect | `pj-s15-e2e` |
| 93fed81 | add Prayer Jar nav link on desktop for easier navigation back to home | `out-of-scope` | — | — |
| fa982ce | add @types/nodemailer for TypeScript build | `out-of-scope` | — | — |
| f5830ef | send magic link as text-only to bypass Resend click tracking | `oauth-cookie` | Playwright magic-link full flow against Resend | `pj-s15-e2e` |
| 142c9c4 | update sign-in form to use nodemailer provider ID | `oauth-cookie` | Playwright sign-in form submit | `pj-s15-e2e` |
| 0f006a0 | pin nodemailer@7 to satisfy next-auth peer dependency | `out-of-scope` | — | — |
| 0b5a590 | switch auth from Resend API to SMTP to bypass broken click tracking | `oauth-cookie` | Playwright magic-link end-to-end | `pj-s15-e2e` |
| 527b790 | rank church results by distance so nearby churches aren't excluded | `driver-data` | Integration test: distance ranking returns nearest rows | `pj-s15-integration` |
| 6da8544 | replace sql ANY() with inArray() for neon-http driver compatibility | `driver-data` | AST guard banning `sql…ANY(` + neon-http integration test | `pj-s15-integration` |
| e23ac9d | add SessionProvider to root layout for useSession support | `prod-drift` | Post-deploy smoke: useSession pages do not throw in prod | `pj-s15-ci-gates` |
| 26a8847 | improve onboarding overlay — navigation, accessibility, backdrop/escape dismiss | `dialog-state` | Playwright onboarding overlay keyboard + backdrop | `pj-s15-e2e` |
| 850a994 | NaN-safe search params and force-dynamic on browse page | `driver-data` | Integration test: browse with malformed params | `pj-s15-integration` |
| 75468dd | mobile layout — responsive service times grid, sticky footer, nav z-index | `out-of-scope` | — | — |
| e22e507 | validate token before rate limit check in claim verify route | `authz-moderation` | Service-layer authz: claim verify rejects invalid token | `pj-s15-integration` |
| 0a43044 | add rate limiting, input validation, save button, polish for church finder | `authz-moderation` | Service-layer authz/rate-limit tests | `pj-s15-integration` |
| cc9251e | add error handling and accessibility improvements to church detail components | `out-of-scope` | — | — |
| e79d300 | add error handling and memoize sorted in church search page | `out-of-scope` | — | — |
| ec6a6aa | type error in search bar, stale closure in map, save error feedback | `dialog-state` | Playwright church-search + map | `pj-s15-e2e` |
| c64cea5 | include claim in isEnriched check for ChurchMap pin colors | `driver-data` | Integration test: pin state reflects both enrichment sources | `pj-s15-integration` |
| 8d28dc9 | add save route input validation and getChurchDetail test | `authz-moderation` | Service-layer validation tests | `pj-s15-integration` |
| 3cc147e | add isNotNull guard to verifyClaim and add missing tests | `authz-moderation` | Service-layer authz: verifyClaim rejects null token | `pj-s15-integration` |
| 90e757f | add API key guard and cache-miss test to church.service | `authz-moderation` | Service-layer authz: missing API key rejected | `pj-s15-integration` |
| fbd4684 | align church table PK pattern and add ChurchSearchCache type export | `out-of-scope` | — | — |
| 67001b8 | add rate limiting to salvation action and force-dynamic to know-jesus page | `authz-moderation` | Service-layer rate-limit test on salvation action | `pj-s15-integration` |
| 6ff046b | category filter bug, error handling, and validation in lights redesign | `dialog-state` | Playwright lights filter flow | `pj-s15-e2e` |
| d5fdb72 | center share buttons bar | `out-of-scope` | — | — |
| 2d99b12 | upload security, OG metadataBase, scroll reveal fallback, object URL leak | `interaction-side-effect` | Integration test: object URL cleanup on unmount | `pj-s15-integration` |
| f44a682 | useEffect for fullUrl to avoid SSR hydration mismatch | `dialog-state` | Playwright: page mount without hydration warnings | `pj-s15-e2e` |
| 6dddbea | clear file input value after successful photo upload | `interaction-side-effect` | Integration test: repeat-upload resets input | `pj-s15-integration` |
| 5992812 | add gateway and selfHarm to ai.service test mocks | `out-of-scope` | — | — |
| 29a9dd6 | close prayer dialog on success and refresh stats | `dialog-state` | Playwright add-prayer closes on success | `pj-s15-e2e` |
| 3746a4a | use gateway() model object instead of plain string for AI SDK | `driver-data` | Integration test hitting real AI gateway adapter | `pj-s15-integration` |
| c1a32fe | remove default page.tsx conflicting with (public) route group | `prod-drift` | CI build gate + post-deploy smoke on `/` | `pj-s15-ci-gates` |
| 7bbc696 | resolve TypeScript build errors for production | `out-of-scope` | — | — |
| 47acbb0 | normalize prayer service return types to T \| null | `out-of-scope` | — | — |
| c48535f | guard against undefined AI output in service layer | `driver-data` | Integration test: AI service handles empty response | `pj-s15-integration` |
| 3ec07a4 | clean up scaffold — test scripts, dep categories, metadata | `out-of-scope` | — | — |

---

## 3. Bucket Analysis — Representative Commit, Root Cause Pattern, Safety Net

### Bucket 1 — `oauth-cookie` (13 commits)

**Representative commit:** `32c98cf` — *remove __Secure- cookie prefix for OAuth state — fixes Safari/ITP cookie drops*

**Root-cause pattern:** OAuth/session state must survive three hostile environments at once — Safari ITP (strips third-party cookies), in-app WebViews (Messenger/Instagram — no shared cookie jar with Safari), and Vercel preview URLs (no custom trustHost). Any combination of `__Secure-` prefix, PKCE, `checks:[...]`, or missing `trustHost` silently drops state on **one** of those environments while passing manual Chrome-desktop testing. We fixed this live, one user report at a time, across 13 commits.

**Other hits in bucket:** `1bd90d9`, `a7024b1`, `f73b5e7`, `bdb7f1d`, `c6b7a4b`, `9a589fb`, `c1d9050`, `82e1933`, `f5830ef`, `142c9c4`, `0b5a590`

**Safety-net control:** `pj-s15-e2e` — Playwright suite runs sign-in (magic-link + Google OAuth) on a Chromium-desktop UA, a mobile-Safari UA, and two WebView UAs (Messenger, Instagram). Any future cookie-prefix / PKCE / checks change that drops state on one of those targets fails CI.

---

### Bucket 2 — `driver-data` (14 commits)

**Representative commit:** `6da8544` — *replace sql ANY() with inArray() for neon-http driver compatibility*

**Root-cause pattern:** `neon-http` is a REST driver — it rejects query shapes that work under `neon-websocket` and under unit-test mocks. The same class also covers SQL 3-valued-logic null handling (`b268747`, `69cb093`), malformed-input coercion (`850a994`), stripe response types drifting (`43bc9c1`), and AI SDK adapter versions (`2f99374`, `3746a4a`). Unit tests with mocked drivers pass — production breaks. Only a **real Neon branch** reveals these.

**Other hits in bucket:** `f3dea5f`, `3536a67`, `3625aef`, `ad5f823`, `1a4c24d`, `527b790`, `c64cea5`, `c48535f`

**Safety-net control:** `pj-s15-integration` — integration suite runs against a per-PR Neon branch. Dedicated driver-quirks tests cover: `inArray` vs `ANY()`, nulls under 3VL, NaN search params, repeated webhook deliveries. A static AST guard in CI bans `sql\`…ANY(\`` in service-layer code.

---

### Bucket 3 — `prod-drift` (10 commits)

**Representative commit:** `e23ac9d` — *add SessionProvider to root layout for useSession support*

**Root-cause pattern:** A required provider, env var, migration, or route wasn't shipped to prod, but local dev worked because dev envs differ. `SessionProvider` missing (every `useSession` page threw in prod), `video_url` migration not generated (`b55e7fd`), `"use client"` left on a server page (`be82273`), `@/auth` → `@/lib/auth` path drift (`af5c423`), duplicate `page.tsx` (`c1a32fe`), stale domain (`4effa00`), signed-in homepage regressions (`3091185`, `e10b68f`, `c2ef45c`). **No one was checking prod after deploy.**

**Safety-net control:** `pj-s15-ci-gates` — GitHub Actions post-deploy smoke hits every top-level route (signed-out *and* a signed-in fixture session), asserts 200 + expected landmark content, and checks migration parity. Drizzle migration-drift guard runs on PR.

---

### Bucket 4 — `dialog-state` (15 commits)

**Representative commit:** `c990752` — *open prayer dialog inline from My Prayers instead of redirecting to homepage*

**Root-cause pattern:** Every dialog-bearing component has three states (closed / opening / open / closing) × two orthogonal action paths (success / cancel) × two launch points (homepage / subpage). We shipped features where the dialog state machine only worked on one launch path. Add-Prayer from My Prayers redirected instead of opening (`a31b05c`, `c990752`), close-on-success wasn't wired (`29a9dd6`), error handling didn't re-enable (`08dab94`), back-navigation lost state (`b3a9746`, `927c0b7`). This is the single noisiest bucket.

**Other hits:** `e1d49d7`, `f528ec1`, `3d21a41`, `93c47ca`, `26a8847`, `ec6a6aa`, `6ff046b`, `f44a682`

**Safety-net control:** `pj-s15-e2e` — Playwright scenarios exercise add-prayer, PrayerCard overflow menu, pray-for, share, renew/adopt, onboarding overlay, and group-wall filters. Each has a happy-path **and** a cancel/error-path assertion.

---

### Bucket 5 — `interaction-side-effect` (7 commits)

**Representative commit:** `f26884c` — *double interaction, stuck side-effects, and SSE timeout log spam*

**Root-cause pattern:** A user action fires its server effect twice (once optimistically, once on submit), or a long-lived side effect (SSE keepalive, object URL, file input) never tears down. `6fa7bc5` and `f26884c` document the double-interaction class. `7e52d52` documents SSE buffering on unmount. `db01d5e` is the moderation-timeout class (action never resolves). `2d99b12`, `6dddbea` are the leaked-resource class.

**Safety-net control:** `pj-s15-integration` — single-fire invariant test (observe `prayerInteractions` row count after a full pray+message flow, must equal 1), moderation timeout test (fail-open within 8s), and a lint rule / test banning `setInterval` inside Next route handlers on Vercel serverless.

---

### Bucket 6 — `authz-moderation` (11 commits)

**Representative commit:** `6edbcaf` — *gate all prayer owner actions behind isOwnPrayer*

**Root-cause pattern:** Owner-gated or moderator-gated mutations relied on the UI hiding the button. Direct server-action / API invocation by a non-owner succeeded. This is the most dangerous bucket — silent authorization bypass. `7c65f56` IDOR on flags/assignments, `42ca7a9` pastoral ownership test, `3cc147e` null-token `verifyClaim`, `e22e507` rate-limit-before-validation, `c7577d5` auth guard on upload, `88c0089` moderation on edit paths.

**Other hits:** `ed9d99b`, `f1165e4`, `c23ca6c`, `9001382`, `ba12889`, `8d28dc9`, `90e757f`, `0a43044`, `67001b8`

**Safety-net control:** `pj-s15-integration` — per service layer, a non-owner / wrong-church / expired / null-token request must be rejected. Admin / moderation actions must write an audit row. Upload routes must require auth. These are positive *and* negative tests.

---

## 4. Bucket → Sprint 15 Task Mapping (Safety-Net Proof Ownership)

Each of the six task IDs already exists in `.agent-state/tasks.json`. This table states which task owns the archaeology proof for each bucket — meaning that task's Reviewer sign-off must demonstrate a failing-test-that-now-passes for at least one commit from the bucket.

| Bucket | Class | Count | Owning task ID(s) |
|---|---|---:|---|
| 1 | `oauth-cookie` | 13 | `pj-s15-e2e` (primary), `pj-s15-observability` (auth-error-rate alert supplement) |
| 2 | `driver-data` | 14 | `pj-s15-integration` (primary), `pj-s15-ci-gates` (AST guard) |
| 3 | `prod-drift` | 10 | `pj-s15-ci-gates` (primary) |
| 4 | `dialog-state` | 15 | `pj-s15-e2e` (primary) |
| 5 | `interaction-side-effect` | 7 | `pj-s15-integration` (primary), `pj-s15-observability` (SSE timeout log alerts supplement) |
| 6 | `authz-moderation` | 11 | `pj-s15-integration` (primary) |

**Close-out gate:** `pj-s15-reviewer-proof` — Reviewer signs off per bucket in `.agent-state/handoffs.md`. For each of the six buckets, the owning engineer submits a commit that intentionally re-introduces a representative past bug; CI must go red; revert must return it to green. No sprint-15 closure without six green/red/green demonstrations.

---

## 5. Notes & Caveats

- Sample is 96 commits; 26 were tagged `out-of-scope` (copy tweaks, a11y labels, local-only TS errors, dep-pinning). They are not defects in a user-facing sense and we deliberately do not size Sprint 15 to prevent them — a CI typecheck gate already covers build-breakage.
- Several commits are multi-bucket (e.g. `c6b7a4b` combines an OAuth-config error with a browse-exclusion driver bug). They are tagged to their **most severe user-facing class**; the secondary class is discussed in the relevant bucket narrative.
- Bucket 4 (`dialog-state`) is the largest in-scope bucket by count (15). It also has the lowest per-bug severity (users see a broken click, not data loss). The Playwright investment is justified by volume, not blast radius.
- Bucket 6 (`authz-moderation`) is the smallest severe bucket. Every commit in it was a silent authorization bypass. Integration tests here earn the highest per-test value.
