# Copy Brief: /contact

**Priority:** Standard
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Client page with a hero (envelope emoji ✉️ at `text-5xl`, H1, subheadline), a contact form (name, email, subject dropdown, message textarea + char counter), submit button, and a footer note about prayer-related support and data deletion. **One emoji hit:** ✉️ on line 58 (hero decoration, rendered via HTML entity `&#x2709;&#xFE0F;` but still a visible emoji). Form labels are generic ("Name," "Email," "Subject," "Message"). No banned-phrase hits in visible copy. Toast success message ("Message sent! We'll get back to you soon.") is fine.

## Voice notes for this page
- Warm intro, plain form labels, quick to complete. This is admin overhead, not a conversion surface.
- Per sprint spec: "Plain form labels ('What's on your mind?' not 'Subject (optional)')." — applied in the brief below.
- One sentence of reassurance that a human reads these — small but builds trust.

## Hero
**Headline:** Get in touch
**Subheadline:** Questions, feedback, church partnerships — we read every message.
**Primary CTA:** (the form IS the action)
**Secondary CTA:** (none)

## Section copy

### Form — label-by-label

**Name field**
- **Label:** Your name
- **Placeholder:** First and last
- **Required:** yes

**Email field**
- **Label:** Email
- **Placeholder:** you@example.com *(unchanged)*
- **Required:** yes

**Subject dropdown** (PM/Frontend decision — see Notes for Frontend)
- **Label:** What's this about?
- **Placeholder:** Choose a topic
- **Options:** General question, Church partnership, Feedback, Bug report, Other
  *(Sentence-case; matches current options verbatim aside from case. Keep as dropdown unless PM decides to drop it.)*

**Message field**
- **Label:** What's on your mind?
- **Placeholder:** Tell us what's going on.
- **Required:** yes
- **Char counter:** {n}/2000 *(unchanged)*

### Submit button
**Default:** Send message
**Loading:** Sending…
*(Change from current "Send Message" / "Sending..." — sentence-case + ellipsis character for the loading state.)*

### Toasts
**Success:** Message sent. We'll read it and get back to you.
**Error (validation/server):** We couldn't send that. Please try again.
*(Change from current "Message sent! We'll get back to you soon." and the generic error string.)*

### Footer note
**Copy:** For prayer-related support, use the app directly. For data deletion requests, see our [Privacy Policy](/privacy).
*(Unchanged from current — already on-brand.)*

### Response-time reassurance line (NEW — small line below hero subheadline or above the form)
**Copy:** A real person reads these. We reply within one business day.

## Verse strip (if used)
No verse strip. Reason: admin/utility page. Adding scripture to a contact form would tip into tract register per brand guide §4.3 + §7 #15.

## Lucide icon suggestions
- **Hero:** replace ✉️ with `Mail` (h-10 w-10 text-amber-600) centered above the H1.
- **Form field icons:** none. The form is clean with labels alone.
- **Submit button:** no leading icon (the label is enough). Optional: `Send` (h-4 w-4) trailing.
- **Response-time line:** `Clock` (h-4 w-4 text-muted-foreground) inline before the copy. Optional — Frontend's call.
- **Footer note:** no icon.

## Empty states (if applicable)
N/A — form page.

## Banned-phrase audit
- All 16 banned phrases searched against `contact/page.tsx`.
- **None found.**

## Jar motif
**No.** Admin/contact page. Brand guide §4.2 reserves the jar for hero/product-identity placements; contact is neither.

## Notes for Frontend
- **Remove the ✉️ emoji** on line 58 (rendered via HTML entity `&#x2709;&#xFE0F;`). Replace with Lucide `Mail`.
- **Label rewrites:** `<Label>Name</Label>` → `Your name`, `<Label>Email</Label>` → `Email` (unchanged), `<Label>Subject</Label>` → `What's this about?`, `<Label>Message</Label>` → `What's on your mind?`. Plus placeholder changes per above.
- **Subject dropdown options:** sentence-case the `SUBJECTS` array in place — `"General"` → `"General question"`, `"Church Partnership"` → `"Church partnership"`, `"Feedback"` → `"Feedback"`, `"Bug Report"` → `"Bug report"`, `"Other"` → `"Other"`. The submitted string goes into the contact action; confirm that `submitContactAction` in `src/app/actions/contact.actions.ts` doesn't strict-match on the current casing before shipping. Flag to Backend if it does.
- **Subject dropdown vs free-text field:** sprint spec implies a free-text "What's on your mind?" replacement. This brief keeps the dropdown for routing (so "Church partnership" reaches the right inbox) and renames it to "What's this about?". If PM prefers a simpler free-text-only flow, delete the Subject field entirely and rely on the Message field. Either works — flagging as a PM decision, not a Copywriter call.
- **Submit button text change:** "Send Message" → "Send message". One-character case change.
- **Ellipsis fix:** "Sending..." → "Sending…" (U+2026). Same on /give, /know-jesus, etc. — Frontend should be consistent.
- **Toast copy changes:** update `toast.success("Message sent...")` and `toast.error(...)` strings per above. The error path has two distinct cases in current code (returned `result.error` vs thrown) — Copywriter recommends both render the same user-facing string to avoid leaking internal error messages.
- **Character limits:** hero headline 13 chars; subheadline 59 chars; all labels ≤ 20 chars — safe on mobile.
- **Required validation stays as-is** (native `required` attrs + disabled-when-empty submit logic).