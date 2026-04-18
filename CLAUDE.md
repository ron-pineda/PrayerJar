@AGENTS.md
@D:\Claude\shared\task-tracking-rules.md

# PrayerJar — Agent Rules

## Task Tracking (mandatory — dashboard depends on this)

Every agent must update `.agent-state/tasks.json` at two moments:

**When starting work:**
- Set `status` → `in-progress`, update `last_touched`

**When handing off:**
- Engineer → QA: set `status` → `review`, update `last_touched`, add note
- QA pass → Reviewer: status stays `review`
- QA fail → Architect: set `status` → `needs-rework`, add note with specific issue
- Reviewer approve: set `status` → `done`, update `last_touched`, add note
- Reviewer reject: set `status` → `needs-rework`, add note

**Also update `.agent-state/handoffs.md` on every handoff:**
```
[timestamp] Agent → Agent: task-id title — one-line context
```

No exceptions. Work that isn't in tasks.json is invisible to the human.

## Sprint Kickoff (PM-led, full-team aware)

Before any engineer writes code for a new sprint:
1. **PM reviews the full agent roster** at `D:\Claude\agents\` (not just the default engineering 5) and decides which specialists this sprint needs. Do not default to the same engineering lineup every sprint — strategic, research, and growth work belongs to the corresponding agents.
2. PM + Architect create all tasks in tasks.json as `proposed`, each assigned to the right agent (see Full Roster below)
3. Tasks get approved (by PM or human via dashboard)
4. The assigned agent sets `in-progress` and begins

Never start sprint work without tasks existing in tasks.json first. Never skip specialist agents because "engineers can do it" — the specialist exists for a reason.

## Full Roster

See `agents/` at `D:\Claude\agents\` for full agent definitions. Consider all of these at sprint planning, not just the engineering core:

**Build team:** Architect, Frontend, Backend, Database, Mobile, AIEngineer, DevOps, SRE, Performance, Security, Integrations, QA, Reviewer
**Product & delivery:** PM, ChiefOfStaff, DocWriter
**Strategy & market:** Strategist, Research, Analytics, Finance, Legal
**Growth & customer:** Growth, Sales, Brand, Content, Copywriter, Designer, CustomerSuccess

PM default engineering roster is still: PM, Architect, Frontend, Backend, Database, QA, Reviewer. But PM **must** proactively pull in Strategist, Research, Growth, Sales, Analytics, Designer, Security, Legal, etc., whenever the sprint's work falls in their domain. A pricing sprint without Strategist is a PM failure. A launch sprint without Growth is a PM failure.

## Definition of Done

A task is done when:
- Code is written and committed
- Tests pass
- Reviewer has approved it in tasks.json (`status: done`)
