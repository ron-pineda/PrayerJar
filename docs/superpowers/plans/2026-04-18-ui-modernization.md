# Sprint 19 — UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the `PrayerJar` component with size/mode props and use it as the visual anchor for redesigned hero sections across five surfaces: homepage (signed-out + signed-in), `/for-churches`, `/pray`, and `/praise-wall`.

**Architecture:** Jar-first approach — Task 1 upgrades the single shared component, Tasks 2–7 apply it page by page. No new libraries. CSS-only animations added to `globals.css`. New personal-stats service functions added to `homepage.service.ts`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS, shadcn/ui (base-ui render prop pattern), Drizzle ORM, Vitest, `node:crypto` (not used here — no encryption changes)

---

## File Map

| File | Action | Task |
|---|---|---|
| `src/components/prayer-jar.tsx` | Modify — add `size`, `mode`, `countLabel` props; add `SlipDropAnimation` export | 1 |
| `src/app/globals.css` | Modify — add `@keyframes slip-drop`, `@keyframes light-escape`, their utility classes, reduced-motion entries | 1, 7 |
| `src/services/homepage.service.ts` | Modify — add `getMyIntercessionsCount`, `getMyAnsweredCount`, `getUserChurch`; update `getHomepageData` | 2 |
| `src/services/homepage.service.test.ts` | Create — tests for the three new functions | 2 |
| `src/app/(public)/page.tsx` | Modify — signed-out hero, signed-in personal stats, contextual CTAs, remove global stats strip | 3 |
| `src/components/prayer-dialog.tsx` | Modify — show `SlipDropAnimation` on success | 4 |
| `src/app/(public)/for-churches/page.tsx` | Modify — add trust strip, remove placeholder testimonials, jar in hero | 5 |
| `src/app/(public)/pray/page.tsx` | Modify — slips-jar hero, new headline | 6 |
| `src/app/(public)/praise-wall/page.tsx` | Modify — lights-jar hero, larger headline with count | 7 |
| `src/components/lights-released-client.tsx` | Modify — add light-escape orb to each praise card | 7 |

---

## Task 1: PrayerJar component upgrade

**Files:**
- Modify: `src/components/prayer-jar.tsx`
- Modify: `src/app/globals.css`

### Context

`PrayerJar` currently accepts only `{ count: number }` and renders one fixed size. We are adding:
- `size?: 'sm' | 'md' | 'lg'` — controls jar dimensions
- `mode?: 'lights' | 'slips'` — `lights` is the current golden-orb behaviour; `slips` renders paper slips for the prayer-wall hero
- `countLabel?: string` — amber label displayed below the jar (any size)
- `SlipDropAnimation` — named export used in Task 4

`md` maps to the current default dimensions exactly, so no existing callsites break.

- [ ] **Step 1: Replace `src/components/prayer-jar.tsx`**

```tsx
'use client';

import React from 'react';

const LIGHT_SLOTS = [
  { left: 15, bottom: 14 }, { left: 40, bottom: 22 }, { left: 65, bottom: 11 },
  { left: 25, bottom: 39 }, { left: 54, bottom: 36 }, { left: 79, bottom: 30 },
  { left: 35, bottom: 56 }, { left: 60, bottom: 52 }, { left: 16, bottom: 67 },
  { left: 47, bottom: 72 }, { left: 77, bottom: 69 }, { left: 29, bottom: 83 },
  { left: 10, bottom: 45 }, { left: 72, bottom: 48 }, { left: 50, bottom: 15 },
  { left: 20, bottom: 28 }, { left: 82, bottom: 18 }, { left: 45, bottom: 44 },
  { left: 68, bottom: 60 }, { left: 12, bottom: 55 }, { left: 56, bottom: 78 },
  { left: 38, bottom: 65 }, { left: 75, bottom: 82 }, { left: 22, bottom: 76 },
  { left: 48, bottom: 90 }, { left: 85, bottom: 55 }, { left: 32, bottom: 10 },
  { left: 62, bottom: 88 }, { left: 8, bottom: 85 }, { left: 42, bottom: 50 },
];

const SLIP_SLOTS = [
  { left: 12, bottom: 10, rotate: -12 }, { left: 40, bottom: 15, rotate: 6 },
  { left: 64, bottom: 8, rotate: -4 },  { left: 22, bottom: 38, rotate: 10 },
  { left: 55, bottom: 35, rotate: -8 }, { left: 30, bottom: 58, rotate: 4 },
  { left: 68, bottom: 62, rotate: -14 },{ left: 12, bottom: 68, rotate: 7 },
  { left: 47, bottom: 80, rotate: -6 }, { left: 75, bottom: 75, rotate: 9 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [10, 12, 14, 16, 18, 20, 22, 24];

type JarSize = 'sm' | 'md' | 'lg';
type JarMode = 'lights' | 'slips';

const SIZE_DIMS: Record<JarSize, {
  neckW: string; neckH: number; bodyW: string; bodyH: string;
}> = {
  sm: { neckW: '60px',             neckH: 18, bodyW: '100px',           bodyH: '120px' },
  md: { neckW: 'min(200px, 52vw)', neckH: 55, bodyW: 'min(350px, 90vw)', bodyH: 'min(450px, 115vw)' },
  lg: { neckW: 'min(210px, 54vw)', neckH: 58, bodyW: 'min(370px, 91vw)', bodyH: 'min(470px, 116vw)' },
};

function lightStyle(index: number, slot: { left: number; bottom: number }): React.CSSProperties {
  const floatAnim = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const floatDur = 2.5 + (index * 0.13) % 1.3;
  const pulseDur = 1.6 + (index * 0.17) % 0.8;
  const delay = (index * 0.37) % 2;
  const size = SIZES[index % SIZES.length];
  return {
    position: 'absolute',
    left: `${slot.left}%`,
    bottom: `${slot.bottom}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(255,220,120,1), rgba(212,168,67,0.6) 50%, transparent 70%)',
    boxShadow: '0 0 12px 4px rgba(212,168,67,0.5), 0 0 30px 8px rgba(212,168,67,0.2)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

