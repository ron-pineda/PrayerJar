# Copy Brief: Network-Tier Reposition

**Task:** pj-s22-21-copy-network-reposition
**Author:** Copywriter
**Date:** 2026-04-20
**Status:** In review

---

## Current state

### plans.ts — enterprise tier `features` array (current)

```ts
features: [
  'Everything in Growing Church',
  'Unlimited events',
  'Unlimited admins',
  'Custom subdomain (coming soon)',
  'SSO / SAML (coming soon)',
  'Custom agreement available',
],
```

### for-churches page — Network contact section (lines 324–329, current)

```
A Network plan is a bespoke agreement. You get unlimited everything, volume pricing,
and a contract that fits how your denomination actually operates. Custom subdomain and
SSO are on the roadmap — we can discuss timeline when we talk.
```

---

## Changes

### plans.ts enterprise features list

OLD:
```ts
'Custom subdomain (coming soon)',
'SSO / SAML (coming soon)',
```

NEW:
```ts
'Custom subdomain',
'Enterprise login coming soon',
'Custom analytics reports coming soon',
```

Full updated array:
```ts
features: [
  'Everything in Growing Church',
  'Unlimited events',
  'Unlimited admins',
  'Custom subdomain',
  'Enterprise login coming soon',
  'Custom analytics reports coming soon',
  'Custom agreement available',
],
```

**Rationale for each change:**
- `'Custom subdomain (coming soon)'` → `'Custom subdomain'` — pj-s22-16 has shipped in code. The feature is live (DNS pending Ron's action, but the code is done and the feature is real). No "(coming soon)" parenthetical.
- `'SSO / SAML (coming soon)'` → `'Enterprise login coming soon'` — No vendor names (WorkOS, SAML, SCIM) in user-facing copy per guidelines. "Enterprise login" names the capability pastors understand. "Coming soon" is honest — it is deferred.
- New entry `'Custom analytics reports coming soon'` — The downloadable PDF reports are deferred to Sprint 23. On-screen analytics are live (not "coming soon"). This entry is specifically about the downloadable/PDF version only. Parallel phrasing to "Enterprise login coming soon" keeps the list consistent.

### for-churches page — Network contact section

**File:** `src/app/(public)/for-churches/page.tsx`

OLD (lines 324–329):
```
A Network plan is a bespoke agreement. You get unlimited everything, volume pricing,
and a contract that fits how your denomination actually operates. Custom subdomain and
SSO are on the roadmap — we can discuss timeline when we talk.
```

NEW:
```
A Network plan is a bespoke agreement. You get unlimited everything, a custom
subdomain for your network, volume pricing, and a contract that fits how your
denomination actually operates. Enterprise login and custom analytics reports
are coming — we can talk through what your network needs when we connect.
```

**Rationale:**
- Subdomain is now live — it moves from "on the roadmap" to a stated live feature in the description.
- SSO is still deferred — "Enterprise login ... coming" preserves the honest gap without naming a vendor or a date.
- PDF reports are still deferred — "custom analytics reports are coming" is the same honest-gap signal without claiming it is available today.
- No §7 banned phrases introduced (see sweep below).

---

## §7 sweep

Phrases checked against brand-guide.md §7 banned list:

| Banned phrase | Present in new copy? | Notes |
|---|---|---|
| "gives your [X] the tools to [Y]" | No | — |
| "churches that want pastoral tools" | No | — |
| "Set up your church in minutes." | No | — |
| "Bring your [X] online" | No | — |
| "platform" | No | — |
| "empower," "empowers" | No | — |
| "leverage" | No | — |
| "solutions" | No | — |
| "unlock" | No | — |
| "seamless," "streamlined," "robust," "best-in-class" | No | — |
| "AI-Flagged Care" | No | — |
| "Most Popular" | No | — |
| "Join the community / movement" | No | — |
| Emoji feature icons | No | — |
| Three-or-more scripture references | No | — |
| "Amen!" | No | — |

Result: **clean**.

---

## Claims audit

| Claim | Status | Evidence |
|---|---|---|
| Custom subdomain: positioned as LIVE | ✓ | Removed "(coming soon)" from plans.ts; described as live feature in for-churches contact section |
| Enterprise login: "coming soon" | ✓ | Explicit "coming soon" in plans.ts feature string; "are coming" in for-churches contact section |
| Enterprise login: NOT claimed as live | ✓ | No string asserts SSO/enterprise login is available today |
| Custom analytics reports: "coming soon" | ✓ | Explicit "coming soon" in plans.ts feature string; "are coming" in for-churches contact section |
| Custom analytics reports: NOT claimed as live | ✓ | No string asserts PDF download is available today |
| On-screen analytics: LIVE (not "coming soon") | ✓ | Growing Church tier retains "Advanced analytics & PDF reports" — wait, see note below |
| No vendor names (WorkOS, SAML, SCIM) in user-facing copy | ✓ | "Enterprise login" used throughout; no protocol or vendor named |
| No date, no "scheduled for Q2", no commitment beyond intent | ✓ | Plain "coming soon" phrasing used throughout |

> **Note on Growing Church "Advanced analytics & PDF reports" feature:** The pro tier currently lists `'Advanced analytics & PDF reports'` as a feature. The PDF download portion of this is also not live yet (deferred to Sprint 23). This is a pre-existing drift that is outside the scope of this copy brief — it was present before Sprint 22 and the task scope is the Network tier card. Flagging for PM/QA to decide whether to strip "& PDF reports" from the Growing Church feature list in a follow-up task. This brief does not touch that string to avoid scope creep.

---

## Exact old → new diff

### src/lib/plans.ts

```diff
-      'Custom subdomain (coming soon)',
-      'SSO / SAML (coming soon)',
+      'Custom subdomain',
+      'Enterprise login coming soon',
+      'Custom analytics reports coming soon',
```

### src/app/(public)/for-churches/page.tsx

```diff
-              A Network plan is a bespoke agreement. You get unlimited
-              everything, volume pricing, and a contract that fits how your
-              denomination actually operates. Custom subdomain and SSO are on
-              the roadmap — we can discuss timeline when we talk.
+              A Network plan is a bespoke agreement. You get unlimited
+              everything, a custom subdomain for your network, volume pricing,
+              and a contract that fits how your denomination actually operates.
+              Enterprise login and custom analytics reports are coming — we can
+              talk through what your network needs when we connect.
```
