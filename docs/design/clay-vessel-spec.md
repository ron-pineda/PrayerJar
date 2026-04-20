# Design Spec: Clay Vessel (PrayerJar brand anchor)

**Date:** 2026-04-19
**Feature:** Replace the translucent glass jar (`src/components/prayer-jar.tsx`) with an earthen clay / terracotta vessel holding abstract amber lights and a soft overflow glow rising from the rim.
**Task refs:** pj-s22-23-designer-jar-visual-refresh (this spec) → pj-s22-24-frontend-jar-swap (implementation)
**Decision:** **Approved with changes.** The clay direction is a clear brand win; the changes below (1) resolve the deferred Sprint-18 amber-token unification, (2) anchor the vessel to the real OKLCH parchment token, (3) extend the mark swap to every emoji-🫙 surface, and (4) close the API questions Frontend would otherwise have to guess at.

---

## 1. Brand rationale (§3 + §4 of brand-guide)

The current glass jar is correct-enough but slightly lifestyle-product. It reads like a boutique candle shop. The clay vessel is a material upgrade on all five voice attributes:

| Attribute | Glass jar today | Clay vessel |
|---|---|---|
| **Warm** | Cool, translucent, gallery-like | Kiln-fired, hand-thrown, kitchen-counter |
| **Reverent** | Decorative | Scripturally anchored — 2 Cor 4:7, "treasure in earthen vessels" |
| **Specific** | Generic container | A *thing* a pastor or grandmother would recognize on a shelf |
| **Faith-confident** | Non-committal | Quietly Christian without being preachy — a vessel from the biblical imagination, not a crucifix |
| **Plainspoken** | Abstract | Made of dirt. Holds light. That is the whole sentence. |

The clay vessel also answers §4.2 ("The jar does not appear on /for-churches today — this is the top visual-identity gap"): a clay vessel survives on a cream parchment background where a translucent glass jar visually disappears. This unlocks jar-as-hero on every page, not only on dark-mode and high-contrast surfaces.

**Voice-attribute ruling: the clay vessel is on-brand and an upgrade. Do not treat this as cosmetic — treat it as the brand anchor replacing a placeholder.**

## 2. Resolving the two-amber tension (brand-guide §4.1 deferred from Sprint 18)

The brand guide explicitly flags two amber systems in tension and says "Unifying them is a Sprint-18 Designer task" — deferred. This spec resolves it. The clay vessel introduces a *third* color family (terracotta/sienna) that is not amber at all, which makes this the natural moment to draw the line between what is amber and what isn't.

**Ruling:**
- **Lights inside the vessel** use OKLCH `--primary` — same semantic slot as `pray-ring` and `candle-flicker`. The `rgba(212,168,67,…)` literals currently hard-coded in `prayer-jar.tsx` are retired. They were never part of System A or System B; they were an accident.
- **The clay vessel body** gets a **new, separate** token family (`--clay-*`). Clay is a material, not an accent. It does not belong on the amber scale and does not compete with it.
- **Tailwind `amber-*` classNames** (System B) remain untouched on "sacred strip" treatments (`amber-950/10`, `amber-900/20`, etc.) — those are page chrome, not the vessel.

New tokens to add to `src/app/globals.css` `:root` / `.dark`:

| Token | Dark mode | Light mode | Purpose |
|---|---|---|---|
| `--clay-rim-hi` | `oklch(0.58 0.09 45)` | `oklch(0.62 0.11 48)` | Rim top highlight |
| `--clay-rim-mid` | `oklch(0.46 0.08 42)` | `oklch(0.52 0.10 45)` | Rim mid-tone |
| `--clay-rim-lo` | `oklch(0.26 0.06 38)` | `oklch(0.34 0.07 40)` | Rim inner-edge shadow |
| `--clay-body-hi` | `oklch(0.56 0.09 44)` | `oklch(0.64 0.11 47)` | Body upper terracotta |
| `--clay-body-mid` | `oklch(0.46 0.09 42)` | `oklch(0.55 0.10 45)` | Body mid-tone |
| `--clay-body-lo` | `oklch(0.33 0.07 38)` | `oklch(0.42 0.09 42)` | Body lower/base |
| `--clay-mottle-warm` | `oklch(0.82 0.08 62 / 0.22)` | `oklch(0.86 0.08 62 / 0.30)` | Warm mottling wash |
| `--clay-mottle-cool` | `oklch(0.32 0.06 36 / 0.35)` | `oklch(0.38 0.07 38 / 0.30)` | Cool mottling wash |
| `--clay-edge` | `oklch(0.18 0.04 34)` | `oklch(0.22 0.05 36)` | 1.5px body outline |
| `--clay-throwing` | `oklch(0.28 0.05 36 / 0.08)` | `oklch(0.32 0.06 38 / 0.10)` | Horizontal throwing-line striations |
| `--clay-shadow` | `oklch(0 0 0 / 0.40)` | `oklch(0.20 0.04 38 / 0.18)` | Cast shadow under vessel |

