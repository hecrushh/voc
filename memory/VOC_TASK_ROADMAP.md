# VOC Task Roadmap

## Current Mission

Build the first working VOC Command Center prototype by proceeding in strict order:

1. Documentation and architecture.
2. UI wireframe structure.
3. MVP implementation plan.
4. Static prototype.
5. Local status-backed prototype.
6. Persistent mission and memory state.
7. Authenticated deployment.
8. Future orchestration.

## Mission Engine v0.2 Checkpoint

Status: implemented.

Recorded commits:

- `1266e27` — BERTHIER audit and execution-plan reports.
- `ca5ad78` — Mission Engine persistence: `commands`, `approvals`, expanded `mission_events`, and linked mission audit fields.
- `2e2900a` — BERTHIER deterministic command parser v0 and Mission Engine service behavior.
- `15dc4cb` — Controlled BERTHIER intake, approval endpoints, and mission timeline UI.

Implemented scope:

- Commands table.
- Approvals table.
- Expanded mission events.
- Command parser v0.
- Functional `/berthier` intake.
- Mission timeline.
- Approval workflow.

Current safety posture:

- No autonomous agents.
- No Telegram.
- No provider execution.
- No external action execution.
- Risky commands are approval-gated and converted into approval requests.

## Phase 0: Audit And Planning

Status: in progress.

Tasks:

- Read `/opt/voc`.
- Read `/opt/voc/docs`.
- Create `/opt/voc/memory`.
- Write master plan.
- Write architecture.
- Write agent system.
- Write Command Center PRD.
- Write task roadmap.

Exit criteria:

- All five memory documents exist.
- Gaps are documented.
- No production infrastructure changed.

## Phase 1: UI Wireframe Structure

Owner: NEY.

Tasks:

- Define app shell.
- Define navigation.
- Define page layout for Dashboard, Agents, Memory, Missions, Infrastructure.
- Define responsive behavior.
- Define status color vocabulary.
- Define component inventory.
- Define fixture data shape.

Exit criteria:

- Wireframe can be implemented without new architecture decisions.
- Every required MVP section has a visible place in the UI.

## Phase 2: Backend And Data Plan

Owner: LANNES.

Tasks:

- Define local API endpoints.
- Define agent registry schema.
- Define mission schema.
- Define memory schema.
- Define infrastructure status schema.
- Choose fixture JSON or SQLite for first implementation.
- Define adapter interfaces for Ollama, 9Router, OpenCode, VPS resources, and models.

Recommended endpoints:

```text
GET /api/status/summary
GET /api/agents
GET /api/memory
GET /api/missions
GET /api/infrastructure
```

Exit criteria:

- Static UI can be switched to API-backed data without redesign.

## Phase 3: Security Review

Owner: DAVOUT.

Tasks:

- Confirm dashboard binds locally during prototype.
- Confirm no secrets are displayed.
- Confirm infrastructure checks are read-only.
- Confirm no autonomous actions exist.
- Define authentication requirement before public exposure.
- Define approval gates for later command actions.

Exit criteria:

- Prototype is safe to run locally.
- Public exposure is blocked until auth exists.

## Phase 4: DevOps Runtime Plan

Owner: MASSENA.

Tasks:

- Inspect available runtime tooling.
- Avoid installing new packages unless approved.
- Decide local dev port.
- Define process start command.
- Define log location.
- Define backup plan for memory and mission files.
- Define lightweight health checks.

Exit criteria:

- Prototype can run locally without interfering with Ollama, 9Router, or OpenCode.

## Phase 5: Static Command Center Prototype

Owner: NEY with LANNES support.

Tasks:

- Create app folder.
- Build dark responsive app shell.
- Add Dashboard page.
- Add Agents page.
- Add Memory page.
- Add Missions page.
- Add Infrastructure page.
- Add fixture data.
- Validate desktop and mobile layouts.

Exit criteria:

- All required pages render.
- Fixture data covers the complete MVP.
- UI clearly marks inactive/planned systems.

## Phase 6: Read-Only Status Adapters

Owner: LANNES and MASSENA.

Tasks:

- Add VPS resource adapter.
- Add Ollama reachability adapter.
- Add model inventory adapter.
- Add 9Router reachability adapter.
- Add OpenCode presence adapter.
- Add last-checked timestamps.
- Add degraded/restricted/planned/offline handling.

Exit criteria:

- Dashboard shows real local infrastructure status where available.
- Adapter failures do not crash the UI.

## Phase 7: Persistent Memory And Missions

Owner: BERTHIER and LANNES.

Tasks:

- Add writable mission store.
- Add writable memory store.
- Add append-only logs.
- Add seed data.
- Add simple backup/copy strategy.
- Add import/export path.

Exit criteria:

- Missions and memory survive app restart.
- Logs capture key state changes.

## Phase 8: Authentication And Controlled Exposure

Owner: DAVOUT and MASSENA.

Tasks:

- Add authentication.
- Add reverse proxy/TLS plan.
- Add allowlist.
- Add session expiration.
- Add basic request logging.
- Run security review.

Exit criteria:

- Dashboard can be exposed intentionally, not accidentally.

## Phase 9: BERTHIER Command Intake

Owner: BERTHIER and LANNES.

Current state:

- Commit `76a3287` added the BERTHIER command surface at `/berthier`.
- Commit `15dc4cb` made `/berthier` functional for controlled Mission Engine v0.2 intake.
- `/berthier` can create mission records, update mission state, summarize status, list blocked missions, and create approval requests.
- `/berthier` performs no autonomous execution.
- `/berthier` makes no provider calls.
- `/berthier` displays no secrets.

Tasks:

- Add command model.
- Add mission creation command.
- Add memory creation command.
- Add status summary command.
- Add 9Router/Ollama inference path.
- Add approval checks before any side effect.

Exit criteria:

- BERTHIER can update mission/memory state through controlled commands.

## Phase 10: Future Agent Orchestration

Owner: BERTHIER.

Tasks:

- Define worker contract.
- Define tool permissions.
- Define approval queue.
- Define agent logs.
- Activate one low-risk specialist workflow.
- Keep IMPERIAL GUARD inactive until automation safety is proven.

Exit criteria:

- Specialist work is auditable, reversible where possible, and approval-gated.

## Immediate Next Actions

After this documentation phase:

1. Inspect available local tooling: Node, npm, Python, system package state.
2. Decide static HTML versus app framework.
3. Create the UI wireframe structure.
4. Build the first fixture-backed Command Center.
5. Run locally only.
6. Report the local URL or HTML path.

## Risks

- Overbuilding autonomous agents before the dashboard is useful.
- Exposing the dashboard before authentication.
- Making heavy monitoring or vector systems on a constrained VPS.
- Confusing role definitions with active services.
- Mixing production infrastructure operations into prototype development.

## BERTHIER Recommendation

Proceed with a fixture-backed Command Center first. It will give VOC an operational shape immediately while preserving the discipline needed to add real status adapters, memory, missions, and agent orchestration later.
