# Church Admin Sidebar Navigation — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent left-sidebar navigation to the church admin section so all admin tools are reachable regardless of plan tier, fixing the broken free-tier workflow where admins had no path to the invite link after landing on the /dashboard paywall.

**Architecture:** Route-group-based layout composition. A new `(admin)` route group at `[slug]/(admin)/` wraps all pages that need the sidebar. Full-screen event tools (`display`, `wall`, `moderation`, `report`) live outside `(admin)/` under their own bare layout. The `(church)/layout.tsx` shell is stripped to a bare wrapper; all chrome moves into the sidebar.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, NextAuth v5 (auth() React-cached), DrizzleORM, React.cache for service calls.

---

## Problem Being Solved

Free-tier church admins receive a welcome drip email with a CTA to `/church/[slug]/dashboard/team` (the invite members page). Once inside the app there is no navigation path back to that page:
- `/dashboard` shows a full-page paywall for free users (gated at starter tier)
- The Quick Navigation links inside `/dashboard` are therefore unreachable
- No sidebar or persistent nav exists in the church admin section

The sidebar makes every tool directly reachable from any admin page, with paid tools locked-but-visible so free admins know what exists.

---

## File Structure Changes

### New files to create
```
src/app/(church)/church/[slug]/layout.tsx                  ← bare pass-through
src/app/(church)/church/[slug]/(admin)/layout.tsx          ← sidebar shell
src/app/(church)/church/[slug]/(admin)/ChurchSidebar.tsx   ← server component
src/app/(church)/church/[slug]/(admin)/NavItem.tsx         ← 'use client', usePathname
src/app/(church)/church/[slug]/(admin)/SidebarDrawer.tsx   ← 'use client', mobile drawer
src/app/(church)/church/[slug]/events/[eventId]/layout.tsx ← bare, no sidebar
```

### Files to move into `(admin)/` route group
Route groups use parentheses and do NOT affect URLs. All existing page URLs remain identical.

| Current path | New path |
|---|---|
| `[slug]/dashboard/page.tsx` | `[slug]/(admin)/dashboard/page.tsx` |
| `[slug]/dashboard/analytics/` | `[slug]/(admin)/dashboard/analytics/` |
| `[slug]/dashboard/branding/` | `[slug]/(admin)/dashboard/branding/` |
| `[slug]/dashboard/care/` | `[slug]/(admin)/dashboard/care/` |
| `[slug]/dashboard/flagged/` | `[slug]/(admin)/dashboard/flagged/` |
| `[slug]/dashboard/groups/` | `[slug]/(admin)/dashboard/groups/` |
| `[slug]/dashboard/team/` | `[slug]/(admin)/dashboard/team/` |
| `[slug]/dashboard/testimony/` | `[slug]/(admin)/dashboard/testimony/` |
| `[slug]/events/page.tsx` | `[slug]/(admin)/events/page.tsx` |
| `[slug]/events/setup/page.tsx` | `[slug]/(admin)/events/setup/page.tsx` |
| `[slug]/settings/page.tsx` | `[slug]/(admin)/settings/page.tsx` |
| `[slug]/settings/integrations/` | `[slug]/(admin)/settings/integrations/` |
| `[slug]/settings/nonprofit/` | `[slug]/(admin)/settings/nonprofit/` |
| `[slug]/admin/audit/` | `[slug]/(admin)/admin/audit/` |
| `[slug]/setup/page.tsx` | `[slug]/(admin)/setup/page.tsx` |
| `[slug]/groups/page.tsx` | `[slug]/(admin)/groups/page.tsx` |

### Files that stay OUTSIDE `(admin)/` (no sidebar)
```
[slug]/wall/page.tsx                       ← public prayer wall
[slug]/events/[eventId]/display/page.tsx   ← full-screen projection
[slug]/events/[eventId]/wall/page.tsx      ← full-screen projection
[slug]/events/[eventId]/moderation/page.tsx ← full-screen moderator console
[slug]/events/[eventId]/report/page.tsx    ← event report
```

### Files to modify
- `src/app/(church)/layout.tsx` — strip to bare wrapper (remove header/nav entirely)

---

## Layout Hierarchy

```
(church)/layout.tsx                    → bare <>{children}</>
  └─ church/[slug]/layout.tsx          → bare pass-through (no auth fetch here)
       ├─ (admin)/layout.tsx           → fetches auth + church + tier, renders sidebar shell
       │    └─ (admin pages)
       └─ events/[eventId]/layout.tsx  → bare <>{children}</> (no sidebar)
            └─ (event tool pages)
```

**Key rule: tier-gating stays at page level only.** The `(admin)/layout.tsx` does NOT redirect or block any route — it only provides the sidebar chrome. Individual pages remain responsible for their own access checks.

---

## Data Fetching in `(admin)/layout.tsx`

```ts
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchTier } from '@/services/church-platform.service';

// auth() is request-scoped cached by NextAuth v5
// getChurchBySlug must be wrapped in React.cache() in church-platform.service.ts
// getChurchTier must be wrapped in React.cache() in church-platform.service.ts
// Both deduplicate with calls made by individual pages in the same render

const session = await auth();
const church = await getChurchBySlug(slug);   // null-safe: redirect to notFound if missing
const tier = await getChurchTier(church.id);
```

Do NOT fetch flag counts, inbox counts, assignment counts, or any page-specific data in the layout.

---

## Sidebar Design

### Layout structure
```
flex flex-row h-screen overflow-hidden    ← outer wrapper (replaces min-h-screen flex-col)
├── aside (sidebar)                       ← w-60 (240px) h-full flex flex-col, hidden on mobile
│   ├── header                            ← church name, maybe CSS initial circle
│   ├── nav                               ← flex flex-col gap-1, overflow-y-auto flex-1
│   └── footer                            ← user name, ← Back to PrayerJar
└── main                                  ← flex-1 overflow-y-auto
```

