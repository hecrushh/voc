# RFC: VOC Agent Assignment v0.3

Status: Proposed RFC  
Owner: BERTHIER  
Repository: `/opt/voc`  
Baseline branch: `master`  
Baseline commit: `3b3f529`  
Scope: RFC only; no implementation authorized

## 1. Executive Summary

Agent Assignment v0.3 defines mission ownership and workload management for VOC Command Center. It extends Mission Engine v0.2 with a database-backed assignment layer that can record which staff role owns a mission, show workload by role, display assigned owners in the Mission Registry, and preserve an auditable history of every assignment change.

The design is administrative, not autonomous. Assigning a mission to BERTHIER, NEY, LANNES, DAVOUT, MASSENA, MURAT, IMPERIAL GUARD, or another profile means assigning responsibility and visibility. It does not create a worker, call a model provider, execute tools, send Telegram messages, run background jobs, or perform the mission.

The required v0.3 additions are:

- `agent_profiles` as the database-backed registry of assignable staff roles.
- `mission_assignments` as the current and historical ownership relation between missions and agents.
- `assignment_events` as an append-only audit trail.
- Controlled assign, reassign, and unassign workflows.
- Workload summaries by agent.
- Agent Board data backed by SQLite, not fixtures.
- Mission Registry assigned-owner display.
- Validation and audit rules preserving Mission Engine v0.2 safety posture.

Strategic and ambiguous decisions remain BERTHIER responsibilities. Claude/DeepSeek-class models are appropriate for strategic reasoning only when provider execution is separately approved. `qwen3:4b` remains a lightweight operational helper for classification, summaries, routing assistance, and formatting; it must not be positioned as a strategic planner.

## 2. Current Baseline

Authoritative current state comes from `RUNBOOK.md`, `memory/VOC_RUNTIME_STATE.md`, `memory/VOC_TASK_ROADMAP.md`, `memory/VOC_AGENT_SYSTEM.md`, `memory/VOC_PROVIDER_STRATEGY.md`, `docs/agents.md`, and `docs/architecture.md`. The runtime state and task roadmap are newer than `docs/review.md`; `review.md` is historical MVP critique and is not the current implementation baseline.

Baseline facts:

- Repository: `/opt/voc`.
- Branch: `master`.
- Stable commit: `3b3f529`.
- Command Center runs locally at `http://127.0.0.1:3010`.
- Mission Engine v0.2 is implemented.
- `/berthier` is controlled Mission Engine v0.2 intake.
- Docker is passing.
- Tests are passing.
- Typecheck is passing.
- Working tree is expected to remain clean except for this RFC document.
- SQLite persistence lives at `/app/data/voc.db` inside the container and is backed by Docker volume `voc_command-center-data`.
- Existing mission persistence includes `missions`, `mission_events`, `commands`, and `approvals`.
- Documentation, memory, and reports mounts are read-only in the running Command Center.

Current safety posture:

- No autonomous agents are active.
- No Telegram interface is active.
- No provider execution is active.
- No external action execution is active.
- No tool execution is exposed through the UI.
- `/berthier` makes no provider calls and performs no autonomous execution.
- Risky commands are approval-gated and converted into approval requests instead of being executed.
- Infrastructure integrations remain read-only.
- Secrets are never displayed.

Current agent doctrine:

- BERTHIER is Chief of Staff and normal interface.
- Specialist agents are staff roles with defined responsibilities, not independent workers.
- MVP delegation is a mission assignment field, not an autonomous process.
- IMPERIAL GUARD remains inactive until automation safety is proven.

## 3. Problem Statement

Mission Engine v0.2 can persist missions, commands, approvals, and mission events. The Command Center also presents an Agent Board and a Mission Registry. However, mission ownership is still too shallow for operational command:

- Agent roles are defined in memory and documentation, but are not yet represented as durable database-backed profiles.
- Mission ownership is not modeled as a first-class, auditable workflow.
- Reassignment history is not independently reconstructable as an assignment audit trail.
- Agent Board data cannot yet serve as a reliable workload management surface if it is not backed by assignment records.
- Mission Registry needs clear assigned-owner display without implying worker execution.
- Workload summaries need to aggregate existing mission, command, and approval state without triggering side effects.

