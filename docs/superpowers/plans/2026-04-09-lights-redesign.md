# Prayer Jar Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only homepage hero with an animated glass jar of floating prayer lights, rename the Praise Wall to "Lights Released" with a matching sky visual, add a daily rotating Bible verse to both pages, and add a time filter for answered prayers.

**Architecture:** Two new client components (`PrayerJar`, `LightsSky`) render CSS-only animated orbs; counts are passed as props from server components. A shared `daily-verse.ts` utility picks today's verse server-side. The Praise Wall page gains a client wrapper (`LightsReleasedClient`) that owns time-filter state and re-queries via a server action. A new `answeredAt` column tracks when prayers are answered to power the time filter.

**Tech Stack:** Next.js 16, Drizzle ORM, CSS @keyframes, React server/client components

---

## File Map

```
src/
  db/
    schema.ts                              # MODIFY: Add answeredAt to prayers
  services/
    prayer.service.ts                      # MODIFY: Set answeredAt in markPrayerAnswered,
                                           #         add getAnsweredPrayersFiltered
  lib/
    daily-verse.ts                         # NEW: Curated verse list + getDailyVerse()
  components/
    prayer-jar.tsx                         # NEW: Animated glass jar with floating lights
    lights-sky.tsx                         # NEW: Night sky with floating lights + stars
    lights-released-client.tsx             # NEW: Client wrapper for time filter + cards
    mobile-nav.tsx                         # MODIFY: "Praise" → "Lights"
    praise-card.tsx                        # (no change — reused as-is)
  app/
    globals.css                            # MODIFY: Add light float/pulse/twinkle keyframes
    layout.tsx                             # MODIFY: "Praise Wall" → "Lights Released" in nav
    (public)/
      page.tsx                             # MODIFY: Insert PrayerJar + daily verse into hero
      praise-wall/
        page.tsx                           # MODIFY: New sky header, daily verse, time filter
  actions/
    praise.actions.ts                      # NEW: Server action for filtered answered prayers
```

---

