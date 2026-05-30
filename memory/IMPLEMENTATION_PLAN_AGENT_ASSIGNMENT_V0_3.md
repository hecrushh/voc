# VOC Agent Assignment v0.3 Implementation Plan

Status: Implementation plan only  
Source RFC: `/opt/voc/memory/RFC_AGENT_ASSIGNMENT_V0_3.md`  
Repository: `/opt/voc`  
App: `/opt/voc/apps/command-center`  
Baseline branch: `master`  
Baseline commit: `3b3f529`  
Implementation status: HOLD until explicitly approved

No code changes, migrations, source modifications, Docker changes, provider calls, Telegram integration, workers, or autonomous runtime are authorized by this plan.

## 0. Baseline and Constraints

**Repo:** `/opt/voc`  
**App:** `/opt/voc/apps/command-center`  
**Current branch:** `master`  
**Current HEAD observed:** `3b3f529`  
**Current working tree note:** `memory/RFC_AGENT_ASSIGNMENT_V0_3.md` is untracked from the prior RFC step.

### Governing RFC

Primary source:

- `/opt/voc/memory/RFC_AGENT_ASSIGNMENT_V0_3.md`

### Reviewer Notes Applied

This plan incorporates these reviewer decisions:

1. **Use uppercase assignment event types.**
   - Example: `MISSION_ASSIGNED`, not `mission_assigned`.

2. **Seed fixed roster first.**
   - Implement fixed, known VOC staff profiles.
   - Defer public create/update UI for agent profiles.

3. **Treat `mission_assignments` as canonical owner model.**
   - Assignment reads should prefer `mission_assignments`.

4. **Treat `missions.owner_agent` as legacy/cache only.**
   - Maintain compatibility, but do not treat it as the source of truth after v0.3.

### Non-Negotiable Safety Constraints

Agent Assignment v0.3 must not introduce:

- autonomous workers,
- provider execution,
- Telegram execution,
- external side effects,
- tool dispatch,
- hidden execution paths,
- background agent runtime,
- mission execution,
- approval bypass.

Assignment remains administrative ownership only.

## 1. Migration Files Needed

The current DB setup is centralized in:

- `/opt/voc/apps/command-center/lib/db.ts`

There is no existing dedicated migration directory observed. Mission Engine v0.2 currently creates/updates schema inside `getDb()` using `CREATE TABLE IF NOT EXISTS` and `ensureColumn`.

### 1.1 Recommended Migration Approach

For v0.3, use an explicit migration mechanism instead of adding all logic inline to `getDb()`.

#### New directory

Create:

```text
/opt/voc/apps/command-center/lib/migrations/
```

#### New files

Create:

```text
/opt/voc/apps/command-center/lib/migrations/001_agent_assignment_v0_3.sql
/opt/voc/apps/command-center/lib/migrations.ts
```

Optional if tests need direct SQL fixture helpers:

```text
/opt/voc/apps/command-center/tests/helpers/db-test-utils.mjs
```

### 1.2 Migration Tracking Table

Add a minimal migration tracking table:

```text
schema_migrations
```

Purpose:

- prevent re-running migration scripts,
- support deterministic local DB upgrades,
- preserve future migration discipline.

Fields:

```text
id TEXT PRIMARY KEY
name TEXT NOT NULL
applied_at TEXT NOT NULL
```

### 1.3 `agent_profiles` Table

Create table:

```text
agent_profiles
```

Purpose:

Database-backed fixed VOC staff roster.

Recommended fields:

```text
id TEXT PRIMARY KEY
agent_key TEXT NOT NULL UNIQUE
display_name TEXT NOT NULL
title TEXT NOT NULL
agent_class TEXT NOT NULL
status TEXT NOT NULL
responsibilities_json TEXT NOT NULL DEFAULT '[]'
permissions_json TEXT NOT NULL DEFAULT '{}'
model_policy_json TEXT NOT NULL DEFAULT '{}'
max_active_missions INTEGER
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

Recommended constraints:

```text
agent_key UNIQUE
status CHECK IN ('active', 'defined', 'planned', 'inactive', 'blocked', 'disabled')
agent_class CHECK IN (
  'strategic',
  'product',
  'frontend',
  'backend',
  'security',
  'devops',
  'marketing',
  'intelligence',
  'finance',
  'automation',
  'reporting'
)
```

### 1.4 Fixed Roster Seed

Seed fixed profiles in migration, not through public UI.

Recommended fixed roster:

```text
berthier
soult
ney
lannes
davout
massena
murat
caulaincourt
colbert
imperial_guard
```

Recommended initial statuses:

```text
berthier: active
soult: defined
ney: defined
lannes: defined
davout: defined
massena: defined
murat: defined
caulaincourt: defined
colbert: defined
imperial_guard: inactive
```

Important normalization:

- Existing static roster uses `imperial-guard`.
- RFC uses `imperial_guard`.
- Choose canonical DB key: `imperial_guard`.
- Add compatibility mapping from legacy `imperial-guard` to `imperial_guard` during backfill.

### 1.5 `mission_assignments` Table

Create table:

```text
mission_assignments
```

Purpose:

Canonical mission ownership model.

Recommended fields:

```text
id TEXT PRIMARY KEY
mission_id TEXT NOT NULL
agent_profile_id TEXT NOT NULL
assignment_status TEXT NOT NULL
assignment_reason TEXT
assigned_by TEXT NOT NULL
assigned_at TEXT NOT NULL
ended_at TEXT
superseded_by_assignment_id TEXT
metadata_json TEXT NOT NULL DEFAULT '{}'
```

Foreign keys:

```text
mission_id REFERENCES missions(id) ON DELETE CASCADE
agent_profile_id REFERENCES agent_profiles(id) ON DELETE RESTRICT
superseded_by_assignment_id REFERENCES mission_assignments(id) ON DELETE SET NULL
```

Recommended status constraint:

```text
assignment_status CHECK IN ('active', 'superseded', 'unassigned', 'cancelled')
```

Critical index:

```text
CREATE UNIQUE INDEX idx_mission_assignments_one_active
ON mission_assignments(mission_id)
WHERE assignment_status = 'active';
```

Supporting indexes:

```text
idx_mission_assignments_mission_id
idx_mission_assignments_agent_profile_id
idx_mission_assignments_status
idx_mission_assignments_assigned_at
```

### 1.6 `assignment_events` Table

Create table:

```text
assignment_events
```

Purpose:

Append-only assignment audit trail.

Recommended fields:

```text
id TEXT PRIMARY KEY
mission_id TEXT
assignment_id TEXT
event_type TEXT NOT NULL
from_agent_profile_id TEXT
to_agent_profile_id TEXT
actor TEXT NOT NULL
reason TEXT
policy_result_json TEXT NOT NULL DEFAULT '{}'
metadata_json TEXT NOT NULL DEFAULT '{}'
created_at TEXT NOT NULL
```

Foreign keys:

```text
mission_id REFERENCES missions(id) ON DELETE CASCADE
assignment_id REFERENCES mission_assignments(id) ON DELETE SET NULL
from_agent_profile_id REFERENCES agent_profiles(id) ON DELETE SET NULL
to_agent_profile_id REFERENCES agent_profiles(id) ON DELETE SET NULL
```

Uppercase event type constraint:

```text
event_type CHECK IN (
  'AGENT_PROFILE_SEEDED',
  'AGENT_PROFILE_UPDATED',
  'MISSION_ASSIGNED',
  'MISSION_REASSIGNED',
  'MISSION_UNASSIGNED',
  'ASSIGNMENT_REJECTED',
  'ASSIGNMENT_VALIDATION_FAILED',
  'LEGACY_OWNER_BACKFILLED'
)
```

Do **not** add read-audit events initially unless needed:

- Defer `WORKLOAD_SUMMARY_GENERATED`.
- Defer `AGENT_BOARD_VIEWED`.

Reason:

Workload and board reads should remain read-only and not produce noisy audit rows in v0.3.

### 1.7 Legacy Cache Strategy for `missions.owner_agent`

Do **not** remove `missions.owner_agent` in v0.3.

Plan:

- Keep it as a legacy/cache field.
- Maintain it during explicit assignment workflows.
- New owner display and workload logic must read canonical ownership from `mission_assignments`.
- Existing mission creation may continue to populate `missions.owner_agent`, but assignment service should also create corresponding canonical assignment.

## 2. Backfill Strategy from `missions.owner_agent`

### 2.1 Goal

For every existing mission, create exactly one active canonical assignment in `mission_assignments` based on legacy `missions.owner_agent`.

### 2.2 Backfill Timing

Run backfill during `001_agent_assignment_v0_3.sql` after:

1. `agent_profiles` table exists.
2. Fixed roster is seeded.
3. `mission_assignments` table exists.
4. `assignment_events` table exists.

### 2.3 Owner Normalization

Legacy values may include:

```text
berthier
ney
lannes
davout
massena
murat
soult
caulaincourt
colbert
imperial-guard
imperial_guard
```

Normalize:

```text
lowercase
trim
replace spaces with underscore
replace hyphen with underscore
```

Specific mapping:

```text
imperial-guard -> imperial_guard
masséna -> massena
```

Fallback:

- Unknown owner should map to `berthier` or a reserved `unassigned` strategy.

Recommended for v0.3:

```text
unknown owner -> berthier
```

Reason:

- Avoid creating public custom profile management.
- Keep fixed roster first.
- Preserve command discipline.

Record unknown-owner fallback in `assignment_events.metadata_json`.

### 2.4 Backfill Assignment Rows

For each mission without an active assignment:

Create `mission_assignments`:

```text
mission_id = missions.id
agent_profile_id = normalized matching profile ID
assignment_status = 'active'
assignment_reason = 'Backfilled from legacy missions.owner_agent'
assigned_by = 'system:migration'
assigned_at = missions.created_at if present else current timestamp
metadata_json = {
  "source": "missions.owner_agent",
  "legacy_owner_agent": "<original value>"
}
```

### 2.5 Backfill Audit Events

For each backfilled assignment, create `assignment_events`:

```text
event_type = 'LEGACY_OWNER_BACKFILLED'
mission_id = missions.id
assignment_id = new assignment id
to_agent_profile_id = assigned profile id
actor = 'system:migration'
reason = 'Backfilled canonical mission assignment from legacy missions.owner_agent'
metadata_json = {
  "legacy_owner_agent": "<original value>",
  "canonical_agent_key": "<normalized key>"
}
```

### 2.6 Idempotency Rules

Migration/backfill must be safe if partially run or re-entered.

Rules:

- Do not create duplicate agent profiles.
- Do not create more than one active assignment per mission.
- Do not duplicate backfill event for a mission if assignment already exists.
- Use `schema_migrations` to prevent full migration re-run.

### 2.7 Canonical Ownership After Backfill

After backfill:

- `mission_assignments` is canonical.
- `missions.owner_agent` is legacy/cache.
- UI owner display reads from active assignment joined to `agent_profiles`.
- Assignment workflows update both:
  - canonical `mission_assignments`,
  - legacy/cache `missions.owner_agent`.

## 3. API Files to Change

### 3.1 Existing API Files

Current relevant files:

```text
/opt/voc/apps/command-center/app/api/agents/route.ts
/opt/voc/apps/command-center/app/api/missions/route.ts
/opt/voc/apps/command-center/app/api/missions/[id]/route.ts
/opt/voc/apps/command-center/app/api/overview/route.ts
/opt/voc/apps/command-center/app/api/berthier/route.ts
```

### 3.2 New API Files

Create:

```text
/opt/voc/apps/command-center/app/api/agent-profiles/route.ts
/opt/voc/apps/command-center/app/api/agent-board/route.ts
/opt/voc/apps/command-center/app/api/assignment-events/route.ts
/opt/voc/apps/command-center/app/api/missions/[id]/assignment/route.ts
/opt/voc/apps/command-center/app/api/missions/[id]/reassignment/route.ts
/opt/voc/apps/command-center/app/api/missions/[id]/unassignment/route.ts
```

### 3.3 Defer Public Profile Mutation APIs

Reviewer note says:

> Seed fixed roster first; defer public agent profile create/update UI.

Therefore v0.3 should initially implement:

```text
GET /api/agent-profiles
```

Do **not** initially expose public:

```text
POST /api/agent-profiles
PATCH /api/agent-profiles/{id}
DELETE /api/agent-profiles/{id}
```

If internal profile status updates are needed later, keep them DB/service-internal, not public UI.

### 3.4 `/api/agents` Strategy

Current:

```text
app/api/agents/route.ts
```

returns static `agents` from `lib/agents.ts`.

Plan:

- Either keep `/api/agents` as backward-compatible alias, or update it to read fixed seeded profiles from DB.
- Preferred: keep route path but change source to assignment service read model.
- Response can remain `{ agents }` for compatibility.

Do not break existing pages while transitioning.

### 3.5 Mission APIs

#### `/api/missions/route.ts`

Current POST creates mission with `owner_agent`.

Plan:

- Keep accepting `owner_agent` temporarily for compatibility.
- After `createMission`, create canonical assignment via assignment service.
- Cache `missions.owner_agent` remains populated.
- Mission creation event remains mission event.
- Assignment creation must also create `MISSION_ASSIGNED` assignment event.

#### `/api/missions/[id]/route.ts`

Current PATCH can update `owner_agent`.

Plan:

- Stop treating mission PATCH as canonical assignment mutation.
- If PATCH includes `owner_agent`, either:
  1. Reject with message: use assignment/reassignment endpoint; or
  2. Internally route to reassignment service.

Preferred for safety and audit clarity:

```text
Reject direct owner_agent change through mission PATCH once v0.3 assignment APIs exist.
```

Reason:

- Forces explicit assignment workflow.
- Guarantees `assignment_events`.

Exception:

- During transitional implementation, mission create may still accept `owner_agent` and generate assignment.

#### New `/api/missions/[id]/assignment/route.ts`

Methods:

```text
GET
POST
```

GET:

- Return current canonical assignment for mission.

POST:

- Assign mission with no active assignment.
- Reject if active assignment already exists.
- Create uppercase `MISSION_ASSIGNED` event.

#### New `/api/missions/[id]/reassignment/route.ts`

Methods:

```text
POST
```

Behavior:

- Validate from owner.
- Validate target profile.
- Supersede old assignment.
- Create new active assignment.
- Update legacy/cache `missions.owner_agent`.
- Create uppercase `MISSION_REASSIGNED` event.

#### New `/api/missions/[id]/unassignment/route.ts`

Methods:

```text
POST
```

Behavior:

- Validate active owner.
- Mark assignment `unassigned`.
- Update legacy/cache `missions.owner_agent` to a safe value.

Recommended cache value:

```text
unassigned
```

But because current `missions.owner_agent` is `NOT NULL`, `unassigned` must either:

- be accepted as a legacy/cache sentinel, or
- map to `berthier`.

Preferred for clear display:

```text
unassigned
```

But only if validation allows it.

#### New `/api/agent-board/route.ts`

Methods:

```text
GET
```

Behavior:

- Read from `agent_profiles`.
- Join active `mission_assignments`.
- Join `missions`.
- Aggregate workload.
- Include unassigned missions.

No mutation.

#### New `/api/assignment-events/route.ts`

Methods:

```text
GET
```

Behavior:

- Return audit trail.
- Support filters:
  - `mission_id`
  - `agent_profile_id`
  - `event_type`
  - `actor`
  - `created_after`
  - `created_before`

No mutation.

### 3.6 BERTHIER Command Intake

Current:

```text
/opt/voc/apps/command-center/lib/mission-engine.ts
```

parses:

```text
assign mission <id> to <agent>
```

and calls `updateMission(... owner_agent ...)`.

Plan:

- Change `assign_mission` behavior to use assignment service.
- If no active assignment exists, call assign.
- If active assignment exists and target differs, call reassign.
- If target equals current owner, return idempotent response without changing mission state, optionally log `ASSIGNMENT_REJECTED` or no-op event depending policy.
- Do not execute anything.
- Preserve command audit in `commands`.
- Link command ID into assignment event metadata.

## 4. Service/Library Files to Change

### 4.1 Existing Files

Modify:

```text
/opt/voc/apps/command-center/lib/db.ts
/opt/voc/apps/command-center/lib/types.ts
/opt/voc/apps/command-center/lib/agents.ts
/opt/voc/apps/command-center/lib/mission-engine.ts
```

### 4.2 New Files

Create:

```text
/opt/voc/apps/command-center/lib/assignment.ts
/opt/voc/apps/command-center/lib/agent-roster.ts
/opt/voc/apps/command-center/lib/migrations.ts
/opt/voc/apps/command-center/lib/migrations/001_agent_assignment_v0_3.sql
```

### 4.3 `lib/types.ts`

Add types:

```text
AgentProfile
AgentProfileStatus
AgentClass
MissionAssignment
MissionAssignmentStatus
AssignmentEvent
AssignmentEventType
AssignmentWorkload
AgentBoardAgent
AgentBoardResponse
MissionWithAssignment
```

Uppercase event type union:

```text
'AGENT_PROFILE_SEEDED'
'AGENT_PROFILE_UPDATED'
'MISSION_ASSIGNED'
'MISSION_REASSIGNED'
'MISSION_UNASSIGNED'
'ASSIGNMENT_REJECTED'
'ASSIGNMENT_VALIDATION_FAILED'
'LEGACY_OWNER_BACKFILLED'
```

### 4.4 `lib/agent-roster.ts`

Purpose:

Fixed roster seed source.

Should export fixed roster metadata derived from current `lib/agents.ts` and docs.

Use canonical keys:

```text
berthier
soult
ney
lannes
davout
massena
murat
caulaincourt
colbert
imperial_guard
```

### 4.5 `lib/agents.ts`

Current static UI roster.

Plan options:

1. Keep as compatibility wrapper that maps fixed roster to legacy `Agent` shape.
2. Replace internal static roster with DB-backed route usage.

Preferred:

- Keep static fixed roster in `agent-roster.ts`.
- Make `agents.ts` compatibility-only for build-time fallback.
- Agent Board should no longer rely on `agents.ts` for live workload.

### 4.6 `lib/assignment.ts`

Core assignment service.

Functions to plan:

```text
listAgentProfiles()
getAgentProfileById(id)
getAgentProfileByKey(agentKey)
listAssignmentEvents(filters)
getMissionAssignment(missionId)
assignMissionToAgent(input)
reassignMission(input)
unassignMission(input)
getAgentWorkload(agentProfileId)
getAgentBoard()
backfillMissionAssignmentsFromLegacyOwners()
normalizeAgentKey(value)
```

Safety-oriented helper:

```text
rejectExecutionIntent(input)
```

Validation functions:

```text
validateAssignableAgent(profile)
validateMissionExists(missionId)
validateNoActiveAssignment(missionId)
validateCurrentOwner(missionId, fromAgentProfileId)
```

### 4.7 `lib/db.ts`

Plan:

- Add migration runner call inside `getDb()` after DB opens and `PRAGMA foreign_keys = ON`.
- Avoid putting all v0.3 SQL inline if possible.
- Expose low-level DB helpers only if needed.
- Existing mission CRUD remains, but owner behavior changes:
  - `createMission` creates mission row and canonical assignment.
  - `updateMission` no longer handles owner changes as ordinary mission update.
  - `rowToMission` still includes `owner_agent` legacy/cache.

## 5. UI Files to Change

### 5.1 Agent Board

Current:

```text
/opt/voc/apps/command-center/app/agents/page.tsx
```

uses static `agents`.

Plan:

- Convert to database-backed Agent Board.
- Server-side fetch/read `getAgentBoard()` directly or through `/api/agent-board`.
- Display:
  - agent name,
  - title,
  - status,
  - responsibilities,
  - active mission count,
  - blocked mission count,
  - pending approval count,
  - capacity label,
  - assigned mission cards,
  - unassigned lane.

#### No Public Profile Create/Update UI

Do **not** add:

- create agent profile form,
- edit agent profile form,
- delete agent profile action.

Fixed roster only.

#### Board Actions

Initial UI may include:

- Assign mission.
- Reassign mission.
- Unassign mission.
- View assignment history.

If time/scope pressure exists, stage actions:

**v0.3a:**

- Read-only Agent Board backed by DB.

**v0.3b:**

- Controlled assignment/reassignment forms.

### 5.2 Mission Registry

Current:

```text
/opt/voc/apps/command-center/app/missions/page.tsx
/opt/voc/apps/command-center/app/missions/mission-registry.tsx
```

Plan:

- Pass missions enriched with assignment data.
- Replace owner display from `mission.owner_agent` with canonical active assignment display.
- Keep `missions.owner_agent` only as legacy/cache fallback.
- Owner dropdown should be removed from generic mission create/edit form or converted to explicit assignment workflow.

Recommended UI change:

- Mission create form may include initial owner, but label it:
  - `Initial assignment`
- Mission edit form should not directly edit owner.
- Add explicit `Assign/Reassign` control near mission card.
- Assignment controls call assignment endpoints, not mission PATCH.

### 5.3 Timeline/Audit Display

Current Mission Registry shows `mission_events`.

Plan:

- Add assignment audit section or merge display of assignment events.
- Prefer separate section:
  - `Assignment Audit`
- Show uppercase event types:
  - `MISSION_ASSIGNED`
  - `MISSION_REASSIGNED`
  - `MISSION_UNASSIGNED`
  - `LEGACY_OWNER_BACKFILLED`

Do not rename existing `mission_events.event_type`; reviewer note applies to assignment event types.

### 5.4 Overview Page

Current:

```text
/opt/voc/apps/command-center/app/api/overview/route.ts
/opt/voc/apps/command-center/app/page.tsx
```

Plan:

- Optionally include agent workload summary in overview.
- Do not block v0.3 on overview if Agent Board and Mission Registry are complete.

## 6. Test Files to Add/Update

### 6.1 Existing Test Files

Current tests:

```text
/opt/voc/apps/command-center/tests/mission-engine-db.test.mjs
/opt/voc/apps/command-center/tests/mission-engine-commands.test.mjs
```

### 6.2 New Test Files

Create:

```text
/opt/voc/apps/command-center/tests/agent-assignment-db.test.mjs
/opt/voc/apps/command-center/tests/agent-assignment-workflow.test.mjs
/opt/voc/apps/command-center/tests/agent-assignment-board.test.mjs
/opt/voc/apps/command-center/tests/agent-assignment-safety.test.mjs
```

Optional API route tests if current setup supports them:

```text
/opt/voc/apps/command-center/tests/agent-assignment-api.test.mjs
```

### 6.3 Update Existing Tests

Update:

```text
/opt/voc/apps/command-center/tests/mission-engine-db.test.mjs
```

Add assertions:

- mission creation creates canonical assignment,
- mission creation creates `MISSION_ASSIGNED`,
- `mission_assignments` is canonical,
- `missions.owner_agent` remains cache.

Update:

```text
/opt/voc/apps/command-center/tests/mission-engine-commands.test.mjs
```

Change current assignment command test expectations if needed:

- `assign mission <id> to <agent>` uses assignment service,
- creates uppercase assignment event,
- does not mutate mission status,
- does not execute anything.

### 6.4 Migration Tests

In `agent-assignment-db.test.mjs`:

Test:

1. DB initializes new v0.3 tables.
2. Fixed roster is seeded.
3. Roster uses canonical `imperial_guard`.
4. `agent_key` unique constraint works.
5. Backfill creates one active assignment per existing mission.
6. Backfill creates `LEGACY_OWNER_BACKFILLED`.
7. Backfill is idempotent.
8. Unknown legacy owner falls back safely and records metadata.
9. Event types are uppercase.

### 6.5 Workflow Tests

In `agent-assignment-workflow.test.mjs`:

Test:

1. Assign unassigned mission to LANNES.
2. Reject assigning mission with existing active assignment.
3. Reassign from LANNES to DAVOUT.
4. Reject reassignment when `from_agent_profile_id` is wrong.
5. Unassign mission.
6. Reject assignment to `disabled` or `inactive` agent.
7. Reassignment updates legacy/cache `missions.owner_agent`.
8. Mission status remains unchanged through assign/reassign/unassign.
9. Every mutation creates assignment event.

### 6.6 Agent Board Tests

In `agent-assignment-board.test.mjs`:

Test:

1. Board lists fixed profiles.
2. Board groups missions under canonical active assignment.
3. Board includes unassigned lane.
4. Workload counts active assigned missions.
5. Workload counts blocked missions.
6. Workload counts pending approvals.
7. Capacity label rules work.
8. Board read does not create assignment events by default.

### 6.7 Safety Tests

In `agent-assignment-safety.test.mjs`:

Test:

1. Payload with `execute_now` is rejected or stripped.
2. Payload with `call_provider` is rejected.
3. Payload with `send_telegram` is rejected.
4. Payload with `start_worker` is rejected.
5. Payload with `background_job` is rejected.
6. No assignment API creates command records that imply execution.
7. Assignment to IMPERIAL_GUARD does not start automation.
8. `qwen3:4b` appears only as lightweight policy metadata if present.
9. No provider/runtime/Telegram fields are emitted in assignment responses.

## 7. Safety Regression Checklist

Before merging v0.3 implementation, verify:

### 7.1 Static Safety

- [ ] No new Telegram route files.
- [ ] No Telegram bot dependency added.
- [ ] No provider SDK dependency added.
- [ ] No worker process added.
- [ ] No cron/scheduler added.
- [ ] No queue runtime added.
- [ ] No Docker service added.
- [ ] No external webhook added.
- [ ] No `fetch()` to model providers added.
- [ ] No tool execution route added.
- [ ] No “execute mission” UI action added.

### 7.2 Assignment Safety

- [ ] Assignment endpoints only mutate assignment tables and legacy/cache owner.
- [ ] Assignment endpoints do not mutate mission status.
- [ ] Reassignment does not unblock, activate, complete, or cancel missions.
- [ ] `mission_assignments` is canonical.
- [ ] `missions.owner_agent` is cache/legacy only.
- [ ] Every assignment mutation creates uppercase `assignment_events`.
- [ ] Failed validation creates uppercase rejection/failure event when safe.
- [ ] Agent profiles are fixed seeded roster only.
- [ ] No public profile create/update UI exists.

### 7.3 Approval Discipline

- [ ] Existing approvals flow still works.
- [ ] Risky `/berthier` commands still become approval requests.
- [ ] Assignment-to-execution combined requests do not execute.
- [ ] IMPERIAL_GUARD remains inactive/non-runtime.

### 7.4 Regression Commands

Run from:

```text
/opt/voc/apps/command-center
```

Required:

```bash
npm test
npm run typecheck
npm run build
```

If no `npm test` script exists currently, add one in an approved commit before relying on it, or run node tests directly:

```bash
node --test tests/*.test.mjs
```

Docker verification after implementation approval:

```bash
cd /opt/voc
docker compose build
docker compose up -d
docker compose ps
```

Do not add or alter Docker services for v0.3.

## 8. Commit Sequence

Recommended implementation commits after approval.

### Commit 1 — Migration foundation and fixed roster

Message:

```text
feat: add agent assignment schema and fixed roster
```

Files:

```text
apps/command-center/lib/migrations.ts
apps/command-center/lib/migrations/001_agent_assignment_v0_3.sql
apps/command-center/lib/agent-roster.ts
apps/command-center/lib/db.ts
apps/command-center/lib/types.ts
```

Scope:

- migration runner,
- schema migrations table,
- `agent_profiles`,
- `mission_assignments`,
- `assignment_events`,
- fixed roster seed,
- uppercase event types,
- backfill from `missions.owner_agent`.

Tests:

```text
agent-assignment-db.test.mjs
```

### Commit 2 — Assignment service

Message:

```text
feat: add canonical mission assignment service
```

Files:

```text
apps/command-center/lib/assignment.ts
apps/command-center/lib/db.ts
apps/command-center/lib/types.ts
```

Scope:

- list profiles,
- get current assignment,
- assign,
- reassign,
- unassign,
- list assignment events,
- workload summary,
- agent board read model,
- validation helpers,
- safety payload checks.

Tests:

```text
agent-assignment-workflow.test.mjs
agent-assignment-safety.test.mjs
```

### Commit 3 — Mission Engine integration

Message:

```text
feat: route BERTHIER assignment commands through assignment workflow
```

Files:

```text
apps/command-center/lib/mission-engine.ts
apps/command-center/tests/mission-engine-commands.test.mjs
apps/command-center/tests/mission-engine-db.test.mjs
```

Scope:

- update `assign_mission` command path,
- avoid direct owner mutation,
- preserve command audit,
- create assignment audit events,
- keep mission status unchanged.

### Commit 4 — Assignment API routes

Message:

```text
feat: expose non-executing assignment APIs
```

Files:

```text
apps/command-center/app/api/agent-profiles/route.ts
apps/command-center/app/api/agent-board/route.ts
apps/command-center/app/api/assignment-events/route.ts
apps/command-center/app/api/missions/[id]/assignment/route.ts
apps/command-center/app/api/missions/[id]/reassignment/route.ts
apps/command-center/app/api/missions/[id]/unassignment/route.ts
apps/command-center/app/api/agents/route.ts
apps/command-center/app/api/missions/route.ts
apps/command-center/app/api/missions/[id]/route.ts
```

Scope:

- GET profile list,
- GET board,
- GET audit events,
- assignment endpoints,
- reject direct owner change in mission PATCH,
- mission POST creates canonical initial assignment.

No public profile create/update endpoint in this commit.

### Commit 5 — Agent Board database integration

Message:

```text
feat: back Agent Board with mission assignments
```

Files:

```text
apps/command-center/app/agents/page.tsx
```

Possibly:

```text
apps/command-center/components/*
```

Scope:

- show fixed seeded profiles,
- show workload,
- show assigned missions,
- show unassigned lane,
- no worker controls,
- no provider/Telegram/tool actions,
- no public profile management UI.

Tests:

```text
agent-assignment-board.test.mjs
```

### Commit 6 — Mission Registry owner display and assignment UI

Message:

```text
feat: display canonical mission owners in registry
```

Files:

```text
apps/command-center/app/missions/page.tsx
apps/command-center/app/missions/mission-registry.tsx
```

Scope:

- display canonical owner from `mission_assignments`,
- show assignment age/status,
- replace direct owner edit with explicit assign/reassign action,
- show assignment audit trail,
- preserve mission status editing separately.

### Commit 7 — Safety regression and docs alignment

Message:

```text
test: add agent assignment safety regressions
```

Files:

```text
apps/command-center/tests/agent-assignment-safety.test.mjs
RUNBOOK.md
memory/VOC_RUNTIME_STATE.md
memory/VOC_TASK_ROADMAP.md
```

Docs update only after implementation is validated.

Scope:

- safety regression tests,
- update docs to say Agent Assignment v0.3 is implemented,
- explicitly state no autonomous runtime/provider/Telegram execution was added.

## 9. Implementation Order Summary

1. Add migration mechanism and schema.
2. Seed fixed roster.
3. Backfill canonical assignments from `missions.owner_agent`.
4. Add assignment service.
5. Add tests for DB/workflow/safety.
6. Route BERTHIER assignment command through assignment service.
7. Add non-executing APIs.
8. Back Agent Board with DB.
9. Update Mission Registry assigned-owner display.
10. Run full safety regression.
11. Update docs only after validation.
12. Commit in focused sequence.

## 10. Key Design Decisions to Preserve During Implementation

- `mission_assignments` is the canonical owner source.
- `missions.owner_agent` is legacy/cache.
- Assignment event types are uppercase.
- Fixed roster is seeded first.
- Public agent profile create/update UI is deferred.
- Agent Board is ownership/workload display, not runtime control.
- Mission Registry assignment is explicit workflow, not generic owner field edit.
- Assignment audit is separate from mission timeline.
- Assignment does not execute missions.
- Assignment does not call providers.
- Assignment does not send Telegram.
- Assignment does not start agents.
- Assignment remains ownership only.
- No execution.
- No provider calls.
- No Telegram.
- No workers.
- No autonomous runtime.

**HOLD IMPLEMENTATION until approved.**