These values target the mockup's `#9a6038 → #7e4a28 → #603418` (dark) and `#c28247 → #a36838 → #824e26` (light) gradients but in OKLCH so they sit cleanly alongside the rest of the token system. Frontend: consume via `oklch(var(--clay-body-hi))` — do not reintroduce hex literals.

## 3. Layout

Same structural model as today — `<div aria-hidden="true">` containing a rim stacked above a body, with contents absolutely positioned inside the body, plus an optional `countLabel` text node underneath. New element: an **overflow glow** absolutely positioned *above* the rim, so light appears to be rising out of the vessel.

Stacking (back to front):
1. Body (with throwing-line texture, mottling, inner left highlight, cast shadow)
2. Contents — absolute-positioned lights inside the body
3. Rim (overlaps the body top by 6px so the join reads as one piece)
4. Overflow glow (absolutely positioned above the rim, scaled to prayer count)
5. `countLabel` text below the whole visual

## 4. Components

### `<PrayerJar>` — API (preserved)

```ts
type JarSize = 'sm' | 'md' | 'lg';
type JarMode = 'lights' | 'slips';  // kept for compile-compatibility; see §4.1
function PrayerJar(props: {
  count: number;
  size?: JarSize;
  mode?: JarMode;
  countLabel?: string;
}): JSX.Element
```

The external API does not change. All 8 consumer files continue to work without edits. Behavior changes inside the component only.

#### 4.1 `mode` prop — decision

`mode` stays in the type signature but becomes **effectively lights-only**. `mode='slips'` silently collapses to the lights rendering — no slips, no warning, no paper. Rationale: Ron ruled out slips for the brand anchor; the slips rendering was from the earlier A/B mockup and is no longer a design surface. Sweeping the 8 call sites is Frontend's second pass; a compile-break across the repo is not worth it and would block Sprint 22 close.

Add a `@deprecated` JSDoc on the `mode` prop. Sprint 23+ can remove it once call sites are swept.

#### 4.2 Rim

- Shape: elliptical band, centered above the body, overlapping the body top edge by 6px.
- Fill: vertical gradient using `--clay-rim-hi → --clay-rim-mid → --clay-rim-lo → --clay-rim-mid → --clay-rim-hi` at stops `0% / 15% / 50% / 85% / 100%` — reads as a thrown lip catching light on top and bottom with a shadow in the middle.
- Inner opening shadow: a darker ellipse (`--clay-rim-lo` at 80% opacity) at top of the rim, 90% width, 8px tall — the mouth of the vessel reads dark, like looking into a jar.
- Outer shadow: `0 2px 4px var(--clay-shadow)` below the rim.
- No border.

#### 4.3 Body

- Shape: `border-radius: 40% 40% 48% 48% / 16% 16% 58% 58%` — short shoulders, rounded bottom, narrow top (amphora silhouette, not a pill).
- Border: `1.5px solid var(--clay-edge)`.
- Base fill (bottom of stack): `linear-gradient(180deg, var(--clay-body-hi) 0%, var(--clay-body-mid) 40%, var(--clay-body-lo) 100%)`.
- Mottling (stacked above the base, in this order):
  1. `radial-gradient(ellipse at 22% 18%, var(--clay-mottle-warm) 0%, transparent 35%)` — upper-left warm glow from the firing
  2. `radial-gradient(ellipse at 78% 30%, var(--clay-mottle-cool) 0%, transparent 40%)` — upper-right shadow
  3. `radial-gradient(ellipse at 35% 62%, var(--clay-mottle-warm) 0%, transparent 30%)` — mid warm wash (dims to 50% at `sm`, see §4.7)
  4. `radial-gradient(ellipse at 72% 78%, var(--clay-mottle-cool) 0%, transparent 45%)` — lower-right shadow