function SlipItem({ slot, index }: { slot: typeof SLIP_SLOTS[0]; index: number }) {
  const w = 26 + (index % 3) * 4;
  const h = 16 + (index % 3) * 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${slot.left}%`,
        bottom: `${slot.bottom}%`,
        width: w,
        height: h,
        borderRadius: 2,
        background: 'rgba(254,243,199,0.88)',
        transform: `rotate(${slot.rotate}deg)`,
      }}
    >
      <div style={{ position: 'absolute', top: 3, left: 4, right: 4 }}>
        <div style={{ height: 1.5, background: 'rgba(120,80,20,0.3)', borderRadius: 1, marginBottom: 2.5 }} />
        <div style={{ height: 1.5, background: 'rgba(120,80,20,0.2)', borderRadius: 1, width: '70%' }} />
      </div>
    </div>
  );
}

export function PrayerJar({
  count,
  size = 'md',
  mode = 'lights',
  countLabel,
}: {
  count: number;
  size?: JarSize;
  mode?: JarMode;
  countLabel?: string;
}) {
  const dims = SIZE_DIMS[size];
  const lightCount = Math.min(count, 30);
  const slipCount = Math.min(count, SLIP_SLOTS.length);

  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div
        style={{
          width: dims.neckW,
          height: dims.neckH,
          border: '2.5px solid rgba(212,168,67,0.5)',
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          background: 'rgba(255,255,255,0.02)',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: dims.bodyW,
          height: dims.bodyH,
          border: '2.5px solid rgba(212,168,67,0.5)',
          borderTop: 'none',
          borderRadius: '0 0 80px 80px',
          background: 'rgba(10,10,20,0.8)',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 24, left: 22, width: 28, height: 110, background: 'rgba(255,255,255,0.05)', borderRadius: 14, transform: 'rotate(-8deg)' }} />
        <div style={{ position: 'absolute', top: 16, right: 36, width: 14, height: 55, background: 'rgba(255,255,255,0.03)', borderRadius: 7, transform: 'rotate(5deg)' }} />

        {mode === 'lights' && LIGHT_SLOTS.slice(0, lightCount).map((slot, i) => (
          <div key={i} className="prayer-jar-light" style={lightStyle(i, slot)} />
        ))}

        {mode === 'slips' && SLIP_SLOTS.slice(0, slipCount).map((slot, i) => (
          <SlipItem key={i} slot={slot} index={i} />
        ))}
      </div>

      {countLabel && (
        <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          {countLabel}
        </p>
      )}
    </div>
  );
}

export function SlipDropAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div
      className="animate-slip-drop"
      style={{
        position: 'fixed',
        top: '28vh',
        left: '50%',
        width: 36,
        height: 22,
        borderRadius: 2,
        background: 'rgba(254,243,199,0.92)',
        zIndex: 50,
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      onAnimationEnd={onComplete}
    />
  );
}
```

- [ ] **Step 2: Add new keyframes to `src/app/globals.css`**

Append these lines before the `/* Respect reduced motion */` block (around line 251):

```css
@keyframes slip-drop {
  0%   { opacity: 1; transform: translateX(-50%) translateY(0)     rotate(-8deg); }
  80%  { opacity: 1; transform: translateX(-50%) translateY(38vh)  rotate(-4deg); }
  100% { opacity: 0; transform: translateX(-50%) translateY(40vh)  rotate(-2deg); }
}

@keyframes light-escape {
  0%   { opacity: 0.8; transform: translateY(0)     scale(1);   }
  50%  { opacity: 0.5; transform: translateY(-50px) scale(0.7); }
  100% { opacity: 0;   transform: translateY(-90px) scale(0.3); }
}

.animate-slip-drop {
  animation: slip-drop 0.85s ease-in forwards;
}

.animate-light-escape {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(255,220,120,1), rgba(212,168,67,0.6) 50%, transparent 70%);
  box-shadow: 0 0 8px 3px rgba(212,168,67,0.4);
  pointer-events: none;
  animation: light-escape 1.1s ease-out forwards;
}
```

- [ ] **Step 3: Extend the reduced-motion block** — add the new animations to the existing `@media (prefers-reduced-motion: reduce)` block in `globals.css`:

Find the existing block and add `, .animate-slip-drop, .animate-light-escape` alongside the other entries. The block will look like:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-pray-ripple,
  .animate-count-bump,
  .animate-candle,
  .animate-fade-slide-up,
  .animate-badge-pop,
  .animate-prayer-text-in,
  .animate-slip-drop,
  .animate-light-escape,
  .prayer-jar-light {
    animation: none !important;
  }
}
```

- [ ] **Step 4: Verify the homepage still renders** — start the dev server and open http://localhost:3000. The jar on the signed-out homepage should look identical to before (no props changed at existing callsites — `size` defaults to `'md'`, `mode` defaults to `'lights'`).

```bash
npm run dev
```

Expected: no console errors, jar displays with golden orbs as before.

- [ ] **Step 5: Commit**

```bash
git add src/components/prayer-jar.tsx src/app/globals.css
git commit -m "feat(s19): PrayerJar size/mode/countLabel props + SlipDropAnimation export"
```

---

## Task 2: Homepage service — personal stats + church query

**Files:**
- Modify: `src/services/homepage.service.ts`
- Create: `src/services/homepage.service.test.ts`

### Context

The signed-in homepage (Task 3) replaces the platform-wide stats strip with personal stats: "X prayers submitted · X times interceded · X answered." It also needs the user's church slug to show a contextual "My Church" CTA. Three new functions and one update to `getHomepageData`.

`prayerInteractions.userId` is the intercessor (the person who prayed for someone else's request).

- [ ] **Step 1: Write the failing tests**

Create `src/services/homepage.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/db/schema', () => ({
  prayers: {},
  prayerInteractions: {},
  churchMembers: {},
  churches: {},
}));

