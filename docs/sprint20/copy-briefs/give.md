# Copy Brief: /give

**Priority:** HIGH
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Client page with a centered hero ("Support The Prayer Jar"), a preset-amount grid ($5–$100), a Stripe checkout button, and a success banner. Banned-phrase hit: `give/page.tsx:87` — "keeping this **platform** free for all" (§7 #5). Two emoji hits: `🙏` in the success banner (line 73) and `🙏` in the "Donations coming soon" card (line 83). Success banner reads as cheerful rather than reverent. The page makes the ask immediately — there is no section that names *why* the product matters before the button. Sprint spec calls this out: "Copy earns the ask before making it."

## Voice notes for this page
- Earn the ask. Before the preset grid, name what the gift actually keeps alive — one specific use ("a 2am prayer"), not a fundraising pitch.
- Reverent, not celebratory. The success state should feel like a quiet thank-you, not a confetti drop.
- Plainspoken about where the money goes. One sentence of "here is what it pays for" builds more trust than a paragraph of mission language.
- This is one-time giving only — checkout does not support recurring gifts. Do not imply a subscription.

## Hero
**Headline:** Keep the jar on the counter.
**Subheadline:** PrayerJar is free for everyone — no ads, no paywalls, no data brokers. Your gift keeps it that way.
**Primary CTA:** (the preset grid + "Give $N" button below — no hero button)
**Secondary CTA:** (none)

## Section copy

### Pre-amount section — why it matters (NEW — the "earn the ask")
**Heading:** What your gift does
**Body:** Someone opens PrayerJar at 2am carrying something they can't say out loud. Within minutes, real people are praying for them by name. Your gift keeps that surface free — for them, and for the next person who arrives carrying something heavy. There are no ads here because of gifts like yours. There never will be.

### Amount selector
**Legend (sr-only):** Choose a gift amount
**Helper under grid:** *(no helper — buttons speak for themselves)*

### Primary CTA button
**Default:** Give ${amount}
**Loading:** Redirecting to Stripe…

### Payment reassurance line (below button)
**Copy:** Secure payment through Stripe. No account required. One-time gift.

### Success state (after `?success=1`)
**Heading:** Thank you.
**Body:** Your gift is received. PrayerJar stays free for the next person who needs it tonight. We're grateful.
**No emoji.** Keep the amber border treatment; drop the 🙏.

### Coming-soon state (when Stripe not configured)
**Heading:** Giving opens soon
**Body:** We're setting up secure giving through Stripe. Check back shortly — every gift will go directly toward keeping PrayerJar free for everyone who uses it.
**No emoji.** Replace 🙏 with a Lucide `HeartHandshake` icon (h-6 w-6 text-amber-600).

### Footer note (below everything)
**Copy:** Questions? [Contact us](/contact).
*(Tax-deductibility line deferred — PM decision 2026-04-18: omit until Legal signs off. Do not add tax claims on ship.)*

## Verse strip (if used)
> "The earth is the Lord's, and everything in it, the world, and all who live in it."
> — Psalm 24:1

Place after "What your gift does" and before the amount selector. One verse, sacred-strip treatment. *(PM decision 2026-04-18: chose Ps 24:1 over 2 Cor 9:7 — stewardship framing before the ask reads less on-the-nose than the "cheerful giver" verse on a donation page.)*

## Lucide icon suggestions
- **Hero:** no icon. Let the headline carry.
- **"What your gift does" section:** `HandHelping` (h-6 w-6 text-amber-600) inline before heading.
- **Amount buttons:** no icons. Typography only.
- **Primary CTA:** no leading icon (amount is the signal).
- **Reassurance line:** `Lock` (h-3.5 w-3.5 text-muted-foreground) inline before "Secure payment".
- **Success state:** `Check` (h-5 w-5 text-amber-600) inside the amber banner.
- **Coming-soon state:** `HeartHandshake` (h-6 w-6 text-amber-600) replaces 🙏.

## Empty states (if applicable)
**Coming-soon state** IS the empty state (see above). Not a zero-results page.

## Banned-phrase audit
1. **"platform"** — `give/page.tsx:87`: *"every gift will go directly toward keeping this **platform** free for all."* → Replace with *"every gift will go directly toward keeping PrayerJar free for everyone who uses it."* (proposed in Coming-soon state above)
2. None of the other 15 banned phrases appear on this page.

## Jar motif
**No jar component on this page.** Reason: per brand guide §4.2, the jar is used "once per page at most" and the homepage already owns that placement. The hero headline ("Keep the jar on the counter") references the motif verbally, which is on-brand without duplicating the visual. If PM/Designer want the jar here, place it once in the hero and drop the hero headline back to "Support The Prayer Jar" — but the verbal reference is sufficient.

## Notes for Frontend
- **Remove both emoji:** 🙏 on line 73 (success banner) and 🙏 on line 83 (coming-soon card). Replace with Lucide per above.
- **Insert new section** "What your gift does" + verse strip between the hero subheadline and the amount grid. This is the "earn the ask" section the sprint spec requires.
- **Character limits:** Hero headline 28 chars. Pre-amount section ~55 words. Keep the hero narrow (`max-w-xl`, already in place).
- **Verse strip:** use the established pattern from brand guide §4.3 — `border-t border-b py-4 mb-8 max-w-md mx-auto px-4`, italic muted body, amber reference line.
- **Do not imply recurring donations.** Checkout is one-time (`/api/v1/checkout` POSTs a `amountCents` once). Do not add "monthly" language.
- **Tax-deductibility line: OMIT.** PM decision 2026-04-18: ship without any tax-deductibility claim. Footer note is now just "Questions? [Contact us](/contact)." Legal sign-off required before adding any tax language in a future sprint.
- **"No account required"** line is accurate per current checkout flow (verified against `/api/v1/checkout` POST).