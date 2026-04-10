# Know Jesus Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a warm gospel introduction page at `/know-jesus` with a CSS cross visual that counts salvation decisions, a displayed prayer, and a one-tap decision button that logs to the database.

**Architecture:** A server page fetches the decision count and daily verse, then passes both as props to `SalvationClient` (a client component that owns the interactive state). `SalvationClient` renders the full page body including the `SalvationCross` visual, gospel content, prayer block, name input, and post-decision confirmation. Count updates locally after submission without a page reload.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, CSS @keyframes (reused from globals.css), React client/server components, Next Auth v5

---

## File Map

```
src/
  db/
    schema.ts                              # MODIFY: Add salvation_decisions table
  app/
    actions/
      salvation.actions.ts                 # NEW: logSalvationDecisionAction
    (public)/
      know-jesus/
        page.tsx                           # NEW: server page
      find-a-church/
        page.tsx                           # NEW: placeholder page
    layout.tsx                             # MODIFY: add Know Jesus to desktop nav
    (public)/
      page.tsx                             # MODIFY: add Know Jesus link to homepage
  components/
    salvation-cross.tsx                    # NEW: CSS cross with rays and floating orbs
    salvation-client.tsx                   # NEW: client wrapper for interactive state
```

---

## Task 1: Add salvation_decisions Table to Schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the table to schema.ts**

In `src/db/schema.ts`, add this table after the `rateLimits` table definition (before the type exports at the bottom):

```typescript
export const salvationDecisions = pgTable('salvation_decisions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').references(() => users.id),
  name: text('name'),
  country: text('country'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

Then add this type export at the bottom alongside the other type exports:

```typescript
export type SalvationDecision = typeof salvationDecisions.$inferSelect;
```

The full bottom of the file should now read:

```typescript
export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type PrayerInteraction = typeof prayerInteractions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type SalvationDecision = typeof salvationDecisions.$inferSelect;
export type CategoryValue = typeof categoryEnum.enumValues[number];
export type BadgeType = typeof badgeTypeEnum.enumValues[number];
```

- [ ] **Step 2: Run build to verify TypeScript compiles**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Push schema to database**

```bash
npx drizzle-kit push
```

When prompted to confirm adding the `salvation_decisions` table, type `y`.

Expected: `[✓] Changes applied`

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add salvation_decisions table to schema"
```

---

## Task 2: Salvation Server Action

**Files:**
- Create: `src/app/actions/salvation.actions.ts`

- [ ] **Step 1: Create the server action**

Create `src/app/actions/salvation.actions.ts`:

```typescript
'use server';

import { db } from '@/db';
import { salvationDecisions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function logSalvationDecisionAction(name?: string): Promise<number> {
  const [session, headersList] = await Promise.all([auth(), headers()]);

  const country =
    headersList.get('cf-ipcountry') ??
    headersList.get('x-vercel-ip-country') ??
    null;

  await db.insert(salvationDecisions).values({
    userId: session?.user?.id ?? null,
    name: name ?? null,
    country,
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salvationDecisions);

  return Number(count);
}
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/salvation.actions.ts
git commit -m "feat: add salvation decision server action"
```

---

## Task 3: SalvationCross Component

**Files:**
- Create: `src/components/salvation-cross.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/salvation-cross.tsx`:

```typescript
'use client';

import React from 'react';

const ORB_SLOTS = [
  { top: 8, left: 25 }, { top: 5, left: 50 }, { top: 8, left: 72 },
  { top: 18, left: 15 }, { top: 15, left: 40 }, { top: 12, left: 62 },
  { top: 20, left: 80 }, { top: 28, left: 30 }, { top: 25, left: 55 },
  { top: 22, left: 75 }, { top: 35, left: 20 }, { top: 32, left: 45 },
  { top: 38, left: 68 }, { top: 30, left: 85 }, { top: 42, left: 35 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [8, 9, 10, 11, 12];
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function orbStyle(index: number, slot: { top: number; left: number }): React.CSSProperties {
  const floatAnim = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const floatDur = 2.5 + (index * 0.18) % 1.3;
  const pulseDur = 1.6 + (index * 0.21) % 0.8;
  const delay = (index * 0.43) % 2;
  const size = SIZES[index % SIZES.length];

  return {
    position: 'absolute',
    top: `${slot.top}%`,
    left: `${slot.left}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(255,220,120,1), rgba(212,168,67,0.6) 50%, transparent 70%)',
    boxShadow: '0 0 8px 2px rgba(212,168,67,0.5), 0 0 20px 4px rgba(212,168,67,0.2)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