Without v0.3, delegation risks remaining either cosmetic or too easily confused with future autonomous execution. Agent Assignment v0.3 must close that gap by making ownership explicit, durable, safe, and auditable.

## 4. Goals

Agent Assignment v0.3 must:

1. Define `agent_profiles` as a durable registry of assignable staff roles.
2. Define `mission_assignments` as the active and historical link between missions and agent profiles.
3. Define `assignment_events` as append-only assignment audit history.
4. Support assigning a mission to an agent.
5. Support reassigning a mission from one agent to another.
6. Support unassigning a mission where required.
7. Provide workload summaries by agent profile.
8. Back the Agent Board with database state.
9. Show assigned owner in the Mission Registry.
10. Preserve an audit event for every assignment, reassignment, unassignment, validation failure, and profile mutation.
11. Preserve approval discipline.
12. Preserve all Mission Engine v0.2 safety boundaries.
13. Keep agents as roles/staff, not autonomous workers.
14. Keep provider strategy policy-only unless provider execution is separately approved.
15. Keep `qwen3:4b` scoped to lightweight operational helper use only.

## 5. Non-Goals

Agent Assignment v0.3 must not:

- Implement autonomous agents.
- Create worker runtimes.
- Start background processes.
- Add queues, schedulers, daemons, pollers, or hidden loops.
- Execute missions.
- Execute commands.
- Dispatch tools.
- Call model providers.
- Add Telegram integration.
- Send external messages.
- Trigger external side effects.
- Change Docker configuration.
- Run migrations as part of this RFC.
- Implement API endpoints as part of this RFC.
- Change Mission Engine v0.2 execution or approval semantics.
- Recommend Telegram MVP as the next step.
- Position `qwen3:4b` as a strategic planner.

Future orchestration remains outside v0.3. The next approved target is Agent Assignment v0.3 as mission ownership and workload management.

## 6. Safety Invariants

The following invariants are mandatory:

1. Assignment is not execution.
2. Agents remain roles/staff, not autonomous workers.
3. Assigning a mission must not execute that mission.
4. Reassigning a mission must not execute that mission.
5. Unassigning a mission must not execute that mission.
6. Agent profile creation must not start a runtime.
7. Agent Board actions must not dispatch tools or providers.
8. No provider execution is allowed in v0.3.
9. No Telegram execution is allowed in v0.3.
10. No external side effects are allowed in v0.3.
11. No tool execution is allowed in v0.3.
12. No hidden execution paths are allowed in v0.3.
13. No background agent runtime is allowed in v0.3.
14. Approval discipline must remain intact.
15. Every successful assignment mutation must create an assignment audit event.
16. Every rejected assignment mutation should create a validation or rejection audit event when enough context exists to do so safely.
17. Assignment workflow must not alter mission status, command status, approval status, Docker state, provider state, or Telegram state.
18. Policy rules and safety invariants override prompt suggestions.

Permitted v0.3 mutations are limited to assignment workflow records:

- `agent_profiles`
- `mission_assignments`
- `assignment_events`

Optional mirroring into `mission_events` may be considered during implementation only if explicit, audited, and non-executing. The canonical audit trail remains `assignment_events`.

## 7. Data Model

This section defines the target data model. It is not a migration file and does not authorize schema changes by itself.

### 7.1 `agent_profiles`

Purpose: database-backed registry of assignable staff roles.

An agent profile is an ownership target and staff identity. It is not a process, model session, queue consumer, or worker.

Recommended fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | text | yes | Stable identifier. |
| `agent_key` | text | yes | Unique key such as `berthier`, `ney`, `lannes`. |
| `display_name` | text | yes | Human display name. |
| `title` | text | yes | Staff title. |
| `agent_class` | text | yes | Controlled class such as `strategic`, `frontend`, `backend`, `security`, `devops`, `marketing`, `automation`, `reporting`. |
| `status` | text | yes | `active`, `defined`, `planned`, `inactive`, `blocked`, or `disabled`. |
| `responsibilities_json` | text/json | yes | Role responsibilities from agent doctrine. |
| `permissions_json` | text/json | yes | Administrative permissions and denied actions. |
| `model_policy_json` | text/json | optional | Policy metadata only; not provider execution config. |
| `max_active_missions` | integer | optional | Advisory workload capacity. |
| `created_at` | text | yes | ISO timestamp. |
| `updated_at` | text | yes | ISO timestamp. |

