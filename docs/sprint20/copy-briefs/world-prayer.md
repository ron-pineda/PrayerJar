# Copy Brief: /world-prayer

**Priority:** Standard
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Server page with a hero block (globe emoji 🌐 at `text-5xl`, H1, subheadline), 8 region cards in a 2-col grid (each with an emoji, region name, prompt, and "Pray Now" button), and a bottom CTA. **Heavy emoji usage:** 🌐 hero (line 56), plus 8 region emoji (🕊️ 🌍 🌏 ⛪ 🌎 🏝️ 🏛️ ✝️). Banned-phrase adjacent: *"Join believers around the globe in lifting up nations…"* (line 58–61) — this is close to §7 #13 ("Join the community / movement") and the "believers around the globe" framing also leans promotional. Needs rewrite.

## Voice notes for this page
- Intercession is the content. Do not make this page feel like a campaign.
- Eight regions is a lot of cards — keep each prompt ≤ 10 words, scannable, specific.
- No "join," no "movement," no "around the globe." Replace with direct prayer prompts.
- One verse strip fits here — this page has a thematic center (global prayer) and a mission statement-shaped slot.

## Hero
**Headline:** Pray for the world
**Subheadline:** Intercession crosses every border. Stand with the people carrying these burdens tonight.
**Primary CTA:** (no hero CTA — the region cards are the CTAs)
**Secondary CTA:** (none)

## Section copy

### Region cards — 8 total
Each card has: Lucide icon (h-8 w-8 text-amber-600), region name (H2, semibold), prompt (muted body, ≤ 10 words), "Pray now" button.

| # | Region | Prompt | Lucide icon |
|---|--------|--------|-------------|
| 1 | Middle East | Pray for peace, reconciliation, and protected churches. | `Dove` (fallback: `Feather`) |
| 2 | Africa | Pray for revival, clean water, and healing from conflict. | `Leaf` |
| 3 | Asia | Pray for open doors and for believers under pressure. | `Users` |
| 4 | Europe | Pray for spiritual awakening and returning families. | `Church` |
| 5 | Americas | Pray for unity, justice, and the forgotten. | `Scale` |
| 6 | Oceania | Pray for indigenous communities and coastal families. | `Landmark` |
| 7 | Global leaders | Pray for wisdom, humility, and righteous decisions. | `Gavel` |
| 8 | Persecuted church | Pray for strength, protection, and unwavering faith. | `Cross` |

**Card CTA (all 8):** Pray now → `/pray` (unchanged link; sentence-case "now" — current page already uses it this way).

### Bottom CTA block
**Lead copy:** Have a specific request in your own community?
**Primary CTA:** Go to the prayer feed → `/pray` (unchanged; sentence-case change)
*(Current copy: "Want to pray for a specific request in your community?" — very close; the proposed phrasing reads slightly warmer.)*

## Verse strip (if used)
> "I urge, then, first of all, that petitions, prayers, intercession and thanksgiving be made for all people — for kings and all those in authority, that we may live peaceful and quiet lives in all godliness and holiness."
> — 1 Timothy 2:1–2

Placed below the hero, above the region cards. One verse, sacred-strip treatment. Fits the page's mission-statement slot per brand guide §4.3.

## Lucide icon suggestions
- **Hero:** replace 🌐 with `Globe` (h-12 w-12 text-amber-600) centered above the H1. This is the single largest icon on the page.
- **Region cards:** see table above. All `h-8 w-8 text-amber-600`. If `Dove` is not available in the current Lucide version, fall back to `Feather`.
- **Bottom CTA:** no leading icon. The button is enough.

**Icon verification note for Frontend:** `Gavel` and `Dove` are in `lucide-react`. If the project pins an older version that lacks one, substitute: `Gavel` → `Landmark` (and change Oceania's `Landmark` → `Palmtree`). The principle: one outlined Lucide icon per card, colored `text-amber-600`, no emoji.

## Empty states (if applicable)
N/A — static region list.

## Banned-phrase audit
1. **"Join believers around the globe"** — `world-prayer/page.tsx:60`: borderline §7 #13 ("Join the community / movement"). → Replace hero subheadline with *"Intercession crosses every border. Stand with the people carrying these burdens tonight."* (proposed above).
2. None of the other 15 banned phrases appear.

## Jar motif
**No.** The hero visual is the globe. Brand guide §4.2: "once per page at most" — and the jar's proper home is the signed-out/signed-in homepage, not every public page.

## Notes for Frontend
- **Delete the `emoji` field** from every entry in the `WORLD_REGIONS` array. Replace with an `icon` field typed as `LucideIcon`.
  ```ts
  const WORLD_REGIONS: { region: string; icon: LucideIcon; prompt: string }[] = [
    { region: "Middle East", icon: Dove, prompt: "..." },
    // ...
  ];
  ```
- **Rename "Global Leaders" → "Global leaders"** (sentence-case; currently title-case on line 40).
- **Hero emoji (🌐):** remove the `<div className="text-5xl">🌐</div>` line entirely. Replace with `<Globe className="h-12 w-12 text-amber-600 mx-auto mb-4" />`.
- **Apply `<ScrollReveal>` to each region card** with `delay={i * 80}` staggered. Do not wrap the hero.
- **Amber palette on cards:** change `hover:border-primary/50` → `hover:border-amber-600/50` if Frontend wants explicit amber hover (consistent with sprint 19 pattern). OR keep `--primary` since OKLCH primary IS amber. Either is acceptable per brand guide §4.1.
- **Verse strip placement:** between hero subheadline and region cards, using the pattern from `docs/superpowers/specs/2026-04-18-sprint20-visual-audit-design.md`.
- **Character limits:** hero headline 18 chars, hero subheadline ≤ 70 chars, each region prompt ≤ 60 chars — all safe.
- **"Pray Now" → "Pray now":** sentence-case, single character change across 8 cards.