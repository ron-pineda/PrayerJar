# UX Tightening Sprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Prayer Card, personalize the homepage for returning users, and fix UI/copy inconsistencies across the app.

**Architecture:** Three independent tracks shipped as 3 PRs in order: C (consistency cleanup), A (Prayer Card refactor), B (homepage personalization + profile restructure). Each PR is independently shippable.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, shadcn/ui, Sonner for toasts, Drizzle ORM + Neon Postgres.

**Spec:** `docs/superpowers/specs/2026-04-16-ux-tightening-design.md`
**Copy audit:** `docs/design/copy-audit-2026-04-15.md`

---

## Spec Deviations

1. **Loading skeletons already exist** for `my-prayers`, `journal`, `profile`, `notifications`. Spec Section 4.3 called for adding them — skip this task. Verified: all 4 `loading.tsx` files present.
2. **"Prayer Sent" is in `pray-for-button.tsx:63`**, not `/p/[id]/page.tsx` as spec suggested.
3. **Profile "Your Activity" has 8 link cards** at `profile/page.tsx:92-115` (one conditional for billing). Spec said "remove the 8 dashboard link cards."

---

## File Map

### Track C — Consistency + Copy
| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/components/prayer-form.tsx:115-127` | Replace native `<select>` with shadcn `<Select>` |
| Modify | `src/app/(public)/find-a-church/page.tsx:132-151` | Replace 2 native `<select>` with shadcn `<Select>` |
| Modify | `src/app/(dashboard)/settings/page.tsx:79-87` | Replace raw `<input>` with shadcn `<Input>` |
| Modify | `src/app/layout.tsx:115-131` | Add `flex-wrap` to footer links |
| Modify | `src/app/(public)/docs/page.tsx` | Strip gradients, oversized emoji, colored borders |
| Modify | `src/app/(public)/docs/features/page.tsx` | Same visual cleanup |
| Modify | `src/app/(public)/docs/guide/page.tsx` | Same visual cleanup |
| Modify | `src/app/(public)/docs/churches/page.tsx` | Same visual cleanup |
| Modify | `src/app/(public)/docs/paid/page.tsx` | Same visual cleanup |
| Modify | `src/components/notification-bell.tsx` | Add `aria-label` |
| Modify | `src/components/theme-toggle.tsx` | Add `aria-label` (verify file exists first) |
| Modify | `src/components/share-buttons.tsx` | Add `aria-label` to icon buttons |
| Modify | `src/components/mobile-nav.tsx:46-54` | "Lights" → "Answered" |
| Modify | `src/app/layout.tsx` | Desktop nav "Lights Released" → "Answered Prayers" |
| Modify | `src/app/(public)/page.tsx:173-204` | Secondary CTA "Lights Released" → "Answered Prayers" |
| Modify | `src/components/pray-for-button.tsx:63` | "Prayer Sent" → "I Prayed for This" |
| Modify | `src/app/(dashboard)/my-prayers/page.tsx:42-44` | "Manage your prayer requests" → "Your prayer requests" |
| Modify | `src/app/(dashboard)/my-prayers/page.tsx:36-39` | "Power Intercessor" → "Faithful Intercessor" |

### Track A — Prayer Card Refactor
| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/components/prayer-card.tsx` | Major refactor: overflow menu, dialogs, state cleanup |
| Create | `src/components/prayer-card-menu.tsx` | Client component: `...` overflow menu using shadcn DropdownMenu |
| Create | `src/components/prayer-edit-dialog.tsx` | Client component: edit form in shadcn Dialog |
| Create | `src/components/prayer-testimony-dialog.tsx` | Client component: mark-as-answered + optional testimony in Dialog |
| Create | `src/components/prayer-delete-dialog.tsx` | Client component: delete confirmation Dialog |
| Verify | All 7 render sites | Ensure refactored card works on every page |