Recommended unique constraint:

```text
agent_profiles.agent_key UNIQUE
```

Recommended initial profiles:

- `berthier` — Chief of Staff / strategic orchestration.
- `ney` — frontend.
- `lannes` — backend.
- `davout` — security.
- `massena` — DevOps.
- `murat` — marketing.
- `imperial_guard` — automation command, inactive.
- Optional future profiles from `docs/agents.md`: `soult`, `caulaincourt`, `colbert`.

Status interpretation:

- `active`: may own missions.
- `defined`: documented and visible; may own missions if policy allows.
- `planned`: visible future role; normally should not own active missions.
- `inactive`: visible but not assignable to new active missions.
- `blocked`: temporarily not assignable.
- `disabled`: not assignable.

### 7.2 `mission_assignments`

Purpose: active and historical ownership relation between a mission and an agent profile.

Recommended fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | text | yes | Assignment identifier. |
| `mission_id` | text | yes | Existing mission identifier. |
| `agent_profile_id` | text | yes | Assigned staff role. |
| `assignment_status` | text | yes | `active`, `superseded`, `unassigned`, or `cancelled`. |
| `assignment_reason` | text | optional | Human-readable reason. |
| `assigned_by` | text | yes | Actor initiating assignment. |
| `assigned_at` | text | yes | ISO timestamp. |
| `ended_at` | text | optional | ISO timestamp when no longer active. |
| `superseded_by_assignment_id` | text | optional | New assignment replacing this one. |
| `metadata_json` | text/json | optional | Non-authoritative metadata. |

Required invariant:

```text
A mission may have at most one active assignment.
```

Recommended statuses:

- `active`: current owner.
- `superseded`: replaced by reassignment.
- `unassigned`: explicitly ended without replacement.
- `cancelled`: invalidated administrative assignment, not mission cancellation.

### 7.3 `assignment_events`

Purpose: append-only audit trail for assignment workflow.

Recommended fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | text | yes | Event identifier. |
| `mission_id` | text | optional | Required for mission assignment events. |
| `assignment_id` | text | optional | Related assignment record. |
| `event_type` | text | yes | Controlled event vocabulary. |
| `from_agent_profile_id` | text | optional | Previous owner for reassignment/unassignment. |
| `to_agent_profile_id` | text | optional | New owner for assignment/reassignment. |
| `actor` | text | yes | Actor causing event. |
| `reason` | text | optional | Human-readable reason. |
| `policy_result_json` | text/json | optional | Policy evaluation result. |
| `metadata_json` | text/json | optional | Non-secret metadata. |
| `created_at` | text | yes | ISO timestamp. |

Required event types:

- `agent_profile_created`
- `agent_profile_updated`
- `mission_assigned`
- `mission_reassigned`
- `mission_unassigned`
- `assignment_rejected`
- `assignment_validation_failed`
- `workload_summary_generated` if read auditing is enabled
- `agent_board_viewed` if read auditing is enabled

Write events are mandatory for all mutations. Read events are optional and should be enabled only if product policy requires read audit.

### 7.4 Relationship to Existing Tables

Existing Mission Engine v0.2 tables remain authoritative for their domains:

- `missions` owns mission identity, status, priority, description, timestamps, and existing owner field until v0.3 migration decisions are implemented.
- `mission_events` owns mission timeline events.
- `commands` owns command intake records.
- `approvals` owns approval workflow records.

New assignment tables own only assignment state:

- `agent_profiles` owns assignable staff identity.
- `mission_assignments` owns mission-to-agent ownership relation.
- `assignment_events` owns assignment audit history.

No assignment table owns execution state.

## 8. API Contracts

This section defines target API behavior only. It does not authorize endpoint implementation.

### 8.1 Common Rules

All v0.3 assignment APIs must:

