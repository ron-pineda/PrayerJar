# PrayerJar Brand Guide

**Version:** 1.0
**Last updated:** 2026-04-17
**Author:** Brand agent
**Status:** v1 — shipping for Sprint 17. v2 will absorb Designer's token unification and Copywriter's pass on in-app surfaces.

This guide governs how PrayerJar talks, looks, and sounds across every surface a user or pastor will touch. Downstream agents (Copywriter, Designer, Frontend, Content) work *from* this document. If something in the product conflicts with this guide, the guide wins until a newer version of this guide supersedes it.

---

## 1. Brand promise + positioning

**Promise (one-liner):**
> PrayerJar is a quiet place online where real prayers are held by real people.

**Positioning (elevator):**
PrayerJar is a prayer-first community product for believers and the churches that shepherd them. Individuals bring their burdens — anonymously if they need to — and find a handful of people praying with them, not for likes. Churches plug the same product into their congregational care so nobody falls through the cracks between Sundays. It is not a social network, not a ChMS, and not a broadcast channel. It is the digital equivalent of a jar on a kitchen counter that a family drops folded prayers into, read by the people who love them.

---

## 2. Audience

### Primary — individual believers
People who pray, or want to. They show up carrying something — a diagnosis, a marriage, a rebellious kid, a silence they can't name. They care about: being *heard* (not algorithmically ranked), being safe from scrolling strangers, knowing a human actually prayed, and seeing answered prayers as evidence that prayer matters. They are not looking for a social feed and will bounce hard from anything that smells like one.

### Secondary — churches and pastoral staff
Pastors, small-group leaders, care teams. They show up carrying *other people* — a congregation they are trying not to lose track of. They care about: not missing a crisis, equipping the prayer team without weaponizing data, a tool their elders will approve without a three-month procurement review, and cost that a ~$2M-budget church can justify. They will bounce hard from anything that sounds like Mailchimp, Salesforce, or a generic ChMS.

---

## 3. Voice attributes

Five adjectives. Each comes with a do-example (on-brand) and a don't-example (off-brand) drawn from the current codebase or a plausible near-miss.

### 3.1 Warm
We sound like a friend who shows up with a casserole, not a service rep.

- **Do:** "Someone is praying for you right now."
- **Don't:** "Your prayer request has been successfully submitted to our network."

### 3.2 Reverent
Prayer is the content. We handle it carefully. We do not hype it, gamify it, or decorate it with emoji.

- **Do:** "Held by 12 people this week."
- **Don't:** "3,412 prayers and counting! Join the movement!"

### 3.3 Specific
We name the thing. Numbers over adjectives. Nouns over buzzwords. A pastor's pain, a believer's 2am.

- **Do:** "Someone left a prayer request in the connect card on Sunday. It's Thursday. Does anyone on your care team know?"
- **Don't:** "Our platform helps you connect with your congregation and drive pastoral outcomes."

### 3.4 Faith-confident (not preachy)
This is a Christian product for Christian users. We do not apologize for it, and we do not perform it. One scripture in a mission-critical slot is authentic; three scriptures in a footer is a tract.

- **Do:** *"Bear one another's burdens, and so fulfill the law of Christ."* — Galatians 6:2 (placed once, as the reason the product exists)
- **Don't:** Scripture references as decorative dividers, section headers ending in "Amen!", a cross in every icon.

### 3.5 Plainspoken
Short sentences. No jargon. No hedging. Average sentence length on the homepage is ~14 words; other public pages must match.

- **Do:** "Prayer is always free. Plans unlock pastoral tools."
- **Don't:** "Our flexible subscription tiers are designed to empower your ministry with scalable, best-in-class tooling."

---

## 4. Visual motifs

### 4.1 Color — the two amber systems (honest state of the repo)

There are currently **two amber systems in tension** in this codebase. v1 documents both. Unifying them is a Sprint-18 Designer task.