### Nav items and tier requirements

| Item | Path | Tier | Lock badge |
|---|---|---|---|
| Prayer Wall | `/church/[slug]/wall` | free | none |
| Prayer Team | `/church/[slug]/dashboard/team` | free | **none** (invite link is free) |
| Events | `/church/[slug]/events` | free | none |
| — divider — | | | |
| Dashboard | `/church/[slug]/dashboard` | starter | 🔒 |
| Care Inbox | `/church/[slug]/dashboard/care` | starter | 🔒 |
| Flagged Prayers | `/church/[slug]/dashboard/flagged` | starter | 🔒 |
| — divider — | | | |
| Analytics | `/church/[slug]/dashboard/analytics` | pro | 🔒 |
| Branding | `/church/[slug]/dashboard/branding` | pro | 🔒 |
| Testimony Queue | `/church/[slug]/dashboard/testimony` | pro | 🔒 |
| — divider — | | | |
| Settings | `/church/[slug]/settings` | free | none |

Admin-only items (role === 'admin' only, shown conditionally):
| Audit Log | `/church/[slug]/admin/audit` | starter | 🔒 |

**Critical:** Prayer Team has NO lock badge. A free-tier admin must be able to click straight to the invite page from the sidebar — that's the primary workflow this entire feature exists to fix.

### Locked item behavior
Locked items are fully clickable (not disabled). Clicking a locked item opens a small inline callout **within the sidebar** replacing the nav area temporarily:

```
┌─────────────────────────┐
│ Care Inbox              │
│ ─────────────────────── │
│ Available on            │
│ Small Church plan.      │
│ [View plans] [×]        │
└─────────────────────────┘
```

Do NOT redirect to `/billing` on click. The callout keeps the admin in context. "View plans" links to `/billing`.

### Active state
`NavItem` is a `'use client'` component using `usePathname()`. It applies active styles when the current path starts with the item's href. The sidebar layout itself stays server-rendered.

```tsx
'use client';
import { usePathname } from 'next/navigation';

export function NavItem({ href, label, locked, tierName }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  // ...
}
```

### Church initial circle (optional, no upload needed)
Generate a background color from the church name (simple hash → pick from a palette of 6–8 muted colors). Render the first letter of the church name in a small circle (`h-8 w-8`). CSS-only, no image upload required.

---

## Mobile Behavior

On `< lg` breakpoints the sidebar is hidden. A hamburger button (`☰`) appears in a minimal top bar (replaces the removed `(church)/layout.tsx` header). Clicking opens a full-height drawer overlay.

Drawer closes when:
1. User clicks the backdrop
2. `usePathname()` changes (close via `useEffect` watching pathname — not on click, because pathname changes after navigation resolves)

```tsx
useEffect(() => {
  setOpen(false);
}, [pathname]);
```

On `lg:` breakpoints the drawer becomes a pinned left rail (sidebar always visible, no hamburger).

---

## `(church)/layout.tsx` Change

**Before:**
```tsx
export default async function ChurchLayout({ children }) {
  const session = await auth();
  // header with logo, username, Back to PrayerJar...
}
```

**After:**
```tsx
export default function ChurchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

The `error.tsx` at `(church)/` level stays in place — it is not moved.

---

## `getChurchBySlug` and `getChurchTier` Caching

Both functions must be wrapped in `React.cache()` in `church-platform.service.ts` before the layout uses them. This ensures the layout's fetch deduplicates with the same call made by individual pages during the same render pass.

```ts
import { cache } from 'react';

export const getChurchBySlug = cache(async (slug: string) => {
  // existing implementation
});

export const getChurchTier = cache(async (churchId: string) => {
  // existing implementation
});
```

Check `church-platform.service.ts` — if these are already using `cache()`, no change needed.

---

## QA Test Scenarios (from QA agent)

All 7 must pass before this ships:

1. **Auth redirect survives route group restructure** — Hit each admin URL unauthenticated. Confirm redirect to `/sign-in?callbackUrl=<exact-url>`. Failure: layout layer swallows redirect or corrupts callbackUrl.

2. **Tier-gate enforcement not dropped during file moves** — With free-tier church, access each paid page directly by URL. Confirm paywall/redirect, not page content. Failure: file move strips import or gate check.

3. **Full-screen event routes render without sidebar** — Navigate to `display`, `wall`, `moderation`. Assert sidebar DOM node is absent. Failure: `events/[eventId]/layout.tsx` inherits admin layout.

4. **URLs unchanged after route group move** — For every moved page, confirm browser URL has no `(admin)` segment. Failure: mis-nested folder breaks URL contract silently.

5. **Active nav state correctness** — Navigate into nested routes. Confirm correct parent item highlighted. Confirm no stale active state on full-screen event routes (sidebar absent there). Failure: `usePathname()` prefix match incorrectly highlights entries.

6. **"Back to PrayerJar" link resolves correctly** — From each admin page, click the footer link. Confirm correct destination, no 404. Failure: link hardcoded relative to old layout DOM position.

7. **Lock badge present on paid items, absent on Prayer Team** — With free-tier account, render sidebar and assert lock on paid items, no lock on Prayer Team. Failure: free/paid check inverts or Prayer Team exception is dropped.

---

## Out of Scope

- Church logo/avatar upload (ship CSS initial circle; avatar is a future sprint)
- Badge counts (unread flags, care inbox count) in the sidebar — defer to a later sprint
- Role-based hiding of nav items (admin vs pastor vs member) — all items show for admin/pastor; members don't access admin routes
- Any change to the public prayer wall page (`/church/[slug]/wall`) layout