- Return structured JSON.
- Validate input before mutation.
- Use explicit assignment workflow for all ownership changes.
- Create assignment events for mutations.
- Avoid provider calls.
- Avoid Telegram calls.
- Avoid tool execution.
- Avoid background jobs.
- Avoid mission execution.
- Preserve approval discipline.

### 8.2 `GET /api/agent-profiles`

Purpose: list database-backed staff profiles.

Response shape:

```json
{
  "agent_profiles": [
    {
      "id": "string",
      "agent_key": "berthier",
      "display_name": "BERTHIER",
      "title": "Chief of Staff / Orchestrator",
      "agent_class": "strategic",
      "status": "active",
      "max_active_missions": 10,
      "active_mission_count": 3
    }
  ]
}
```

### 8.3 `POST /api/agent-profiles`

Purpose: create a staff profile.

Safety note: this creates a role record only. It must not start a worker runtime.

Required side effect:

- Create `agent_profiles` row.
- Create `assignment_events` row with `agent_profile_created`.

### 8.4 `PATCH /api/agent-profiles/{agent_profile_id}`

Purpose: update profile metadata or status.

Required side effect:

- Update `agent_profiles` row.
- Create `assignment_events` row with `agent_profile_updated`.

Disabling a profile must not automatically reassign active missions unless a separate explicit reassignment workflow is invoked.

### 8.5 `GET /api/missions/{mission_id}/assignment`

Purpose: return current assignment for one mission.

Response shape:

```json
{
  "mission_id": "string",
  "assignment": {
    "id": "string",
    "agent_profile_id": "string",
    "agent_key": "lannes",
    "display_name": "LANNES",
    "assignment_status": "active",
    "assigned_by": "berthier",
    "assigned_at": "timestamp",
    "assignment_reason": "Backend ownership"
  }
}
```

If no active assignment exists:

```json
{
  "mission_id": "string",
  "assignment": null
}
```

### 8.6 `POST /api/missions/{mission_id}/assignment`

Purpose: assign an unassigned mission to an agent.

Request shape:

```json
{
  "agent_profile_id": "string",
  "reason": "string",
  "actor": "berthier"
}
```

Required behavior:

- Validate mission exists.
- Validate agent profile exists.
- Validate agent profile is assignable.
- Validate no active assignment already exists for the mission.
- Create active `mission_assignments` row.
- Create `assignment_events` row with `mission_assigned`.
- Return assignment and event summary.

If active assignment already exists, reject and require reassignment API.

### 8.7 `POST /api/missions/{mission_id}/reassignment`

Purpose: reassign a mission from current owner to another agent.

Request shape:

```json
{
  "from_agent_profile_id": "string",
  "to_agent_profile_id": "string",
  "reason": "string",
  "actor": "berthier"
}
```

Required behavior:

- Validate mission exists.
- Validate current active assignment exists.
- Validate `from_agent_profile_id` matches current owner.
- Validate target agent profile exists and is assignable.
- Mark previous assignment `superseded` and set `ended_at`.
- Create new active assignment.
- Link old assignment to new assignment through `superseded_by_assignment_id`.
- Create `assignment_events` row with `mission_reassigned`.
- Return previous assignment, new assignment, and event summary.

### 8.8 `POST /api/missions/{mission_id}/unassignment`

Purpose: explicitly remove active mission ownership.

Request shape:

```json
{
  "from_agent_profile_id": "string",
  "reason": "string",
  "actor": "berthier"
}
```

Required behavior:

- Validate mission exists.
- Validate current active owner matches `from_agent_profile_id`.
- Mark current assignment `unassigned` and set `ended_at`.
- Create `assignment_events` row with `mission_unassigned`.
- Do not change mission status.

### 8.9 `GET /api/agent-board`

Purpose: return Agent Board view backed by database state.

Response shape:

```json
{
  "agents": [
    {
      "agent_profile": {
        "id": "string",
        "agent_key": "berthier",
        "display_name": "BERTHIER",
        "status": "active"
      },
      "workload": {
        "active_missions": 0,
        "blocked_missions": 0,
        "critical_missions": 0,
        "pending_approvals": 0,
        "open_commands": 0,
        "oldest_assignment_age_seconds": 0,
        "capacity_label": "normal"
      },
      "missions": []
    }
  ],
  "unassigned": {
    "count": 0,
    "missions": []
  }
}
```