### Track B — Homepage + Profile
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/services/homepage.service.ts` | 3 new queries for returning user data |
| Modify | `src/app/(public)/page.tsx` | Signed-in greeting bar + action cards, hide "How It Works" |
| Modify | `src/app/(dashboard)/profile/page.tsx:92-115` | Remove "Your Activity" link cards section |

---

## Track C: Consistency + Copy

### Task 1: Replace native selects with shadcn Select

**Files:**
- Modify: `src/components/prayer-form.tsx:115-127`
- Modify: `src/app/(public)/find-a-church/page.tsx:132-151`
- Modify: `src/app/(dashboard)/settings/page.tsx:79-87`

- [ ] **Step 1: Read the existing shadcn Select usage for reference**

Read `src/app/(public)/contact/page.tsx` — it uses `<Select>`, `<SelectTrigger>`, `<SelectValue>`, `<SelectContent>`, `<SelectItem>` correctly. Note the import path and usage pattern.

- [ ] **Step 2: Replace prayer-form.tsx native select**

Replace the native `<select>` at lines 115-127 with shadcn Select. The component is a client component using form state, so wire the `onValueChange` handler to update the form state the same way the native `onChange` did:

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select name="category" value={category} onValueChange={setCategory}>
  <SelectTrigger id="category" className="w-full">
    <SelectValue placeholder="Select a category" />
  </SelectTrigger>
  <SelectContent>
    {CATEGORIES.map((cat) => (
      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Read the file first to confirm the exact state variable name and CATEGORIES import before editing.

- [ ] **Step 3: Replace find-a-church page native selects**

Replace both native `<select>` elements at lines 132-151 with shadcn `<Select>`. This is a client component (`"use client"` directive should be present or it uses client-side state). Wire `onValueChange` to the same state setters the native `onChange` handlers used.

Read the file first — confirm the state variables are `denomination`/`setDenomination` and `sort`/`setSort`.

- [ ] **Step 4: Replace settings page raw input**

Replace the raw `<input>` at lines 79-87 with shadcn `<Input>`:

```tsx
import { Input } from '@/components/ui/input';

<Input id="name" name="name" type="text" defaultValue={user.name ?? ''} />
```

Read the file first to confirm the exact props and context.

- [ ] **Step 5: Verify in browser at 375px**

Run `npm run dev`. Open Chrome DevTools mobile emulator at 375px. Check:
- Prayer form: category dropdown renders correctly in dark mode
- Find a church: both dropdowns render correctly in dark mode
- Settings: name input matches other inputs on the page

- [ ] **Step 6: Commit**

```bash
git add src/components/prayer-form.tsx src/app/(public)/find-a-church/page.tsx src/app/(dashboard)/settings/page.tsx
git commit -m "fix: replace native select/input with shadcn components for dark mode consistency"
```

---

### Task 2: Fix footer overflow on mobile

**Files:**
- Modify: `src/app/layout.tsx:115-131`

- [ ] **Step 1: Read the footer section**

Read `src/app/layout.tsx` lines 115-131. Identify the container element wrapping the 8 links.

- [ ] **Step 2: Add flex-wrap**

Add `flex-wrap` to the className of the link container. Also add `justify-center` if not already present so the wrapped rows are centered:

```tsx
<div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
```

Read the file first to confirm the exact current className.

- [ ] **Step 3: Verify at 320px**

Open Chrome DevTools at 320px. Footer links should wrap into 2 rows naturally. No horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "fix: add flex-wrap to footer links to prevent mobile overflow"
```

---

### Task 3: Tone down docs visual language

**Files:**
- Modify: `src/app/(public)/docs/page.tsx`
- Modify: `src/app/(public)/docs/features/page.tsx`
- Modify: `src/app/(public)/docs/guide/page.tsx`
- Modify: `src/app/(public)/docs/churches/page.tsx`
- Modify: `src/app/(public)/docs/paid/page.tsx`

- [ ] **Step 1: Read all 5 docs pages**

Read each file. Identify:
- `bg-gradient-to-br` or `bg-gradient-to-*` classes (replace with solid `bg-card` or `bg-muted`)
- `border-blue-500/20`, `border-purple-500/20`, etc. (replace with `border` or `border-border`)
- `text-7xl` or `text-6xl` emoji (reduce to `text-3xl` or `text-4xl`)
- Numbered step cards with unique styling (replace with standard card pattern)

- [ ] **Step 2: Edit each file**

For each file, replace gradient backgrounds with `bg-card`, colored borders with `border`, and oversized emoji with `text-3xl`. Preserve all content text. The goal is to make these pages feel like the rest of the app, not a marketing site.

