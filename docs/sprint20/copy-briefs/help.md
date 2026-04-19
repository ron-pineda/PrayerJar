# Copy Brief: /help

**Priority:** Standard (+ UX fix: section anchors)
**Treatment:** Full (visual + content) — copy is mostly preserved; focus is grouping + anchors + icons
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Client page (accordion needs `useState`). Title + subtitle with a "Contact us" link, then 5 accordion sections (Getting Started, Praying for Others, Community & Safety, Account & Settings, For Churches), each with 4 FAQs in a `<details>`-style accordion with `ChevronDown`. Bottom "Didn't find your answer?" CTA links to `/contact`. **5 emoji section icons:** 🙏 ✝️ 🛡️ ⚙️ ⛪. One banned-phrase hit:
- `help/page.tsx:115` — *"Paid plans **unlock** higher member limits, pastoral tools, analytics, and event walls."* (§7 #9, "unlock" = gamification register).

No other banned phrases. FAQ body copy is already reasonable — the scope here is grouping + anchors + icons, NOT rewriting FAQ answers.

## Voice notes for this page
- Keep existing FAQ bodies. They reference real product features (Prayer Partner, Quiet Hours, pastoral tiers) — replacing them risks introducing claims that drift from the actual product.
- The 5-section grouping is already good. Add anchor IDs so the jump-nav pills (per sprint spec + `pj-s20-09` description) work.
- Strip the 5 emoji, swap to Lucide, amber accent.
- Sentence-case section titles; keep FAQ question wording as-is.

## Hero
**Headline:** Help & FAQ
**Subheadline:** Common questions about The Prayer Jar. Still need help? [Contact us](/contact).
**Primary CTA:** (anchor nav below — see "Jump nav" section)
**Secondary CTA:** (none)

## Section copy

### Jump nav (new, directly below hero)
**Pattern:** 5 pill-style anchor links in a horizontal row (wraps on mobile). Each pill has Lucide icon + section name, links to `#anchor-id`.

**Pills:**
1. `[Sparkles] Getting started` → `#getting-started`
2. `[HandHelping] Praying for others` → `#praying-for-others`
3. `[Shield] Community & safety` → `#community-safety`
4. `[Settings] Account & settings` → `#account-settings`
5. `[Church] For churches` → `#for-churches`

### Section 1 — Getting started
**Anchor ID:** `getting-started`
**Heading:** Getting started *(sentence-case change from "Getting Started")*
**Icon:** `Sparkles` (h-5 w-5 text-amber-600)
**FAQs grouped here (existing, verbatim):**
- What is The Prayer Jar?
- Do I need to create an account?
- Is it really free?
- How do I submit a prayer request?

### Section 2 — Praying for others
**Anchor ID:** `praying-for-others`
**Heading:** Praying for others
**Icon:** `HandHelping` (h-5 w-5 text-amber-600)
**FAQs grouped here (existing, verbatim):**
- How do I pray for someone?
- Will the person know who prayed for them?
- What if I don't know what to pray?
- Can I leave a message for someone?

### Section 3 — Community & safety
**Anchor ID:** `community-safety`
**Heading:** Community & safety
**Icon:** `Shield` (h-5 w-5 text-amber-600)
**FAQs grouped here (existing, verbatim):**
- How is content moderated?
- What if I see something inappropriate?
- Can I keep my request private?
- What is the Prayer Partner feature?

### Section 4 — Account & settings
**Anchor ID:** `account-settings`
**Heading:** Account & settings
**Icon:** `Settings` (h-5 w-5 text-amber-600)
**FAQs grouped here (existing, verbatim):**
- How do I change my email notification settings?
- What are Quiet Hours?
- How do I delete my account?
- What data does The Prayer Jar store about me?

### Section 5 — For churches
**Anchor ID:** `for-churches`
**Heading:** For churches
**Icon:** `Church` (h-5 w-5 text-amber-600)
**FAQs grouped here (existing, verbatim, EXCEPT the "unlock" rewrite below):**
- What church features are available?
- How do I set up my church?
- Is there a free tier for churches? **← body needs the "unlock" rewrite**
- Who do I contact for a demo or enterprise pricing?

**FAQ body rewrite (this FAQ only — banned-phrase fix):**

> Original (current line 114–115): *"Small congregations can use the free tier with core features. Paid plans **unlock** higher member limits, pastoral tools, analytics, and event walls. See our For Churches page for details."*
>
> **Replacement:** *"Small congregations can use the free tier with core features. Paid plans add higher member limits, pastoral tools, analytics, and event walls. See our For Churches page for details."*

(One-word change: "unlock" → "add".)

### Bottom CTA block
**Heading:** Didn't find your answer?
**Body:** We typically respond within one business day.
**Primary CTA:** Contact support → `/contact` *(button text unchanged)*

## Verse strip (if used)
No verse strip. Reason: help/utility page. A verse here would feel ceremonial on an information-retrieval surface.

## Lucide icon suggestions
All covered above in section headings + jump nav. Summary:
- Section 1: `Sparkles`
- Section 2: `HandHelping`
- Section 3: `Shield`
- Section 4: `Settings`
- Section 5: `Church`
- Accordion chevron: `ChevronDown` (unchanged — already Lucide)
- Jump-nav pills: same icon per section, smaller size (h-4 w-4)

## Empty states (if applicable)
N/A — all FAQs render unconditionally.

## Banned-phrase audit
1. **"unlock"** — `help/page.tsx:115`: *"Paid plans **unlock** higher member limits…"* (§7 #9). → Replace with *"Paid plans add higher member limits…"* (proposed in Section 5 above).
2. None of the other 15 banned phrases appear in visible copy. (Note: FAQ body text references "AI-assisted moderation"–adjacent language, but the current help copy says "screened for content" without naming AI — on-brand per §7 #11 which targets "AI-Flagged Care" as a feature name, not all AI mentions.)

## Jar motif
**No.** Help/utility page. Brand guide §4.2 reserves the jar for hero/product-identity placements.

## Notes for Frontend
- **Section grouping is unchanged** — current 5 sections stay. This brief confirms their composition; the deliverable is anchor IDs + Lucide icons + sentence-case + the one banned-phrase fix.
- **Delete the `icon` string field** from each entry in the `SECTIONS` array. Replace with a `LucideIcon` ref. The `<span>{section.icon}</span>` line becomes `<section.icon className="h-5 w-5 text-amber-600" />`.
- **Add `id={section.anchor}` to each `<section>` element** so the jump-nav anchor links resolve.
- **Jump-nav pills:** add a new row above the 5 sections with 5 anchor-linked buttons (or `<a href="#...">` styled as pills). Per sprint `pj-s20-09` description: "Add jump-nav pills above accordion with anchor IDs per section." On mobile, pills should wrap or scroll horizontally — Frontend's call.
- **Sentence-case section headings:** "Getting Started" → "Getting started", "Praying for Others" → "Praying for others", "Community & Safety" → "Community & safety", "Account & Settings" → "Account & settings", "For Churches" → "For churches".
- **FAQ body change (one only):** the "Is there a free tier for churches?" answer on line 115 — change "unlock" to "add". No other FAQ body changes.
- **Wrap the 5 accordion sections in `<ScrollReveal delay={n * 80} />`.** Do not wrap the hero, jump nav, or the bottom "Contact support" card.
- **Do not add search.** Sprint scope is explicit: grouping + anchors only. No filter, no keyword match, no full IA rework.
- **Character limits:** pill labels ≤ 22 chars (safe); section headings ≤ 24 chars; hero copy unchanged length.
- **Verify Prayer Partner + Quiet Hours features exist** before shipping: confirmed in code (`src/services/partner.service.ts`, `src/lib/quiet-hours.ts`, `src/app/(dashboard)/partner/page.tsx`, `src/app/(dashboard)/settings/page.tsx`). FAQ text referencing both is accurate.
- **Metadata note:** current page is `'use client'` due to accordion state. If PM wants a `<title>` tag (currently commented out at line 4–5), move the metadata to the parent layout or refactor the accordion to a client island inside a server component. Out of scope for Copywriter — flagging for Frontend.