- Throwing lines: `::before` pseudo-element, `repeating-linear-gradient(180deg, transparent 0px, transparent 10px, var(--clay-throwing) 10px, var(--clay-throwing) 11px)` covering the full body. Suppressed at `sm` (see §4.7).
- Inner left highlight: `::after` pseudo-element, `top: 16px; left: 26px; width: 20px; height: 140px; background: linear-gradient(180deg, var(--clay-mottle-warm) 0%, transparent 100%); border-radius: 50%; transform: rotate(-8deg)`. At `sm`, scale to `width: 12px; height: 72px`.
- Inner shadows (box-shadow on the body): `inset -14px 0 24px var(--clay-shadow), inset 14px 0 20px var(--clay-mottle-warm), 0 8px 18px var(--clay-shadow)`.
- `overflow: hidden` so lights clip to the body shape.

#### 4.4 Lights inside (contents)

**Kept largely from the existing `lightStyle()` function.** Positions, sizes, float animations, and pulse animation all carry over. Two color changes:

- Radial fill: `radial-gradient(circle at 35% 35%, oklch(var(--primary) / 1) 0%, oklch(var(--primary) / 0.6) 50%, transparent 70%)` — **not** `rgba(255,220,120,1) → rgba(212,168,67,0.6)` as today.
- Box shadow: `0 0 12px 4px oklch(var(--primary) / 0.5), 0 0 30px 8px oklch(var(--primary) / 0.2)`.

Count logic unchanged: `lightCount = Math.min(count, 30)` from the existing `LIGHT_SLOTS` table.

Animations keep their existing CSS keyframes — do **not** re-author them:
- `light-float-a / -b / -c` (globals.css:223–238)
- `light-pulse` (globals.css:240–243)

The `.prayer-jar-light` className and its `prefers-reduced-motion` rule (globals.css:296–300) carry over unchanged.

#### 4.5 Overflow glow (new)

An absolutely positioned decorative element sitting above the rim, representing light "escaping" from an over-full vessel. Frontend adds it as a new element inside the component (not a pseudo — it needs its own keyframe target).

- Position: `absolute; top: -20px; left: 50%; transform: translateX(-50%)`.
- Dimensions at `md`: `width: 180px; height: 70px`. Scales with size (see §4.7).
- Fill: `radial-gradient(ellipse at 50% 100%, oklch(var(--primary) / 0.50) 0%, oklch(var(--primary) / 0.20) 40%, transparent 70%)`.
- Filter: `blur(10px)`.
- `pointer-events: none`, `z-index: 3` (above the rim).
- New keyframe `clay-overflow-pulse` in `globals.css`:
  ```css
  @keyframes clay-overflow-pulse {
    0%, 100% { opacity: var(--overflow-base); transform: translateX(-50%) scaleY(1); }
    50%      { opacity: var(--overflow-peak); transform: translateX(-50%) scaleY(1.15); }
  }
  ```
- Opacity scales with prayer count (see §5).
- **Add to the `prefers-reduced-motion` rule** alongside the existing `.prayer-jar-light` entry:
  ```css
  .clay-overflow-glow { animation: none !important; }
  ```

Frontend: expose two CSS custom properties on the element (`--overflow-base`, `--overflow-peak`) so the count-responsive opacity in §5 works without inline keyframe rewrites.

#### 4.6 `countLabel` (unchanged)

- Rendered below the visual, same structure as today.
- Copy: whatever the caller passes. No changes.
- Color: `text-amber-600 dark:text-amber-400` — keep the existing Tailwind classes; these are System B "sacred strip" accents and per the brand guide they stay.

### 4.7 Sizes