**System A — OKLCH semantic tokens (source of truth for theme)**
Defined in `src/app/globals.css` as `--primary`, consumed by the pray-ring and candle-flicker animations. These are the values the app actually uses for `bg-primary`, `text-primary`, ring glows, etc.

| Role | Light mode | Dark mode | Usage |
|------|------------|-----------|-------|
| `--primary` | `oklch(0.50 0.14 54)` | `oklch(0.70 0.14 62)` | CTA buttons, active ring states, animated glows (`pray-ring`, `candle-flicker`, `count-flash`) |
| `--background` | `oklch(0.975 0.007 72)` (warm parchment) | `oklch(0.115 0.006 56)` (deep charcoal) | page background |
| `--card` | `oklch(0.945 0.008 70)` | `oklch(0.155 0.007 56)` | card surfaces |
| `--muted-foreground` | `oklch(0.47 0.012 63)` | `oklch(0.57 0.013 67)` | secondary text |

**System B — Tailwind's default amber palette (ad-hoc accents)**
Used directly in classNames across `src/**/*.tsx` for accents, pill badges, and highlight surfaces. These are Tailwind default values, not custom tokens.

| Class | Hex | Common usage in repo |
|-------|-----|----------------------|
| `amber-50` | `#FFFBEB` | light badge/background (e.g., `church/[slug]/events/page.tsx:80`) |
| `amber-100` | `#FEF3C7` | avatar + badge backgrounds (`my-prayers/page.tsx:35`) |
| `amber-300` / `amber-400` | `#FCD34D` / `#FBBF24` | card-hover borders, blockquote rules |
| `amber-500` | `#F59E0B` | icon color, docs section accents (`docs/paid/page.tsx:61`) |
| `amber-600` / `amber-700` | `#D97706` / `#B45309` | body-text emphasis in amber contexts |
| `amber-900/20` | rgba of `#78350F` @ 20% | border of the "sacred section" treatment on homepage (`page.tsx:217`) |
| `amber-950/10` | rgba of `#451A03` @ 10% | background of the same sacred section |

**Rule for v1:** do not invent new amber tokens. Use `--primary` for interactive states (buttons, rings, focus); use Tailwind `amber-*` for the "sacred strip" treatment and accent highlights already established on `/` and dashboard pages. When Designer unifies these in Sprint 18, this table gets replaced by a single accent-token table.

### 4.2 Jar motif

The jar is the product's central symbol. Real component: `src/components/prayer-jar.tsx`, used on the signed-out homepage hero (`src/app/(public)/page.tsx:90`) and signed-in homepage (`:142`). It animates the active prayer count with a warm inner glow (`prayer-jar-light`, see `globals.css:265`).

**When to use:**
- As the main hero visual on a top-level page (homepage, `/for-churches` hero).
- Next to a live count of prayers currently being held.
- Once per page at most. It's a seal, not a pattern.

**When NOT to use:**
- As a favicon-only cameo decoration in card corners. That reduces it to a logo swirl.
- Alongside a second jar anywhere on the same screen.
- On transactional emails (keep those text-first; the jar is a web-surface motif).

The jar does not appear on `/for-churches` today — this is the top visual-identity gap flagged in `docs/brand/sprint17-churches-page-brand-review-2026-04-17.md` §2 and is a Sprint-17 Frontend fix.

### 4.3 Verse strip

A bordered strip containing one scripture, placed where a mission statement would go. Current inline implementation on the homepage:

```tsx
// src/app/(public)/page.tsx:164-170
<div className="border-t border-b py-4 mb-8 max-w-md mx-auto">
  <p className="text-sm italic text-muted-foreground leading-relaxed">
    &ldquo;{verse.text}&rdquo;
  </p>
  <p className="text-xs text-primary mt-2">{verse.reference}</p>
</div>
```

Scripture text is sourced daily via `src/lib/daily-verse.ts`.

