# Sprint 24 — Signed-In Surface Design Audit

**Task:** pj-s24-08-signedin-design-audit
**Author:** Designer
**Date:** 2026-07-19
**Authority:** `docs/brand/brand-guide.md` (voice §3, palette §4.1, jar §4.2, verse strip §4.3, icons §4.5, banned phrases §7, in-app copy §8.2) and `docs/design/clay-vessel-spec.md`.
**Reference pattern:** Sprint 20 refreshed public pages (Lucide not emoji, amber palette, sentence-case CTAs, `ArrowRight`/`ArrowLeft` Lucide instead of text arrows — see `src/app/(public)/browse/page.tsx` and `docs/sprint20/design-spotcheck.md`).

This is a **static code audit** (local dev/build is broken on this machine — see memory). Every finding is a delta spec: Frontend applies the "Change to" column verbatim, no interpretation needed. All paths relative to `D:\Claude\projects\PrayerJar`.

**Two blanket rulings up front** (so Frontend doesn't guess):

1. **No verse strips on signed-in utility pages.** Brand §8.2 governs in-app surfaces (warm + specific, no marketing motifs). §4.3 verse strips belong where a mission statement would go — marketing pages. None of the 9 audited pages should gain one. `/pray` already carries reverence via the clay vessel hero; adding a verse would double the motif.
2. **Semantic status colors stay, decorative rainbow goes.** Green = "verified/active", red = "rejected", amber = "answered/pending" are semantic state colors and stay (e.g. the 501(c)(3) badge on the church dashboard, the Active pill on prayer cards). Decorative multi-hue icon coloring (the notifications rainbow) is palette drift and goes.

---

## 1. /pray — `src/app/(public)/pray/page.tsx` + `src/components/category-picker.tsx`

### 1.1 Emoji category grid → Lucide (HIGH)
`src/components/category-picker.tsx:5-9` defines 10 emoji category icons (🩺 👨‍👩‍👧 💼 🕊️ 🙏 🧭 ❤️ ⚡ ✨ 📖) rendered at `:27`, plus a standalone 🙏 for "Any" at `:18`. Brand §4.5: "Emoji as feature-card icons … read as Slack, not sanctuary."

**Change to:** the exact Lucide mapping already shipped on `/browse` (`src/app/(public)/browse/page.tsx:35-46`):

| category | Lucide icon |
|---|---|
| any | `LayoutGrid` |
| health | `HeartPulse` |
| family | `Users` |
| financial | `Wallet` |
| grief | `Feather` |
| gratitude | `Sparkles` |
| guidance | `Compass` |
| relationships | `Heart` |
| work_career | `Briefcase` |
| spiritual_growth | `Leaf` |
| other | `Star` |

Render as `<Icon className="h-6 w-6 text-amber-600 mb-1" aria-hidden="true" />` (feature-tile size per §4.5). **Extract the map once** to `src/lib/category-icons.ts` and import it in both `category-picker.tsx` and `browse/page.tsx` so the two grids cannot drift.

### 1.2 Deprecated `mode="slips"` prop (LOW)
`src/app/(public)/pray/page.tsx:35` passes `mode="slips"` to `<PrayerJar>`. Per clay-vessel-spec §4.1 the prop is deprecated and silently collapses to lights. **Change to:** delete the `mode="slips"` line. No visual change; this is the call-site sweep the spec queued.

### 1.3 Text arrow + Title Case CTA (LOW)
`src/app/(public)/pray/page.tsx:49`: `Browse Prayer Requests →`. Sprint 20 pattern is sentence case + Lucide arrow. **Change to:** `Browse prayer requests` followed by `<ArrowRight className="h-4 w-4" aria-hidden="true" />` inside the button (import `ArrowRight` from `lucide-react`).

### 1.4 Subhead voice (MEDIUM)
`src/app/(public)/pray/page.tsx:42`: "Choose a category and intercede for a real request from the community." — "the community" edges toward social-network register (§7 #13 adjacent) and the sentence is instruction-shaped, not warm. **Change to (verbatim):**
> `Pick a category. A real request from a real person is waiting.`

### 1.5 Explicit passes (no change)
- Clay vessel hero with `countLabel="{n} requests waiting"` — on-brand, specific (§8.2), keep.
- H1 "Someone wrote this for you." — keep, it is the best line on the signed-in surface.
- No ScrollReveal needed: entire page is above-fold utility.
- No verse strip (blanket ruling 1).

---

## 2. /my-prayers — `src/app/(dashboard)/my-prayers/page.tsx` (+ shared `src/components/prayer-card.tsx`, §10 below)

### 2.1 "Answered ✨" section heading (HIGH)
`src/app/(dashboard)/my-prayers/page.tsx:73-74`: `Answered ✨ ({answered.length})`. §3.2: we do not decorate prayer with emoji. **Change to:** `Answered ({answered.length})` — keep the existing `text-amber-700 dark:text-amber-400` classes; the amber color alone is the celebration.

### 2.2 Empty-state copy + pattern (MEDIUM)
`:47-55` inlines its own empty state instead of using `src/components/empty-state.tsx`, and the description "When you submit a prayer, it will appear here." is passive system-speak (§8.2 wants the next action named). **Change to:** use `<EmptyState>` with:
- icon: `<Heart size={24} />` (unchanged)
- title: `No prayers yet`
- description (verbatim): `Add your first request — real people will pray for it by name.`
- Keep the `<PrayerDialog />` trigger below it (EmptyState's `action` prop takes an href; here keep the dialog as a sibling exactly as today, or extend EmptyState to accept a ReactNode action — Frontend's choice, visual result identical).

### 2.3 Explicit passes
- "Faithful Intercessor" amber pill (`:35`) — correct System B amber badge, keep.
- Section structure Active/Answered/Expired — keep.
- Card-level emoji issues are in `prayer-card.tsx` — see §10.

---

## 3. /profile — `src/app/(dashboard)/profile/page.tsx`

### 3.1 🙏 avatar fallback (HIGH)
`:37`: `<span aria-hidden="true">🙏</span>` as the no-photo avatar. **Change to:** `<User className="h-7 w-7 text-primary" aria-hidden="true" />` (import `User` from `lucide-react`). Do NOT use `PrayerJarMark` here — the mark is the product logo, not a person.

### 3.2 🔥 streak decoration (HIGH)
`:62`: `Day streak {user.currentStreak >= 7 ? "🔥" : ""}`. Fire-streak is gamification register (§3.2 "we do not … gamify it"). **Change to:** remove the conditional entirely — the label is just `Day streak`. The number is the celebration (§3.3, numbers over adjectives).

### 3.3 Zero-badge state (LOW)
`:68` hides the Badges section entirely when `badges.length === 0`. A brand-new user sees stats and nothing else — no pointer to what comes next (§8.2 empty states name the next step). **Change to:** when `badges.length === 0`, render the section header "Badges" with one muted line (verbatim): `None yet — they arrive quietly as you pray.` and keep the "View all" link pointing to `/badges`.

### 3.4 Explicit passes
- Stats cards use `text-primary` on numbers — correct System A usage, keep.
- Fallback display name "Intercessor" (`:41`) — on-register, keep.

---

## 4. /journal — `src/app/(dashboard)/journal/page.tsx`

### 4.1 Green "✓ Answered" (HIGH)
`:61`: `<span className="text-xs text-green-600 font-medium">✓ Answered</span>`. Two violations: text checkmark instead of Lucide, and green where "answered" is amber everywhere else (my-prayers heading, prayer-card STATUS_COLORS, praise surfaces). **Change to:**
```tsx
<span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
  <Check className="h-3 w-3" aria-hidden="true" /> Answered
</span>
```
(import `Check` from `lucide-react`).

### 4.2 "[Anonymous prayer]" placeholder (MEDIUM)
`:53`: bracketed system text reads like a log line, not a held prayer. **Change to (verbatim):** `An anonymous request` (italic styling unchanged, no brackets, no quotes).

### 4.3 Unconditional ellipsis (LOW)
`:53`: `` `"${prayer.content.slice(0, 120)}..."` `` appends `...` even when content is under 120 chars, and uses straight quotes where §4.3 conventions want typographic. **Change to:** only append `…` (single ellipsis character) when `prayer.content.length > 120`, and wrap in `&ldquo;`/`&rdquo;`.

### 4.4 Explicit passes
- Empty state uses `<EmptyState>` + `BookOpen` with action to `/pray` — this is the model the other pages should copy. No change.
- Card header (category label + date, `text-xs text-muted-foreground`) — consistent, keep.

---

## 5. /notifications — `src/app/(dashboard)/notifications/page.tsx` + `notification-group.tsx`

### 5.1 Rainbow icon palette (HIGH)
`src/app/(dashboard)/notifications/notification-group.tsx:9-17` colors the 9 type icons rose-500, blue-500, amber-500, yellow-500, purple-500, muted, green-500, indigo-500, amber-500. Six non-amber accent hues on one list is the largest palette drift on the signed-in surface (§4.1: `--primary` for interactive, amber for accents — nothing else). **Change to** this exact table (all at `h-4 w-4`):

| type | icon | class |
|---|---|---|
| someone_prayed | `Heart` | `text-amber-600` |
| message_received | `MessageCircle` | `text-amber-600` |
| prayer_answered | `Sparkles` | `text-amber-600` |
| badge_earned | `Award` | `text-amber-600` |
| partnership_request | `Users` | `text-primary` |
| partnership_ended | `UserMinus` | `text-muted-foreground` |
| chain_joined | `Link2` | `text-primary` |
| group_joined | `Users2` | `text-primary` |
| testimony_posted | `BookOpen` | `text-amber-600` |

Reading: amber = prayer happened (sacred accents), primary = people/connection events (interactive register), muted = endings. Unread dot stays `bg-primary` (`:66`) — already correct.

### 5.2 Celebratory exclamations (MEDIUM)
- `notification-group.tsx:12`: `'You earned a new badge!'` → **change to** `You earned a new badge.` (§8.2: reverent, not celebratory).
- `page.tsx:70`: `You're all caught up!` → **change to** `You're all caught up.`

### 5.3 Explicit passes
- Empty state (Bell at `h-10 w-10 opacity-40`, two-line copy) — structure fine once the exclamation is fixed.
- Today / This Week / Older grouping and "Mark all read" ghost button — keep.

---

## 6. /badges — `src/app/(dashboard)/badges/page.tsx` + `src/components/badge-display.tsx`

### 6.1 Fourteen emoji badge icons (HIGH — worst single component on the surface)
`src/components/badge-display.tsx:6-19`: every badge is an emoji (🕯️ 🙏 🛡️ 🛡️ 🏆 💛 🧡 ❤️ 🔥 ⚡ ⭐ 📖 🤝 💝), rendered `text-3xl` at `:40`. **Change to** Lucide, rendered `<Icon className="h-8 w-8 text-amber-600" aria-hidden="true" />` (locked cards keep the existing `opacity-30 grayscale` treatment which will mute the amber correctly):

| badge | Lucide icon |
|---|---|
| first_light | `Flame` |
| first_prayer | `HandHelping` |
| intercessor_bronze | `Shield` |
| intercessor_silver | `Shield` |
| intercessor_gold | `Trophy` |
| encourager_bronze | `MessageCircle` |
| encourager_silver | `MessageCircle` |
| encourager_gold | `MessageCircleHeart` |
| faithful | `Sunrise` |
| devoted | `CalendarHeart` |
| witness | `Star` |
| testimony | `BookOpen` |
| community_builder | `Users` |
| donor | `Gift` |

(Bronze/silver share an icon by design — the tier lives in the name, exactly as it does today with the doubled 🛡️. Do not invent per-tier colors; §4.1 forbids new amber tokens.)

Change the `icon: string` field to `icon: LucideIcon` and render `<meta.icon … />`.

### 6.2 "Locked:" tooltip (MEDIUM)
`badge-display.tsx:37`: `title={… 'Locked: ${meta.name}'}`. "Locked/unlock" is loot-drop register (§7 #9). **Change to:** `Not yet earned: ${meta.name}`. (Earned variant `Earned: ${meta.name}` is fine, keep.)

### 6.3 Explicit passes
- `/badges/page.tsx` itself is clean: specific counts ("Current streak: 12 days · 5 badges earned") is §3.3 done right. Keep.

---

## 7. /saved-churches — `src/app/(dashboard)/saved-churches/page.tsx`

Cleanest page on the surface — all Lucide, no emoji, no banned phrases, empty state names the next action.

### 7.1 Title Case buttons (LOW)
`:24-26` "Find More" and `:36` "Find a Church". Sprint 20 CTA convention is sentence case ("Find a church near you" on /know-jesus). **Change to:** `:24` → `Find more churches`; `:36` → `Find a church`.

### 7.2 Empty-state pattern (LOW)
`:29-37` inlines its own empty state. Copy is good — keep it verbatim — but migrate to `<EmptyState icon={<Bookmark size={24} />} title="No saved churches yet" description="Save churches from the Church Finder to keep track of ones you want to visit." action={{ label: "Find a church", href: "/find-a-church" }} />` for consistency with /journal.

### 7.3 Explicit passes
- Card rows (MapPin, ExternalLink, saved date) — keep as-is.

---

## 8. /settings — `src/app/(dashboard)/settings/page.tsx`

Structurally strong: consistent Card/CardHeader/CardTitle/CardDescription rhythm, zero emoji, zero palette drift.

### 8.1 "Danger Zone" (MEDIUM)
`:251`: `<CardTitle className="text-destructive">Danger Zone</CardTitle>`. GitHub/gamer register, not warm (§3.1). **Change to:** title `Delete account` (keep `text-destructive` class and the `border-destructive/40` card border). Description at `:253` already says exactly what happens — keep verbatim.

### 8.2 "Suppress notifications" (LOW)
`:175`: "Suppress notifications during a time window so you are not disturbed while sleeping." — "Suppress" is system vocabulary. **Change to (verbatim):** `Pause notifications overnight so nothing wakes you.`

### 8.3 Explicit passes
- All form labels use the noun the user would say (§8.2): "Someone prays for your request", "You earn a badge" — keep.
- Email frequency options with specific rate ("max 1 per 15 min") — §3.3 specific, keep.

---

## 9. Church dashboard — `src/app/(church)/church/[slug]/(admin)/dashboard/page.tsx`

### 9.1 Banned phrase: "Upgrade to unlock it." (HIGH — §7 #9)
`:57-58`: "The Pastoral Dashboard is available on the {PASTORAL_DASHBOARD_TIER_NAME} plan and above. Upgrade to unlock it." "Unlock" is banned (gamification register — "prayer is not a loot drop"). **Change to (verbatim):**
> `The Pastoral Dashboard is included on the {PASTORAL_DASHBOARD_TIER_NAME} plan and above.`

…and let the existing "View plans" link (`:61`) carry the CTA. Do not add an upgrade verb to the sentence.

**Same string recurs on 5 sibling gates + 2 other surfaces** — sweep them in the same commit (identical replacement, adjusting the feature noun):
- `dashboard/care/page.tsx:49`
- `dashboard/testimony/page.tsx:56`
- `dashboard/groups/page.tsx:50`
- `dashboard/team/page.tsx:147`
- `(admin)/events/page.tsx:82` ("Upgrade to unlock events" → `Events are included on the … plan`)
- `src/app/(dashboard)/billing/page.tsx:114,117` ("Upgrade to unlock church features" → `Church features — private prayer walls and pastoral tools — are included on paid plans.` / button label `View church plans`)
- `src/app/(public)/docs/churches/page.tsx:309` ("plans unlock pastoral tools" → `paid plans include pastoral tools`)

### 9.2 Text arrows → Lucide (MEDIUM)
- `:41, :68, :92`: `← Back to {church.name}` → `<ArrowLeft className="h-4 w-4" aria-hidden="true" />` inline before the text (wrap link content in `inline-flex items-center gap-1`).
- `:125, :132, :139, :146, :169`: trailing `<span …>→</span>` on the five quick-nav cards → `<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />`.

### 9.3 Quick-nav cards lack icons (LOW — polish parity)
The five nav cards (`:120-170`) are text-only where every Sprint 20 card row leads with a Lucide icon. **Change to:** add a leading icon per card at `h-5 w-5 text-amber-600`: Flagged Prayers `Flag`, Care Inbox `Inbox`, Prayer Team `Users`, Synced Groups `RefreshCw`, 501(c)(3) Verification `BadgeCheck`.

### 9.4 Explicit passes
- 501(c)(3) status badge green/amber/red (`:156-162`) — semantic status colors, keep (blanket ruling 2).
- Stats grid (uppercase `text-xs` labels + `text-3xl` numbers) — consistent card-header pattern, keep.
- Access-restricted and tier-gate layouts — fine once 9.1 lands.

---

## 10. Shared component: `src/components/prayer-card.tsx` (renders on /my-prayers, /journal-adjacent surfaces, /browse, /p/[id])

Fixing this file pays off on every page that lists prayers.

### 10.1 Emoji category icon (HIGH)
`:22-26` duplicate emoji map, rendered `text-xl` at `:134`, fallback 📖 at `:43`. **Change to:** import the shared Lucide map from §1.1 (`src/lib/category-icons.ts`), render `<Icon className="h-5 w-5 text-amber-600" aria-hidden="true" />`, fallback `Star`.

### 10.2 ✝️ before suggested verse (HIGH)
`:168`: `✝️ {prayer.suggestedVerse}`. §3.4 don't-example is literally "a cross in every icon." **Change to:** drop the cross entirely — the italic `text-xs text-muted-foreground` styling already signals scripture. No replacement icon.

### 10.3 "Answered ✨" status line (MEDIUM)
`:200`: `'Answered ✨'` → **change to** `'Answered'` (the amber Testimony block below already celebrates).

### 10.4 Explicit passes
- STATUS_COLORS (`:28-32`): answered amber correct; active green + expired gray are semantic states — keep (blanket ruling 2).
- `hover:shadow-amber-500/10` card hover (`:128`) — on-palette, keep.
- Toast copy ("Renewed — expires in 30 days", "Report submitted — thank you") — reverent + specific, keep.

Also sweep the same emoji category map in `src/components/praise-card.tsx:10-16` (and its `✨ Testimony` label at `:37` → `Sparkles` Lucide `h-3.5 w-3.5 text-amber-600`) — same fix, same shared map.

---

## Prioritized rollup

### Findings by category
| Category | Count (distinct findings) | Notes |
|---|---|---|
| 1. Emoji → Lucide | 9 | ~40 emoji instances total; concentrated in `badge-display.tsx` (14), `category-picker.tsx` (11), `prayer-card.tsx` (12 incl. fallback + ✝️ + ✨) |
| 2. Banned phrases (§7) | 1 phrase, 9 occurrences | "unlock" (§7 #9) on the dashboard gate + 8 siblings |
| 3. Palette drift | 2 | notifications rainbow (6 off-palette hues), journal green "Answered" |
| 4. Clay vessel / mark | 1 | deprecated `mode="slips"` on /pray; no 🫙 or glass jar residue found on audited pages (mark shipped correctly) |
| 5. Voice / copy drift | 8 | exclamations ×2, "Danger Zone", "Locked:", "[Anonymous prayer]", /pray subhead, "Suppress", ellipsis/quotes |
| 6. Empty states | 4 | my-prayers copy+pattern, profile zero-badge gap, saved-churches pattern (copy fine), notifications (copy only) |
| 7. Missing Sprint 20 polish | 4 | text arrows ×2 pages, Title Case CTAs ×2 pages, dashboard nav cards missing icons |
| **Total** | **29 delta specs** | |

### Worst pages (fix in this order)
1. **/badges** (`badge-display.tsx`) — 14 emoji in the single most gamification-prone surface, plus "Locked:" register. One component rewrite clears it.
2. **/pray** (`category-picker.tsx`) — 11 emoji on the primary prayer entry point, the highest-traffic signed-in surface; plus deprecated jar prop. The shared `category-icons.ts` extraction here also fixes `prayer-card.tsx` and `praise-card.tsx`.
3. **Church dashboard** — the only §7 banned-phrase violation on the surface ("Upgrade to unlock it."), repeated across 6 gate screens pastors actually hit; plus text-arrow chrome. Highest severity per finding even though the count is lower.

Then: **/notifications** (palette drift), **/my-prayers + prayer-card** (partially fixed by #2), **/profile**, **/journal**, **/settings**, **/saved-churches** (near-pass).

### Adjacent findings (out of scope, log for backlog)
- `src/app/(public)/error.tsx:12`, `src/app/(church)/error.tsx:12`, `src/app/global-error.tsx:13` still use 🙏 where `src/app/error.tsx` and `not-found.tsx` were correctly migrated to `<PrayerJarMark>` (clay-vessel-spec §7). Same one-line swap ×3.
- `src/components/check-in-pulse.tsx:10-13,79,91` (mood emoji + 🙏 💙), `src/components/guided-prayer.tsx:99,212,223`, `src/components/onboarding-overlay.tsx:256`, `src/components/feedback-widget.tsx:126` (💬), `src/components/prayer-search-bar.tsx:110` (🚨) — signed-in-adjacent components with the same emoji debt; suggest a follow-up task `pj-s24-xx-shared-component-emoji-sweep`.
- `<VerseStrip>` component (brand-guide §4.3 "queued for v2", re-flagged in Sprint 20 spotcheck) still does not exist in `src/`. Not needed for this audit's pages, but the debt remains on public pages.