Dimensions are specified in px (not `min()` with viewport units) because the jar now sits on light-mode pages with real content flow; the existing mobile scaling (`min(350px, 90vw)`) causes the jar to dominate small-phone layouts and the clay vessel — which reads as denser — amplifies that. If mobile ends up too large after build, Frontend can wrap the `md` vessel in a responsive container at the page level, not inside the component.

| Size | Rim W × H | Body W × H | Overflow W × H | Mottling | Throwing lines | Inner highlight |
|---|---|---|---|---|---|---|
| `sm` | 100 × 16 | 170 × 210 | 120 × 40 | **Reduced** — washes #3 (mid warm) suppressed | **Suppressed** (too fine to render cleanly < 200px) | 12 × 72 |
| `md` | 150 × 22 | 260 × 320 | 180 × 70 | All four washes | Enabled | 20 × 140 |
| `lg` | 170 × 26 | 300 × 370 | 210 × 82 | All four + intensify warm (+0.05 opacity) | Enabled | 24 × 162 |

**`sm` breaks with the existing 100 × 120 dimensions.** The old `sm` was a thumbnail-scale mark; the clay vessel does not survive that size — mottling, throwing lines, and rim highlights all mush. Growing `sm` to 170 × 210 is non-negotiable. The only caller using `size='sm'` is `src/app/(auth)/sign-in/page.tsx:49`, where the jar sits above the H1 "The Prayer Jar" — 170 × 210 still fits the sign-in card comfortably.

If a genuinely small mark is needed (nav, favicon-adjacent), use the **SVG mark** in §7, not the component.

## 5. Behavior at low vs high counts

The overflow glow visually represents how "full" the vessel is. The mockup already gets this right; formalizing the rule so Frontend doesn't have to guess.

Opacity of `.clay-overflow-glow`, set via inline style or a modifier class:

| `count` | `--overflow-base` | `--overflow-peak` | Reading |
|---|---|---|---|
| 0 | 0 | 0 | Vessel is empty — no glow, no animation. Jar stands alone. |
| 1–2 | 0.10 | 0.15 | Barely perceptible. A single candle in a cathedral. |
| 3–8 | 0.30 | 0.45 | Quiet — there is clearly prayer here. |
| 9–19 | 0.50 | 0.75 | Meaningful. Glow reads on both light and dark backgrounds. |
| 20–29 | 0.65 | 0.90 | Strong. The vessel feels full. |
| 30+ | 0.80 | 1.00 | Brimming. Maximum overflow — "light escaping heavenward." |

Lights inside continue to cap at 30 per the existing `LIGHT_SLOTS.slice(0, lightCount)` — do not change this.

At `count === 0`, also hide the overflow glow DOM node entirely (`return null` for that element). The empty vessel is a valid, intentional state — don't add a "No prayers yet" placeholder inside it. The consuming page handles empty copy.

## 6. Motion specs (summary)

| Animation | Source | Keep/Change |
|---|---|---|
| `light-float-a/-b/-c` | `globals.css:223–238` | **Keep unchanged.** |
| `light-pulse` | `globals.css:240–243` | **Keep unchanged.** |
| `clay-overflow-pulse` | **New**, 3.5s `ease-in-out infinite` | New keyframe in globals.css §Floating-light-animations section. |
| `prefers-reduced-motion` | `globals.css:296–300` | Extend: add `.clay-overflow-glow { animation: none !important; }` alongside `.prayer-jar-light`. |

No slip-drop changes are in scope for this task — `SlipDropAnimation` lives in `prayer-jar.tsx` and its caller `prayer-dialog.tsx` stays functional. A follow-up rename (`LightDropAnimation`) is semantically correct but out of scope here; flagged for Sprint 23. Frontend: do not rename in this task.

## 7. The mark (🫙 emoji replacement)

The 🫙 emoji is the stand-in mark in four places today, not just the nav:

| Location | Current | New mark |
|---|---|---|
| `src/app/layout.tsx:66` (nav header) | `<span aria-hidden="true">🫙</span>` | Inline SVG clay vessel mark, 20×20, same `aria-hidden` |
| `src/emails/sign-in.tsx:18` (magic-link email header) | `<Text …>🫙</Text>` | PNG export of SVG mark, 36×36, no animation (email clients) |
| `src/app/error.tsx:19` (error boundary) | `<span className="text-6xl mb-6">🫙</span>` | Inline SVG mark, 60×60, `aria-hidden` |
| `src/app/not-found.tsx:7` (404) | `<span className="text-6xl mb-6">🫙</span>` | Inline SVG mark, 60×60, `aria-hidden` |