## Task 1: Add answeredAt Column to Schema

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/services/prayer.service.ts`

- [ ] **Step 1: Write failing test for answeredAt column**

Add to `src/db/schema.test.ts`:

```typescript
it('has answeredAt column', () => {
  expect(prayers.answeredAt).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/db/schema.test.ts
```

Expected: FAIL — `prayers.answeredAt` is undefined.

- [ ] **Step 3: Add answeredAt to prayers table in schema**

In `src/db/schema.ts`, add after the `expiresAt` line:

```typescript
answeredAt: timestamp('answered_at'),
```

The full prayers table now includes:

```typescript
export const prayers = pgTable('prayers', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: uuid('author_id').references(() => users.id),
  content: text('content').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  isUrgent: boolean('is_urgent').default(false).notNull(),
  category: categoryEnum('category').notNull(),
  tags: text('tags').array().default([]).notNull(),
  suggestedVerse: text('suggested_verse'),
  status: prayerStatusEnum('status').default('active').notNull(),
  testimony: text('testimony'),
  imageUrl: text('image_url'),
  prayerCount: integer('prayer_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  answeredAt: timestamp('answered_at'),
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/db/schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Set answeredAt in markPrayerAnswered**

In `src/services/prayer.service.ts`, update the `markPrayerAnswered` function. Add `answeredAt: new Date()` to the `.set()` call:

```typescript
export async function markPrayerAnswered(id: string, authorId: string, testimony?: string, imageUrl?: string) {
  const [updated] = await db
    .update(prayers)
    .set({
      status: 'answered',
      testimony: testimony ?? null,
      imageUrl: imageUrl ?? undefined,
      answeredAt: new Date(),
    })
    .where(and(eq(prayers.id, id), eq(prayers.authorId, authorId)))
    .returning();
  return updated ?? null;
}
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/db/schema.test.ts src/services/prayer.service.ts
git commit -m "feat: add answeredAt timestamp to prayers schema"
```

---

## Task 2: Daily Verse Utility

**Files:**
- Create: `src/lib/daily-verse.ts`
- Create: `src/lib/daily-verse.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/daily-verse.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getDailyVerse, VERSES } from './daily-verse';

describe('daily-verse', () => {
  it('exports a non-empty VERSES array', () => {
    expect(VERSES.length).toBeGreaterThan(0);
  });

  it('each verse has text and reference', () => {
    for (const v of VERSES) {
      expect(typeof v.text).toBe('string');
      expect(typeof v.reference).toBe('string');
      expect(v.text.length).toBeGreaterThan(0);
      expect(v.reference.length).toBeGreaterThan(0);
    }
  });

  it('returns a verse with text and reference', () => {
    const verse = getDailyVerse();
    expect(verse).toHaveProperty('text');
    expect(verse).toHaveProperty('reference');
    expect(typeof verse.text).toBe('string');
    expect(typeof verse.reference).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/daily-verse.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create daily-verse.ts**

Create `src/lib/daily-verse.ts`:

```typescript
export const VERSES = [
  { text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', reference: 'Jeremiah 29:11' },
  { text: 'I can do all things through Christ who strengthens me.', reference: 'Philippians 4:13' },
  { text: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { text: 'Cast all your anxiety on him because he cares for you.', reference: '1 Peter 5:7' },
  { text: 'Be still and know that I am God.', reference: 'Psalm 46:10' },
  { text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', reference: 'Proverbs 3:5-6' },
  { text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', reference: 'Psalm 34:18' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  { text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', reference: 'Philippians 4:6-7' },
  { text: 'He heals the brokenhearted and binds up their wounds.', reference: 'Psalm 147:3' },
  { text: 'The Lord will fight for you; you need only to be still.', reference: 'Exodus 14:14' },
  { text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me.', reference: 'Psalm 23:4' },
  { text: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', reference: 'Matthew 7:7' },
  { text: 'For nothing will be impossible with God.', reference: 'Luke 1:37' },
  { text: 'God is our refuge and strength, an ever-present help in trouble.', reference: 'Psalm 46:1' },
  { text: 'The prayer of a righteous person is powerful and effective.', reference: 'James 5:16' },
  { text: 'Do not fear, for I am with you; do not be dismayed, for I am your God.', reference: 'Isaiah 41:10' },
  { text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', reference: 'Romans 8:28' },
  { text: 'Let us therefore come boldly to the throne of grace, that we may obtain mercy and find grace to help in time of need.', reference: 'Hebrews 4:16' },
  { text: 'Before they call I will answer; while they are still speaking I will hear.', reference: 'Isaiah 65:24' },
  { text: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you.', reference: 'Zephaniah 3:17' },
  { text: 'He gives strength to the weary and increases the power of the weak.', reference: 'Isaiah 40:29' },
  { text: 'Delight yourself in the Lord, and he will give you the desires of your heart.', reference: 'Psalm 37:4' },
  { text: 'With God all things are possible.', reference: 'Matthew 19:26' },
  { text: 'For the Lord your God is gracious and compassionate.', reference: '2 Chronicles 30:9' },
  { text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives.', reference: 'John 14:27' },
  { text: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.', reference: 'Numbers 6:24-26' },
  { text: 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.', reference: 'Psalm 121:1-2' },
  { text: 'Yet those who wait for the Lord will gain new strength; they will mount up with wings like eagles.', reference: 'Isaiah 40:31' },
  { text: 'This is the day the Lord has made; let us rejoice and be glad in it.', reference: 'Psalm 118:24' },
];

export function getDailyVerse(): { text: string; reference: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return VERSES[dayOfYear % VERSES.length];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/daily-verse.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/daily-verse.ts src/lib/daily-verse.test.ts
git commit -m "feat: add daily rotating Bible verse utility"
```

---

## Task 3: Light Animation Keyframes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add float, pulse, and twinkle keyframes to globals.css**

Append to the end of `src/app/globals.css` (before the `@media (prefers-reduced-motion)` block — insert just above it):

```css
/* Floating light animations */
@keyframes light-float-a {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(4px, -10px); }
  66% { transform: translate(-3px, -5px); }
}

@keyframes light-float-b {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-6px, -12px); }
}

@keyframes light-float-c {
  0%, 100% { transform: translate(0, 0); }
  40% { transform: translate(5px, -8px); }
  80% { transform: translate(-2px, -14px); }
}

@keyframes light-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.7; }
}
```

Then update the `@media (prefers-reduced-motion: reduce)` block to also disable the new animations. Replace the existing block:

```css
/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-pray-ripple,
  .animate-count-bump,
  .animate-candle,
  .animate-fade-slide-up,
  .animate-badge-pop {
    animation: none;
  }

  .prayer-jar-light,
  .sky-light,
  .sky-star {
    animation: none !important;
  }
}
```

- [ ] **Step 2: Run build to verify CSS is valid**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add floating light and star twinkle CSS animations"
```

---

## Task 4: PrayerJar Component

**Files:**
- Create: `src/components/prayer-jar.tsx`

- [ ] **Step 1: Create the PrayerJar component**

Create `src/components/prayer-jar.tsx`:

```typescript
'use client';

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

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [6, 7, 8, 9, 10, 11, 12, 13];

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
    boxShadow: '0 0 8px 2px rgba(212,168,67,0.5), 0 0 20px 4px rgba(212,168,67,0.2)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

export function PrayerJar({ count }: { count: number }) {
  const lightCount = Math.min(count, 30);

  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      {/* Neck */}
      <div
        style={{
          width: 80,
          height: 22,
          border: '2.5px solid rgba(212,168,67,0.5)',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          background: 'rgba(255,255,255,0.02)',
        }}
      />
      {/* Body */}
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 180,
          border: '2.5px solid rgba(212,168,67,0.5)',
          borderTop: 'none',
          borderRadius: '0 0 40px 40px',
          background: 'rgba(10,10,20,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Glass shine highlights */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 14,
            width: 16,
            height: 60,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            transform: 'rotate(-8deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 20,
            width: 8,
            height: 30,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 4,
            transform: 'rotate(5deg)',
          }}
        />
        {/* Lights */}
        {LIGHT_SLOTS.slice(0, lightCount).map((slot, i) => (
          <div key={i} className="prayer-jar-light" style={lightStyle(i, slot)} />
        ))}
      </div>
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
git add src/components/prayer-jar.tsx
git commit -m "feat: add PrayerJar component with CSS floating light animations"
```

---

## Task 5: LightsSky Component

**Files:**
- Create: `src/components/lights-sky.tsx`

- [ ] **Step 1: Create the LightsSky component**

Create `src/components/lights-sky.tsx`:

```typescript
'use client';

const SKY_SLOTS = [
  { top: 30, left: 10 }, { top: 38, left: 35 }, { top: 25, left: 60 }, { top: 42, left: 80 },
  { top: 18, left: 50 }, { top: 55, left: 15 }, { top: 48, left: 70 }, { top: 22, left: 25 },
  { top: 60, left: 45 }, { top: 35, left: 90 }, { top: 50, left: 5 }, { top: 28, left: 75 },
  { top: 45, left: 55 }, { top: 65, left: 30 }, { top: 15, left: 40 }, { top: 58, left: 85 },
  { top: 40, left: 20 }, { top: 32, left: 65 }, { top: 52, left: 50 }, { top: 20, left: 8 },
  { top: 62, left: 72 }, { top: 36, left: 42 }, { top: 46, left: 88 }, { top: 26, left: 58 },
  { top: 56, left: 28 }, { top: 44, left: 12 }, { top: 34, left: 78 }, { top: 68, left: 48 },
  { top: 24, left: 92 }, { top: 54, left: 62 }, { top: 16, left: 18 }, { top: 64, left: 82 },
  { top: 42, left: 38 }, { top: 30, left: 52 }, { top: 58, left: 8 }, { top: 48, left: 68 },
  { top: 22, left: 45 }, { top: 66, left: 22 }, { top: 38, left: 58 }, { top: 50, left: 78 },
];

const STAR_POSITIONS = [
  { top: 8, left: 15 }, { top: 12, left: 70 }, { top: 5, left: 45 }, { top: 20, left: 85 },
  { top: 15, left: 30 }, { top: 25, left: 60 }, { top: 3, left: 80 }, { top: 10, left: 52 },
  { top: 18, left: 10 }, { top: 7, left: 38 }, { top: 22, left: 72 }, { top: 14, left: 22 },
  { top: 28, left: 48 }, { top: 6, left: 65 }, { top: 30, left: 92 },
];

const FLOAT_ANIMS = ['light-float-a', 'light-float-b', 'light-float-c'];
const SIZES = [7, 8, 9, 10, 11, 12, 13];

function skyLightStyle(index: number, slot: { top: number; left: number }): React.CSSProperties {
  const floatAnim = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const floatDur = 2.5 + (index * 0.15) % 1.3;
  const pulseDur = 1.6 + (index * 0.19) % 0.8;
  const delay = (index * 0.41) % 2;
  const size = SIZES[index % SIZES.length];

  return {
    position: 'absolute',
    top: `${slot.top}%`,
    left: `${slot.left}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(255,230,140,1), rgba(212,168,67,0.5) 50%, transparent 70%)',
    boxShadow: '0 0 10px 3px rgba(212,168,67,0.4), 0 0 25px 6px rgba(212,168,67,0.15)',
    animation: `${floatAnim} ${floatDur}s ease-in-out infinite ${delay}s, light-pulse ${pulseDur}s ease-in-out infinite ${delay * 0.7}s`,
  };
}

export function LightsSky({ count }: { count: number }) {
  const lightCount = Math.min(count, 40);

  return (
    <div
      className="relative overflow-hidden rounded-xl mb-8"
      style={{
        background: 'linear-gradient(180deg, #04040a 0%, #080814 50%, #0c0c1a 100%)',
        minHeight: 200,
      }}
      aria-hidden="true"
    >
      {/* Star dots */}
      {STAR_POSITIONS.map((star, i) => {
        const twinkleDur = 2.4 + (i * 0.3) % 1.6;
        const delay = (i * 0.5) % 2;
        const size = i % 2 === 0 ? 2 : 1;
        return (
          <div
            key={`star-${i}`}
            className="sky-star"
            style={{
              position: 'absolute',
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'white',
              animation: `star-twinkle ${twinkleDur}s ease-in-out infinite ${delay}s`,
            }}
          />
        );
      })}
      {/* Floating lights */}
      {SKY_SLOTS.slice(0, lightCount).map((slot, i) => (
        <div key={i} className="sky-light" style={skyLightStyle(i, slot)} />
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
git add src/components/lights-sky.tsx
git commit -m "feat: add LightsSky component with floating lights and star field"
```

---

## Task 6: Homepage — Integrate Jar + Daily Verse

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Update the homepage**

Read `src/app/(public)/page.tsx` first.

Add imports at the top:

```typescript
import { PrayerJar } from '@/components/prayer-jar';
import { getDailyVerse } from '@/lib/daily-verse';
```

Add `const verse = getDailyVerse();` after `const stats = await getStats();`

Replace the hero `<section>` with:

```typescript
<section className="py-20 px-4 text-center max-w-2xl mx-auto">
  <h1 className="text-4xl font-bold tracking-tight mb-4">
    The Prayer Jar
  </h1>
  <p className="text-lg text-muted-foreground mb-8">
    A global place to share your heart and intercede for others.
    Every prayer matters. Every name is known by God.
  </p>

  <div className="flex justify-center mb-6">
    <PrayerJar count={stats.active} />
  </div>

  <p className="text-2xl font-bold text-primary mb-1">{stats.active}</p>
  <p className="text-sm text-muted-foreground mb-6">prayers in the jar</p>

  {/* Daily verse */}
  <div className="border-t border-b py-4 mb-8 max-w-md mx-auto">
    <p className="text-sm italic text-muted-foreground leading-relaxed">
      &ldquo;{verse.text}&rdquo;
    </p>
    <p className="text-xs text-primary mt-2">{verse.reference}</p>
  </div>

  <div className="flex flex-col sm:flex-row gap-3 justify-center">
    <PrayerDialog />
    <Button size="lg" variant="outline" render={<Link href="/pray" />}>Pray for Someone</Button>
  </div>
</section>
```

Update the Praise Wall CTA at the bottom of the page. Replace:

```typescript
<p className="text-muted-foreground mb-3">See what God has been doing</p>
<Button variant="ghost" render={<Link href="/praise-wall" />}>View the Praise Wall →</Button>
```

With:

```typescript
<p className="text-muted-foreground mb-3">See what God has been doing</p>
<Button variant="ghost" render={<Link href="/praise-wall" />}>View Lights Released →</Button>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/page.tsx"
git commit -m "feat: add prayer jar, daily verse, and lights released link to homepage"
```

---

## Task 7: Filtered Answered Prayers Server Action

**Files:**
- Modify: `src/services/prayer.service.ts`
- Create: `src/app/actions/praise.actions.ts`

- [ ] **Step 1: Add getAnsweredPrayersFiltered to prayer service**

In `src/services/prayer.service.ts`, add this function after the existing `getAnsweredPrayers`:

```typescript
export async function getAnsweredPrayersFiltered(
  period: 'week' | 'month' | 'all',
  category?: CategoryValue,
) {
  const conditions = [eq(prayers.status, 'answered')];
  if (category) conditions.push(eq(prayers.category, category));

  if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    conditions.push(gt(prayers.answeredAt, weekAgo));
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    conditions.push(gt(prayers.answeredAt, monthAgo));
  }
  // 'all' — no date filter

  return db
    .select()
    .from(prayers)
    .where(and(...conditions))
    .orderBy(prayers.createdAt);
}
```

Also add `gt` to the imports from `drizzle-orm` if not already there. Check the existing import line — it already imports `gt` (used in the homepage stats query), so no change needed.

- [ ] **Step 2: Create the server action**

Create `src/app/actions/praise.actions.ts`:

```typescript
'use server';

import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import type { CategoryValue } from '@/db/schema';

export async function getFilteredPraisesAction(
  period: 'week' | 'month' | 'all',
  category?: string,
) {
  const validCategory = category as CategoryValue | undefined;
  return getAnsweredPrayersFiltered(period, validCategory);
}
```

- [ ] **Step 3: Run tests and build**

```bash
npx vitest run && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/services/prayer.service.ts src/app/actions/praise.actions.ts
git commit -m "feat: add filtered answered prayers query and server action"
```

---

## Task 8: LightsReleasedClient Component

**Files:**
- Create: `src/components/lights-released-client.tsx`

- [ ] **Step 1: Create the client wrapper**

Create `src/components/lights-released-client.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LightsSky } from '@/components/lights-sky';
import { PraiseCard } from '@/components/praise-card';
import { getFilteredPraisesAction } from '@/app/actions/praise.actions';

type Prayer = Awaited<ReturnType<typeof getFilteredPraisesAction>>[number];

type Period = 'week' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

export function LightsReleasedClient({
  initialPrayers,
  category,
}: {
  initialPrayers: Prayer[];
  category?: string;
}) {
  const [period, setPeriod] = useState<Period>('month');
  const [prayers, setPrayers] = useState(initialPrayers);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip fetch on mount — we already have initialPrayers for 'month'
    if (period === 'month') {
      setPrayers(initialPrayers);
      return;
    }

    setLoading(true);
    getFilteredPraisesAction(period, category).then((result) => {
      setPrayers(result);
      setLoading(false);
    });
  }, [period, category, initialPrayers]);

  return (
    <>
      <LightsSky count={prayers.length} />

      {/* Time filter */}
      <div className="flex gap-2 mb-8">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <Button
            key={key}
            variant={period === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(key)}
            disabled={loading}
          >
            {label}
          </Button>
        ))}
      </div>

      {prayers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No answered prayers in this time period.</p>
          <p className="text-muted-foreground">
            Try a different filter or check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prayers.map((prayer) => (
            <div key={prayer.id} className="animate-fade-slide-up" style={{ opacity: 0 }}>
              <PraiseCard prayer={prayer} />
            </div>
          ))}
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
git add src/components/lights-released-client.tsx
git commit -m "feat: add LightsReleasedClient with time filter and sky integration"
```

---

## Task 9: Praise Wall Page — Integrate Sky, Verse, Filter

**Files:**
- Modify: `src/app/(public)/praise-wall/page.tsx`

- [ ] **Step 1: Rewrite the praise wall page**

Read `src/app/(public)/praise-wall/page.tsx` first.

Replace the entire file contents with:

```typescript
import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { getDailyVerse } from '@/lib/daily-verse';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LightsReleasedClient } from '@/components/lights-released-client';
import type { CategoryValue } from '@/db/schema';

export const metadata = { title: 'Lights Released | The Prayer Jar' };

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

  // Default period is 'month'
  const prayers = await getAnsweredPrayersFiltered('month', activeCategory);
  const verse = getDailyVerse();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Lights Released ✨</h1>
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

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/praise-wall/page.tsx"
git commit -m "feat: redesign praise wall as Lights Released with sky, verse, and time filter"
```

---

## Task 10: Rename Navigation — "Praise Wall" → "Lights Released"

**Files:**
- Modify: `src/components/mobile-nav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update mobile nav**

In `src/components/mobile-nav.tsx`, find the Praise `<Link>` block:

```typescript
<Star className="h-5 w-5" />
<span>Praise</span>
```

Replace with:

```typescript
<Star className="h-5 w-5" />
<span>Lights</span>
```

- [ ] **Step 2: Update desktop nav in layout**

In `src/app/layout.tsx`, find:

```typescript
<Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>Praise Wall</Button>
```

Replace with:

```typescript
<Button variant="ghost" size="sm" render={<Link href="/praise-wall" />}>Lights Released</Button>
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/mobile-nav.tsx src/app/layout.tsx
git commit -m "feat: rename Praise Wall to Lights Released in navigation"
```

---

## Task 11: Remove Old Stats Section from Homepage

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Remove the separate Stats section**

Read `src/app/(public)/page.tsx` first.

The jar now shows the active count visually. The separate Stats `<section>` with two cards ("Active prayer requests" and "Prayers answered") is redundant. Remove the entire `{/* Stats */}` section:

```typescript
{/* Stats */}
<section className="pb-16 px-4">
  <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
    ...
  </div>
</section>
```

Delete this entire block. The jar count below the jar replaces the "Active prayer requests" card. The "Prayers answered" stat can be added below the active count if desired, but per spec it's not required — the Lights Released page now shows answered prayers.

If you want to keep the answered count as a small line, add it after the "prayers in the jar" label:

```typescript
<p className="text-xs text-muted-foreground">{stats.answered} answered</p>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/page.tsx"
git commit -m "refactor: remove redundant stats section from homepage"
```

---

## Task 12: Final Verification & Deploy

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
- Homepage shows a large glass jar with floating amber lights
- Light count scales with active prayer count (capped at 30)
- Daily Bible verse appears below the jar in italics with amber reference
- "View Lights Released →" link at bottom of homepage
- `/praise-wall` page shows "Lights Released" heading
- Dark sky section at top with floating lights and star field
- Time filter bar (This Week / This Month / All Time) works — cards re-filter
- Daily Bible verse appears on Lights Released page too
- Mobile nav shows "Lights" instead of "Praise"
- Desktop nav shows "Lights Released" instead of "Praise Wall"

- [ ] **Step 4: Deploy**

```bash
vercel --prod
```

Expected: deployment succeeds.

- [ ] **Step 5: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete prayer jar visual redesign with Lights Released"
```
