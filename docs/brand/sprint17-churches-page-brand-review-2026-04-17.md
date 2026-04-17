# Sprint 17 — /for-churches Brand Review

**Date:** 2026-04-17
**Author:** Brand agent
**Scope:** `src/app/(public)/for-churches/page.tsx` — voice, visual identity, positioning, pricing hierarchy, trust, and Christian framing. Guardrails for Copywriter and Frontend before rewrite.

Note: PrayerJar has no `docs/brand/brand-guide.md` yet. This review extracts the de-facto brand from the homepage, About page, and copy audit (`docs/design/copy-audit-2026-04-15.md`). A proper brand guide is a separate deliverable; this document is Sprint 17 guardrails only.

---

## 1. Voice audit of current page

The consumer surfaces talk like a person ("You're not alone." / "Will you stand with them?" / "A quiet place online where people bring their real burdens"). The churches page talks like a vendor. Three problem lines:

- L70: *"PrayerJar gives your congregation a safe, private place to share prayer requests — and gives your pastoral team the tools to care for every person in it."* — Salesforce-shaped sentence. "Gives your [noun] the tools to [verb]" is B2B template copy.
- L104: *"Plans are for churches that want pastoral tools."* — "Want" is hollow. Pastors don't "want tools"; they're carrying people.
- L246: *"Set up your church in minutes."* — HubSpot-grade. Divorced from what the product actually is.

Also: six feature tiles (L10–46) all open with a feature name ("Private Prayer Wall," "Pastoral Dashboard") and describe a capability. None of them name the *pastoral pain* being solved (people falling through the cracks, Sunday-to-Sunday loss of visibility, the 2am phone call).

The H1 *"Bring your church's prayer life online"* is fine but bland — no faith-confident register, no keyword signal (Growth already flagged this).

**Verdict:** Voice drift. Churches page sounds like generic ChMS software. Homepage and About sound like PrayerJar. Rewrite must close that gap.

## 2. Visual identity gaps

The homepage uses amber accents (`amber-500`, `amber-950/10`), the `PrayerJar` jar component, the daily-verse bordered strip, and `ScrollReveal`. The churches page uses **none of these** — it's plain `bg-card`, generic border radii, emoji icons (`🛡️ 🧭 🤖 📺 🎨 📊`) that read as Slack, not sanctuary.

Specific gaps:
- No jar motif anywhere on the page. The product has a hero visual asset; this page doesn't use it.
- Emoji icons are the wrong register for a pastor-buyer. Replace with a consistent outlined icon set (Lucide is already in the dep tree).
- No amber warmth. The whole page is neutral grey/parchment — technically on-palette but emotionally cold.
- Cards use `rounded-xl` while the rest of the site's hero surfaces use `rounded-xl` with a `border-amber-900/20 bg-amber-950/10` treatment for "sacred" sections. The churches page never earns that treatment.
- No scripture/verse strip — present on every other public page.

## 3. Positioning tension — where the page fails the pastor buyer

The tension: a pastor needs to see a B2B product that his elders will approve, but it must not feel like the congregation is being handed to Mailchimp. The current page chooses the wrong side of the tension — it's **under-indexed on B2B seriousness and under-indexed on faith confidence simultaneously**. It hedges.

Failures:
- No statement of theological posture. A pastor asks "who built this, and do they understand what prayer is?" — the page never answers. Compare to the About page's "2am on a Tuesday" story.
- No mention of the word *intercession*, *shepherd*, *flock*, *care* (as a noun), *soul*, *ministry* outside the eyebrow. The one place the page could speak pastor is flattened to "pastoral tools."
- "AI-Flagged Care" (L24) is the scariest phrase on the page for a pastor — it implies the software decides who needs care. Reframe as *assist*, not *flag*: "surfaces quietly to your care team; you decide."

## 4. Pricing table visual recommendations

Current block (L136–202) is a 4-column card grid. Pastors comparing Starter vs Pro must read two bullet lists and mentally diff. Recommendations:

- **Replace with a comparison table below the cards** — feature rows × tier columns, checkmarks. Cards stay for scan; table serves the deciding pastor. (Growth flagged the same pattern.)
- **Rename the tiers to do work.** Free/Starter/Pro/Enterprise is Stripe template. Propose: `Free` → keep; `Starter` → **Small Church** (or **Congregation**); `Pro` → **Growing Church**; `Enterprise` → **Network** (for multi-site / denominations). Names describe who the tier is for, not how much it costs.
- **Anchor the "best fit" signal.** Current "Most Popular" badge on Pro is weak — no pastor believes vendor "most popular" claims. Replace with **"Best for churches 150–500"** on the Growing Church tier. Concrete, falsifiable, trust-building.
- **Consolidate the dollar treatment.** Monthly/yearly toggle is fine, but the `/mo` and "billed yearly" lines collide typographically. Use a single price line + a smaller caption.
- **Put the "Prayer is always free" line ABOVE the pricing block**, not buried as subhead copy. That sentence is the single most on-brand line in the section. It should lead.

