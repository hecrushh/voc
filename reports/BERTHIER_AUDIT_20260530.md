# BERTHIER AUDIT 20260530

Role: BERTHIER, Chief of Staff

Scope reviewed:
- /opt/voc/docs
- /opt/voc/memory
- /opt/voc/RUNBOOK.md

## 1. EXECUTIVE SUMMARY

VOC has advanced from pure planning into a working Command Center prototype, but it is not yet an autonomous operating system.

Current state:

- VOC is defined as Virtual Operations Command: a personal AI operating system organized as a command structure.
- BERTHIER is the primary interface, Chief of Staff, and central coordinator.
- The commander-facing style doctrine is explicit: address the commander as “Sire.”
- A Next.js Command Center exists under /opt/voc/apps/command-center.
- The Command Center runs locally at:

  http://127.0.0.1:3010

- Docker Compose uses host networking so the app can inspect loopback-local services such as Ollama and a manually started 9Router.
- The app is intentionally bound to 127.0.0.1, not public interfaces.
- Mission persistence exists through SQLite at /app/data/voc.db inside the container, backed by Docker volume voc_command-center-data.
- Current UI surfaces include:
  - Strategic Overview
  - Agent Board
  - Mission Registry
  - Memory Vault
  - Infrastructure
  - BERTHIER command surface at /berthier
- The /berthier page is currently read-only/non-functional command intake.
- No autonomous agents are active.
- No provider/model calls are made by the UI.
- No tool execution is exposed through the UI.
- Infrastructure integrations are read-only.
- Documentation and memory are mounted read-only.
- Secrets are not displayed, and provider checks only report configuration posture.

Strategic assessment:

VOC is currently a safe, local-first command visibility system with persistent missions and read-only status adapters. The next major step should be a controlled Mission Engine: command intake, mission creation, event logging, approvals, and safe dispatch scaffolding. Specialist autonomy should remain deferred until the Mission Engine is auditable, permissioned, and approval-gated.

## 2. INVENTORY OF EXISTING CAPABILITIES

### A. Command Center application

Existing:
- Next.js Command Center application.
- Docker Compose runtime.
- Local-only service binding at 127.0.0.1:3010.
- Host networking for loopback inspection.
- Standalone production build artifacts exist.
- App route structure exists for:
  - /
  - /agents
  - /missions
  - /memory
  - /infrastructure
  - /berthier

### B. API surface

Existing API routes:
- GET /api/overview
- GET /api/agents
- GET /api/memory
- GET /api/missions
- GET /api/infrastructure
- Mission detail/update route under /api/missions/[id]

### C. Mission Registry

Existing:
- SQLite-backed mission storage.
- Tables:
  - missions
  - mission_events
- Mission status values:
  - queued
  - active
  - blocked
  - completed
  - cancelled
- Mission priority values:
  - low
  - normal
  - high
  - critical
- Mission fields:
  - id
  - title
  - description
  - status
  - priority
  - owner_agent
  - created_at
  - updated_at
- Mission event fields:
  - id
  - mission_id
  - event_type
  - summary
  - created_at

### D. Agent Board

Existing:
- Agent roles represented in the UI.
- Current doctrine: roles are not autonomous workers yet.
- Runbook says the Agent Board has ten command roles, all Offline / Planned.
- Memory doctrine identifies seven MVP-facing agents:
  - BERTHIER
  - NEY
  - LANNES
  - DAVOUT
  - MASSENA
  - MURAT
  - IMPERIAL GUARD
- Broader doctrine also defines:
  - SOULT
  - CAULAINCOURT
  - COLBERT

### E. BERTHIER command surface

Existing:
- /berthier page exists.
- It is read-only/non-functional intake only.
- It performs no autonomous execution.
- It makes no provider calls.
- It displays no secrets.

### F. Memory Vault

Existing:
- Read-only explorer for /opt/voc/docs and /opt/voc/memory.
- Memory doctrine exists for:
  - strategic memory
  - operational memory
  - project memory
  - logs
- Existing memory files include:
  - VOC_MASTER_PLAN.md
  - VOC_ARCHITECTURE.md
  - VOC_AGENT_SYSTEM.md
  - VOC_COMMAND_CENTER_PRD.md
  - VOC_PROVIDER_STRATEGY.md
  - VOC_HERMES_RUNTIME_PLAN.md
  - VOC_RUNTIME_STATE.md
  - VOC_TASK_ROADMAP.md

### G. Infrastructure status

Existing:
- Read-only status posture for:
  - VPS
  - Docker
  - GitHub
  - Cloudflare
  - Hermes runtime
  - Hermes providers
  - Ollama
  - 9Router
