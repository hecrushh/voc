# VOC Alpha Execute All Phases Authorization

Status: AUTHORIZED

## Mission

Implement VOC Alpha completely.

This document supersedes further planning.

The following documents are already approved:

- `VOC_ALPHA_7_DAY_PLAN.md`
- `IMPLEMENT_VOC_ALPHA.md`

No additional RFCs are required.
No additional planning documents are required.
No additional implementation-plan documents are required.

## Objective

Commander can use BERTHIER through Telegram for daily work.

## Implementation Scope

### Phase 1 — Telegram Integration

Deliver:

- Telegram intake
- Commander allowlist
- Telegram command routing
- Telegram response handling
- Telegram webhook or approved intake path
- Mission creation from Telegram
- Mission updates from Telegram

Validation:

- `/status`
- `/missions`
- `/create`
- `/update`

must work.

---

### Phase 2 — BERTHIER Integration

Deliver:

- BERTHIER Telegram routing
- Slash command normalization
- Natural language routing
- Existing Mission Engine integration

Validation:

- Existing `/berthier` behavior remains functional
- Telegram and web paths share mission state

---

### Phase 3 — Mission Engine Integration

Deliver:

- Mission lookup helpers
- Recent mission summaries
- Mission detail summaries
- Telegram-friendly responses

Validation:

- Existing Mission Engine tests pass
- No schema changes required

---

### Phase 4 — Daily Briefing

Deliver:

- `/briefing`
- mission summary
- blocker summary
- pending approval summary
- top focus summary

Validation:

- useful Telegram briefing output
- deterministic fallback exists

---

### Phase 5 — Workload Summary

Deliver:

- `/workload`
- owner summary
- blocked summary
- priority summary

Use existing `owner_agent` field.

Validation:

- no Agent Assignment implementation
- read-only summary behavior

---

### Phase 6 — Safe Model Routing

Deliver:

- model-router
- provider detection
- deterministic fallback
- safe routing categories

Allowed:

- summaries
- drafting
- classification
- reasoning

Forbidden:

- execution
- deployment
- posting
- account modification
- GitHub write actions

Validation:

- provider failure does not break BERTHIER

---

### Phase 7 — SKP Assistant

Deliver:

- `/skp status`
- `/skp checklist`
- `/skp next`
- `/skp risk`
- `/skp mission`

Allowed:

- planning
- checklist generation
- mission creation
- risk analysis

Forbidden:

- execution
- browser automation
- Playwright
- account actions
- purchases
- posting

Validation:

- execution requests are blocked or approval-gated

---

### Phase 8 — Read-Only GitHub Intelligence

Deliver:

- `/repo status`
- `/github status`
- branch summary
- recent commit summary
- working tree summary

Allowed:

- read-only inspection

Forbidden:

- push
- merge
- PR creation
- issue creation
- repository modification

Validation:

- no write operations exist

---

### Phase 9 — Alpha Launch Validation

Validate:

- Telegram works
- BERTHIER works
- Mission creation works
- Mission updates work
- Briefing works
- Workload works
- SKP assistant works
- GitHub intelligence works

Update:

- `RUNBOOK.md`
- `VOC_RUNTIME_STATE.md`
- `VOC_TASK_ROADMAP.md`

only after successful validation.

## Hard Constraints

Never implement:

- autonomous agents
- hidden execution
- self-modifying systems
- queues
- workers
- autonomous loops
- Playwright execution
- GitHub writes
- Telegram execution bypass
- provider side effects
- SKP execution

## Implementation Process

For every phase:

1. Implement
2. Run tests
3. Run typecheck
4. Run build
5. Fix failures
6. Re-run tests
7. Commit

## Required Report Format

```markdown
# Phase X Report

## Files Changed

## Why Changed

## Tests Executed

## Build Result

## Validation Result

## Commit Hash

## Remaining Work
```

## Completion Rule

Do not stop after Phase 1.
Do not stop after Phase 2.
Do not stop after any intermediate phase.

Continue sequentially through all phases until:

- Phase 9 is complete

or

- a blocking issue is encountered.

If a blocking issue is encountered:

- stop immediately
- document blocker
- propose resolution
- wait for approval

## Execution Order

1. Write this authorization document.
2. Verify file path, file size, `ls -lh`, and `tail -20`.
3. Begin implementation immediately.
4. Execute all phases sequentially.
5. Commit after each validated phase.
6. Stop only at Phase 9 completion or blocking issue.

## Safety Posture

VOC Alpha is a commander-facing Telegram interface to existing BERTHIER and Mission Engine capabilities. It is not an autonomous runtime. It does not add hidden execution, queues, workers, browser automation, GitHub writes, provider side effects, SKP execution, or approval bypass.
