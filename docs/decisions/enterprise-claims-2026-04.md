# Decision: Enterprise-tier marketing claim reconciliation

**Date:** 2026-04-17
**Sprint:** 17
**Task:** `pj-s17-hotfix-enterprise-claims`
**Author:** Security Agent
**Status:** Decision recorded; copy changes applied in the same commit.

## Why this decision exists

`docs/security/sprint17-enterprise-audit-2026-04-17.md` (the prior audit) identified
that the Enterprise tier in `src/lib/plans.ts` advertises four features — SSO / SAML,
Custom subdomain, SLA, Dedicated support — with no backing code, no runbook, no
contract, and no on-call rotation. `docs/legal/sprint17-church-compliance-2026-04-17.md`
flagged the same surface as an FTC §5 deceptive-practice exposure. Any church that
signs an Enterprise agreement today believes they are buying something that does not
exist. This doc is the resolution: for each contested claim, pick REMOVE, COMING SOON,
or KEEP WITH TIGHTENED DEFINITION, and ship the copy change now — before the Sprint 17
`/for-churches` rewrite re-publishes the old copy verbatim.

Per the task brief: **do not build SSO, SAML, subdomain routing, or a support
contract as part of this hotfix.** Those are multi-sprint efforts. This hotfix only
stops the marketing lie.

## Surfaces audited

| Surface | File | Enterprise copy today |
|---|---|---|
| Plan definition (source of truth) | `src/lib/plans.ts:78–86` | `'Everything in Pro'`, `'Unlimited events'`, `'Unlimited admins'`, `'Custom subdomain'`, `'SSO / SAML'`, `'Dedicated support'`, `'SLA'` |
| Marketing page tier cards | `src/app/(public)/for-churches/page.tsx:136–202` | Renders `plan.features` from `plans.ts` directly. |
| Marketing page feature card | `src/app/(public)/for-churches/page.tsx:35–39` | `'Custom Branding' — 'Your church logo, colors, and subdomain. PrayerJar becomes your tool, not a third-party platform.'` |
| Docs comparison table | `src/app/(public)/docs/paid/page.tsx:95–98` | Four Enterprise-only rows hard-coded: `'Custom subdomain'`, `'SSO / SAML'`, `'SLA'`, `'Dedicated account manager'` |
| Terms of service | `src/app/(public)/terms/page.tsx:31–36` | **"We do not guarantee uptime, data retention beyond our stated policies, or any specific outcome…"** — directly contradicts an SLA claim. |

There is no standalone `/pricing` page; the task brief used "pricing page" as shorthand
for the plan cards on `/for-churches`. The real second surface the brief missed is
`/docs/paid` — included in this reconciliation.

## Decision matrix

| # | Advertised claim (verbatim) | Real backing today | Decision | Rationale |
|---|---|---|---|---|
| 1 | `'SSO / SAML'` (`plans.ts:83`) | `src/lib/auth.ts` registers only Google OAuth + Resend magic links. No SAML library is installed. `allowDangerousEmailAccountLinking: true` (`auth.ts:24`) and no `hd`/`hosted_domain` restriction means a church admin cannot even force their Workspace users through a specific identity provider. There is no per-tenant IdP config, no SCIM, no JIT provisioning. | **COMING SOON — target Sprint 19+** | No defensible minimum version exists. Google Workspace is NOT a keep-with-qualification path: without `hosted_domain` enforcement and forced-IdP, Workspace login is not SSO for the buyer. Enterprise buyers mean "our IdP, our rules, deprovisioning via SCIM" when they say SSO. Labeling "coming soon" keeps the roadmap signal without creating a contractual obligation today. |
| 2 | `'Custom subdomain'` (`plans.ts:82`, and in the `/docs/paid` comparison table) | `churches.subdomain` is a `text().unique()` column at `src/db/schema.ts:537`, written by `PUT /api/v1/church/[slug]/branding`. No root `middleware.ts` exists. No host-based routing. All church data sits in a shared Postgres with application-layer isolation only. | **COMING SOON — target Sprint 19+** | The column exists and the capture UI exists; what is missing is routing. "Coming soon" is honest — the ETA is defensible because the backing column is already in place. |
| 3 | Marketing card copy: `'Your church logo, colors, and subdomain. PrayerJar becomes your tool, not a third-party platform.'` (`for-churches/page.tsx:35–39`) | Logo + colors work today (`BrandingForm.tsx`). Subdomain is cosmetic (see row 2). "Not a third-party platform" implies logical isolation / own-tenant posture that the shared multi-tenant Postgres does not provide. | **REWORD** — drop the subdomain phrase and the "not a third-party platform" implication. | Logo and color customization are real and can stay. The other two phrases overstate what the branding feature delivers. |
| 4 | `'SLA'` (`plans.ts:85`, and `/docs/paid` comparison table) | No SLA document anywhere in `docs/legal/`. No uptime monitoring alert threshold, no credit policy, no on-call rotation, no incident-response runbook. The Terms of Service at `src/app/(public)/terms/page.tsx:33` **explicitly disclaim** uptime guarantees: *"The Prayer Jar is provided as-is. We do not guarantee uptime…"* | **REMOVE** | Advertising "SLA" on the plans page while Terms disclaim uptime is itself the deceptive-practice exposure — the two documents are contradictory, and the contradiction itself compounds the FTC §5 risk. No defensible "coming soon" ETA either: a real SLA requires on-call staffing, monitoring thresholds, a credit schedule, and the legal-ops work we have not scoped. Remove now; re-introduce only when an SLA doc exists in `docs/legal/` AND Terms is updated. |
| 5 | `'Dedicated support'` (`plans.ts:84`) — also appears as `'Dedicated account manager'` on the `/docs/paid` comparison table | No dedicated ticketing, no CS rep assigned, no routing. Every support request goes to the same `mailto:hello@prayerjar.org` that free-tier users email. Pro already advertises `'Priority support'` (`plans.ts:67`). | **REMOVE** — and the `/docs/paid` "Dedicated account manager" row is removed too. | "Dedicated" implies a named human with an inbox routed just to this customer. That does not exist. Relabeling to "Priority support" would duplicate what Pro already has, so there is no tightened definition that gives Enterprise a differentiator here. Remove the row. When there is a CS hire and a named routing alias (e.g. `enterprise@prayerjar.org`), re-introduce with specifics. |
| 6 | `'Everything in Pro'`, `'Unlimited events'`, `'Unlimited admins'` (`plans.ts:79–81`) | `PLANS.enterprise.limits.events = null`, `admins = 999` in `plans.ts:87`. The gating code uses these values. "Everything in Pro" is true if Enterprise inherits all Pro flags at runtime. | **KEEP** | These are real and code-backed. |