- Docker socket access is intentionally restricted.
- The dashboard reports Docker as restricted, not degraded.
- 9Router is installed but treated as planned/manual unless a listener exists.
- Hermes runtime has been observed on host:
  - /usr/local/bin/hermes
  - Hermes Agent v0.15.1 (2026.5.29)
- Hermes configuration posture is checked through safe metadata only.
- Provider status checks use environment-variable presence only and do not reveal key values.

### H. Runtime and deployment posture

Existing:
- Docker Compose service.
- Host networking.
- Local-only Next.js binding.
- Named Docker volume for SQLite persistence.
- Documentation/memory mounted read-only.
- Safe secret practices documented.
- Command Center does not call external model APIs during status checks.

### I. Security posture

Existing:
- No autonomous agents.
- No tool execution from UI.
- No provider calls from UI.
- No cloud calls for GitHub or Cloudflare status.
- Secrets are never displayed.
- Docker remains least-privilege/restricted.
- External actions are not implemented.
- High-risk action doctrine exists in documents.

## 3. INVENTORY OF MISSING CAPABILITIES

### A. Mission Engine

Missing:
- Real command intake processing.
- Command normalization.
- Intent classification.
- Mission creation from BERTHIER commands.
- Mission update commands.
- Mission event timeline from commands.
- Assignment workflow from BERTHIER to agent roles.
- Mission dependency model.
- Mission approval state.
- Mission audit log beyond basic mission_events.
- Mission search/filtering semantics.
- Mission templates.

### B. BERTHIER operational core

Missing:
- Actual BERTHIER command parser.
- Natural language command handling.
- Status summary command.
- Memory creation command.
- Mission creation command.
- Approval request generation.
- Final response composition over current VOC state.
- Telegram intake.
- Daily briefing.
- Reminder handling.
- Schedule/calendar support.

### C. Agent execution

Missing:
- Specialist worker processes.
- Agent tool permissions.
- Agent memory scopes enforced in code.
- Agent assignment queue.
- Agent result handoff back to BERTHIER.
- Agent output schemas.
- Agent conflict prevention.
- Agent-level activity timeline.
- Agent-specific model routing.
- Real delegation loop:

  Commander -> BERTHIER -> Specialist Agent -> BERTHIER -> Commander

### D. Approval system

Missing:
- Approval queue/table.
- Approval request UI.
- Approve/reject/modify workflow.
- Approval enforcement before risky actions.
- Risk classification.
- Audit trail linking command, approval, agent, and external action.
- Telegram approval buttons.
- Policy engine.

### E. Memory system

Missing:
- Writable memory store from UI or BERTHIER.
- Memory source/confidence enforcement.
- Memory correction/deletion workflow.
- Strategic vs operational vs project memory persistence beyond documents.
- Memory retrieval for command answers.
- Memory indexing/search beyond document browsing.
- Memory proposal workflow from specialist agents.
- Protection against memory pollution.
- Document ingestion.
- Full-text and vector retrieval.

### F. Integrations

Missing:
- Telegram bot.
- GitHub integration.
- OpenCode adapter.
- Codex adapter.
- Hermes runtime adapter for safe prompt execution.
- 9Router model routing integration.
- SKP adapter.
- Tipper adapter.
- Playwright worker.
- Calendar/reminder integrations.
- Notification system.
- Cloudflare/GitHub live API calls, if later authorized.

### G. Security and exposure readiness

Missing:
- Authentication.
- Allowlisted dashboard users.
- Session expiration.
- TLS/reverse proxy plan.
- Public exposure security review.
- Request logging.
- Rate limits.
- Secret manager integration.
- Separate staging/production credentials.
- DAVOUT pre-exposure review.

### H. Observability and operations

Missing:
- Health check endpoint or watchdog.
- Error reporting.
- Queue depth metrics.
- Job failure tracking.
- Agent latency tracking.
- Cost/token tracking.
- Backup automation for database and memory.
- Restore procedure.
- Uptime alerts.

### I. Product modules

Missing:
- Product roadmap module.
- PRD generator.
- Engineering module.
- Marketing module.
- Finance/cost module.
- Research/intelligence module.
- SKP operations module.
- Tipper operations module.

## 4. TOP 10 RISKS

### 1. Premature autonomy

Risk:
Activating specialist agents or automation before command intake, approvals, and logs are stable could create uncontrolled side effects.

Mitigation:
Keep agents as staff roles until the Mission Engine, approval gates, and audit log are implemented.

### 2. Dashboard exposure before authentication

Risk:
The Command Center currently binds locally. Public exposure without auth, TLS, allowlist, and session controls would be unsafe.