**Conventions:**
- Italic body copy at `text-sm`, `muted-foreground` color, typographic quotation marks (`&ldquo;`/`&rdquo;`), never straight quotes.
- Reference at `text-xs` in `text-primary`, placed *below* the verse, no dash separator.
- Horizontal rules top and bottom (`border-t border-b`), centered, max-width `max-w-md` on mobile-first pages, `max-w-lg` for wider page contexts.
- **One verse per page.** Multiple verses on a page drops us into tract register.

*To define (Sprint-18 Frontend task):* extract this into a `<VerseStrip verse={...} />` component so the churches page and other public pages stop re-implementing it inline. Guide this component to accept a single `verse: { text, reference }` prop and render exactly this layout.

### 4.4 ScrollReveal

Animation wrapper for on-scroll entry. Component: `src/components/scroll-reveal.tsx` — a single `<div>` that fades and slides up 16px when it enters the viewport (`fade-slide-up` keyframe, `globals.css:182`). Accepts a `delay` prop in ms.

**Usage patterns:**
- Wrap each feature tile, tier card, testimonial, or section header that sits below the fold.
- Stagger with `delay={n * 80}` (80–120ms between siblings) for a gentle cascade, not a parade.
- Never wrap the above-the-fold hero — that content should render immediately.
- Honors `prefers-reduced-motion` automatically (see `globals.css:251`). Do not reimplement.

### 4.5 Icons

**Outlined, consistent, one set.** `lucide-react` is already a dependency (see `notifications/notification-group.tsx:11`, `testimony/[id]/page.tsx:40`, etc.) and is the canonical icon set.

**Do:** Lucide outlined icons at `h-5 w-5` for body contexts, `h-6 w-6` for feature tiles, colored via `text-primary` or `text-amber-500/600` depending on emphasis.

**Don't:** Emoji as feature-card icons. The `/for-churches` page uses `🛡️ 🧭 🤖 📺 🎨 📊` today (`src/app/(public)/for-churches/page.tsx` FEATURES array). These read as Slack, not sanctuary. Sprint-17 `pj-s17-for-churches-build` replaces them.

---

## 5. Tier-naming convention

**Recommendation:** rename the paid tiers from `Starter / Pro / Enterprise` to **`Small Church / Growing Church / Network`**. `Free` stays `Free`.

### Rationale
The current names describe *price* ("Starter is cheap, Pro is expensive"). The recommended names describe *who the tier is for* ("a small church, a growing church, a multi-site network"). A pastor self-qualifying into the right tier costs us zero sales calls; a pastor who has to read four bullet lists to figure out which Stripe-template tier fits them costs us the funnel.

### Current state in code
`src/lib/plans.ts` defines:
```ts
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
```
with `PLANS.starter.name = 'Starter'`, `PLANS.pro.name = 'Pro'`, `PLANS.enterprise.name = 'Enterprise'`.

**Rename is Backend's scope, not Brand's.** The migration happens inside `pj-s17-plans-gating-fix`, which is blocked on Strategist's final tier map in `pj-s17-tier-redesign`.

### Ask for Strategist
Adopt `Free / Small Church / Growing Church / Network` in `docs/strategy/pricing-prayerjar-2026-04.md`, or explicitly justify deviating. Acceptance criterion on `pj-s17-tier-redesign` already wires this in ("uses the tier-name convention from the brand guide OR explicitly justifies deviating from it").

### Migration considerations (for Backend in Sprint 18+)
- `PlanTier` literal type needs decision: keep internal `'starter'|'pro'|'enterprise'` slugs (no DB migration) and change only the display `name`, OR migrate the slugs too (cleaner long-term, requires a data migration on `church.plan_tier` column).
- Preference: keep slugs, change names. Lowest blast radius.
- Every hard-coded display string of "Starter"/"Pro"/"Enterprise" needs an audit — Legal's hotfix notes flag `docs/paid:89` and `docs/churches:78` as drift risks.

---

## 6. "Most Popular" rule

