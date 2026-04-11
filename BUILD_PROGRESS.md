# Prayer Jar — Build Progress

## Live URL
https://prayerjar.org (also accessible at prayer-jar.vercel.app)

## GitHub
https://github.com/ron-pineda/PrayerJar (branch: `feature/prayer-jar`)

## Worktree Path
`D:\Claude\ProjectJesus\.worktrees\feature\prayer-jar`

---

## Stack
- **Framework**: Next.js 16.2.2 (App Router, `proxy.ts` for auth middleware)
- **Database**: Neon Postgres (serverless) + Drizzle ORM
- **Auth**: NextAuth v5 + DrizzleAdapter + Resend magic link
- **AI**: Vercel AI SDK v6 — `gateway('anthropic/claude-haiku-4.5')` via Vercel AI Gateway
- **Email**: Resend + React Email
- **UI**: shadcn/ui with **Base UI** backend (`@base-ui/react/*`) — uses `render` prop, NOT `asChild`
- **Styling**: Tailwind CSS v4, solemn dark/light theme via `next-themes`
- **Testing**: Vitest + React Testing Library (10 tests passing)
- **Deploy**: Vercel (production), Neon (database)

---

## Completed Features (All 19 Tasks)

### Core
- [x] Prayer submission with AI moderation + categorization (Haiku 4.5)
- [x] Anonymous or named submissions
- [x] Rate limiting (DB-backed: 5 prayers/hr, 20 prays/hr, 10 messages/hr)
- [x] Prayer expiry (30-day auto-expire, daily cron job)

### Prayer Flow
- [x] Guided prayer UI — shows random prayer by category with scripture verse
- [x] Leave encouragement messages (anonymous or named)
- [x] Crisis resources shown when self-harm detected

### Community
- [x] Praise Wall — answered prayer testimonies, filterable by category
- [x] Share links (`/p/[id]`) for individual prayers
- [x] Prayer count tracking

### User Dashboard (requires sign-in)
- [x] My Prayers — view active/answered/expired, mark answered, renew, add testimony
- [x] Journal — private prayer notes
- [x] Badges — 13 badge types (Intercessor bronze/silver/gold, Encourager, Faithful, Devoted, Witness, Testimony)
- [x] Streaks — daily prayer streak tracking
- [x] Notifications — in-app bell + email notifications
- [x] Settings — email frequency preference (off/realtime/daily/weekly)

### Admin
- [x] Moderation queue (`/admin/queue`) — approve/reject reported content
- [x] Protected by `ADMIN_EMAILS` env var

### API
- [x] v1 REST API (`/api/v1/prayers`, `/api/v1/prayers/[id]`, `/api/v1/prayers/random`, `/api/v1/prayers/[id]/pray`, `/api/v1/prayers/[id]/report`, `/api/v1/badges`, `/api/v1/notifications`)

### Design
- [x] Solemn dark mode (deep charcoal + warm amber accent)
- [x] Light mode (warm parchment)
- [x] Sun/moon theme toggle in nav bar
- [x] Default: dark mode

---

## Key Technical Notes

### Next.js 16 Breaking Changes (already fixed)
- `params`/`searchParams` are `Promise<T>` — must `await` in Server Components, use `React.use()` in Client Components
- `headers()` returns a `Promise` — must `await`
- `middleware.ts` → `proxy.ts` for route protection
- Form `action` handlers must return `Promise<void>` (not objects)

### Base UI vs Radix UI
The shadcn installation uses `@base-ui/react` (NOT Radix). Key difference:
- ❌ `<Button asChild><Link /></Button>` — does NOT work
- ✅ `<Button render={<Link href="/" />}>Text</Button>` — correct pattern

### Zod v4
- `.errors[0]` → `.issues[0]` (renamed in Zod v4)

### AI SDK v6
- Use `gateway('anthropic/claude-haiku-4.5')` — NOT a plain string
- `generateText` with `Output.object({ schema })` for structured output
- Result accessed as `result.output`

### DB Connection
- `src/db/index.ts` has fallback URL for build-time (`postgresql://user:password@localhost/dbname`)
- Real `DATABASE_URL` must be set in Vercel env vars

---

## Environment Variables (Vercel Production)
| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon connection string |
| `NEXTAUTH_SECRET` | Random base64 string |
| `AUTH_RESEND_KEY` | Resend API key (`re_...`) |
| `AUTH_EMAIL_FROM` | `Prayer Jar <noreply@prayerjar.org>` |
| `ADMIN_EMAILS` | `ronnel.pineda@gmail.com` |

---

## Known / Pending
- [x] ~~Custom email domain~~ — prayerjar.org configured in Resend (click tracking disabled), DNS verified
- [x] ~~Auto-deploy~~ — GitHub Actions workflow deploys on push to `feature/prayer-jar`
- [ ] `.env.local` on local machine has real credentials (do not commit)
- [ ] `ADMIN_EMAILS` only supports a single email (comma-separation not yet implemented)
- [ ] Resend domain verification may still be pending — test sign-in email sender address
