# Church Admin Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent left-sidebar to all church admin pages so every tier of admin can reach any tool, fixing the broken free-tier workflow where `/dashboard` gating stranded admins with no path to the invite link.

**Architecture:** A new `(admin)` route group at `[slug]/(admin)/` wraps all admin pages and renders a sidebar via its layout. The sidebar sticks below the global PrayerJar header using `sticky top-14`. Full-screen event tools (`display`, `wall`, `moderation`, `report`) live outside `(admin)/` under a bare `events/[eventId]/layout.tsx`. `(church)/layout.tsx` is stripped to `{children}` — member-facing pages rely on the global root layout header.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, NextAuth v5 (`auth()` React-cached), DrizzleORM, `React.cache()` for service deduplication.

---

## File Map

### New files
```
src/app/(church)/church/[slug]/layout.tsx                         bare pass-through
src/app/(church)/church/[slug]/(admin)/layout.tsx                 fetches auth+church+tier, renders sidebar shell
src/app/(church)/church/[slug]/(admin)/ChurchSidebar.tsx          server component — sidebar markup + nav items
src/app/(church)/church/[slug]/(admin)/NavItem.tsx                'use client' — active state, lock callout
src/app/(church)/church/[slug]/(admin)/SidebarDrawer.tsx          'use client' — mobile drawer
src/app/(church)/church/[slug]/events/[eventId]/layout.tsx        bare {children}, no sidebar
```

### Modified files
```
src/app/(church)/layout.tsx                                       strip to bare {children}
src/services/church-platform.service.ts                           add React.cache to getChurchBySlug + getChurchTier
```

### Moved into (admin)/ route group (URLs unchanged)
```
[slug]/dashboard/           → [slug]/(admin)/dashboard/
[slug]/settings/            → [slug]/(admin)/settings/
[slug]/events/page.tsx      → [slug]/(admin)/events/page.tsx
[slug]/events/setup/        → [slug]/(admin)/events/setup/
[slug]/admin/               → [slug]/(admin)/admin/
[slug]/setup/page.tsx       → [slug]/(admin)/setup/page.tsx
```

### Stays outside (admin)/ — no sidebar
```
[slug]/wall/page.tsx        member-facing prayer wall
[slug]/groups/page.tsx      member-facing groups list
[slug]/events/[eventId]/display/     full-screen projection
[slug]/events/[eventId]/wall/        full-screen projection
[slug]/events/[eventId]/moderation/  full-screen moderator console
[slug]/events/[eventId]/report/      event report
```

---

## Task 1: Add React.cache to getChurchBySlug and getChurchTier

**Files:**
- Modify: `src/services/church-platform.service.ts`

The `(admin)/layout.tsx` will call these functions, and individual pages call them too. `React.cache()` ensures they deduplicate within a single render pass — no extra DB round-trips.

- [ ] **Step 1: Open church-platform.service.ts and check the top imports**

```bash
head -10 src/services/church-platform.service.ts
```

Confirm `React` or `cache` is not already imported.

- [ ] **Step 2: Add the cache import at the top of the file**

In `src/services/church-platform.service.ts`, add after the existing imports (line 8 area):

```ts
import { cache } from 'react';
```

- [ ] **Step 3: Wrap getChurchTier with cache**

Find `export async function getChurchTier(churchId: string)` (line 25) and replace:

```ts
export const getChurchTier = cache(async function getChurchTier(churchId: string): Promise<PlanTier> {
  const [row] = await db
    .select({ tier: subscriptions.tier, status: subscriptions.status })
    .from(churches)
    .leftJoin(subscriptions, eq(subscriptions.id, churches.subscriptionId))
    .where(eq(churches.id, churchId))
    .limit(1);

  if (row?.tier && row.status === 'active') return row.tier as PlanTier;
  return 'free';
});
```

- [ ] **Step 4: Wrap getChurchBySlug with cache**

Find `export async function getChurchBySlug(slug: string)` (line 119) and replace:

