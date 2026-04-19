# Copy Brief: /know-jesus

**Priority:** HIGH
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Server page renders a short title block, then delegates to `src/components/salvation-client.tsx`. The client shows a cross visual + "lives transformed" count, a daily verse strip, five gospel sections (each with an embedded scripture: John 3:16, Rom 3:23, Rom 5:8, Eph 2:8-9, Rom 10:9), a salvation prayer, a name-optional form, and a post-decision "welcome" state. Post-decision state uses an emoji (🙏 in "Welcome to the family") and an off-brand green-on-slate "Find a Community" card that breaks the amber system. Banned-phrase hits: none in visible copy. Scripture density hit: the page ships 5 gospel verses + 1 daily verse = **6 scriptures**, which trips brand guide §7 #15 ("three-or-more scripture references on one page").

## Voice notes for this page
- This is evangelism, not product marketing. Warm and specific, not a tract. No jar motif — the page is about Jesus, not the product.
- Resolve the §15 tension: the 5 gospel scriptures ARE the substance of the page, not decoration. Keep them. **Drop the daily-verse strip** so the scripture count is deliberate, not incidental. This is the only page where scripture count exceeds one — call it out so Frontend doesn't flag it in QA.
- PrayerJar is a next step, not the hero. Never lead with the product here.
- Read like a friend, not a street preacher. No exclamation points in headings. No "Amen!" as a button label (the "Amen" at the end of the prayer text is prayer content, not a label — leave it).

## Hero
**Headline:** Know Jesus
**Subheadline:** You don't have to have it all together. You just have to come as you are.
**Primary CTA:** (none in hero — the page IS the content; CTA lives in the post-prayer state and the decision form)
**Secondary CTA:** (none)

## Section copy

### Cross + count
**Label under count:** *(unchanged count behavior)* `{count} lives changed here`
*(Reason: "lives transformed" is fine but vague. "Changed here" names the surface honestly.)*

### Gospel section 1 — God loves you
**Heading:** God loves you
**Body:** Before you had a name, God knew you. Before you made a single choice — good or bad — he loved you.
> *"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."*
> — John 3:16

### Gospel section 2 — We all drift
**Heading:** We all drift
**Body:** Here's the honest part: every one of us has wandered. Not because we're terrible — because we're human.
> *"For all have sinned and fall short of the glory of God."*
> — Romans 3:23
That isn't shame. It's just the truth about all of us.

### Gospel section 3 — Jesus is the bridge
**Heading:** Jesus is the bridge
**Body:** God didn't leave us there. He sent Jesus — not to judge, but to rescue. Jesus lived the life we couldn't live, died the death we deserved, and rose again.
> *"But God demonstrates his own love for us in this: while we were still sinners, Christ died for us."*
> — Romans 5:8

### Gospel section 4 — It's a gift
**Heading:** It's a gift, not an earning
**Body:** You don't have to clean yourself up first. You don't have to be good enough.
> *"For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast."*
> — Ephesians 2:8–9

### Gospel section 5 — How to receive it
**Heading:** How to receive it
**Body:**
> *"If you declare with your mouth, 'Jesus is Lord,' and believe in your heart that God raised him from the dead, you will be saved."*
> — Romans 10:9
That's it. A prayer, a turning, a yes.

### The prayer (set off as a scripture-style block, italic)
> "Jesus, I believe you died for me and rose again. I turn from my own way and ask you to come into my life. Thank you for forgiving me. I'm yours. Amen."

### Decision form — pre-submit
**Name field placeholder:** Your first name (optional)
**Primary CTA:** I prayed this prayer
**Loading state:** Saving…
**Error:** Something went wrong. Please try again.

### Decision form — post-submit ("welcome" state)
**Heading:** Welcome home{name ? `, ${name}` : ''}.
**Subheading:** Heaven is celebrating right now. — Luke 15:7

### Next step card (replaces the green/slate block)
**Heading:** Find a community
**Body:** One of the best next steps is finding a church where you can grow, ask questions, and be prayed for by people who will know your name. When you're ready:
**Primary CTA:** Find a church near you → `/find-a-church`
**Helper text:** No pressure — you can always find this in the menu.

### PrayerJar as a next step (new, replacing the current "Go to the Prayer Jar" outline button)
**Secondary CTA:** Ask someone to pray for you → `/` (signed-out home; opens prayer dialog via existing `<PrayerDialog />` if feasible, otherwise routes home)
*(This is the PrayerJar "first step" CTA the sprint spec asks for — placed below the church CTA, not above it, and framed as an action ("ask someone to pray") not a product pitch ("go to the Prayer Jar").)*

## Verse strip (if used)
No verse strip on this page. Reason: the gospel sections already contain 5 scripture references. Adding the daily verse strip would push the page to 6 and drop it into tract register per brand guide §7 #15. Drop the `verse` prop usage from `SalvationClient` on this page.

## Lucide icon suggestions
- **Cross visual:** keep existing `<SalvationCross />` component (brand-specific, not Lucide-replaceable).
- **Post-submit welcome heading:** No decorative icon. Remove the trailing 🙏 emoji from the welcome line.
- **Next-step card heading:** `Church` (h-5 w-5 text-amber-600) inline before "Find a community".
- **PrayerJar next-step CTA:** `HandHelping` (h-4 w-4) inside the button, leading.
- Per-gospel-section: no icons. Typography carries these; icons would make the page feel like a tract.

## Empty states (if applicable)
N/A — the page has no list or query surface.

## Banned-phrase audit
- Current page source searched against all 16 banned phrases in brand guide §7.
- **None found in visible copy.**
- Note: "Amen" appears inside the salvation prayer text (salvation-client.tsx:124). This is prayer content, not a button label or heading, so §7 #16 does not apply — leave unchanged.

## Jar motif
**No.** Per sprint spec and brand guide §4.2: the jar is a product motif and this page is about Jesus, not the product. The cross is the page's central visual.

## Notes for Frontend
- **Drop the daily-verse strip** in `SalvationClient` — remove the `verse` prop from the call site in `src/app/(public)/know-jesus/page.tsx` and remove the rendered strip between the count and the gospel sections. This is the resolution to the §15 scripture-density concern; do NOT add a separate verse strip elsewhere on this page.
- **Replace the green/slate "Find a Community" card** with a card using the amber-500/amber-950 sacred-strip treatment. Drop `bg-emerald-950`, `from-emerald-950`, `bg-emerald-600`, `text-slate-*` classes entirely — they are the single biggest off-brand color block in the codebase.
- **Remove the 🙏 emoji** from the post-decision welcome line.
- **Button copy changes:** "Find a Church Near You" → "Find a church near you" (sentence-case), "Go to the Prayer Jar" → "Ask someone to pray for you" (per-sprint "first step" framing).
- **PrayerJar CTA link target:** If possible, wire `<PrayerDialog />` directly into this button (same pattern used on `/about`). Fallback: `href="/"`.
- **Character counts:** hero headline 10 chars, all section headings ≤ 22 chars — all safe.
- **Conditional:** the welcome heading interpolates `{name}` when provided; the comma before the name must be rendered only when `name` is present (already handled in current client).
- The count label text change ("lives changed here") is optional polish; if Designer or PM prefers the existing "lives transformed," keep it. Not a brand-guide violation either way.