export function SalvationCross({ count }: { count: number }) {
  const orbCount = Math.max(3, Math.min(count, 15));

  return (
    <div
      className="relative overflow-hidden rounded-xl w-full mb-6"
      style={{
        background: 'linear-gradient(180deg, #04040a 0%, #080814 60%, #0c0c1a 100%)',
        minHeight: 280,
        maxWidth: 500,
      }}
      aria-hidden="true"
    >
      {/* Light rays from cross center */}
      {RAY_ANGLES.map((angle) => (
        <div
          key={angle}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 90,
            background: 'linear-gradient(to top, rgba(212,168,67,0.5), transparent)',
            transformOrigin: 'top center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
          }}
        />
      ))}
      {/* Cross vertical bar */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8,
          height: 120,
          background: 'rgba(212,168,67,0.9)',
          boxShadow: '0 0 30px 8px rgba(212,168,67,0.3)',
          borderRadius: 4,
        }}
      />
      {/* Cross horizontal bar */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, calc(-50% - 16px))',
          width: 80,
          height: 8,
          background: 'rgba(212,168,67,0.9)',
          boxShadow: '0 0 30px 8px rgba(212,168,67,0.3)',
          borderRadius: 4,
        }}
      />
      {/* Floating orbs */}
      {ORB_SLOTS.slice(0, orbCount).map((slot, i) => (
        <div key={i} className="prayer-jar-light" style={orbStyle(i, slot)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/salvation-cross.tsx
git commit -m "feat: add SalvationCross component with CSS cross and floating orbs"
```

---

## Task 4: SalvationClient Component

**Files:**
- Create: `src/components/salvation-client.tsx`

- [ ] **Step 1: Create the client component**

Create `src/components/salvation-client.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SalvationCross } from '@/components/salvation-cross';
import { logSalvationDecisionAction } from '@/app/actions/salvation.actions';

type Verse = { text: string; reference: string };

export function SalvationClient({
  initialCount,
  verse,
}: {
  initialCount: number;
  verse: Verse;
}) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleDecision() {
    setLoading(true);
    try {
      const newCount = await logSalvationDecisionAction(name.trim() || undefined);
      setCount(newCount);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Cross visual */}
      <div className="flex justify-center mb-4">
        <SalvationCross count={count} />
      </div>
      <p className="text-2xl font-bold text-primary mb-1 text-center">{count.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mb-10 text-center">lives transformed</p>

      {/* Daily verse */}
      <div className="border-t border-b py-4 mb-10 max-w-md mx-auto text-center">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2">{verse.reference}</p>
      </div>

      {/* Gospel sections */}
      <div className="space-y-8 max-w-xl mx-auto mb-12">
        <section>
          <h2 className="text-xl font-semibold mb-3">God loves you</h2>
          <p className="text-muted-foreground leading-relaxed">
            Before you had a name, God knew you. Before you made a single choice, good or bad,
            he loved you.{' '}
            <em>
              &ldquo;For God so loved the world that he gave his one and only Son, that whoever
              believes in him shall not perish but have eternal life.&rdquo;
            </em>{' '}
            — John 3:16
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">We all drift</h2>
          <p className="text-muted-foreground leading-relaxed">
            Here&rsquo;s something honest: every one of us has wandered. Not because we&rsquo;re
            terrible — but because we&rsquo;re human.{' '}
            <em>
              &ldquo;For all have sinned and fall short of the glory of God.&rdquo;
            </em>{' '}
            — Romans 3:23. That&rsquo;s not shame. That&rsquo;s just the truth about all of us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Jesus is the bridge</h2>
          <p className="text-muted-foreground leading-relaxed">
            God didn&rsquo;t leave us there. He sent Jesus — not to judge, but to rescue. Jesus
            lived the life we couldn&rsquo;t live, died the death we deserved, and rose again.{' '}
            <em>
              &ldquo;But God demonstrates his own love for us in this: while we were still
              sinners, Christ died for us.&rdquo;
            </em>{' '}
            — Romans 5:8
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">It&rsquo;s a gift, not an earning</h2>
          <p className="text-muted-foreground leading-relaxed">
            You don&rsquo;t have to clean yourself up first. You don&rsquo;t have to be good
            enough.{' '}
            <em>
              &ldquo;For it is by grace you have been saved, through faith — and this is not from
              yourselves, it is the gift of God — not by works, so that no one can boast.&rdquo;
            </em>{' '}
            — Ephesians 2:8-9
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How to receive it</h2>
          <p className="text-muted-foreground leading-relaxed">
            <em>
              &ldquo;If you declare with your mouth, &lsquo;Jesus is Lord,&rsquo; and believe in
              your heart that God raised him from the dead, you will be saved.&rdquo;
            </em>{' '}
            — Romans 10:9. That&rsquo;s it. A prayer, a turning, a yes.
          </p>
        </section>
      </div>

      {/* Salvation prayer */}
      <div className="border-t border-b py-6 mb-8 max-w-md mx-auto text-center">
        <p className="text-base italic text-muted-foreground leading-relaxed">
          &ldquo;Jesus, I believe you died for me and rose again. I turn from my own way and ask
          you to come into my life. Thank you for forgiving me. I&rsquo;m yours. Amen.&rdquo;
        </p>
      </div>

      {!submitted ? (
        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name (optional)"
            className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={50}
          />
          <Button
            size="lg"
            className="w-full"
            onClick={handleDecision}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'I prayed this prayer'}
          </Button>
        </div>
      ) : (
        <div className="text-center max-w-sm mx-auto">
          <p className="text-lg font-semibold mb-2">
            Welcome to the family{name.trim() ? `, ${name.trim()}` : ''}. 🙏
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Heaven is celebrating right now. — Luke 15:7
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" render={<Link href="/find-a-church" />}>
              Find a Church Near Me
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/" />}>
              Go to the Prayer Jar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/salvation-client.tsx
git commit -m "feat: add SalvationClient with gospel content, prayer, and decision flow"
```

---

## Task 5: Know Jesus Page

**Files:**
- Create: `src/app/(public)/know-jesus/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(public)/know-jesus/page.tsx`:

```typescript
import { db } from '@/db';
import { salvationDecisions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { getDailyVerse } from '@/lib/daily-verse';
import { SalvationClient } from '@/components/salvation-client';

export const metadata = { title: 'Know Jesus | The Prayer Jar' };

export default async function KnowJesusPage() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salvationDecisions);

  const verse = getDailyVerse();

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Know Jesus</h1>
        <p className="text-muted-foreground">
          You don&rsquo;t have to have it all together. You just have to come as you are.
        </p>
      </div>

      <SalvationClient initialCount={Number(count)} verse={verse} />
    </main>
  );
}
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: build succeeds, `/know-jesus` listed as a dynamic route.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/know-jesus/page.tsx"
git commit -m "feat: add Know Jesus server page"
```

---

## Task 6: Find a Church Placeholder Page

**Files:**
- Create: `src/app/(public)/find-a-church/page.tsx`

- [ ] **Step 1: Create the placeholder page**

Create `src/app/(public)/find-a-church/page.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Find a Church | The Prayer Jar' };

export default function FindAChurchPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Find a Church Near You</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        We&rsquo;re building this feature. Check back soon!
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        In the meantime, you can search for &ldquo;Bible-based churches near me&rdquo; on Google
        Maps or ask someone in your community.
      </p>
      <Button render={<Link href="/" />}>Back to the Prayer Jar</Button>
    </main>
  );
}
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/find-a-church/page.tsx"
git commit -m "feat: add Find a Church placeholder page"
```

---

## Task 7: Navigation Updates

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Add Know Jesus to desktop nav in layout.tsx**

In `src/app/layout.tsx`, find the nav buttons section:

```typescript
<Button variant="ghost" size="sm" render={<Link href="/pray" />}>Pray</Button>
<Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>Lights Released</Button>
```

Add the Know Jesus button after Lights Released:

```typescript
<Button variant="ghost" size="sm" render={<Link href="/pray" />}>Pray</Button>
<Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>Lights Released</Button>
<Button variant="ghost" size="sm" render={<Link href="/know-jesus" />}>Know Jesus</Button>
```

- [ ] **Step 2: Add Know Jesus link to homepage**

In `src/app/(public)/page.tsx`, find the Lights Released CTA section:

```typescript
{/* Lights Released CTA */}
<section className="pb-20 px-4 text-center">
  <p className="text-muted-foreground mb-3">See what God has been doing</p>
  <Button variant="ghost" render={<Link href="/praise-wall" />}>View Lights Released →</Button>
</section>
```

Replace with:

```typescript
{/* Lights Released CTA */}
<section className="pb-20 px-4 text-center">
  <p className="text-muted-foreground mb-3">See what God has been doing</p>
  <Button variant="ghost" render={<Link href="/praise-wall" />}>View Lights Released →</Button>
  <div className="mt-3">
    <Button variant="ghost" render={<Link href="/know-jesus" />}>Know Jesus →</Button>
  </div>
</section>
```

- [ ] **Step 3: Run build to verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx "src/app/(public)/page.tsx"
git commit -m "feat: add Know Jesus to desktop nav and homepage CTA"
```

---

## Task 8: Final Verification & Deploy

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Verify locally**

```bash
npm run dev
```

Verify:
- `/know-jesus` loads with dark cross visual, floating orbs, counter at 0
- Daily verse shows between counter and gospel sections
- 5 gospel sections render with correct scripture
- Prayer appears in italic bordered block
- Name input is optional — can submit without it
- Clicking "I prayed this prayer" increments the counter and shows confirmation
- Confirmation shows name if provided, "friend" fallback is not needed (just omit name if blank)
- "Find a Church Near Me" → `/find-a-church` placeholder page
- "Go to the Prayer Jar" → `/`
- Desktop nav shows "Know Jesus" link
- Homepage shows "Know Jesus →" link below "View Lights Released →"

- [ ] **Step 4: Push schema to production database**

```bash
DATABASE_URL="<your-neon-connection-string>" npx drizzle-kit push
```

Confirm the `salvation_decisions` table creation when prompted.

- [ ] **Step 5: Push to deploy**

```bash
git push origin feature/prayer-jar
```

Expected: Vercel deploys successfully.