import { getMyIntercessionsCount, getMyAnsweredCount, getUserChurch } from './homepage.service';
import { db } from '@/db';

describe('getMyIntercessionsCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 0 when no interactions exist', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 0 }]);

    const result = await getMyIntercessionsCount('user-1');
    expect(result).toBe(0);
  });

  it('returns the intercession count for the user', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 7 }]);

    const result = await getMyIntercessionsCount('user-1');
    expect(result).toBe(7);
  });
});

describe('getMyAnsweredCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns answered prayer count for the user', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockResolvedValue([{ count: 3 }]);

    const result = await getMyAnsweredCount('user-1');
    expect(result).toBe(3);
  });
});

describe('getUserChurch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when user has no church', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).innerJoin = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockReturnThis();
    (db as any).limit = vi.fn().mockResolvedValue([]);

    const result = await getUserChurch('user-1');
    expect(result).toBeNull();
  });

  it('returns slug and name when user belongs to a church', async () => {
    (db as any).select = vi.fn().mockReturnThis();
    (db as any).from = vi.fn().mockReturnThis();
    (db as any).innerJoin = vi.fn().mockReturnThis();
    (db as any).where = vi.fn().mockReturnThis();
    (db as any).limit = vi.fn().mockResolvedValue([{ slug: 'grace-chapel', name: 'Grace Chapel' }]);

    const result = await getUserChurch('user-1');
    expect(result).toEqual({ slug: 'grace-chapel', name: 'Grace Chapel' });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/services/homepage.service.test.ts
```

Expected: FAIL — `getMyIntercessionsCount`, `getMyAnsweredCount`, `getUserChurch` not found.

- [ ] **Step 3: Add the three functions and update `getHomepageData` in `src/services/homepage.service.ts`**

Add these imports at the top (alongside existing ones):

```typescript
import { db } from '@/db';
import { prayers, prayerInteractions, churchMembers, churches } from '@/db/schema';
import { eq, and, gt, lt, or, isNull, ne, sql, count, inArray } from 'drizzle-orm';
import { addDays } from 'date-fns';
```

Then add these three functions before `getHomepageData`:

```typescript
export async function getMyIntercessionsCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(prayerInteractions)
    .where(eq(prayerInteractions.userId, userId));
  return Number(row?.count ?? 0);
}

export async function getMyAnsweredCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(and(eq(prayers.authorId, userId), eq(prayers.status, 'answered')));
  return Number(row?.count ?? 0);
}

