# Sprint 20 Design Spot-Check

**Reviewer:** Designer
**Date:** 2026-04-18
**Pages reviewed:** /know-jesus (pj-s20-02), /give (pj-s20-03)

Scope: visual + brand compliance spot-check on the two HIGH-priority pages Sprint 20 gated behind Designer sign-off before Reviewer flips final. Source of truth: `docs/brand/brand-guide.md` (voice §3, motifs §4, banned phrases §7) and the per-page briefs in `docs/sprint20/copy-briefs/`.

---

## /know-jesus (pj-s20-02)

**Verdict:** APPROVED

Files reviewed:
- `src/app/(public)/know-jesus/page.tsx` (commit `7e065dd`)
- `src/components/salvation-client.tsx` (commit `7e065dd`)

### Per-criterion verdict

- **Amber palette:** PASS. Sacred-strip treatment (`border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20`) applied to the "Find a community" next-step card (`salvation-client.tsx:162`). Church icon uses `text-amber-600` (`:164`). No off-brand emerald/slate residue — the previously-flagged green-on-slate block is gone.
- **Lucide icons:** PASS. `Church` at `h-5 w-5 text-amber-600` inline before the "Find a community" heading (`:164`); `HandHelping` at `h-4 w-4` inside the "Ask someone to pray for you" button (`:186`). Sizes and colors match the brief exactly. `SalvationCross` custom component retained as the central visual — correct per brief.
- **ScrollReveal stagger:** PASS. Hero (`page.tsx:15-21`) and cross+count (`salvation-client.tsx:39-43`) render immediately — no above-fold wrapping. Five gospel sections cascade 0/80/160/240/320ms — gentle, not a parade. Post-decision blocks at 400/480ms feel earned, not delayed.
- **Verse strip:** PASS (deliberately absent). Brief §7 #15 resolution — 5 gospel scriptures ARE the page substance; adding a sixth verse strip would trip the tract-register threshold. Drop confirmed.
- **No emoji:** PASS. Verified via codepoint grep of `salvation-client.tsx` — no emoji in the file. Previously-flagged 🙏 in the welcome line removed.
- **No banned phrases:** PASS. Grepped the 16 banned phrases from brand-guide §7 against both files — zero hits. Note: "Amen" inside the prayer block (`:124`) is prayer content, not a button/heading label, so §7 #16 does not apply.
- **Jar motif placement:** PASS. No jar on this page — brand §4.2 + brief both explicit. The cross is the page's central visual.
- **Copy matches brief:** PASS. Verified headline ("Know Jesus"), subhead ("You don't have to have it all together…"), count label ("lives changed here"), all 5 gospel headings, prayer block, welcome line ("Welcome home{, name}."), "Find a community" card copy, and both CTAs ("Find a church near you" sentence-case, "Ask someone to pray for you"). All exact.
- **Hierarchy:** PASS. Hero → cross + count → 5 gospel sections → prayer → decision form → post-decision next-step cards. Reads as a single flow, not a stack of widgets.
- **Accessibility:** PASS. Heading hierarchy is h1 → h2 (gospel sections) → h3 (next-step card). Inline icons are decorative and carried by visible text labels — screen reader flow not broken. No icon-only controls.

### Open question resolutions

- **PrayerJar CTA `href="/"` fallback (vs inline `<PrayerDialog />`):** ACCEPTABLE FOR SHIP. The brief explicitly permits the fallback; signed-out home surfaces `<PrayerDialog />` immediately, so the user pays one extra click, not a feature gap. Wiring inline `<PrayerDialog />` here requires a client-side refactor of the post-decision block (currently within `SalvationClient` which already is a client component — feasibility is fine, but not blocking). Backlog a small follow-up ticket for the inline wiring; do NOT block Sprint 20 close on it.

---

## /give (pj-s20-03)

**Verdict:** APPROVED

Files reviewed:
- `src/app/(public)/give/page.tsx` (commit `dacf006`)

### Per-criterion verdict