Mitigation:
No public exposure until DAVOUT completes security review and authentication exists.

### 3. Secret leakage

Risk:
Provider keys, Hermes config, Docker details, or service URLs could leak through status pages, logs, or transcripts.

Mitigation:
Continue posture-only checks. Never display values, prefixes, fingerprints, or config contents.

### 4. Docker privilege escalation

Risk:
Readable Docker socket access would effectively grant host control.

Mitigation:
Keep Docker socket restricted. Do not run the app as root solely for Docker inspection.

### 5. Memory pollution

Risk:
Uncontrolled memory writes could degrade BERTHIER’s decisions and create persistent false assumptions.

Mitigation:
Typed memory with source, scope, confidence, and correction/deletion controls. Specialist agents propose; BERTHIER writes.

### 6. Confusing role definitions with active agents

Risk:
The UI may imply agents are operational when they are only planned/defined.

Mitigation:
Use explicit status vocabulary: planned, defined, ready, active, inactive, restricted, degraded.

### 7. Mission state without auditability

Risk:
Mission CRUD alone does not explain who ordered what, what changed, or why.

Mitigation:
Expand mission_events into a true append-only audit stream before adding command actions.

### 8. Provider routing before policy

Risk:
Hermes, 9Router, Ollama, OpenAI, DeepSeek, MiMo, and Ollama Cloud create routing complexity and possible data-sensitivity mistakes.

Mitigation:
Policy-driven provider selection. Local by default for private/lightweight tasks; remote only by task class and approval posture.

### 9. Overbuilding infrastructure

Risk:
Queues, vector search, full monitoring stacks, and multi-agent orchestration could consume effort before BERTHIER becomes useful.

Mitigation:
Phase 2 should implement controlled mission flow, not full autonomy.

### 10. Automation side effects

Risk:
SKP, Tipper, Playwright, posting, deployment, billing, or GitHub actions can alter real systems.

Mitigation:
Dry-run first. Require explicit approval. Log screenshots/output/results. Keep IMPERIAL GUARD inactive until safety is proven.

## 5. RECOMMENDED PHASE 2 ROADMAP

Recommendation:
Phase 2 should be “Mission Engine and Controlled BERTHIER Intake,” not full specialist autonomy.

The existing roadmap has multiple phase schemes. The practical next phase after the current Command Center prototype should be:

### Phase 2A: Mission Engine foundation

Build:
- Command table.
- Mission event expansion.
- Command-to-mission linkage.
- Mission audit timeline.
- Mission owner assignment to agent roles.
- Mission status transitions.
- Mission priority handling.
- Mission notes/events.
- Safe validation rules.

Exit criteria:
- Every mission change is attributable and reconstructable.
- BERTHIER can create/update missions through a controlled backend path.
- No external side effects exist.

### Phase 2B: BERTHIER command intake

Build:
- /berthier command form becomes functional.
- Supported commands:
  - create mission
  - update mission
  - summarize status
  - list blocked missions
  - list pending approvals
  - create memory proposal, if memory write path exists
- Deterministic command parser first.
- LLM-assisted parsing later, after policy is defined.

Exit criteria:
- BERTHIER can turn a commander instruction into structured mission state.
- Invalid or risky commands are refused or converted into approval requests.
- All responses preserve the “Sire” command doctrine.

### Phase 2C: Approval scaffold

Build:
- Approval model.
- Approval status:
  - requested
  - approved
  - rejected
  - modified
  - expired
- Approval risk levels:
  - low
  - medium
  - high
  - critical
- UI list of pending approvals.
- Enforcement before any future external action.

Exit criteria:
- The system can request approval even before it can execute approved actions.
- Approval records link back to commands, missions, and agents.

### Phase 2D: Writable memory, still controlled

Build:
- Memory table/store.
- Memory create/update/delete.
- Fields:
  - type
  - title
  - body
  - source
  - confidence
  - scope
  - tags
  - created_at
  - updated_at
- Memory proposal flow from commands.
- No inferred memory yet unless explicitly approved.

Exit criteria:
- BERTHIER can save and retrieve explicit memory.
- Memory can be corrected or deleted.
- Secrets are blocked from memory.

### Phase 2E: Read-only agent task flow

Build:
- Agent assignment remains non-autonomous.
- Agent roles can own missions.
- Agent pages show current assigned missions.
- No worker execution yet.
- No external tools yet.

Exit criteria:
- The Command Center can model delegation without pretending agents are running.

### Phase 2F: Provider planning, no execution by default

Build:
- HermesAdapter interface.
- Model provider policy table.
- Sensitivity classes.
- No prompt routing until command intake and audit are ready.