### 8.10 `GET /api/agent-profiles/{agent_profile_id}/workload`

Purpose: return workload summary for one agent profile.

This endpoint must be read-only.

### 8.11 `GET /api/assignment-events`

Purpose: return assignment audit trail.

Recommended filters:

- `mission_id`
- `agent_profile_id`
- `event_type`
- `actor`
- `created_after`
- `created_before`

## 9. Assignment State Machine

Assignment state is separate from mission state.

### 9.1 States

Required assignment states:

- `active`
- `superseded`
- `unassigned`
- `cancelled`

Mission-level display may show `unassigned` when no active assignment row exists.

### 9.2 Assign Flow

```text
No active assignment
  -> active assignment created
  -> mission_assigned event created
```

Mission status remains unchanged.

### 9.3 Reassign Flow

```text
active assignment A
  -> A becomes superseded
  -> active assignment B created
  -> A.superseded_by_assignment_id = B.id
  -> mission_reassigned event created
```

Mission status remains unchanged.

### 9.4 Unassign Flow

```text
active assignment
  -> assignment becomes unassigned
  -> mission_unassigned event created
```

Mission status remains unchanged.

### 9.5 Validation Failure Flow

```text
invalid request
  -> no assignment state change
  -> assignment_validation_failed or assignment_rejected event created when auditable
```

### 9.6 Forbidden Transitions

Agent Assignment v0.3 has no transition to:

- `executing`
- `running`
- `dispatched`
- `provider_called`
- `telegram_sent`
- `worker_started`
- `background_started`

## 10. Agent Workload Model

Workload summaries are database reads and aggregations. They do not trigger balancing, reassignment, execution, notifications, or external effects.

### 10.1 Workload Inputs

Workload may read from:

- `agent_profiles`
- `mission_assignments`
- `missions`
- `commands`
- `approvals`
- `assignment_events`

### 10.2 Workload Metrics

Recommended metrics per agent:

- `active_missions`
- `queued_missions`
- `active_status_missions`
- `blocked_missions`
- `completed_missions`
- `cancelled_missions`
- `critical_missions`
- `high_priority_missions`
- `pending_approvals`
- `open_commands`
- `oldest_assignment_age_seconds`
- `newest_assignment_age_seconds`
- `average_assignment_age_seconds`
- `max_active_missions`
- `capacity_used_ratio`
- `capacity_label`

### 10.3 Capacity Labels

Recommended labels:

- `normal`
- `elevated`
- `overloaded`
- `inactive`
- `disabled`

Recommended rules:

```text
disabled: agent profile status is disabled
inactive: agent profile status is inactive, blocked, or planned
overloaded: max_active_missions exists and active_missions > max_active_missions
elevated: max_active_missions exists and active_missions >= 80% of max_active_missions
normal: otherwise
```

### 10.4 No Automatic Rebalancing

Workload summary must never automatically reassign missions. Any rebalancing decision must be represented as a separate explicit reassignment request and audit event.

### 10.5 Model Policy for Workload Helpers

`qwen3:4b` may be used later, if provider execution is explicitly approved, for lightweight workload summary wording, classification support, routing helper text, or formatting. It must not make strategic ownership decisions as the primary planner.

Strategic or ambiguous workload decisions remain BERTHIER responsibilities and should use Claude/DeepSeek-class reasoning only if model provider execution is separately authorized.

## 11. Agent Board Integration

### 11.1 Purpose

The Agent Board becomes the operational view for staff roles and mission ownership. It must be backed by database records rather than fixtures.

### 11.2 Required Board Lanes

Recommended lanes:

- BERTHIER
- NEY
- LANNES
- DAVOUT
- MASSENA
- MURAT
- IMPERIAL GUARD
- Other defined profiles
- Unassigned

Future lanes may include SOULT, CAULAINCOURT, and COLBERT as documented in `docs/agents.md`.

### 11.3 Required Board Display

For each agent lane, display:

- Agent name.
- Title.
- Status.
- Mission domain or responsibilities summary.
- Active mission count.
- Capacity label.
- Assigned missions.
- Blocked mission count.
- Pending approval count.
- Last assignment activity.

Do not display fake metrics such as token usage, autonomous task completion, model latency, or worker health unless those systems are real and approved.

### 11.4 Permitted Board Actions

The Agent Board may expose controlled administrative actions:

- Assign mission.
- Reassign mission.
- Unassign mission.
- View assignment history.
- View workload summary.

### 11.5 Forbidden Board Actions

The Agent Board must not expose:

- Execute mission.
- Start agent.
- Dispatch worker.
- Call provider.
- Send Telegram.
- Run tool.
- Start automation.
- Trigger background job.

### 11.6 Board Read Model

The board read model may join:

- `agent_profiles`
- `mission_assignments`
- `missions`
- `commands`
- `approvals`
- `assignment_events`

The read model is not a queue and must not become an execution scheduler.

## 12. Mission Registry Integration

### 12.1 Purpose

The Mission Registry must show assigned owner clearly while preserving Mission Engine v0.2 as the source of mission state.

### 12.2 Required Display

Each mission row/detail should display:

- Current assigned agent display name.
- Agent key.
- Assignment age.
- Assignment status.
- Last assignment event timestamp.

If no active assignment exists, display:

```text
Unassigned
```

### 12.3 Relationship to Existing `missions.owner_agent`

`missions.owner_agent` currently exists in the baseline schema. v0.3 should treat the new assignment tables as the future canonical ownership model while maintaining compatibility with existing mission records.

Migration implementation must decide whether to:

1. Backfill `mission_assignments` from `missions.owner_agent`, then use assignment tables as canonical; or
2. Keep `missions.owner_agent` as a denormalized display/cache field updated only by explicit assignment workflow.

Either option must avoid implicit mission execution and must preserve auditability.

### 12.4 Mission Status Independence

Assignment changes must not alter mission status. For example:

- Assigning a queued mission to LANNES does not make it active.
- Reassigning a blocked mission to DAVOUT does not unblock it.
- Unassigning a mission does not cancel it.

Mission status changes remain Mission Engine v0.2 operations and approval-gated where applicable.

## 13. Audit Trail Requirements

### 13.1 Audit Invariant

Every assignment mutation must produce an `assignment_events` row.

```text
No assignment mutation without assignment audit.
```

If the audit event cannot be written, the assignment mutation must fail atomically.

### 13.2 Required Audit Contents

Assignment events must include:

- Event ID.
- Event type.
- Mission ID where applicable.
- Assignment ID where applicable.
- From-agent profile ID where applicable.
- To-agent profile ID where applicable.
- Actor.
- Reason where supplied.
- Policy result where applicable.
- Timestamp.
- Non-secret metadata.

### 13.3 Append-Only History

`assignment_events` should be append-only. Corrections must be represented by additional events, not mutation of historical event rows.

### 13.4 Audit and Approval Discipline

Assignment itself is generally low-risk administrative state. However, assignment to sensitive roles, assignment involving IMPERIAL GUARD, or assignment requests that imply execution must preserve approval discipline.

If a request asks to assign and execute in one step, the assignment portion may be processed only if safe and explicit; the execution portion must be rejected, halted, or converted into an approval request according to Mission Engine v0.2 policy.

### 13.5 Secret Handling

Assignment audit must not store:

- Provider credentials.
- Telegram tokens.
- Secret-bearing URLs.
- Environment dumps.
- Private keys.
- Hidden execution handles.

## 14. Validation Rules

### 14.1 Agent Profile Validation

- `agent_key` must be unique.
- `agent_key` must use stable lowercase identifier format.
- `display_name` must be present.
- `agent_class` must be a controlled value.
- `status` must be a controlled value.
- Disabled agents cannot receive new active assignments.
- Inactive, blocked, or planned agents should not receive new active assignments unless explicitly allowed by policy.

### 14.2 Mission Assignment Validation

- Mission must exist.
- Target agent profile must exist.
- Target agent profile must be assignable.
- A mission may have at most one active assignment.
- Direct assignment must reject if an active assignment already exists.
- Reassignment must verify `from_agent_profile_id` matches current owner.
- Reassignment reason is required.
- Unassignment reason is required.
- All assignment mutations require actor identity.