## Replacement copy (exact strings)

### `src/lib/plans.ts` — Enterprise `features` array

Replace (lines 78–86):

```ts
features: [
  'Everything in Pro',
  'Unlimited events',
  'Unlimited admins',
  'Custom subdomain',
  'SSO / SAML',
  'Dedicated support',
  'SLA',
],
```

With:

```ts
features: [
  'Everything in Pro',
  'Unlimited events',
  'Unlimited admins',
  'Custom subdomain (coming soon)',
  'SSO / SAML (coming soon)',
  'Custom agreement available',
],
```

Notes:
- "SLA" removed. Replaced by "Custom agreement available" — honest: a bespoke contract
  can be negotiated, but no standing SLA is promised.
- "Dedicated support" removed. Pro already advertises "Priority support"; Enterprise's
  differentiator is the "Custom agreement available" bullet, not a duplicate support tier.
- "Custom subdomain" and "SSO / SAML" kept as bullets but explicitly labeled
  "(coming soon)" — readers cannot infer the feature ships today.

### `src/app/(public)/for-churches/page.tsx` — Custom Branding feature card (lines 34–39)

Replace:

```tsx
{
  icon: '🎨',
  title: 'Custom Branding',
  description:
    'Your church logo, colors, and subdomain. PrayerJar becomes your tool, not a third-party platform.',
},
```

With:

```tsx
{
  icon: '🎨',
  title: 'Custom Branding',
  description:
    'Upload your church logo and choose accent colors so the private wall, event wall, and welcome messages match your congregation. Custom subdomain coming soon.',
},
```

### `src/app/(public)/docs/paid/page.tsx` — FEATURE_COMPARISON rows (lines 95–98)

Replace:

```ts
{ feature: 'Custom subdomain', free: false, starter: false, pro: false, enterprise: true },
{ feature: 'SSO / SAML', free: false, starter: false, pro: false, enterprise: true },
{ feature: 'SLA', free: false, starter: false, pro: false, enterprise: true },
{ feature: 'Dedicated account manager', free: false, starter: false, pro: false, enterprise: true },
```

With:

```ts
{ feature: 'Custom subdomain (coming soon)', free: false, starter: false, pro: false, enterprise: 'Roadmap' },
{ feature: 'SSO / SAML (coming soon)', free: false, starter: false, pro: false, enterprise: 'Roadmap' },
{ feature: 'Custom agreement available', free: false, starter: false, pro: false, enterprise: true },
```

The "SLA" row is removed outright. The "Dedicated account manager" row is removed outright.
The subdomain and SSO rows render as the string `"Roadmap"` in the Enterprise column
(the existing `CellIcon` helper renders string values as text, not a green check).

## Rationale summary

1. **SSO / SAML: COMING SOON, not keep-with-qualification.** The temptation to say
   "Google Workspace counts as SSO" was considered and rejected. Without
   `hd`/`hosted_domain` enforcement and with `allowDangerousEmailAccountLinking: true`,
   a Workspace-using church admin cannot make staff log in through their own IdP. That
   is not SSO in the sense any enterprise buyer uses the term. Coming-soon is honest;
   keep-with-qualification would be confirmation bias.
2. **SLA: REMOVE, not coming-soon.** Terms of Service already disclaim uptime. Having
   the marketing page promise what the Terms disclaim is the very shape of deceptive
   advertising. Removing is cleaner than adding an ETA we cannot defend.
