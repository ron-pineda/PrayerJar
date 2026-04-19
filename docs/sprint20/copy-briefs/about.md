# Copy Brief: /about

**Priority:** Standard
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Static server page. Title + subtitle, then four prose sections ("Why it was built," "What it is," "The mission," "What it is not") and a bottom CTA row with `<PrayerDialog />` and a "Pray for Someone" outline button. No verse strip, no jar motif, no icons. Copy is already close to brand voice in most places — the 2am-parking-lot origin story is on-brand and should stay. Two banned-phrase hits:
1. `about/page.tsx:64` — *"This is not a **religious platform**."* (§7 #5, "platform")
2. `about/page.tsx:91` — *"paid plans for churches that **want pastoral tools**"* (§7 #2, verbatim banned pattern)

No emoji.

## Voice notes for this page
- Brand storytelling is the job here. The 2am origin is the page's best asset — do not flatten it into a mission statement.
- One verse strip, placed where a mission statement would go (between "What it is" and "The mission").
- Jar motif once in the hero — this is the right page for a `<PrayerJar size="sm" />` cameo next to the title since there is no live count.
- Keep the "What it is not" section — the explicit "not a church, not a debate platform" framing is a strong differentiator and pre-empts common objections.

## Hero
**Headline:** About The Prayer Jar
**Subheadline:** How a 2am moment became a place for everyone carrying something heavy.
**Primary CTA:** (no hero CTA — the origin story is the hero)
**Secondary CTA:** (none)

## Section copy

### Why it was built
**Heading:** Why it was built
**Body (paragraph 1):** It started at 2am on a Tuesday. Someone was sitting alone in their car outside a hospital, their mother on the other side of glass they couldn't pass through. They wanted prayer — not in the morning, not at a service, not over text to a friend they didn't want to wake. Right then. In that parking lot. In the dark.

**Body (paragraph 2):** There was nowhere to go. So they sat there alone.

**Body (paragraph 3):** The Prayer Jar exists because that moment shouldn't have been so lonely. Prayer doesn't wait for business hours, and neither should a place to ask for it.

### What it is
**Heading:** What it is
**Body (paragraph 1):** The Prayer Jar is a place to submit a prayer request and have real people pray over it — day or night, anywhere in the world. You can share your name or stay completely anonymous. No account required to ask for prayer.

**Body (paragraph 2):** Every submission is reviewed before it goes live. Automated moderation catches harmful content before any human has to read it, and connects anyone in crisis with the right resources. What makes it to the feed is real — someone's real grief, real fear, real hope.

**Body (paragraph 3):** When a prayer is answered, it becomes a light released — a small testimony shared with the community that something shifted, something healed, something turned.

### [Verse strip — see "Verse strip" below, placed here]

### The mission
**Heading:** The mission
**Body (paragraph 1):** This is not a church, a theology degree, or a set of right words. The mission is simple: anyone carrying something heavy should be able to be seen and prayed for — tonight, if they need it.

**Body (paragraph 2):** We believe prayer does something. We believe being witnessed matters. We believe the stranger across the world who stops to pray for your mother in the hospital is doing something real and good.

### What it is not
**Heading:** What it is not
**Body (paragraph 1):** The Prayer Jar is not a church, and it is not trying to be one. It won't tell you what to believe, push a denomination, or ask you to sign up for anything beyond what you came here for.

**Body (paragraph 2):** It is not a debate product. Comments are not a feature here. If you pray for someone, you pray — you don't critique, correct, or counsel unsolicited.

**Body (paragraph 3):** Prayer is free — always. No ads, no data brokers, no paywall on asking for prayer or praying for others. Churches can subscribe for pastoral features like a private prayer wall, pastoral notes, and a care dashboard — but the core is free for everyone.

### Bottom CTA block
**Copy above CTAs:** If something brought you here, you're welcome to stay. Whatever you're carrying, there are people here who will hold it with you for a moment.
**Primary CTA:** Add a prayer → opens `<PrayerDialog />` (unchanged)
**Secondary CTA:** Pray for someone → `/pray` (unchanged link target)

## Verse strip (if used)
> "Bear one another's burdens, and so fulfill the law of Christ."
> — Galatians 6:2

Placed between "What it is" and "The mission" — where a mission statement would go, per brand guide §4.3. One verse only on this page.

## Lucide icon suggestions
- **Hero:** `<PrayerJar size="sm" />` component inline with the H1 (small cameo), or above it centered. This is the jar's designated appearance on this page.
- **Section headings:** no icons. The prose carries.
- **Bottom CTA row:** `HandHelping` (h-4 w-4) leading the "Add a prayer" button; `Church` (h-4 w-4) leading "Pray for someone" is optional — Frontend's call.

## Empty states (if applicable)
N/A — static page.

## Banned-phrase audit
1. **"platform"** — `about/page.tsx:64`: *"This is not a **religious platform**."* → Replace with *"This is not a church, a theology degree, or a set of right words."* (proposed in "The mission" section above — note this replaces the sentence entirely; the "religious platform" framing was already awkward because PrayerJar IS religious).
2. **"churches that want pastoral tools"** — `about/page.tsx:91`: verbatim banned pattern (§7 #2). Original: *"paid plans for churches that want pastoral tools and private prayer walls, but the core experience is free for everyone."* → Replace with *"Churches can subscribe for pastoral features like a private prayer wall, pastoral notes, and a care dashboard — but the core is free for everyone."* (proposed in "What it is not" §3 above).
3. **"platform" (second instance)** — `about/page.tsx:86`: *"It is not a debate **platform**."* → Replace with *"It is not a debate product."* (proposed above).
4. **"AI-assisted moderation"** — `about/page.tsx:50`: the word "AI" is not banned, but per brand guide §7 #11 + Legal hotfix, AI claims should be quiet-surface. Soften from "AI-assisted moderation" to "Automated moderation" (proposed above). Moderation is automated regardless of whether the underlying tech is AI; the simpler word is more accurate and less marketing-y.

## Jar motif
**Yes — once, in the hero.** Use `<PrayerJar size="sm" />` next to or above the H1. This page has no live count, so render the jar in its static/idle state (no active-count glow). Reason: `/about` is the right surface for the brand seal; the page has no competing hero visual and the story that follows IS the brand story.

## Notes for Frontend
- **Wrap all below-fold sections in `<ScrollReveal delay={n * 80} />`** — hero renders immediately, then each of the 4 prose sections + verse strip + bottom CTA block get staggered delays.
- **The bottom CTA already uses `<PrayerDialog />` inline** — keep that pattern; do not route to `/` for "Add a prayer."
- **Character limits:** Hero headline 21 chars (safe). Section headings all ≤ 16 chars.
- **The `<PrayerJar>` component currently expects an active count for its glow animation** (see `prayer-jar.tsx` usage on `/`). On this static page, pass `size="sm"` and let it render without an active count — confirm with `src/components/prayer-jar.tsx` that this renders sensibly, or Frontend decision: wrap in a lighter static SVG variant.
- **Verse strip placement** is between "What it is" and "The mission" — do not add a second verse anywhere on this page.
- **No emoji anywhere** (currently none — keep it that way).