- [ ] **Step 3: Verify at 375px and desktop**

Check each docs page at mobile and desktop. Content should be readable, cards should match the rest of the app's aesthetic.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/docs/
git commit -m "fix: align docs pages with app visual language — remove gradients and oversized elements"
```

---

### Task 4: Add aria-labels to icon-only buttons

**Files:**
- Modify: `src/components/notification-bell.tsx`
- Modify: `src/components/share-buttons.tsx`
- Verify: `src/components/theme-toggle.tsx` (if exists)

- [ ] **Step 1: Read each file and find icon-only buttons**

Grep for `size="icon"` or icon-only `<Button>` / `<button>` elements that lack `aria-label`.

- [ ] **Step 2: Add aria-labels**

For each icon-only button, add a descriptive `aria-label`:

```tsx
// notification-bell.tsx
<Button variant="ghost" size="icon" aria-label="Notifications">

// share-buttons.tsx — copy link button
<button aria-label="Copy link to clipboard">

// theme-toggle.tsx
<Button variant="ghost" size="icon" aria-label="Toggle theme">
```

Read each file first to confirm the exact element. Also check `src/components/mobile-nav.tsx` for the Know Jesus elevated button — it may already have an aria-label (the Designer noted it does).

- [ ] **Step 3: Commit**

```bash
git add src/components/notification-bell.tsx src/components/share-buttons.tsx src/components/theme-toggle.tsx
git commit -m "fix: add aria-labels to icon-only buttons for screen reader accessibility"
```

---

### Task 5: Copy fixes — navigation labels and page copy

**Files:**
- Modify: `src/components/mobile-nav.tsx:46-54`
- Modify: `src/app/layout.tsx` (desktop nav)
- Modify: `src/app/(public)/page.tsx:173-204` (secondary CTAs section)
- Modify: `src/components/pray-for-button.tsx:63`
- Modify: `src/app/(dashboard)/my-prayers/page.tsx:36-44`

- [ ] **Step 1: Fix mobile nav "Lights" → "Answered"**

Read `src/components/mobile-nav.tsx`. At line 53, change `<span>Lights</span>` to `<span>Answered</span>`. The link still goes to `/praise-wall`.

- [ ] **Step 2: Fix desktop nav "Lights Released" → "Answered Prayers"**

Read `src/app/layout.tsx`. Find the desktop nav link to `/praise-wall`. Change label text from "Lights Released" to "Answered Prayers".

- [ ] **Step 3: Fix homepage secondary CTA**

Read `src/app/(public)/page.tsx` lines 173-204. Find the "Lights Released" CTA card. Change heading to "Answered Prayers". Update description text if it references "lights" metaphor — keep the link to `/praise-wall`.

- [ ] **Step 4: Fix "Prayer Sent" → "I Prayed for This"**

Read `src/components/pray-for-button.tsx`. At line 63, change the button text from "Prayer Sent" to "I Prayed for This".

- [ ] **Step 5: Fix my-prayers subtitle and label**

Read `src/app/(dashboard)/my-prayers/page.tsx`.
- Lines 42-44: Change "Manage your prayer requests and share testimonies." to "Your prayer requests and testimonies."
- Lines 36-39: Change "Power Intercessor" to "Faithful Intercessor".

- [ ] **Step 6: Apply remaining copy fixes from audit**

Read `docs/design/copy-audit-2026-04-15.md` for the full priority fix list. Apply fixes 6-10 in the same pass. Read each target file before editing.

- [ ] **Step 7: Verify navigation labels at 375px and desktop**

Check mobile nav shows "Answered" label. Check desktop nav shows "Answered Prayers". Check both link to `/praise-wall` correctly.

- [ ] **Step 8: Commit**

```bash
git add src/components/mobile-nav.tsx src/app/layout.tsx src/app/(public)/page.tsx src/components/pray-for-button.tsx src/app/(dashboard)/my-prayers/page.tsx
git commit -m "fix: copy improvements — clearer nav labels, warmer dashboard language, consistent prayer confirmation"
```

---

### Task 6: PR 1 — Track C final verification and push

- [ ] **Step 1: Run type check**

```bash
npx tsc --noEmit
```

Fix any type errors introduced by the shadcn component swaps.

- [ ] **Step 2: Full visual test at 320px, 375px, 428px, desktop**

Check every modified page:
- Prayer form category dropdown (dark mode especially)
- Find a church dropdowns
- Settings name input
- Footer wrapping at 320px
- All 5 docs pages
- Mobile nav "Answered" label
- Desktop nav "Answered Prayers" label
- My Prayers subtitle and label
- Pray-for-button post-prayer text

- [ ] **Step 3: Commit any remaining fixes and push**

```bash
git push origin feature/prayer-jar
```

---

## Track A: Prayer Card Refactor

### Task 7: Extract overflow menu component

**Files:**
- Create: `src/components/prayer-card-menu.tsx`

- [ ] **Step 1: Check shadcn DropdownMenu exists**

```bash
ls src/components/ui/dropdown-menu.tsx
```

If it doesn't exist, install it:
```bash
npx shadcn@latest add dropdown-menu
```

- [ ] **Step 2: Create the overflow menu component**

Create `src/components/prayer-card-menu.tsx` as a client component. It receives a `variant` prop — either `"own"` or `"community"` — and renders the appropriate menu items:

```tsx
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface PrayerCardMenuProps {
  variant: 'own' | 'community';
  onEdit?: () => void;
  onRenew?: () => void;
  onMarkAnswered?: () => void;
  onDelete?: () => void;
  onAdopt?: () => void;
  onReport?: () => void;
}