**Replace generic popularity badges with concrete who-it's-for claims.** No pastor believes vendor "most popular" claims; they read as marketing theater. A falsifiable fit-statement builds trust.

### Pattern
> **Best for churches `[N]`–`[M]` members.**

### Approved variants (use verbatim)
- **Small Church card:** "Best for churches under 150 members."
- **Growing Church card:** "Best for churches 150–500 members."
- **Network card:** "Best for multi-site churches and denominations."

### Forbidden
- "Most Popular" (anywhere).
- "Recommended" (no basis — recommended by whom?).
- "Best Value" (price-frame, not fit-frame).
- Starbursts, "Hot," "New," "Limited time."

The Small/Growing/Network labels also let us drop the badge entirely on `Free` and `Network` cards — only the middle tier needs a fit-statement to anchor the comparison.

---

## 7. Banned phrases

Phrases the codebase currently uses (or is at risk of using) that break voice. Each has a rationale. Not exhaustive — if it *sounds* like B2B template copy, it probably is.

| # | Banned phrase / pattern | Where (if in repo) | Why |
|---|---|---|---|
| 1 | "gives your [X] the tools to [Y]" | `for-churches/page.tsx:68-69` | Salesforce-shaped sentence. Template B2B. Pastors aren't "given tools"; they are carrying people. |
| 2 | "churches that want pastoral tools" | `for-churches/page.tsx:104` | "Want" is hollow. Replace with what pastors actually carry. |
| 3 | "Set up your church in minutes." | `for-churches/page.tsx:246` | HubSpot-grade. Divorced from what the product is. |
| 4 | "Bring your [X] online" | `for-churches/page.tsx:65` (H1) | Every ChMS says this. No keyword signal, no faith register. |
| 5 | "platform" (as in "our platform helps you…") | Not currently present — pre-empt | Tells you we're a vendor, not a neighbor. Say "PrayerJar" or name the actual surface. |
| 6 | "empower," "empowers" | Pre-empt | Consulting-deck vocabulary. Replace with the specific thing the user can now do. |
| 7 | "leverage" (as a verb) | Pre-empt | Business-school. There is no humane sentence that needs it. |
| 8 | "solutions" | Pre-empt | SaaS tell. We ship a product, not a solution. |
| 9 | "unlock" (as in "unlock features") | Pre-empt | Gamification register. Prayer is not a loot drop. |
| 10 | "seamless," "streamlined," "robust," "best-in-class" | Pre-empt | Template adjectives. Adjective salad signals nothing. |
| 11 | "AI-Flagged Care" (as a headline or feature name) | Already removed per `pj-s17-hotfix-ai-claim` | Implies the software decides who needs care. Scary to pastors. Keep AI quiet-surface, not a tier name. |
| 12 | "Most Popular" | Pre-empt on `/for-churches` | See §6. Replace with fit-statement. |
| 13 | "Join the community / movement" | Pre-empt | Social-network register. PrayerJar is not a community product in that sense. |
| 14 | Emoji feature icons (🛡️ 🧭 🤖 📺 🎨 📊) | `for-churches/page.tsx` FEATURES array | Slack register, not sanctuary. Use Lucide outlined icons. |
| 15 | Three-or-more scripture references on one page | Pre-empt | Tract register. One scripture, placed where a mission statement would go. |
| 16 | "Amen!" as a button label, heading, or exclamation | Pre-empt | Performative faith. We don't need to shout. |

---

## 8. Usage by context

### 8.1 Marketing pages — `/`, `/for-churches`, `/pricing`
Faith-confident but not preachy. One verse per page, placed where a mission statement would go. Jar motif once, in the hero. Amber accents applied to the "sacred section" treatment (`border-amber-900/20 bg-amber-950/10`) around the verse strip and primary CTA region. Feature descriptions name the pain before the feature ("Someone left a prayer request on Sunday. It's Thursday. Does anyone know?"). Tier cards use the Small Church / Growing Church / Network naming and the fit-statement pattern from §6. Pastors buy on social proof — a real pilot testimonial with name, church, city, photo is worth more than three bullet lists.