**SVG mark spec:**

A simplified, single-color silhouette of the clay vessel. It is not a miniature of the full component — mottling, throwing lines, and contents drop away. What remains is a shape a user can read at 20px.

- 24×24 viewBox, centered.
- Two-path construction:
  1. Rim: horizontal rounded rectangle, width 16, height 3, at top y=3.
  2. Body: amphora silhouette, starting at rim edges, narrowing slightly at the shoulder, rounding at the base, bottom y=21.
- Fill: `currentColor` on the rim, `currentColor` at 70% opacity on the body. Inherits text color from the container (so it reads in any theme).
- No stroke.
- A single **amber dot** at approximately (12, 15), radius 1.5, fill `oklch(var(--primary))` — one small light inside. This is the only accent color. It keeps the mark from reading as a generic urn or vase.

Frontend: save the SVG at `src/components/prayer-jar-mark.tsx` as a React component (`<PrayerJarMark size={20} />`) so all four sites share it. For the email PNG, Frontend exports a 72×72 (2×) PNG of the mark rendered on transparent background with text color `#1a1a1a` (foreground for the email's light background), saves at `src/emails/assets/prayer-jar-mark.png`, and imports it in `sign-in.tsx`.

**Do not animate the mark.** A 20px mark with motion is visual noise in chrome. The full component is where motion lives.

## 8. Light-mode background check

Brand-guide §4.1 sets light-mode `--background` to `oklch(0.975 0.007 72)` — warm parchment. **The mockup's `#f7f3ec` is close but not identical.** When Frontend builds, test the clay vessel against the *real* token, not the mockup literal. The clay reads as warm-on-warm (both tokens live in the 60–75 hue range), which is intentional — the vessel looks like it belongs on the surface, not pasted on top of it.

Light-mode `--card` (`oklch(0.945 0.008 70)`) is also fine as a backdrop; the clay's `--clay-edge` 1.5px outline provides the separation.

Dark-mode `--background` (`oklch(0.115 0.006 56)`) gives maximum contrast — the vessel is in its strongest state there. This is the default that the existing `rgba(10,10,20,0.8)` jar body was designed for; the clay direction is what lets us stop privileging dark mode.

## 9. Interactions

- None on the vessel itself — it is `aria-hidden="true"`, non-interactive.
- `countLabel`, when present, is the only user-readable text in the component. Interaction behavior (hover, click) is owned by the caller's wrapping element (e.g., `<Link>` on the sign-in page).

## 10. Copy

No copy lives inside the component. `countLabel` is caller-supplied. No new strings.

Existing callers' labels (already on-brand, keep as-is):
- Homepage: `"{count} prayers held · {answered} answered"`
- Sign-in: no label (decorative)
- `/pray`, `/praise-wall`: caller-specific count labels

## 11. Edge cases

- **`count === 0`:** Empty vessel rendered cleanly. No lights. No overflow glow (DOM node absent). `countLabel` still renders if passed ("No prayers yet" style strings are the caller's job).
- **`count > 30`:** Lights cap at 30 (existing behavior). Overflow glow is at maximum (`--overflow-base: 0.80`). The count in `countLabel` is the real number — "127 prayers held" is fine even though only 30 lights are drawn. The metaphor is the vessel, not a literal count.
- **`prefers-reduced-motion: reduce`:** Lights stop floating/pulsing. Overflow glow stops pulsing but stays at `--overflow-base` opacity (it does not disappear — it is a fill-state signal, not decorative motion).
- **Light-mode page:** Vessel renders identically, using `.light` CSS variable overrides for the `--clay-*` tokens. Overflow glow picks up `--primary` which is already light-mode-aware.
- **Mobile `<420px`:** `md` vessel at 260px body width is 62% of a 420px viewport — acceptable. `lg` vessel at 300px is 71% — still acceptable for hero use. No responsive scaling inside the component.
- **Slow connection / server render:** Component is `'use client'` today and must stay client-side (animation hooks). First-paint shows the vessel without animation; animation starts on mount. No layout shift because dimensions are absolute.

## 12. Accessibility

- Outer wrapper keeps `aria-hidden="true"` — the vessel is decorative; semantic information lives in `countLabel` and the surrounding page copy.
- `countLabel` renders as a plain `<p>` — no `aria-hidden`. It's the one readable element.
- All color pairings above meet at minimum 3:1 for non-text graphics (the clay body against both backgrounds tests to 4.2:1+ on dark, 4.7:1+ on light, due to the `--clay-edge` outline). Frontend: verify with axe/Lighthouse after build; spot-check with Windows High Contrast mode — clay tokens are OKLCH and the High Contrast override should downgrade them gracefully to `WindowText`/`Window` via `forced-colors` media query; Frontend adds:
  ```css
  @media (forced-colors: active) {
    .clay-body, .clay-rim { forced-color-adjust: none; border-color: CanvasText; }
  }
  ```
- Reduced motion already covered in §6.
- No text inside the vessel — no text-on-texture contrast concerns.

## 13. What This Is NOT

- **Not a slips rendering.** `mode='slips'` silently collapses to lights. Frontend does not build a clay-vessel slips variant. Ron rejected slips.
- **Not a replacement for `SlipDropAnimation`.** That export stays as-is in `prayer-jar.tsx` for `prayer-dialog.tsx`. A semantic rename to `LightDropAnimation` is Sprint 23 scope.
- **Not a call-site refactor.** The 8 files that import `<PrayerJar>` stay untouched in this task. API is preserved by design.
- **Not a favicon update.** `src/app/icon.svg` is not in scope; the 🫙 emoji in `apple-touch-icon` and favicons are a separate follow-up.
- **Not an OG image rebuild.** `src/app/opengraph-image.tsx` (if present) uses its own rendering; out of scope. Flag for Sprint 23 if it still renders the old glass jar.
- **Not a Tailwind amber audit.** The "sacred strip" treatments (`amber-900/20`, `amber-950/10`) on the homepage and elsewhere stay. This spec only retires the `rgba(212,168,67,…)` literals inside `prayer-jar.tsx`.
- **Not a type system change.** `JarMode = 'lights' | 'slips'` stays in the signature. Sprint 23 removes it.
- **Not a new component.** Edits happen inside `src/components/prayer-jar.tsx`. A new `src/components/prayer-jar-mark.tsx` is added for the SVG mark only.
- **Not a copy change.** No strings touched inside the component. `countLabel` stays caller-supplied.

## 14. Hand-off checklist for Frontend

Frontend can pick this up and implement without asking clarifying questions. In order:

1. Add the 11 `--clay-*` tokens to `src/app/globals.css` `:root` and `.dark` (§2).
2. Add `@keyframes clay-overflow-pulse` in globals.css alongside existing light keyframes (§4.5). Add its `prefers-reduced-motion` entry.
3. Add `@media (forced-colors: active)` rule (§12).
4. Rewrite `src/components/prayer-jar.tsx`:
   - Remove the `rgba(212,168,67,…)` and `rgba(10,10,20,0.8)` literals; consume `var(--clay-*)` and `oklch(var(--primary))` instead.
   - Rim + body per §4.2, §4.3.
   - Lights per §4.4 (keep positions/animations, swap colors only).
   - New overflow-glow element per §4.5, opacity-driven by §5 table.
   - Size dims per §4.7 — including the `sm` breaking change (100→170 width).
   - `mode='slips'` collapses to lights.
5. Create `src/components/prayer-jar-mark.tsx` per §7.
6. Swap 🫙 at the 4 sites per §7 table.
7. Export email PNG per §7 and wire into `src/emails/sign-in.tsx`.
8. Visual regression: verify `sm` on `src/app/(auth)/sign-in/page.tsx`, `md` on `src/app/(public)/page.tsx`, `lg` on `src/app/(public)/for-churches/page.tsx`.
9. Delete `src/app/preview/jar-slips/` if it still exists — it was a Sprint 19 A/B preview and no longer reflects the design system. Confirm with Ron before deletion.