Exit criteria:
- Provider execution can be added later without rewriting architecture.

## 6. RECOMMENDED MISSION ENGINE ARCHITECTURE

Mission Engine purpose:
Turn commander intent into structured, auditable, approval-aware work objects that BERTHIER can supervise.

Recommended architecture:

```text
UI / Telegram later
      |
      v
BERTHIER Command Intake
      |
      v
Command Parser
      |
      v
Policy + Risk Classifier
      |
      +--> Reject unsafe/impossible command
      +--> Request approval
      +--> Create/update mission
      |
      v
Mission Engine
      |
      +--> Mission Store
      +--> Mission Event Log
      +--> Approval Store
      +--> Memory Proposal Store
      +--> Agent Assignment Registry
      |
      v
BERTHIER Response Composer
```

Core tables or data objects:

### A. commands

Fields:
- id
- source: berthier_ui | telegram | system | future_api
- raw_text
- parsed_intent
- commander_id
- status: received | parsed | rejected | converted_to_mission | awaiting_approval | completed
- risk_level
- created_at
- resolved_at

### B. missions

Current table exists. Expand gradually with:
- id
- title
- description
- status
- priority
- owner_agent
- source_command_id
- requires_approval
- approval_id
- due_at
- blocked_reason
- created_at
- updated_at
- completed_at

### C. mission_events

Current table exists. Expand event_type vocabulary:
- mission_created
- mission_updated
- status_changed
- priority_changed
- owner_changed
- note_added
- approval_requested
- approval_resolved
- command_linked
- memory_proposed
- external_action_blocked
- system_error

Fields:
- id
- mission_id
- command_id
- agent_id
- event_type
- summary
- metadata_json
- created_at

### D. approvals

Fields:
- id
- action_type
- requested_by_agent
- mission_id
- command_id
- summary
- risk_level
- status
- approved_by
- created_at
- resolved_at
- resolution_note

### E. memory_proposals

Fields:
- id
- source_command_id
- source_mission_id
- proposed_by_agent
- memory_type
- scope
- title
- body
- confidence
- status: proposed | accepted | rejected | superseded
- created_at
- resolved_at

### F. agent_assignments

Fields:
- id
- mission_id
- agent_id
- assignment_type
- status
- instructions
- created_by
- created_at
- updated_at

Mission Engine rules:

1. BERTHIER owns mission creation and final communication.
2. Specialist agents may own missions but do not execute until workers exist.
3. All state changes create mission_events.
4. Any future side-effect action must have:
   - command
   - mission
   - policy decision
   - approval if required
   - execution log
5. Memory writes must be deliberate and sourced.
6. External actions are impossible until adapters are explicitly added.
7. Risk classifier runs before execution, not after.
8. UI must clearly distinguish:
   - planned
   - ready
   - active
   - blocked
   - completed
   - requires approval

Recommended Mission Engine status flow:

```text
queued
  -> active
  -> blocked
  -> completed
```

Alternative flows:
- queued -> cancelled
- active -> blocked
- blocked -> active
- active -> cancelled
- blocked -> cancelled

Recommended command outcomes:

- answer_directly
- create_mission
- update_mission
- request_approval
- propose_memory
- refuse_unsafe
- ask_clarifying_question
- mark_as_future_capability

## 7. RECOMMENDED AGENT HIERARCHY AND RESPONSIBILITIES

Command doctrine:
BERTHIER remains the commander-facing interface. Specialists report to BERTHIER. The commander should not have to manage agent chatter directly.

Recommended hierarchy:

```text
Commander
    |
    v
BERTHIER
Supreme Chief of Staff / Orchestrator
    |
    +--> SOULT
    |    Product Strategy / PRDs / Roadmap
    |
    +--> NEY
    |    Frontend / UI / UX / Next.js
    |
    +--> LANNES
    |    Backend / APIs / Database / Integrations
    |
    +--> DAVOUT
    |    Security / Permissions / Threat Review
    |
    +--> MASSENA
    |    DevOps / Runtime / Monitoring / Backups
    |
    +--> MURAT
    |    Marketing / Launch / Campaigns
    |
    +--> CAULAINCOURT
    |    Intelligence / Research / Market Analysis
    |
    +--> COLBERT
    |    Finance / Cost / Budget / Forecasting
    |
    +--> IMPERIAL GUARD
         Automation / Playwright / SKP / Tipper / Scheduled Jobs
```

Near-term active hierarchy:

### A. BERTHIER

Status:
- Active as interface and command coordinator.