### 14.3 Audit Validation

- Successful assignment mutation must create an audit event in the same transaction.
- Reassignment event must include from-agent and to-agent.
- Unassignment event must include from-agent.
- Profile mutation events must identify actor.
- Audit metadata must not include secrets.

### 14.4 Safety Validation

Reject or strip any request field implying:

- execution,
- provider call,
- Telegram call,
- tool dispatch,
- worker start,
- background runtime,
- queue enqueue,
- external side effect,
- hidden execution path.

Examples of forbidden request intent:

```text
execute_now
dispatch
run_agent
start_worker
call_provider
send_telegram
invoke_tool
background_job
autonomous_loop
```

### 14.5 Model Policy Validation

- BERTHIER handles strategic reasoning.
- Strategic or ambiguous assignment decisions must not use `qwen3:4b` as primary planner.
- `qwen3:4b` may be referenced only as lightweight operational helper for classification, summaries, routing helpers, and formatting.
- Provider execution remains disallowed until separately approved.

## 15. Migration Strategy

This RFC does not authorize migration files or migration execution. It defines the migration strategy for later approval.

### 15.1 Phase 0 — RFC Approval

Current phase.

Allowed:

- Review this RFC.
- Revise this RFC.
- Approve or hold the design.

Forbidden:

- Schema changes.
- Migration files.
- Endpoint implementation.
- Docker changes.
- Runtime changes.
- Provider calls.
- Telegram calls.
- Autonomous workers.

### 15.2 Phase 1 — Schema Design Proposal

Future explicit approval required.

Deliverables:

- SQL migration draft for `agent_profiles`.
- SQL migration draft for `mission_assignments`.
- SQL migration draft for `assignment_events`.
- Constraint/index review.
- Rollback plan.
- Backfill plan from existing `missions.owner_agent`.

### 15.3 Phase 2 — Migration Dry Run

Future explicit approval required.

Run migrations only against disposable/local test database copy. Confirm rollback and baseline data compatibility.

### 15.4 Phase 3 — API Implementation

Future explicit approval required.

Implement assignment APIs without execution capability. Include tests before activating UI workflows.

### 15.5 Phase 4 — Agent Board Database Backing

Future explicit approval required.

Replace or augment Agent Board fixture/planned data with database read model. Keep planned/inactive roles visible without implying workers exist.

### 15.6 Phase 5 — Mission Registry Owner Display

Future explicit approval required.

Add assigned-owner display from assignment tables. Maintain Mission Engine v0.2 mission status behavior.

### 15.7 Phase 6 — Controlled Activation

Future explicit approval required.

Enable assign/reassign/unassign flows locally. Verify working tree, Docker, tests, and typecheck. Confirm no autonomous runtime, no provider execution, no Telegram execution, and no hidden paths.

## 16. Test Plan

### 16.1 Baseline Regression Tests

Verify after future implementation:

- Existing missions still load.
- Existing mission events still load.
- Existing commands still load.
- Existing approvals still load.
- `/berthier` remains controlled intake.
- Docker remains healthy.
- Tests pass.
- Typecheck passes.

### 16.2 Agent Profile Tests

- Create agent profile.
- Reject duplicate `agent_key`.
- Update profile status.
- Confirm disabling profile does not start runtime and does not automatically reassign missions.
- Confirm IMPERIAL GUARD can be represented as inactive without automation starting.

### 16.3 Assignment Tests

- Assign unassigned mission to active agent.
- Reject assignment to missing mission.
- Reject assignment to missing agent.
- Reject assignment to disabled agent.
- Reject second active assignment for same mission.
- Confirm `mission_assigned` event is created.
- Confirm mission status is unchanged.

### 16.4 Reassignment Tests

- Reassign mission from current owner to target owner.
- Confirm old assignment becomes `superseded`.
- Confirm new assignment becomes `active`.
- Confirm old assignment links to new assignment.
- Confirm `mission_reassigned` event includes from/to agents.
- Reject reassignment when from-agent does not match current owner.
- Confirm mission status is unchanged.