## 5. Trust signals to add

Pastors buy on social proof and risk reversal, not features. The page has zero of either. Add:

- **One real pilot-church testimonial with name + church + photo.** If no paying churches yet, use a beta-pilot and say "pilot" honestly.
- **Security/privacy strip:** "SSL encrypted · Data never sold · Private by default · Prayers owned by your church." Four short claims, one line. No SOC 2 yet — don't claim it.
- **Denomination-agnostic language near the hero:** "Built for Baptist, Non-denominational, Methodist, Pentecostal, and liturgical churches." Signals breadth.
- **Founder note / who-built-this micro-section.** One paragraph, one photo. Pastors want to know a human made this.
- **Cancel-anytime + no-card-required repeated at the Pro card**, not buried in the FAQ.
- **User-count or prayer-count ticker** — the homepage already has `stats.active + stats.answered`. Reuse on this page: "Already 3,412 prayers shared." Reuses real data; costs nothing.

## 6. Brand voice for the Christian context

PrayerJar is a Christian product used by Christians serving Christians. The churches page should stop hedging. The consumer side can stay low-barrier; the churches page should be faith-confident.

Scripture references: yes, **one**, in the page. Not decorative. Use James 5:16 ("pray for one another") or Galatians 6:2 ("bear one another's burdens"). Place it as a quiet pull-quote between hero and features, same treatment as the homepage verse strip. One verse = authenticity. Three+ = tract.

The line between authentic and decorative:
- **Authentic:** a verse cited *as the reason the product exists*, placed where a pastor would expect a mission statement.
- **Decorative:** verses sprinkled as section dividers, scripture-as-background-image, bullet points ending in "Amen."

### Do's (for Copywriter)

- Speak to the pastor as a peer carrying people, not a prospect evaluating a SaaS.
- Use nouns from ministry: shepherd, care team, intercession, flock, soul, burden, witness.
- Name the pain before the feature. "Someone left a prayer request in the connect card. It's Thursday. Does anyone know?"
- Keep sentences short. The homepage averages 14 words. Match it.
- One scripture reference, cited in full, placed where a mission statement would go.
- Faith-confident register: this is a Christian product for Christian churches. Don't apologize for that on *this* page.
- Quote one real pilot pastor. Name, church, city, photo.
- Match homepage tokens: amber accents, jar motif, verse strip, `ScrollReveal`.

### Don'ts

- No "solutions," "platform," "empower," "leverage," "tools that..." B2B template verbs.
- No "Bring your church's [X] online" framing — every ChMS says this.
- No AI language front-and-center ("AI-Flagged Care" headline). AI is a quiet feature, not a tier name.
- No emoji icons on features. Use a consistent outlined icon set.
- No "Free / Starter / Pro / Enterprise" tier names — they describe price, not people.
- No "Most Popular" badge. Replace with a concrete who-it's-for claim.
- No generic SaaS testimonial fakes. Real or nothing.
- No more than one scripture. Decoration breaks trust.
- Don't bury "Prayer is always free for your congregation" in subtext. It's the thesis; lead with it.

---

## Tasks to add to Sprint 17

1. **B-1: Write PrayerJar brand guide v1** (Brand agent, S). Create `docs/brand/brand-guide.md` formalizing: positioning, 5 personality adjectives, voice do/don't with examples, color palette (extract hexes from `globals.css` oklch values), typography scale, icon set decision (Lucide outlined), "What this brand is NOT." Ships before any other Sprint 17 copy work lands. Unblocks Copywriter and Frontend.

2. **B-2: Rename the pricing tiers and restructure the pricing block** (Copywriter + Frontend, M). Rename Starter/Pro/Enterprise to **Small Church / Growing Church / Network**. Replace "Most Popular" with **"Best for churches 150–500"** on Growing Church. Move "Prayer is always free for your congregation" to lead the pricing section. Add a feature-comparison table below the tier cards. Depends on B-1.

3. **B-3: Add trust-signal strip + one real pilot testimonial to /for-churches** (Copywriter + Frontend, M). Security/privacy one-liner; denomination-agnostic line; one real pilot-church quote with name/church/photo; founder micro-paragraph. If no paying churches exist, Ron approves a labeled "pilot" testimonial. Depends on B-1.