```ts
export const getChurchBySlug = cache(async function getChurchBySlug(slug: string): Promise<Church | null> {
  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);
  return church ?? null;
});
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors related to these two functions.

- [ ] **Step 6: Commit**

```bash
git add src/services/church-platform.service.ts
git commit -m "perf(church): wrap getChurchBySlug + getChurchTier in React.cache"
```

---

## Task 2: Strip (church)/layout.tsx to bare wrapper

**Files:**
- Modify: `src/app/(church)/layout.tsx`

The sidebar absorbs all admin chrome. Member-facing pages (`/wall`, `/groups`) keep navigation via the global root layout header and their own in-page back links. The `error.tsx` at `(church)/` level is untouched.

- [ ] **Step 1: Replace the entire file**

`src/app/(church)/layout.tsx`:

```tsx
export default function ChurchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(church\)/layout.tsx
git commit -m "refactor(church): strip (church)/layout.tsx to bare wrapper — chrome moves to sidebar"
```

---

## Task 3: Create [slug]/layout.tsx bare pass-through

**Files:**
- Create: `src/app/(church)/church/[slug]/layout.tsx`

This layout sits between `(church)/` and `(admin)/`. It does no fetching, renders no chrome. Its only job is to exist so Next.js can resolve the `[slug]` segment for child layouts.

- [ ] **Step 1: Create the file**

`src/app/(church)/church/[slug]/layout.tsx`:

```tsx
export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(church)/church/[slug]/layout.tsx"
git commit -m "feat(church): add bare [slug]/layout.tsx segment layout"
```

---

## Task 4: Create NavItem client component

**Files:**
- Create: `src/app/(church)/church/[slug]/(admin)/NavItem.tsx`

This is the only interactive piece of the sidebar. It uses `usePathname()` for active state and manages the inline lock callout with local `useState`. The layout and `ChurchSidebar` stay server-rendered.

- [ ] **Step 1: Create the file**

`src/app/(church)/church/[slug]/(admin)/NavItem.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItemProps {
  href: string;
  label: string;
  locked: boolean;
  tierName: string; // e.g. "Small Church" — shown in upgrade callout
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 opacity-40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function NavItem({ href, label, locked, tierName }: NavItemProps) {
  const pathname = usePathname();
  const [showCallout, setShowCallout] = useState(false);

  const isActive =
    pathname === href ||
    (href.length > 1 && pathname.startsWith(href + '/'));

  if (locked) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowCallout((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors text-muted-foreground hover:bg-muted/50"
        >
          <span>{label}</span>
          <LockIcon />
        </button>
        {showCallout && (
          <div className="mx-2 mb-1 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="mb-2">
              Available on the{' '}
              <span className="font-medium text-foreground">{tierName}</span> plan.
            </p>
            <Link
              href="/billing"
              className="text-primary hover:underline"
              onClick={() => setShowCallout(false)}
            >
              View plans →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-muted/50'
      }`}
    >
      {label}
    </Link>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(church)/church/[slug]/(admin)/NavItem.tsx"
git commit -m "feat(church): add NavItem client component with active state and lock callout"
```

---

## Task 5: Create SidebarDrawer client component

**Files:**
- Create: `src/app/(church)/church/[slug]/(admin)/SidebarDrawer.tsx`

Renders a sticky mini-bar (hamburger button) below the global header on mobile. Opens a full-height drawer overlay. Closes automatically when `usePathname()` changes (navigation happened).

- [ ] **Step 1: Create the file**

`src/app/(church)/church/[slug]/(admin)/SidebarDrawer.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarDrawerProps {
  churchName: string;
  children: React.ReactNode; // sidebar content rendered by ChurchSidebar (server)
}

function HamburgerIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function SidebarDrawer({ churchName, children }: SidebarDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      {/* Sticky mini-bar below global header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b bg-background px-4 h-11">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Open navigation menu"
        >
          <HamburgerIcon />
        </button>
        <span className="text-sm font-medium truncate">{churchName}</span>
      </div>

      {/* Drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(church)/church/[slug]/(admin)/SidebarDrawer.tsx"
git commit -m "feat(church): add SidebarDrawer client component for mobile nav"
```

---

## Task 6: Create ChurchSidebar server component

**Files:**
- Create: `src/app/(church)/church/[slug]/(admin)/ChurchSidebar.tsx`

Server component that builds the nav item list based on tier and renders:
- Desktop: a sticky left rail (hidden on mobile)
- Mobile: passes content into `SidebarDrawer`

**Critical:** Prayer Team item has `minTier: 'free'` — it is NEVER locked, regardless of plan. This is the core fix for the broken workflow.

- [ ] **Step 1: Create the file**

`src/app/(church)/church/[slug]/(admin)/ChurchSidebar.tsx`:

```tsx
import Link from 'next/link';
import { NavItem } from './NavItem';
import { SidebarDrawer } from './SidebarDrawer';
import { PLANS, TIER_RANK } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

interface Props {
  slug: string;
  churchName: string;
  tier: PlanTier;
  userName: string | null;
}

// null entries render as dividers
const NAV_ITEMS: Array<{
  label: string;
  hrefFn: (slug: string) => string;
  minTier: PlanTier;
} | null> = [
  { label: 'Prayer Wall',      hrefFn: (s) => `/church/${s}/wall`,                  minTier: 'free'     },
  { label: 'Prayer Team',      hrefFn: (s) => `/church/${s}/dashboard/team`,         minTier: 'free'     },
  { label: 'Events',           hrefFn: (s) => `/church/${s}/events`,                 minTier: 'free'     },
  null,
  { label: 'Dashboard',        hrefFn: (s) => `/church/${s}/dashboard`,              minTier: 'starter'  },
  { label: 'Care Inbox',       hrefFn: (s) => `/church/${s}/dashboard/care`,         minTier: 'starter'  },
  { label: 'Flagged Prayers',  hrefFn: (s) => `/church/${s}/dashboard/flagged`,      minTier: 'starter'  },
  null,
  { label: 'Analytics',        hrefFn: (s) => `/church/${s}/dashboard/analytics`,   minTier: 'pro'      },
  { label: 'Branding',         hrefFn: (s) => `/church/${s}/dashboard/branding`,    minTier: 'pro'      },
  { label: 'Testimony Queue',  hrefFn: (s) => `/church/${s}/dashboard/testimony`,   minTier: 'pro'      },
  null,
  { label: 'Settings',         hrefFn: (s) => `/church/${s}/settings`,              minTier: 'free'     },
];

function churchInitialColor(name: string): string {
  const palette = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
  ];
  return palette[name.charCodeAt(0) % palette.length];
}

function SidebarContent({ slug, churchName, tier, userName }: Props) {
  return (
    <div className="flex h-full w-60 flex-col bg-card border-r">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b px-4 py-4 min-w-0">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${churchInitialColor(churchName)}`}
          aria-hidden="true"
        >
          {churchName[0].toUpperCase()}
        </div>
        <span className="truncate text-sm font-semibold">{churchName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Church admin navigation">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item, i) =>
            item === null ? (
              <div key={i} className="my-1 border-t" role="separator" />
            ) : (
              <NavItem
                key={item.hrefFn(slug)}
                href={item.hrefFn(slug)}
                label={item.label}
                locked={TIER_RANK[tier] < TIER_RANK[item.minTier]}
                tierName={PLANS[item.minTier].name}
              />
            )
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-4 text-xs text-muted-foreground flex flex-col gap-1">
        {userName && (
          <p className="truncate text-sm font-medium text-foreground">{userName}</p>
        )}
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to PrayerJar
        </Link>
      </div>
    </div>
  );
}

export function ChurchSidebar({ slug, churchName, tier, userName }: Props) {
  const content = <SidebarContent slug={slug} churchName={churchName} tier={tier} userName={userName} />;

  return (
    <>
      {/* Desktop: sticky left rail below global header */}
      <aside
        className="hidden lg:flex shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] self-start"
        aria-label="Church admin sidebar"
      >
        {content}
      </aside>

      {/* Mobile: drawer trigger + overlay */}
      <SidebarDrawer churchName={churchName}>
        {content}
      </SidebarDrawer>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(church)/church/[slug]/(admin)/ChurchSidebar.tsx"
git commit -m "feat(church): add ChurchSidebar server component"
```

---

## Task 7: Create (admin)/layout.tsx

**Files:**
- Create: `src/app/(church)/church/[slug]/(admin)/layout.tsx`

Fetches session, church, and tier. Renders the two-column shell (sidebar + main content). Does NOT redirect or gate — tier-gating stays on individual pages.

- [ ] **Step 1: Create the file**

`src/app/(church)/church/[slug]/(admin)/layout.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchTier } from '@/services/church-platform.service';
import { ChurchSidebar } from './ChurchSidebar';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { slug } = await params;

  // auth() is request-scoped cached by NextAuth v5.
  // getChurchBySlug and getChurchTier are wrapped in React.cache — they
  // deduplicate with calls made by individual pages in the same render.
  const [session, church] = await Promise.all([
    auth(),
    getChurchBySlug(slug),
  ]);

  if (!church) notFound();

  const tier = await getChurchTier(church.id);
  const userName = session?.user?.name ?? session?.user?.email ?? null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <ChurchSidebar
        slug={slug}
        churchName={church.name}
        tier={tier}
        userName={userName}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(church)/church/[slug]/(admin)/layout.tsx"
git commit -m "feat(church): add (admin)/layout.tsx with sidebar shell"
```

---

## Task 8: Create events/[eventId]/layout.tsx (bare, no sidebar)

**Files:**
- Create: `src/app/(church)/church/[slug]/events/[eventId]/layout.tsx`

Full-screen event tools (display, wall, moderation, report) must render without any sidebar. This bare layout prevents the `(admin)` layout from wrapping them.

Note: `events/[eventId]/` lives OUTSIDE `(admin)/` in the file tree, so this layout only needs to exist to avoid any accidental layout inheritance. Since these pages are outside `(admin)/`, they don't inherit the sidebar anyway — but creating this layout makes the intent explicit and protects against future restructuring.

- [ ] **Step 1: Create the file**

`src/app/(church)/church/[slug]/events/[eventId]/layout.tsx`:

```tsx
export default function EventToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(church)/church/[slug]/events/[eventId]/layout.tsx"
git commit -m "feat(church): add bare event tool layout to exclude sidebar from display/wall/moderation"
```

---

## Task 9: Move admin pages into (admin)/ route group

**Files:** All admin page directories moved — URLs unchanged because route groups don't affect URLs.

Move each directory using `git mv` so git preserves history. Do this in one batch and verify types after.

- [ ] **Step 1: Create the (admin)/ directory structure and move pages**

Run these commands from the project root. Each `git mv` moves one directory:

```bash
# Create the (admin)/ directory
mkdir -p "src/app/(church)/church/[slug]/(admin)"

# Move dashboard and all its subdirectories
git mv "src/app/(church)/church/[slug]/dashboard" "src/app/(church)/church/[slug]/(admin)/dashboard"

# Move settings directory
git mv "src/app/(church)/church/[slug]/settings" "src/app/(church)/church/[slug]/(admin)/settings"

# Move events list and setup (NOT events/[eventId]/ — that stays outside)
mkdir -p "src/app/(church)/church/[slug]/(admin)/events"
git mv "src/app/(church)/church/[slug]/events/page.tsx" "src/app/(church)/church/[slug]/(admin)/events/page.tsx"
git mv "src/app/(church)/church/[slug]/events/setup" "src/app/(church)/church/[slug]/(admin)/events/setup"

# Move admin/audit
git mv "src/app/(church)/church/[slug]/admin" "src/app/(church)/church/[slug]/(admin)/admin"

# Move setup wizard
git mv "src/app/(church)/church/[slug]/setup" "src/app/(church)/church/[slug]/(admin)/setup"
```

- [ ] **Step 2: Verify the events/[eventId]/ routes are still outside (admin)/**

```bash
ls "src/app/(church)/church/[slug]/events/"
```

Expected output includes `[eventId]/` directory and the newly-created bare `layout.tsx`. The `page.tsx` and `setup/` should be gone (moved to `(admin)/events/`).

- [ ] **Step 3: Update any hardcoded import paths broken by the move**

Check for broken imports in the moved files. The moved pages use relative imports for client components (e.g., `./FlagActions`, `./AssignPrayerForm`). Since we moved entire directories, relative imports should be intact. Verify:

```bash
npx tsc --noEmit 2>&1 | grep "Cannot find module" | head -20
```

If any "Cannot find module" errors appear, they indicate a relative import path that broke. Fix by adjusting the import path. Most likely culprit: any file that imported from `@/app/...` using an absolute path — check and update.

- [ ] **Step 4: Fix any broken "Back to" links in moved pages**

The moved pages have links like `href={\`/church/${slug}/settings\`}` and `href={\`/church/${slug}/dashboard\`}`. These are URL strings, not file imports, so they are unaffected by the route group move. No changes needed.

- [ ] **Step 5: Full type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If errors remain, fix them before committing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(church): move admin pages into (admin)/ route group — URLs unchanged"
```

---

## Task 10: Push and verify on Vercel

- [ ] **Step 1: Push to trigger a Vercel preview deploy**

```bash
git push
```

Wait for the Vercel deployment to complete (check Vercel dashboard or wait ~2 minutes).

- [ ] **Step 2: QA Check 1 — Auth redirect with callbackUrl**

With a free-tier church account, sign out. Open each admin URL directly:
- `/church/[slug]/dashboard/team`
- `/church/[slug]/dashboard`
- `/church/[slug]/settings`

Expected: browser redirects to `/sign-in?callbackUrl=/church/[slug]/<page>`. The `?callbackUrl=` query param must be present.
Failure mode: redirected to `/sign-in` with no callbackUrl — check that the `(admin)/layout.tsx` is NOT adding any redirect logic.

- [ ] **Step 3: QA Check 2 — Free tier can reach Prayer Team**

Sign in with a free-tier church admin account. Navigate to any admin page.

Expected: sidebar is visible. "Prayer Team" item has NO lock badge. Clicking it loads the invite page.
Failure mode: Prayer Team shows a lock icon — check `ChurchSidebar.tsx` NAV_ITEMS and confirm `minTier: 'free'` for Prayer Team.

- [ ] **Step 4: QA Check 3 — Tier gates still enforce on paid pages**

With free-tier account, click "Dashboard" in the sidebar (which has a lock badge).

Expected: inline upgrade callout appears in the sidebar ("Available on Small Church plan. View plans →"). 
Then navigate directly to `/church/[slug]/dashboard`.
Expected: full-page paywall (the page-level gate still works).

- [ ] **Step 5: QA Check 4 — Full-screen event routes have no sidebar**

Navigate to `/church/[slug]/events/[eventId]/display`.

Expected: NO sidebar, NO hamburger bar. Full-screen layout only.
Check the same for `/wall` and `/moderation` event routes.

- [ ] **Step 6: QA Check 5 — URLs are unchanged**

For each moved page, confirm the browser URL has no `(admin)` segment:
- `/church/[slug]/dashboard` ✓ (not `/church/[slug]/(admin)/dashboard`)
- `/church/[slug]/settings` ✓
- `/church/[slug]/events` ✓
- `/church/[slug]/admin/audit` ✓

- [ ] **Step 7: QA Check 6 — Back to PrayerJar link**

From any admin page, click "← Back to PrayerJar" in the sidebar footer.

Expected: navigates to `/` (PrayerJar home). Not a 404.

- [ ] **Step 8: QA Check 7 — Lock badges on paid items, not on free items**

With free-tier account, inspect sidebar:
- "Prayer Wall", "Prayer Team", "Events", "Settings" — no lock icon
- "Dashboard", "Care Inbox", "Flagged Prayers" — lock icon present
- "Analytics", "Branding", "Testimony Queue" — lock icon present

- [ ] **Step 9: QA Check 8 — Active state highlights current page**

Navigate between sidebar items. Confirm the current page's nav item is highlighted (primary color background). Confirm navigating away removes the highlight from the previous item.

- [ ] **Step 10: Mobile drawer**

On a mobile viewport (or DevTools mobile emulation):
- Admin pages show a hamburger bar below the global PrayerJar header
- Tapping hamburger opens full-height drawer with sidebar content
- Tapping a nav item closes the drawer and navigates correctly
- Tapping the backdrop closes the drawer without navigating
