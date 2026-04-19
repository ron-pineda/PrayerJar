# Sprint 20 — Full Visual Audit (Public Pages) Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit and update every public/pre-login page not covered in Sprint 19 to match the design direction established in Sprint 19 — amber palette, Lucide icons, no emoji, clean copy, brand-guide voice.

**Scope:** Public/pre-login pages only. Authenticated user pages (dashboard, settings, billing, etc.) are Sprint 21.

**Brand authority:** `docs/brand/brand-guide.md` — Copywriter and Frontend both work from this document. It is the source of truth for voice, visual motifs, banned phrases, and tier naming.

---

## Pages in Scope

### Full treatment (visual + content refresh)

| Page | Priority | Notes |
|------|----------|-------|
| `/know-jesus` | HIGH | Evangelism surface. Warm + specific, not a tract. No jar in hero — this page is about Jesus, not the product. PrayerJar as the "first step" CTA only. |
| `/give` | HIGH | Donation page. Copy earns the ask before making it. Name why the product matters first. |
| `/about` | Standard | Brand storytelling. Jar motif once. One verse strip. Clear banned phrases. |
| `/browse` | Standard | Discovery/search. Strip emoji from filters and empty states. Warm empty states. |
| `/find-a-church` | Standard | Church directory. Visual consistency, strip emoji, warm zero-results empty state. |
| `/world-prayer` | Standard | Heavy emoji — strip all. Amber palette. Remove any "join the movement" language. |
| `/contact` | Standard | Simple form. Warm intro copy. Plain form labels ("What's on your mind?" not "Subject (optional)"). |
| `/help` | Standard + UX fix | Visual pass + FAQ accordion grouping with anchor links. No search, no full restructure. |

### Light pass (visual consistency only, no content changes)

| Page | Notes |
|------|-------|
| `/sign-in` | Amber palette, no emoji, consistent header. OAuth button copy unchanged. |
| `/docs` | Amber palette, consistent nav. No content changes. |

### Skipped

- `/docs/privacy`, `/docs/terms`, `/docs/community-guidelines` — legal boilerplate, content is locked.

---

## Design Direction (inherited from Sprint 19)

Fully established in Sprint 19. Do not reinvent — apply consistently.

**Amber palette:**
- Emphasis text: `text-amber-600 dark:text-amber-400`
- Sacred strip: `border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20`
- Interactive states (buttons, rings, focus): `text-primary` / `bg-primary` (OKLCH semantic token)

**Icons:** Lucide outlined icons only. `h-5 w-5` body, `h-6 w-6` feature tiles. Color via `text-primary` or `text-amber-500/600`.

**Jar motif:** Once per page, hero only, with a live count. Not on /know-jesus (product motif inappropriate there).

**Verse strip:** One per page max. Pattern:
```tsx
<div className="border-t border-b py-4 mb-8 max-w-md mx-auto px-4">
  <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
    &ldquo;{verse}&rdquo;
  </p>
  <p className="text-xs text-primary mt-2 text-center">{reference}</p>
</div>
```

**ScrollReveal:** Wrap all below-fold sections. Stagger siblings with `delay={n * 80}`. Never wrap the hero.

**No emoji:** Anywhere in visible text — headings, body, labels, buttons, empty states.

---

## Team & Task Structure

### Roles

| Agent | Responsibility |
|-------|---------------|
| PM | Sprint kickoff, creates all tasks in tasks.json as `proposed` |
| Architect | Spec, task sequencing, handoff coordination |
| Copywriter | Copy brief per page — works from `docs/brand/brand-guide.md` |
| Frontend | Visual + markup implementation per page |
| Designer | Spot-check on /know-jesus and /give (high-stakes layout decisions) |
| QA | Visual regression + brand compliance across all pages |
| Reviewer | Final approval per task in tasks.json |

### Task flow per page

```
Copywriter (copy brief) → Frontend (visual + markup) → QA → Reviewer
```

Multiple pages run in parallel. Copywriter and Frontend are never blocked across different pages — while Frontend implements page N, Copywriter writes the brief for page N+1.

**Constraint:** Frontend cannot start a page until the Copywriter's brief for that page is complete. The brief is a short doc (not a full task) committed to `docs/sprint20/copy-briefs/<page>.md`.

### Recommended parallelism

Copywriter writes all 8 briefs first (one task), then Frontend implements all 8 pages (one task per page, parallelizable). This avoids the hand-off overhead of per-page Copywriter→Frontend coordination.

---

## Success Criteria

A page is done when all of the following are true:

1. **No emoji** in any visible text (headings, body, labels, empty states, buttons, alt text)
2. **Lucide icons** replace any emoji used as feature icons or decorative elements
3. **Amber palette** applied — `text-amber-600 dark:text-amber-400` for emphasis, sacred strip treatment where contextually appropriate
4. **Banned phrases cleared** — all 16 from `docs/brand/brand-guide.md §7` (no "platform," "empower," "seamless," "unlock," "leverage," "solutions," "join the movement," etc.)
5. **Copy voice** — warm, specific, plainspoken, faith-confident per brand guide §3
6. **One verse strip max** per page, using the established pattern above
7. **ScrollReveal** wraps all below-fold sections with `delay` stagger (80–120ms between siblings)
8. **Mobile view** passes visual check (no overflow, no broken layout)
9. **QA signed off** in tasks.json
10. **Reviewer approved** in tasks.json (`status: done`)

---

## What This Sprint Is NOT

- **Not** a redesign of authenticated user pages (Sprint 21)
- **Not** a full restructure of /help (accordion grouping only — no search, no new information architecture)
- **Not** a jar placement on /know-jesus (the jar is a product motif; this page is about Jesus)
- **Not** a new component library (reuse ScrollReveal, PrayerJar, existing Shadcn/base-ui components)
- **Not** a Copywriter pass on in-app surfaces (toasts, empty states inside the app) — that's brand guide v2 scope
- **Not** a tier rename migration (Small Church / Growing Church / Network) — that's Backend scope, already tracked

---

## Known Carry-Overs from Sprint 19

Two PM decisions deferred from Sprint 19 that may affect Sprint 20 copy:

1. **"Active" vs "Submitted" label** in the personal stats strip on the signed-in homepage — `activePrayerCount` shows only current active prayers, not lifetime submitted. The label currently reads "Active." If PM decides to change to "Submitted," that's a one-line Frontend fix.
2. **`LightEscapeAnimation` named export** — currently a CSS class only, not a React component export from `prayer-jar.tsx`. Accepted debt; no Sprint 20 action required unless a page needs it.

---

## Revision Log

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-18 | PM (brainstorming) | Initial spec. Sprint 20 full visual audit of public pages. |
