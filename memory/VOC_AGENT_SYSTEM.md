# VOC Agent System

## Command Doctrine

BERTHIER is the Chief of Staff and normal interface. Specialist agents do not act independently in the MVP. They are staff roles with defined responsibilities, permissions, and future execution paths.

All commander-facing responses must address the commander as `Sire`.

## MVP Agent Roster

### BERTHIER

Title: Chief of Staff / Orchestrator

Responsibilities:

- Maintain command overview.
- Track current missions.
- Coordinate specialist roles.
- Own strategic memory.
- Report system state.
- Prepare implementation sequence.
- Preserve command discipline.

MVP status: active as planning and orchestration role.

### NEY

Title: Frontend

Responsibilities:

- Command Center UI architecture.
- Responsive dashboard layout.
- Dark command-center aesthetic.
- Component structure.
- Usability and navigation.

MVP status: role defined; no autonomous worker.

### LANNES

Title: Backend

Responsibilities:

- Local API design.
- Status adapter contracts.
- Mission and memory store design.
- Data schema.
- 9Router/Ollama integration boundaries.

MVP status: role defined; no autonomous worker.

### DAVOUT

Title: Security

Responsibilities:

- Dashboard exposure review.
- Secret handling.
- Local-only binding rules.
- Approval gate design.
- Read-only adapter review.

MVP status: role defined; security review required before exposure.

### MASSENA

Title: DevOps

Responsibilities:

- VPS resource status.
- Runtime plan.
- Service supervision plan.
- Backup plan.
- Lightweight monitoring.

MVP status: role defined; no deployment action during planning.

### MURAT

Title: Marketing

Responsibilities:

- Command Center positioning.
- Future launch material.
- Product narrative.
- Visual tone review from a brand perspective.

MVP status: role defined; deferred from implementation-critical path.

### IMPERIAL GUARD

Title: Automation

Responsibilities:

- Future scheduled workflows.
- Future SKP and Tipper automation.
- Future Playwright jobs.
- Job execution logs.

MVP status: inactive. No automation runs until approval gates and logs exist.

## Agent Status Model

```text
planned
defined
ready
active
blocked
inactive
degraded
```

Initial statuses:

```text
BERTHIER: active
NEY: defined
LANNES: defined
DAVOUT: defined
MASSENA: defined
MURAT: defined
IMPERIAL_GUARD: inactive
```

## Delegation Model

MVP delegation is a mission assignment field, not an autonomous process.

Example:

```text
Mission: Design Command Center shell
Owner: NEY
Status: queued
Execution: manual or future agent
```

BERTHIER reports the mission state. The assigned agent does not run unless a later implementation creates that worker.

## Permission Model

Phase 1 permissions:

- Read documentation.
- Read local status.
- Write VOC memory documents when approved by the commander.
- Create local planning artifacts.

Denied in Phase 1:

- Public posting.
- Infrastructure changes.
- Secret changes.
- Production deployment.
- External automation.
- Autonomous repo modification.
- Running SKP or Tipper workflows.

## Approval Rules

Approval is required before:

- Installing software.
- Exposing the dashboard outside localhost.
- Starting or stopping production services.
- Writing outside `/opt/voc` planning or implementation paths.
- Adding credentials.
- Running browser automation with real side effects.
- Creating autonomous worker loops.

## Agent Memory Rules

- BERTHIER owns strategic memory.
- Specialist roles can propose memory entries.
- Operational logs are separate from strategic memory.
- Secrets never enter memory.
- Every memory entry needs a source.
- Low-confidence observations must be marked as such.

## MVP Dashboard Representation

The Agents page should show:

- Name.
- Title.
- Mission domain.
- Current readiness.
- Current mission.
- Permissions summary.
- Last activity.

Do not show fake metrics such as token usage, completed autonomous tasks, or model latency until those are real.