export async function getUserChurch(userId: string): Promise<{ slug: string; name: string } | null> {
  const rows = await db
    .select({ slug: churches.slug, name: churches.name })
    .from(churchMembers)
    .innerJoin(churches, eq(churchMembers.churchId, churches.id))
    .where(eq(churchMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}
```

Replace the existing `getHomepageData` function:

```typescript
export async function getHomepageData(userId: string) {
  const [
    prayedForMeCount,
    expiringCount,
    activePrayerCount,
    communityPrayer,
    myIntercessionsCount,
    myAnsweredCount,
    church,
  ] = await Promise.all([
    getPrayedForMeCount(userId),
    getExpiringPrayerCount(userId),
    getActivePrayerCount(userId),
    getCommunityPrayerSnippet(userId),
    getMyIntercessionsCount(userId),
    getMyAnsweredCount(userId),
    getUserChurch(userId),
  ]);
  return {
    prayedForMeCount,
    expiringCount,
    activePrayerCount,
    communityPrayer,
    myIntercessionsCount,
    myAnsweredCount,
    church,
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/services/homepage.service.test.ts
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Run the full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: same pass/fail count as before (353/358 or better — the 5 pre-existing failures are in billing/stripe/feature-flags and unrelated).

- [ ] **Step 6: Commit**

```bash
git add src/services/homepage.service.ts src/services/homepage.service.test.ts
git commit -m "feat(s19): personal stats + church query for signed-in homepage"
```

---

## Task 3: Homepage redesign — signed-out and signed-in

**Files:**
- Modify: `src/app/(public)/page.tsx`

### Context

Read the full current file at `src/app/(public)/page.tsx` before editing. Changes:

**Signed-out:**
- Jar → `size="lg"` with `countLabel`
- Headline → "Where every prayer finds a witness."
- Stats inline below the jar — remove the separate stat boxes
- How It Works icons → Lucide SVG (`Heart`, `Users`, `Sparkles`)
- Global stats strip → removed
- Secondary CTAs → clean icon cards (same 3 destinations)

**Signed-in:**
- Jar → keep `md` (no change)
- Greeting → name in larger type, prayed-for count as distinct line
- Global stats strip → replaced with personal stats strip
- Secondary CTAs → Pray for Someone, Praise Wall, My Church (or Find a Church)

The `PrayingNowCounter` import and usage is removed (it was in the global stats strip).

- [ ] **Step 1: Update imports at the top of `src/app/(public)/page.tsx`**

Replace the import block with:

```typescript
import Link from 'next/link';
import { Heart, Users, Sparkles, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrayerDialog } from '@/components/prayer-dialog';
import { OnboardingOverlay } from '@/components/onboarding-overlay';
import { PrayerJar } from '@/components/prayer-jar';
import { ScrollReveal } from '@/components/scroll-reveal';
import { getDailyVerse } from '@/lib/daily-verse';
import { db } from '@/db';
import { prayers, prayerInteractions, users } from '@/db/schema';
import { eq, and, gt, ne, or, isNull, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getHomepageData } from '@/services/homepage.service';
```

(Removed: `AnimatedCounter`, `PrayingNowCounter`. Keep `users` import — used by `getUserOnboardingState`.)

- [ ] **Step 2: Replace the `HomePage` component**

Keep the three helper functions (`getStats`, `getUserOnboardingState`, `getTimeOfDay`) exactly as they are — do not modify them. Only the `HomePage` component body changes.

```tsx
export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const verse = getDailyVerse();

  const [stats, homepageData, onboardingCompleted] = await Promise.all([
    getStats(userId),
    userId ? getHomepageData(userId) : Promise.resolve(null),
    userId ? getUserOnboardingState(userId) : Promise.resolve(true),
  ]);

  const needsOnboarding = userId ? !onboardingCompleted : false;

  return (
    <main className="min-h-screen">
      <OnboardingOverlay showOnboarding={needsOnboarding} />

      {/* ── Signed-in greeting ─────────────────────────────────── */}
      {session?.user && homepageData ? (
        <>
          <div className="text-center space-y-2 py-8 px-4">
            <div className="flex justify-center mb-4">
              <PrayerJar count={stats.active} />
            </div>
            <h1 className="text-3xl font-bold">
              Good {getTimeOfDay()},{' '}
              <span className="text-amber-600 dark:text-amber-400">
                {session.user.name?.split(' ')[0] ?? 'friend'}
              </span>
            </h1>
            {homepageData.prayedForMeCount > 0 && (
              <p className="text-muted-foreground text-sm">
                {homepageData.prayedForMeCount}{' '}
                {homepageData.prayedForMeCount === 1 ? 'person' : 'people'} prayed for your requests this week
              </p>
            )}
            {homepageData.expiringCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {homepageData.expiringCount}{' '}
                {homepageData.expiringCount === 1 ? 'prayer needs' : 'prayers need'} renewal
              </p>
            )}
            <div className="mt-4">
              <PrayerDialog />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto px-4 mt-6">
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold">Someone needs prayer</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {homepageData.communityPrayer?.content ?? 'There are prayers waiting for your intercession.'}
              </p>
              <a href="/pray" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                Pray for Them →
              </a>
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold">Your prayers</h3>
              <p className="text-sm text-muted-foreground">
                {homepageData.activePrayerCount} active
                {homepageData.expiringCount > 0 ? ` · ${homepageData.expiringCount} expiring soon` : ' · all current'}
              </p>
              <a href="/my-prayers" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                View My Prayers →
              </a>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Signed-out hero ────────────────────────────────────── */}
      {!session?.user && (
        <section className="py-20 px-4 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <PrayerJar
              count={stats.active}
              size="lg"
              countLabel={`${stats.active.toLocaleString()} prayers held · ${stats.answered.toLocaleString()} answered`}
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Where every prayer finds a witness.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            A global community that prays together. Share what you're carrying — someone here will intercede.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PrayerDialog />
            <Button size="lg" variant="outline" render={<Link href="/pray" />}>
              Pray for Someone
            </Button>
          </div>
        </section>
      )}

      {/* ── Daily verse ────────────────────────────────────────── */}
      <div className="border-t border-b py-4 mb-8 max-w-md mx-auto px-4">
        <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2 text-center">{verse.reference}</p>
      </div>

      {/* ── How it works — signed-out only ─────────────────────── */}
      {!session?.user && (
        <ScrollReveal>
          <section className="pb-12 px-4">
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
                How It Works
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                  { Icon: Heart, title: 'Share Your Heart', body: 'Write a prayer request — as specific or as simple as you need. You choose who sees it.' },
                  { Icon: Users, title: 'The Community Intercedes', body: 'Others around the world pray for your request. You receive a notification each time someone intercedes.' },
                  { Icon: Sparkles, title: 'Release a Light', body: 'When your prayer is answered, mark it as a testimony. A light joins the Lights Released wall for all to celebrate.' },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ── Personal stats — signed-in only ────────────────────── */}
      {session?.user && homepageData && (
        <ScrollReveal>
          <section className="pb-12 px-4">
            <div className="max-w-lg mx-auto rounded-xl border border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20 py-8 px-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                Your Prayer Journey
              </p>
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {homepageData.activePrayerCount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {homepageData.myIntercessionsCount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Intercessions</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
                    {homepageData.myAnsweredCount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Answered</span>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ── Secondary CTAs ─────────────────────────────────────── */}
      <ScrollReveal delay={120}>
        <section className="pb-20 px-4">
          <div className="border-t max-w-xs mx-auto mb-10" />
          {session?.user && homepageData ? (
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Link
                href="/pray"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Pray for Someone</p>
                <p className="text-xs text-muted-foreground mt-1">Intercede for the community</p>
              </Link>
              <Link
                href="/praise-wall"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Praise Wall</p>
                <p className="text-xs text-muted-foreground mt-1">Celebrate answered prayers</p>
              </Link>
              {homepageData.church ? (
                <Link
                  href={`/church/${homepageData.church.slug}`}
                  className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
                >
                  <div className="flex justify-center mb-2">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{homepageData.church.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Your church community</p>
                </Link>
              ) : (
                <Link
                  href="/find-a-church"
                  className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
                >
                  <div className="flex justify-center mb-2">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">Find a Church</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect with a local community</p>
                </Link>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Link
                href="/know-jesus"
                className="group rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-primary">Know Jesus</p>
                <p className="text-xs text-muted-foreground mt-1">Start your faith journey</p>
              </Link>
              <Link
                href="/praise-wall"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Answered Prayers</p>
                <p className="text-xs text-muted-foreground mt-1">Celebrate answered prayers</p>
              </Link>
              <Link
                href="/find-a-church"
                className="group rounded-xl border hover:bg-accent/50 px-5 py-5 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <Church className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Find a Church</p>
                <p className="text-xs text-muted-foreground mt-1">Connect with a local community</p>
              </Link>
            </div>
          )}
        </section>
      </ScrollReveal>
    </main>
  );
}
```


- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000 signed out. Confirm:
- Jar displayed large with count label below
- Headline "Where every prayer finds a witness."
- No separate stat boxes in hero
- How It Works uses Lucide icons (no emojis)
- No stats strip at bottom

Open http://localhost:3000 signed in. Confirm:
- Personalized greeting with larger name
- "Your Prayer Journey" strip shows active / intercessions / answered
- Secondary CTAs are Pray for Someone / Praise Wall / My Church (or Find a Church)

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```

Expected: same pass count as before.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/page.tsx
git commit -m "feat(s19): homepage redesign — signed-out hero, personal stats, contextual CTAs"
```

---

## Task 4: PrayerDialog slip-drop animation

**Files:**
- Modify: `src/components/prayer-dialog.tsx`

### Context

After a user successfully submits a prayer, show `SlipDropAnimation` for ~850ms before closing the dialog. The animation component calls `onComplete` via `onAnimationEnd`, which triggers the dialog close and router refresh.

- [ ] **Step 1: Replace `src/components/prayer-dialog.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PrayerForm } from '@/components/prayer-form';
import { SlipDropAnimation } from '@/components/prayer-jar';

export function PrayerDialog() {
  const [open, setOpen] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setShowDrop(true);
  }

  function handleDropComplete() {
    setShowDrop(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {showDrop && <SlipDropAnimation onComplete={handleDropComplete} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="lg" />}>
          Add a Prayer Request
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share your prayer request</DialogTitle>
          </DialogHeader>
          <PrayerForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000, click "Add a Prayer Request", submit a prayer. Confirm:
- A paper-slip-shaped element animates downward after submission
- Dialog closes after the animation completes (~850ms)
- Page refreshes and new prayer appears

- [ ] **Step 3: Commit**

```bash
git add src/components/prayer-dialog.tsx
git commit -m "feat(s19): slip-drop animation in PrayerDialog on prayer submission"
```

---

## Task 5: /for-churches — trust strip + hero jar

**Files:**
- Modify: `src/app/(public)/for-churches/page.tsx`

### Context

Two changes:
1. Add `PrayerJar` at `size="lg"` to the existing hero section (currently text-only except for a small jar)
2. Remove the three `TESTIMONIAL_SLOTS` placeholder entries and their JSX section; replace with a new server-side trust strip using live DB counts

Read the full current file before editing.

- [ ] **Step 1: Add imports**

Add to the existing imports in `src/app/(public)/for-churches/page.tsx`:

```typescript
import { db } from '@/db';
import { prayers, churchMembers } from '@/db/schema';
import { or, eq, sql, count } from 'drizzle-orm';
```

`PrayerJar` is already imported.

- [ ] **Step 2: Add the trust strip data fetch**

Add this function before `export default function ForChurchesPage()`:

```typescript
async function getTrustStats() {
  const [churchCountRow, prayerCountRow, memberCountRow] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${churchMembers.churchId})` })
      .from(churchMembers)
      .then(rows => rows[0]),
    db
      .select({ count: count() })
      .from(prayers)
      .where(or(eq(prayers.status, 'active'), eq(prayers.status, 'answered'))),
    db
      .select({ count: count() })
      .from(churchMembers),
  ]);

  return {
    churches: Number(churchCountRow?.count ?? 0),
    prayers: Number(prayerCountRow?.[0]?.count ?? 0),
    members: Number(memberCountRow?.[0]?.count ?? 0),
  };
}
```

- [ ] **Step 3: Fetch trust stats in the page component**

Change `export default function ForChurchesPage()` to `export default async function ForChurchesPage()` and add the fetch at the top of the function body:

```typescript
export default async function ForChurchesPage() {
  const trust = await getTrustStats();
  // ... rest of existing code
```

- [ ] **Step 4: Update the hero to include the jar**

Find the hero section (starts at `<section className="py-20 px-4 text-center max-w-2xl mx-auto">`). The existing code already has `<PrayerJar count={12} />`. Replace `count={12}` with `count={trust.prayers}` and add `size="lg"` and `countLabel`:

```tsx
<div className="flex justify-center mb-8">
  <PrayerJar
    count={trust.prayers}
    size="lg"
    countLabel={`${trust.prayers.toLocaleString()} prayers held across ${trust.churches} churches`}
  />
</div>
```

- [ ] **Step 5: Remove the testimonials section and replace with trust strip**

Delete the entire `TESTIMONIAL_SLOTS` constant (lines defining the array with placeholder quotes) and the corresponding `{/* ── Social Proof Strip */}` JSX section.

Replace them with this trust strip JSX, inserted in the same position (after the FAQ section, before the Enterprise section):

```tsx
{/* ── Trust Strip ─────────────────────────────────────── */}
{trust.churches > 0 && (
  <section className="pb-20 px-4 max-w-3xl mx-auto">
    <ScrollReveal>
      <div className="rounded-xl border border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20 py-10 px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
          PrayerJar by the numbers
        </p>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center gap-1 px-4">
            <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
              {trust.churches}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Churches</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4">
            <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
              {trust.prayers.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Prayers Held</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4">
            <span className="text-3xl font-bold tabular-nums text-amber-500 dark:text-amber-400">
              {trust.members.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Members Prayed For</span>
          </div>
        </div>
      </div>
    </ScrollReveal>
  </section>
)}
```

Note the `trust.churches > 0` guard — if no churches have members yet (early staging), the section is simply not rendered rather than showing zeroes.

- [ ] **Step 6: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000/for-churches. Confirm:
- Jar is displayed larger in the hero with count label
- No `[PLACEHOLDER]` red badges anywhere on the page
- Trust strip renders below the FAQ with live numbers (will show small numbers in dev/staging — that's expected)

- [ ] **Step 7: Commit**

```bash
git add src/app/\(public\)/for-churches/page.tsx
git commit -m "feat(s19): for-churches trust strip replaces placeholder testimonials + hero jar upgrade"
```

---

## Task 6: /pray — prayer wall header redesign

**Files:**
- Modify: `src/app/(public)/pray/page.tsx`

### Context

Current page is a bare `<h1>` + one-liner + `<CategoryPicker>`. Replace the header with a slips-mode jar at `size="md"` and a more evocative headline. `count` for the jar comes from a quick DB query of active prayers.

- [ ] **Step 1: Replace `src/app/(public)/pray/page.tsx`**

```tsx
import { CategoryPicker } from '@/components/category-picker';
import { PrayerJar } from '@/components/prayer-jar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { and, eq, gt, isNull, sql, count } from 'drizzle-orm';

export const metadata = { title: 'Pray for Someone | The Prayer Jar' };

async function getActivePrayerCount() {
  const now = new Date();
  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(and(eq(prayers.status, 'active'), gt(prayers.expiresAt, now), isNull(prayers.groupId)));
  return Number(row?.count ?? 0);
}

export default async function PrayPage({
  searchParams,
}: {
  searchParams: Promise<{ urgent?: string }>;
}) {
  const { urgent } = await searchParams;
  const urgentOnly = urgent === '1';
  const activeCount = await getActivePrayerCount();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center mb-10">
        <PrayerJar
          count={activeCount}
          size="md"
          mode="slips"
          countLabel={`${activeCount.toLocaleString()} requests waiting`}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">
          Someone wrote this for you.
        </h1>
        <p className="text-muted-foreground max-w-md">
          Choose a category and intercede for a real request from the community.
        </p>
      </div>
      <CategoryPicker urgentOnly={urgentOnly} />
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Want to browse all requests?</p>
        <Button variant="ghost" size="sm" render={<Link href="/browse" />}>
          Browse Prayer Requests →
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000/pray. Confirm:
- Slips-mode jar (paper slips, not golden orbs) displayed above the headline
- Count label shows number of active requests
- Headline is "Someone wrote this for you."
- CategoryPicker is unchanged below

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/pray/page.tsx
git commit -m "feat(s19): /pray hero — slips jar + evocative headline"
```

---

## Task 7: /praise-wall — header upgrade + light escape animation

**Files:**
- Modify: `src/app/(public)/praise-wall/page.tsx`
- Modify: `src/components/lights-released-client.tsx`

### Context

Two changes:
1. `/praise-wall` page gets a lights-mode jar at `size="md"` and a more celebratory header with answered-prayer count
2. `LightsReleasedClient` wraps each praise card with a relative container that holds a `animate-light-escape` orb div — this is the CSS animation defined in Task 1

- [ ] **Step 1: Replace `src/app/(public)/praise-wall/page.tsx`**

```tsx
import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { getDailyVerse } from '@/lib/daily-verse';
import { PrayerJar } from '@/components/prayer-jar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LightsReleasedClient } from '@/components/lights-released-client';
import type { CategoryValue } from '@/db/schema';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export const metadata = { title: 'Lights Released | The Prayer Jar' };

async function getAnsweredCount() {
  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(eq(prayers.status, 'answered'));
  return Number(row?.count ?? 0);
}

export default async function PraiseWallPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const validCategories = PRAYER_CATEGORIES.map((c) => c.value) as string[];
  const activeCategory =
    category && validCategories.includes(category)
      ? (category as CategoryValue)
      : undefined;

  const [prayers, verse, answeredCount] = await Promise.all([
    getAnsweredPrayersFiltered('month', activeCategory),
    Promise.resolve(getDailyVerse()),
    getAnsweredCount(),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <PrayerJar
          count={answeredCount}
          size="md"
          mode="lights"
          countLabel={`${answeredCount.toLocaleString()} lights released`}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">
          Lights Released ✨
        </h1>
        <p className="text-muted-foreground">
          Every light was once a prayer. God answered.
        </p>
      </div>

      {/* Daily verse */}
      <div className="border-t border-b py-4 mb-8 max-w-md mx-auto text-center">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2">{verse.reference}</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={!activeCategory ? 'default' : 'outline'}
          size="sm"
          render={<Link href="/praise-wall" />}
        >
          All
        </Button>
        {PRAYER_CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            render={<Link href={`/praise-wall?category=${cat.value}`} />}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <LightsReleasedClient initialPrayers={prayers} category={activeCategory} />
    </main>
  );
}
```

- [ ] **Step 2: Update `src/components/lights-released-client.tsx` to add the light-escape orb**

Find the card grid section (the `{prayers.map(...)}` block) and wrap each `PraiseCard` with a relative container that holds the orb:

```tsx
<div className="grid gap-4 sm:grid-cols-2">
  {prayers.map((prayer, i) => (
    <ScrollReveal key={prayer.id} delay={Math.min(i, 5) * 80}>
      <div className="relative">
        <div className="animate-light-escape" style={{ animationDelay: `${Math.min(i, 5) * 0.08}s` }} />
        <PraiseCard prayer={prayer} />
      </div>
    </ScrollReveal>
  ))}
</div>
```

The `animationDelay` matches `ScrollReveal`'s stagger so the orb rises as the card becomes visible.

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000/praise-wall. Confirm:
- Lights-mode jar (golden orbs) displayed above the headline with count label ("X lights released")
- Headline is larger / more prominent
- Each praise card has a small golden orb that rises and fades on entry
- Category filter and cards unchanged

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: same pass count as before.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/praise-wall/page.tsx src/components/lights-released-client.tsx
git commit -m "feat(s19): praise-wall jar hero + light-escape entry animation on praise cards"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ PrayerJar `size` + `mode` + `countLabel` props — Task 1
- ✅ `SlipDropAnimation` export — Task 1
- ✅ `LightEscapeAnimation` (implemented as `.animate-light-escape` CSS class) — Task 1, Task 7
- ✅ Homepage signed-out hero redesign — Task 3
- ✅ Platform-wide stats strip removed — Task 3
- ✅ Homepage signed-in personal stats — Tasks 2 + 3
- ✅ Signed-in contextual CTAs — Task 3
- ✅ PrayerDialog slip-drop on submit — Task 4
- ✅ /for-churches trust strip — Task 5
- ✅ /for-churches placeholder testimonials removed — Task 5
- ✅ /for-churches hero jar upgrade — Task 5
- ✅ /pray slips-mode jar header — Task 6
- ✅ /praise-wall lights jar header — Task 7
- ✅ Light escape animation on praise cards — Task 7

**Testing covered:** Task 2 adds unit tests for the three new service functions. Visual verification at each task. Full suite run after Task 7.