- **Amber palette:** PASS. Success banner uses `border-amber-500/30 bg-amber-500/10` with `text-amber-700 dark:text-amber-300` for the "Thank you" heading (`:75-81`). `HandHelping`, `Check`, and `HeartHandshake` icons all at `text-amber-600`. Consistent with brand §4.1 System B (Tailwind amber accent). Amount-grid selected state uses `border-primary bg-primary` (OKLCH token) — correct split between "sacred" (amber accents) and "interactive" (primary token).
- **Lucide icons:** PASS. `HandHelping` h-6 w-6 (`:96`), `Lock` h-3.5 w-3.5 text-muted-foreground (`:190`), `Check` h-5 w-5 text-amber-600 (`:77`), `HeartHandshake` h-6 w-6 text-amber-600 (`:127`). All sizes/colors match the brief line-for-line.
- **ScrollReveal stagger:** PASS. Hero (`:61-69`) renders immediately. Below-fold sections staggered 0/80/160/240/320ms — success banner, "What your gift does", verse, form, reassurance, footer. Cascade feels deliberate. One nuance: both the success banner AND "What your gift does" use `delay={0}` — when the success banner renders, they enter in the same frame, which is fine since they're visually separated and never fight for attention.
- **Verse strip:** PASS. Single Psalm 24:1 with plain `border-t border-b` matching the homepage pattern. See open-question #3 below for alignment reasoning.
- **No emoji:** PASS. Verified via codepoint grep of `give/page.tsx` — no emoji in the file. Previously-flagged 🙏 on success banner and coming-soon card both removed, replaced with `Check` and `HeartHandshake` respectively.
- **No banned phrases:** PASS. Grepped the 16 banned phrases from brand-guide §7 — zero hits. Previously-flagged "platform" removed; coming-soon body now reads "keeping PrayerJar free for everyone who uses it" (`:134-135`).
- **Jar motif placement:** PASS. No jar component on this page — brand §4.2 "once per page, homepage owns it." Hero headline ("Keep the jar on the counter.") carries the motif verbally, which is on-brand without visual duplication.
- **Copy matches brief:** PASS. Hero headline (28 chars), subhead, "What your gift does" heading + body (verified 2am / "next person who arrives carrying something heavy" / "There never will be."), reassurance ("Secure payment through Stripe. No account required. One-time gift."), success banner ("Thank you." / "Your gift is received…"), coming-soon ("Giving opens soon" / "setting up secure giving…"), footer ("Questions? Contact us."). All exact. Tax-deductibility line correctly omitted per PM decision.
- **Hierarchy:** PASS. Hero → success banner (conditional) → "What your gift does" → verse → amount grid → primary CTA → reassurance → footer. Hero reads first and earns the ask before the preset grid shows up, which was the sprint's explicit complaint about the prior state.
- **Accessibility:** PASS. Amount buttons use `<fieldset>` with `sr-only` legend ("Choose a gift amount"), `aria-pressed` for selection state, and visible focus-ring via `focus-visible:ring-2`. Error message uses `role="alert"`. Reassurance icon decorative; text label is primary. H1 → H2 → H2 (success heading is a `<p>` with `text-lg font-medium` — acceptable since it's inside an alert-like banner, not a document section).

### Open question resolutions

- **Success-state pitch block (should "What your gift does" hide after `?success=1`?):** KEEP VISIBLE. Rationale: (a) a just-donated user arriving on `/give?success=1` via Stripe redirect benefits from re-anchoring on what their gift does, not hiding it; (b) users can also land on `/give?success=1` via bookmark, refresh, or deep link — if the thesis is hidden, the page collapses into a thank-you with no narrative; (c) the preset amount grid below is the actual "ask" — after success, it reads as "give again if you want" which is gentle, not pushy. No action needed. Optional backlog follow-up: if analytics show post-success bounce off the preset grid, consider conditionally hiding the `{!stripeConfigured ? ... : (<ScrollReveal>...amount grid...</ScrollReveal>)}` block when `success=true` — but that's a data-driven decision, not a brand decision. Do NOT block Sprint 20 close.

- **"What your gift does" alignment (centered heading, left-aligned body in max-w-md):** CORRECT AS-IS. The heading is a centered label/anchor (icon + H2) and works as a visual beacon. The body is a paragraph written to be *read* — left-aligned body text in a narrow column is measurably more readable than centered body, and aligns with brand voice §3.5 (plainspoken, not marketing-shaped). A fully-centered body paragraph would read as B2B hero copy. Ship as-is; do not unify.

- **Verse strip treatment (plain `border-t border-b` vs sacred-strip `border-amber-900/20 bg-amber-950/10`):** PLAIN IS CORRECT. Two reasons: (1) the brief explicitly instructs "use the established pattern from brand guide §4.3" which IS the plain `border-t border-b` treatment — verified against `src/app/(public)/page.tsx:160-165` (homepage). (2) Sacred-strip (amber-washed panel) is reserved for CTA regions and stat blocks where the amber wash signals "this is the thesis surface" — verse strips specifically are meant to be quiet mission-statement substitutes, not highlighted boxes. Using sacred-strip on a donation-page verse would tip from "reverent quote" toward "sanctified marketing frame," which reads off. Ship as plain. Approved.

---

## Follow-up tickets (suggested, non-blocking)

These do NOT block Sprint 20 close. Backlog for a future sprint.

1. **Inline `<PrayerDialog />` on /know-jesus PrayerJar CTA** (S21 or later). Currently uses `href="/"` fallback — acceptable but costs a page load. Requires importing PrayerDialog into `salvation-client.tsx` and swapping the button. Small, self-contained, would match the pattern on `/about` and homepage.

2. **Post-success UX on /give** (only if analytics warrant). Consider conditionally hiding the preset-amount grid (not the "What your gift does" thesis) after `?success=1` to avoid an implied "please give again" immediately after a gift. Data-driven — wait for analytics on post-success bounce before acting.

3. **Extracted `<VerseStrip>` component** (already queued in brand-guide §4.3 "queued for v2"). `/give`, signed-out home, and other pages each inline the same verse-strip markup. A single component would eliminate drift risk (e.g., someone accidentally using sacred-strip on a verse in a future sprint). Out of scope for S20; carries into Brand v2 / S21.

---

## Sign-off

**Designer approves both pj-s20-02 and pj-s20-03 for Reviewer final.**

Neither page has a brand or visual regression. Both pages honor the Sprint 19 design direction (amber palette, Lucide icons, no emoji, clean copy, ScrollReveal cascade, verse-strip-once) and the specific constraints of their surface (no jar on evangelism/donation pages per §4.2; 5 scriptures on /know-jesus is a deliberate §15 exception called out in the brief; verse strip on /give uses plain §4.3 pattern). Leaving both tasks at `status: review` for Reviewer to flip to `done`.
