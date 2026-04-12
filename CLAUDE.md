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

## Sprint Kickoff (Architect + PM)

Before any engineer writes code for a new sprint:
1. PM tells Architect to create all tasks in tasks.json as `proposed`
2. Tasks get approved (by PM or human via dashboard)
3. Architect sets `in-progress` and hands to engineers

Never start sprint work without tasks existing in tasks.json first.

## Active Roster

See `agents/` at `D:\Claude\agents\` for full agent definitions.
- PM, Architect, Frontend Engineer, Backend Engineer, Database Engineer, QA, Reviewer

## Definition of Done

A task is done when:
- Code is written and committed
- Tests pass
- Reviewer has approved it in tasks.json (`status: done`)