### 8.2 In-app copy — dashboards, forms, empty states
Warm and specific. Empty states name what the user should do next in one sentence ("No prayers yet. Add your first one — your group sees it, nobody else does."). Button labels use verbs, not nouns ("Pray for this" not "Pray"). Confirmation toasts reverent, not celebratory ("Your prayer is posted." not "Nice! Your prayer is live."). Error messages lead with what happened and what the user can do, not with "Oops!" Form labels use the noun the user would say out loud ("Who is this for?" not "Subject (optional)"). Counts are always specific ("Held by 12 people" not "A few people are praying").

### 8.3 Transactional email — morning digest, magic-link, notifications
Text-first, no jar motif, no scripture decoration (the morning-email template already has verse-strip logic — keep one verse, as the thesis, same rule as web). Subject lines ≤ 6 words, specific ("3 people prayed for you yesterday" not "Your daily PrayerJar update"). Body copy short: one paragraph, one CTA, one signature. No marketing footer, no social icons, no "unsubscribe or manage your preferences" lawyer-sludge — a single, plain unsubscribe link. Magic-link emails are the most no-voice surface in the product: "Click this link to sign in. It expires in 15 minutes. — PrayerJar" is correct; anything warmer is noise on a transactional surface.

---

## 9. Reference copy examples

Three worked examples showing on-brand voice applied.

### 9.1 Hero headline + subhead (for `/for-churches`)

> **No one falls through the cracks between Sundays.**
>
> PrayerJar is the prayer wall your congregation already wanted — private, safe, and built around care. Your pastoral team sees who's carrying what. Your members know they are prayed for by name.

(Compare to current L65: *"Bring your church's prayer life online"* — bland, ChMS-shaped, says nothing specific.)

### 9.2 Tier card (Growing Church)

> **Growing Church — $49/month**
> *Best for churches 150–500 members.*
>
> - Unlimited members and groups
> - Pastoral dashboard — see who needs care this week
> - Pastoral notes and prayer-team assignments
> - Live event prayer wall
> - Custom branding
>
> Cancel anytime. No card needed to start.

(Compare to current L136–202: generic "Pro" tier with a "Most Popular" sticker.)

### 9.3 Feature description (Pastoral Care Inbox)

> **Pastoral Care Inbox**
>
> Someone left a request on Sunday. You want to know before Thursday. The Care Inbox surfaces unprayed-for requests quietly to your care team — no ranking, no AI decisions, just a list of people your team hasn't reached yet. You decide who follows up.

(Compare to a generic template version: *"Our AI-powered pastoral inbox empowers your care team to efficiently triage incoming prayer requests with best-in-class filtering."* — every banned phrase at once.)

---

## 10. Revision log

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-17 | Brand agent | Initial guide. Promotes Sprint-17 churches-page review (`docs/brand/sprint17-churches-page-brand-review-2026-04-17.md`) into a durable brand spec. Documents the two-amber-systems state; recommends Small Church / Growing Church / Network tier names; establishes banned-phrases list and "Best for churches N–M" fit-statement rule. |

### Queued for v2 (after Sprint 17 ships)
- Designer unifies OKLCH `--primary` and ad-hoc Tailwind `amber-*` into a single accent-token scale.
- Copywriter's pass on every in-app surface with this guide in hand (empty states, toasts, form labels).
- Extracted `<VerseStrip>` component replaces the inline verse markup on `/` and `/for-churches`.
- Full typography section (font families, scale, weights) once Designer lands the type system.
- "What This Brand Is NOT" section expanded (Brand role spec §Self-Review requires 3–5 explicit anti-patterns; v1 distributes these across §3 don'ts and §7 banned phrases — v2 consolidates into a dedicated section).