Responsibilities:
- Maintain operational overview.
- Create and update missions.
- Route work to agent roles.
- Own strategic memory.
- Enforce command style.
- Request approvals.
- Summarize VOC state.
- Prevent premature autonomy.

Phase 2 permissions:
- Read docs/memory.
- Read infrastructure status.
- Create/update mission records.
- Create mission events.
- Propose/write approved memory.
- Request approvals.

Denied:
- External side effects.
- Infrastructure changes.
- Secret changes.
- Autonomous tool execution.

### B. LANNES

Status:
- Should become Phase 2 implementation owner for Mission Engine backend.

Responsibilities:
- Mission Engine data model.
- API endpoints.
- SQLite migrations.
- Command persistence.
- Mission events.
- Approval store.
- Adapter interfaces.

### C. DAVOUT

Status:
- Security gatekeeper.

Responsibilities:
- Approval model.
- Local-only binding review.
- Secret handling.
- Auth requirements.
- Permission model.
- External action risk policy.
- Pre-exposure review.

### D. NEY

Status:
- UI owner.

Responsibilities:
- Mission Engine UI.
- BERTHIER command surface.
- Mission detail/timeline UI.
- Pending approval UI.
- Agent assignment display.
- Responsive dashboard clarity.

### E. MASSENA

Status:
- Runtime owner.

Responsibilities:
- Docker/Compose runtime.
- Health checks.
- Logs.
- Backups.
- SQLite volume protection.
- Local service status.
- Deployment discipline.

### F. IMPERIAL GUARD

Status:
- Must remain inactive.

Responsibilities later:
- Scheduled workflows.
- SKP automation.
- Tipper automation.
- Playwright jobs.
- Job run reports.
- Screenshot/log evidence.

Activation condition:
- Only after approval gates, logs, dry-run mode, and failure recovery exist.

### G. MURAT, SOULT, CAULAINCOURT, COLBERT

Status:
- Defined/planned.

Recommended sequencing:
- Keep deferred until the Mission Engine supports safe mission assignment and memory.
- SOULT may enter before MURAT/CAULAINCOURT/COLBERT if product roadmap work becomes a priority.
- COLBERT should enter before costly provider routing or automation expansion.

## 8. RECOMMENDED NEXT IMPLEMENTATION MILESTONE

Recommended milestone:
Mission Engine v0.2: Controlled BERTHIER mission intake.

Objective:
Make BERTHIER capable of creating and updating structured missions from the /berthier command surface while preserving the current safety posture: no autonomous execution, no provider calls unless explicitly added later, no external side effects.

Deliverables:

### 1. Command data model

Add persistent command records:
- raw command text
- source
- parsed intent
- status
- risk level
- linked mission id
- created/resolved timestamps

### 2. Mission Engine service layer

Implement backend functions:
- createMissionFromCommand
- updateMissionStatus
- addMissionEvent
- assignMissionOwner
- listPendingApprovals
- summarizeCurrentState

### 3. BERTHIER command parser v0

Start deterministic, not fully LLM-based.

Supported command examples:
- “Create mission: [title]”
- “Assign mission [id] to Lannes”
- “Mark mission [id] blocked: [reason]”
- “Mark mission [id] complete”
- “Summarize VOC state”
- “What is blocked?”
- “What is pending?”

### 4. Mission event timeline

Every command-driven mission change must append an event.

### 5. BERTHIER UI upgrade

Upgrade /berthier from read-only intake to controlled command console:
- command input
- parsed result preview
- created/updated mission link
- safety refusal message where applicable
- recent command history

### 6. Safety enforcement

Block:
- infrastructure changes
- external messages
- provider/model calls
- GitHub changes
- public posting
- SKP/Tipper/Playwright actions
- secret inspection or display

### 7. Acceptance tests

Minimum tests:
- A create mission command creates one mission and one mission event.
- An update command changes mission status and appends an event.
- A blocked mission requires a reason.
- A risky command is refused or converted into an approval request.
- BERTHIER responses address the commander as Sire.
- No command path performs external side effects.
- No secret-bearing files are read or displayed.

Why this milestone is the correct next move:

- It converts the Command Center from passive visibility into controlled command operations.
- It preserves discipline before autonomy.
- It uses the existing SQLite mission base.
- It prepares for approvals, memory, and agent delegation.
- It does not require public exposure.
- It does not require full model routing.
- It does not activate unsafe automation.

Final BERTHIER recommendation:

Proceed with Mission Engine v0.2 before any autonomous agent work, Telegram bot work, SKP/Tipper automation, or public exposure.

The system is ready to become operationally useful, Sire, but only if the next step strengthens command discipline rather than expanding autonomy prematurely.