### 16.5 Unassignment Tests

- Unassign mission with active owner.
- Confirm assignment becomes `unassigned`.
- Confirm `mission_unassigned` event is created.
- Reject unassignment from wrong owner.
- Confirm mission status is unchanged.

### 16.6 Workload Summary Tests

- Agent with no missions reports zero active missions.
- Agent with assigned missions reports correct counts.
- Blocked mission counts are correct.
- Pending approval counts are correct.
- Capacity labels are correct.
- Workload endpoint is read-only.
- Workload summary does not trigger reassignment.

### 16.7 Agent Board Tests

- Board lists agent profiles from database.
- Board lists assigned missions under correct profile.
- Board lists unassigned missions separately.
- Board shows workload metrics.
- Board does not expose execute, dispatch, provider, Telegram, or worker actions.
- Board assignment action creates audit event.
- Board reassignment action creates audit event.

### 16.8 Mission Registry Tests

- Mission list shows assigned owner.
- Mission detail shows assigned owner and assignment age.
- Unassigned mission displays `Unassigned`.
- Assignment changes update owner display.
- Assignment changes do not change mission status.

### 16.9 Audit Tests

- Every successful assignment mutation has an event.
- Failed validation creates audit event when safe.
- Assignment events are append-only.
- Audit includes actor and timestamp.
- Audit excludes secrets.
- Event ordering is deterministic by timestamp and ID.

### 16.10 Safety Tests

- Assignment request with `execute_now` is rejected or execution portion ignored with audit note.
- Assignment API does not call providers.
- Assignment API does not send Telegram messages.
- Assignment API does not dispatch tools.
- Assignment API does not create background jobs.
- Assignment API does not start workers.
- `qwen3:4b` is not accepted as strategic planner.
- Strategic or ambiguous assignment decisions route to BERTHIER policy.

## 17. Definition of Done

Agent Assignment v0.3 is done only when all of the following are true after separately approved implementation:

### 17.1 Data Model

- `agent_profiles` exists and stores assignable staff roles.
- `mission_assignments` exists and tracks active/historical ownership.
- `assignment_events` exists and records append-only audit.
- One-active-assignment-per-mission invariant is enforced.

### 17.2 Workflows

- Mission can be assigned to an agent.
- Mission can be reassigned from one agent to another.
- Mission can be unassigned.
- Every mutation creates an audit event.
- Validation failures are handled safely and audibly.

### 17.3 UI/API Integration

- Agent Board is backed by database state.
- Agent Board shows workload summaries.
- Agent Board exposes only assignment-management actions.
- Mission Registry shows assigned owner.
- Assignment history is inspectable.

### 17.4 Safety

- No autonomous runtime exists.
- No provider execution exists.
- No Telegram execution exists.
- No external side effects exist.
- No tool execution exists.
- No hidden execution paths exist.
- Agents remain roles/staff, not autonomous workers.
- Approval discipline remains intact.

### 17.5 Baseline Preservation

- Mission Engine v0.2 behavior remains stable.
- Existing mission, command, approval, and event flows continue to work.
- Docker passes.
- Tests pass.
- Typecheck passes.
- Working tree is clean after approved changes are committed.

### 17.6 Model Policy

- BERTHIER remains strategic reasoning layer.
- Claude/DeepSeek-class models remain the policy choice for strategic or ambiguous reasoning if provider execution is separately approved.
- `qwen3:4b` remains lightweight operational helper only.
- `qwen3:4b` is not positioned as a strategic planner.

## 18. Implementation Hold / Approval Recommendation

Recommendation: APPROVE RFC; HOLD IMPLEMENTATION.

Rationale:

Agent Assignment v0.3 is the correct next target for VOC because it converts existing staff-role doctrine into durable, auditable mission ownership without introducing autonomous execution. It strengthens the Command Center by making Agent Board and Mission Registry ownership real while preserving Mission Engine v0.2 safety posture.

Approval should apply only to this RFC. Implementation, database migrations, endpoint creation, UI changes, Docker changes, provider execution, Telegram execution, and any autonomous runtime remain on hold until separately and explicitly approved.