3. **Dedicated support: REMOVE.** Pro already advertises "Priority support"; there is
   no tightened definition of "Dedicated" that is both honest today and distinct from
   Pro. When a CS hire lands and a routed alias exists, re-introduce with specifics.
4. **Custom subdomain: COMING SOON with defensible ETA.** The column exists; only
   host-based routing is missing. A Sprint 19+ ETA is defensible.
5. **Custom Branding card wording:** subdomain mention goes to "coming soon"; "not a
   third-party platform" is cut — it implied logical isolation the shared multi-tenant
   Postgres does not deliver.

## Copy-change handoff to Copywriter

Copywriter picks this up in `pj-s17-for-churches-rewrite`. The content guidance:

- The bullets in `plans.ts` Enterprise `features` are now the approved strings.
  Copywriter may refine tone but **must not** reintroduce "SSO / SAML" without
  "(coming soon)", must not reintroduce "SLA" at all, and must not reintroduce
  "Dedicated support" or "Dedicated account manager" as standalone selling points.
- The "(coming soon)" labels are load-bearing legally. They can be rephrased
  ("Roadmap — Q3 2026", "Planned for 2026", etc.) as long as they remain visible and
  unambiguous in the same visual hierarchy as the bullet itself. Footnote-style
  disclosures do not meet the bar.
- For the Custom Branding card, "logo and colors" is real today. "Subdomain" is
  roadmap. Do not use the phrase "your tool, not a third-party platform" — it
  overstates tenancy isolation.
- If Copywriter wants to add a dedicated "Enterprise" section later in the rewrite,
  the safe bullets are: bespoke agreement terms, unlimited limits, volume pricing,
  and whatever roadmap items are marked coming-soon here.

## Follow-up tasks (for Architect to create in Sprint 18+)

These are the build-side follow-ups the coming-soon labels are writing checks against:

- **Sprint 19+ — SSO / SAML.** Pick a per-tenant OIDC path (WorkOS, Auth.js
  enterprise, or custom provider matrix). Add `hd`-restricted Google Workspace as a
  minimum-viable first cut; remove `allowDangerousEmailAccountLinking`. Track as
  `pj-s19-enterprise-sso` or similar. Note: s17-sec-01 from the prior audit is the
  seed task.
- **Sprint 19+ — Subdomain routing.** Create `middleware.ts` at repo root that maps
  `{subdomain}.prayerjar.org` to the corresponding church slug. Track as
  `pj-s19-subdomain-routing`. Seed: s17-sec-03.
- **Sprint 18 — SLA document.** If we do intend to reintroduce the SLA claim, Legal
  drafts the SLA doc in `docs/legal/sla.md` and updates Terms to remove the
  contradictory "We do not guarantee uptime" sentence for paying plans. SRE defines
  the monitoring alert threshold and the credit policy. Only after that ships can the
  "Custom agreement available" bullet be upgraded to a published SLA.
- **Sprint 18+ — Dedicated support channel.** Decide on CS staffing model first. Only
  then re-introduce the bullet with specifics (e.g. "Named CS contact, <4h response
  weekdays").

## What was NOT reviewed

- The `/docs/churches` admin guide page — the task brief did not name it as a
  target. Grep confirmed no Enterprise-tier claims there, but a full audit of that
  page against `plans.ts` is a separate task.
- Stripe checkout copy / Stripe Price descriptions — those strings live in the
  Stripe dashboard, not in the repo. Strategist should audit during the tier redesign.
- Email templates (welcome, upgrade) — not scoped here. If any reference "SSO" or
  "SLA" in body copy, that is a separate hotfix.
- The tier-to-feature mapping behavior on the `/for-churches` tier cards — the cards
  render `plan.features` directly from `plans.ts`, so editing `plans.ts` cascades into
  the tier cards automatically. This is confirmed by reading `for-churches/page.tsx:177`.

## Acceptance-criteria notes

The task spec lists seven acceptance criteria. Status of each:

1. ✅ This doc exists and is committed.
2. ✅ Matrix covers SSO, SAML (combined with SSO — same bullet), 99.9% SLA (actual code
   says `'SLA'`, not `'99.9%'`; documented), Dedicated support, Custom subdomain, plus
   the Custom Branding card's subdomain reference and the `/docs/paid` "Dedicated
   account manager" row.
3. ✅ Each row states verbatim claim, code reality with file:line, and decision.
4. ✅ For kept claims ("Custom agreement available", "Everything in Pro" et al.),
   defensible definition is stated. The operational backing (Stripe-negotiated
   bespoke agreement) is real today.
5. ✅ Exact replacement copy specified per file/lines above.
6. ✅ Follow-up Sprint 18+/19+ tasks listed for Architect.
7. **⚠ OPEN — Legal sign-off.** Security cannot sign off on Security's own
   resolution as if it were a Legal pass. The PM should route this doc to the Legal
   agent for an explicit pass before closing the task. The Legal audit doc
   (`docs/legal/sprint17-church-compliance-2026-04-17.md`) flagged the same risk
   surface; the resolutions in this doc are aligned with that audit's remediation
   direction, but that is not the same as a Legal agent sign-off on the final copy.
   Flagged in the task note for PM.