export function PrayerCardMenu({
  variant,
  onEdit,
  onRenew,
  onMarkAnswered,
  onDelete,
  onAdopt,
  onReport,
}: PrayerCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Prayer actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {variant === 'own' && (
          <>
            {onEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
            {onRenew && <DropdownMenuItem onClick={onRenew}>Renew for 30 days</DropdownMenuItem>}
            {onMarkAnswered && <DropdownMenuItem onClick={onMarkAnswered}>Mark as Answered</DropdownMenuItem>}
            {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete</DropdownMenuItem>}
          </>
        )}
        {variant === 'community' && (
          <>
            {onAdopt && <DropdownMenuItem onClick={onAdopt}>Adopt this prayer</DropdownMenuItem>}
            {onReport && <DropdownMenuItem onClick={onReport}>Report</DropdownMenuItem>}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Read `src/components/ui/dropdown-menu.tsx` first to confirm the exact export names. Adjust import path if needed.

- [ ] **Step 3: Commit**

```bash
git add src/components/prayer-card-menu.tsx
git commit -m "feat: add PrayerCardMenu overflow component for card refactor"
```

---

### Task 8: Extract edit dialog

**Files:**
- Create: `src/components/prayer-edit-dialog.tsx`

- [ ] **Step 1: Read existing edit form in prayer-card.tsx**

Read `src/components/prayer-card.tsx` lines 212-238. Note the exact form fields, state variables, and the save action it calls.

- [ ] **Step 2: Create the edit dialog component**

Create `src/components/prayer-edit-dialog.tsx` as a client component. Move the edit form fields from prayer-card.tsx into a `<Dialog>`. Props: `prayer` (current data), `open`, `onOpenChange`, `onSave` callback.

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PrayerEditDialogProps {
  prayer: { id: string; content: string; urgent: boolean; anonymous: boolean };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { content: string; urgent: boolean; anonymous: boolean }) => Promise<void>;
}

export function PrayerEditDialog({ prayer, open, onOpenChange, onSave }: PrayerEditDialogProps) {
  const [content, setContent] = useState(prayer.content);
  const [urgent, setUrgent] = useState(prayer.urgent);
  const [anonymous, setAnonymous] = useState(prayer.anonymous);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    await onSave({ content, urgent, anonymous });
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit prayer request</DialogTitle>
        </DialogHeader>
        {/* Form fields — read prayer-card.tsx edit form to get the exact fields and styling */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm"
        />
        {/* Urgent and anonymous toggles — match existing pattern from prayer-card.tsx */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Read `src/components/ui/dialog.tsx` to confirm exact export names. Read the existing edit form in `prayer-card.tsx` to get every field — the code above is a skeleton. The actual implementation must include every field the current inline form has (content, urgent toggle, anonymous toggle, and any others discovered).

- [ ] **Step 3: Commit**

```bash
git add src/components/prayer-edit-dialog.tsx
git commit -m "feat: add PrayerEditDialog for card refactor"
```

---

### Task 9: Extract testimony dialog and delete dialog

**Files:**
- Create: `src/components/prayer-testimony-dialog.tsx`
- Create: `src/components/prayer-delete-dialog.tsx`

- [ ] **Step 1: Read existing testimony form**

Read `src/components/prayer-card.tsx` lines 299-326. Note the testimony textarea, optional image/video upload fields, and the submit action.

- [ ] **Step 2: Create testimony dialog**

Same pattern as edit dialog. `<Dialog>` with `max-h-[90vh] overflow-y-auto`. Props: `prayerId`, `open`, `onOpenChange`, `onConfirm` callback. Include optional testimony text field and any media upload fields the current form has.

- [ ] **Step 3: Create delete dialog**

Simple confirmation dialog:

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PrayerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function PrayerDeleteDialog({ open, onOpenChange, onConfirm }: PrayerDeleteDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    await onConfirm();
    setPending(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete prayer request</DialogTitle>
          <DialogDescription>Are you sure? This can't be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/prayer-testimony-dialog.tsx src/components/prayer-delete-dialog.tsx
git commit -m "feat: add testimony and delete dialogs for card refactor"
```

---

### Task 10: Refactor prayer-card.tsx

**Files:**
- Modify: `src/components/prayer-card.tsx`

This is the core task. Read the full file before making changes.

- [ ] **Step 1: Read the full prayer-card.tsx**

Read all ~330 lines. Map every useState, every conditional block, every action handler. Understand what can be removed (inline forms, inline delete confirmation) and what moves to the new components.

- [ ] **Step 2: Remove inline edit form**

Remove the `showEdit` state variable and the edit form JSX block (lines ~212-238). Replace with:
- `editDialogOpen` state (`useState(false)`)
- `<PrayerEditDialog>` rendered at the bottom of the card, controlled by `editDialogOpen`
- The `onEdit` callback in the menu sets `editDialogOpen(true)`

- [ ] **Step 3: Remove inline testimony form**

Remove the `showTestimony` state variable and the testimony form JSX block (lines ~299-326). Replace with:
- `testimonyDialogOpen` state
- `<PrayerTestimonyDialog>` rendered at the bottom

- [ ] **Step 4: Remove inline delete confirmation**

Remove the `confirmDelete` state and the inline confirm/cancel buttons (lines ~280-295). Replace with:
- `deleteDialogOpen` state
- `<PrayerDeleteDialog>` rendered at the bottom

- [ ] **Step 5: Remove scattered action buttons, add overflow menu**

Remove the block of buttons at lines ~242-295 (Mark as Answered, Edit, Renew, Share Link, View, Delete). Replace with:

For **own prayer cards** (`isOwnPrayer === true`):
- Status indicator: `<span className="text-sm text-muted-foreground">Active · {daysLeft} days left</span>` (or "Answered ✨" / "Expired")
- `<PrayerCardMenu variant="own" onEdit={...} onRenew={...} onMarkAnswered={...} onDelete={...} />`

For **community prayer cards** (`isOwnPrayer !== true`):
- Primary CTA stays: the existing Pray button / AdoptPrayerButton
- Subtle share icon (keep existing share link button but make it icon-only)
- `<PrayerCardMenu variant="community" onAdopt={...} onReport={...} />`

For **Renew**: keep it as an inline action (no dialog). Call the existing renew handler, show Sonner toast:
```tsx
import { toast } from 'sonner';
toast('Renewed — expires in 30 days');
```

For **Adopt**: same — inline action with Sonner toast:
```tsx
toast('Added to your adopted prayers');
```

- [ ] **Step 6: Clean up removed state variables**

Remove useState calls that are no longer needed: `showEdit`, `editContent`, `editUrgent`, `editAnonymous`, `showTestimony`, `confirmDelete`, `showCelebration` (if celebration moves to testimony dialog), `imageUrl`, `videoUrl`, `videoDurationSeconds` (if media upload moves to testimony dialog).

Target: reduce from 17 useState calls to ~8.

- [ ] **Step 7: Verify card layout at 320px**

Run dev server. Test at 320px:
- Community card: content + Pray button + share icon + `...` menu. Nothing wraps.
- Own card: content + status text + `...` menu. Nothing wraps.
- All dialogs open correctly and scroll on small screens.

- [ ] **Step 8: Commit**

```bash
git add src/components/prayer-card.tsx
git commit -m "refactor: simplify PrayerCard — overflow menu, dialog forms, reduced state"
```

---

### Task 11: Verify all 7 render sites

**Files to check (read-only verification, fix if broken):**
- `src/app/(dashboard)/my-prayers/page.tsx`
- `src/app/(dashboard)/prayed-for/page.tsx`
- `src/app/(dashboard)/adopted/page.tsx`
- `src/app/(public)/browse/page.tsx` or `src/app/(public)/pray/` pages
- `src/app/(public)/p/[id]/page.tsx`
- Group prayer wall (grep for `PrayerCard` usage)
- Church prayer wall (grep for `PrayerCard` usage)

- [ ] **Step 1: Grep for all PrayerCard imports**

```bash
grep -r "import.*PrayerCard" src/ --include="*.tsx" -l
```

- [ ] **Step 2: Read each file and verify props are still compatible**

The refactored PrayerCard should accept the same props. Verify no render site passes props that were removed or depends on behavior that changed (e.g., inline edit form visibility).

- [ ] **Step 3: Fix any broken render sites**

If any site relied on the inline edit form being visible by default, or passed `showDelete` expecting inline confirmation — update it to work with the new dialog pattern.

- [ ] **Step 4: Visual test each page at 375px**

Navigate to each page in the browser. Confirm cards render correctly with the new layout.

- [ ] **Step 5: Commit fixes and push**

```bash
git add -A
git commit -m "fix: update PrayerCard render sites for new overflow menu pattern"
git push origin feature/prayer-jar
```

---

## Track B: Homepage Personalization + Profile

### Task 12: Backend — homepage queries

**Files:**
- Create: `src/services/homepage.service.ts`

- [ ] **Step 1: Read existing services for query patterns**

Read `src/services/interaction.service.ts` and `src/services/prayer.service.ts` to understand Drizzle query patterns, db import, and table references.

- [ ] **Step 2: Create homepage service with 3 queries**

```tsx
import { db } from '@/db';
import { prayers, prayerInteractions } from '@/db/schema';
import { eq, and, gte, count, sql } from 'drizzle-orm';

export async function getHomepageStats(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. How many people prayed for the user's requests in last 7 days
  const [prayedForMe] = await db
    .select({ count: count() })
    .from(prayerInteractions)
    .innerJoin(prayers, eq(prayers.id, prayerInteractions.prayerId))
    .where(
      and(
        eq(prayers.authorId, userId),
        gte(prayerInteractions.createdAt, sevenDaysAgo)
      )
    );

  // 2. Any prayers expiring within 7 days
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = await db
    .select({ count: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.authorId, userId),
        eq(prayers.status, 'active'),
        sql`${prayers.expiresAt} <= ${sevenDaysFromNow}`,
        sql`${prayers.expiresAt} > now()`
      )
    );

  // 3. One community prayer for the action card (reuse existing pattern)
  // Read the guided prayer service to find how it fetches a random prayer
  // and replicate that query here, excluding the user's own prayers

  return {
    prayedForMeCount: prayedForMe?.count ?? 0,
    expiringCount: expiringSoon[0]?.count ?? 0,
  };
}
```

Read the existing guided prayer service (grep for "random" or "shuffle" in services/) to find the community prayer query. Reuse it for the action card.

Read `src/db/schema.ts` to confirm exact column names for `prayers.expiresAt`, `prayers.status`, `prayers.authorId`, and the `prayerInteractions` join columns.

- [ ] **Step 3: Commit**

```bash
git add src/services/homepage.service.ts
git commit -m "feat: add homepage stats service for returning user experience"
```

---

### Task 13: Homepage — personalized greeting for signed-in users

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Read the full homepage**

Read `src/app/(public)/page.tsx`. Note: it already checks `const session = await auth()` at line 62. The personalization can branch on `session?.user`.

- [ ] **Step 2: Add the personalized greeting block**

After the session check, if `session?.user` exists:
- Call `getHomepageStats(session.user.id)` to get the stats
- Replace the hero section (lines ~74-112) with a compact greeting bar:

```tsx
{session?.user ? (
  <div className="text-center space-y-2 py-8">
    <h1 className="text-2xl font-bold">
      Good {getTimeOfDay()}, {session.user.name?.split(' ')[0] ?? 'friend'} 🙏
    </h1>
    <p className="text-muted-foreground">
      {stats.prayedForMeCount > 0
        ? `${stats.prayedForMeCount} ${stats.prayedForMeCount === 1 ? 'person' : 'people'} prayed for your requests this week`
        : 'Your prayers are with the community'}
      {stats.expiringCount > 0 && ` · ${stats.expiringCount} ${stats.expiringCount === 1 ? 'prayer needs' : 'prayers need'} renewal`}
    </p>
  </div>
) : (
  // Existing hero for signed-out users — keep exactly as-is
)}
```

Add a `getTimeOfDay()` helper (morning/afternoon/evening based on hour).

- [ ] **Step 3: Add two action cards below greeting**

Below the greeting, for signed-in users only:

```tsx
<div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto px-4">
  {/* Someone needs prayer */}
  <div className="rounded-lg border bg-card p-6 space-y-3">
    <h3 className="font-semibold">Someone needs prayer</h3>
    {/* Show a prayer snippet if available, or generic prompt */}
    <p className="text-sm text-muted-foreground line-clamp-2">
      {communityPrayer?.content ?? 'There are prayers waiting for your intercession.'}
    </p>
    <a href="/pray" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
      Pray for Them →
    </a>
  </div>

  {/* Your prayers */}
  <div className="rounded-lg border bg-card p-6 space-y-3">
    <h3 className="font-semibold">Your prayers</h3>
    <p className="text-sm text-muted-foreground">
      {activePrayerCount} active · {stats.expiringCount > 0 ? `${stats.expiringCount} expiring soon` : 'all healthy'}
    </p>
    <a href="/my-prayers" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
      View My Prayers →
    </a>
  </div>
</div>
```

- [ ] **Step 4: Hide "How It Works" for signed-in users**

Wrap the "How It Works" section (lines ~114-152) in a condition:

```tsx
{!session?.user && (
  // Existing "How It Works" section
)}
```

Keep Daily Verse and secondary CTAs visible for all users.

- [ ] **Step 5: Verify signed-in vs signed-out**

Test in browser:
- Signed out: full hero, stats, "How It Works", secondary CTAs — unchanged
- Signed in: compact greeting, two action cards, daily verse, secondary CTAs
- Mobile 375px: action cards stack vertically (single column)

- [ ] **Step 6: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat: personalized homepage for returning users — greeting, action cards, hide How It Works"
```

---

### Task 14: Profile page — remove nav cards

**Files:**
- Modify: `src/app/(dashboard)/profile/page.tsx:92-115`

- [ ] **Step 1: Read the profile page**

Read the full file. Identify the "Your Activity" section at lines 92-115.

- [ ] **Step 2: Remove the section**

Delete the "Your Activity" heading (line 92), the link cards array definition (lines 94-102), and the `.map()` render block (lines 103-115). These navigation items already exist in the user menu dropdown.

Keep: avatar, name, join date, stat cards, badge gallery.

- [ ] **Step 3: Verify at 375px**

Profile should feel clean — personal info + stats + badges. No "junk drawer" nav cards.

- [ ] **Step 4: Commit and push**

```bash
git add src/app/(dashboard)/profile/page.tsx
git commit -m "refactor: remove nav link cards from profile — navigation belongs in the menu"
git push origin feature/prayer-jar
```

---

## Post-Ship

### Task 15: Performance audit (after all 3 tracks deployed)

**Agent:** Performance Engineer

- [ ] **Step 1: Measure Core Web Vitals**

Use Vercel Analytics or Lighthouse on key pages:
- Homepage (signed-in and signed-out)
- My Prayers
- Browse / Guided Prayer
- Find a Church

- [ ] **Step 2: Measure bundle size delta**

Compare the Prayer Card chunk size before and after Track A refactor. The extraction of 3 dialog components should reduce initial card bundle.

- [ ] **Step 3: Report findings**

Document in `.agent-state/handoffs.md` any regressions or improvements. Flag anything that needs a follow-up fix.
