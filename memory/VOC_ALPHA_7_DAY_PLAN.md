# VOC Alpha 7-Day Execution Plan

Status: Execution-focused plan  
Owner: BERTHIER  
Purpose: Make BERTHIER useful to the commander through Telegram within 7 days  
Scope: Plan only; no implementation authorized by this document

This document intentionally avoids new RFCs, schema design, migrations, future autonomous runtime concepts, and governance-layer expansion. The objective is immediate operational usefulness.

## 1. Current Reality Assessment

### Current State

VOC already has enough infrastructure to produce a useful Chief of Staff experience quickly.

Current reality:

- VPS is running.
- Command Center is running.
- Mission Engine v0.2 exists.
- Telegram Bot is configured.
- Cloudflare is configured.
- Cloudflare D1 is available.
- GitHub is available.
- `voc.tipper.cloud` is available.
- OpenRouter is configured.
- DeepSeek is configured.
- MiMo is configured.
- Ollama Local is available.
- Ollama Cloud is available.

Existing useful components:

- Command Center web UI.
- Mission Registry.
- Mission Engine v0.2.
- SQLite-backed missions.
- Mission events.
- Commands table.
- Approvals table.
- `/berthier` controlled intake.
- Deterministic BERTHIER parser.
- Mission creation path.
- Mission status update path.
- Blocked mission handling.
- Pending approval tracking.
- Infrastructure posture checks.
- Provider readiness posture checks.

Existing safety posture:

- No autonomous agents.
- No hidden execution.
- No self-modifying behavior.
- No background autonomous loops.
- Approval discipline remains.
- Risky actions are approval-gated.
- Provider calls must not trigger side effects.
- Telegram must not become an execution bypass.

### What Is Already Sufficient

The following are sufficient for VOC Alpha and should be reused rather than redesigned:

- Existing Mission Engine v0.2 data model.
- Existing mission creation/update logic.
- Existing command audit records.
- Existing approval request model.
- Existing Command Center mission visibility.
- Existing provider configuration posture.
- Existing local SQLite persistence.
- Existing `/berthier` command behavior.

The useful Alpha does not require a new database architecture, a new agent registry, or a new orchestration system.

### What Is Unnecessary Right Now

Postpone anything that does not directly make Telegram BERTHIER useful within 7 days.

Unnecessary right now:

- Agent Assignment v0.3 implementation.
- Planning v0.4.
- Approval Expansion v0.5.
- Future autonomous runtime concepts.
- D1 migration.
- Agent Board rewrite.
- New mission ownership schema.
- Public agent profile management.
- Multi-agent orchestration.
- Queues and workers.
- Background autonomous loops.
- Telegram group support.
- Multi-user support.
- Rich Telegram UI.
- Full Cloudflare architecture migration.
- Vector memory.
- Long-term memory refactor.
- SKP automation execution.
- GitHub write workflows.

## 2. VOC Alpha Objective

### Minimum Successful Outcome

Within 7 days, BERTHIER must be useful through Telegram every day.

The commander should be able to use Telegram to:

- create missions,
- update missions,
- check mission status,
- receive a daily briefing,
- receive workload summaries,
- use SKP assistant workflows,
- ask for safe operational guidance,
- see Telegram-created state reflected in Command Center.

### Alpha Boundary

VOC Alpha is not autonomous.

VOC Alpha must not:

- execute external actions,
- start workers,
- create hidden background loops,
- self-modify,
- deploy autonomously,
- run SKP automation,
- call providers in a way that triggers side effects,
- bypass approval discipline.

### Alpha Standard

The Alpha standard is practical usefulness, not architectural completeness.

The commander should be able to open Telegram in the morning, ask BERTHIER for a briefing, create/update missions during the day, check blockers and workload, and receive useful safe operational guidance without opening the Command Center unless deeper review is needed.

## 3. 7-Day Execution Plan

### Day 1 — Telegram BERTHIER Intake MVP

#### Objective

Make Telegram messages reach BERTHIER and return safe responses.

#### Deliverables

- Telegram intake adapter.
- Commander allowlist.
- Telegram message-to-BERTHIER command routing.
- Telegram response sender.
- Command logging through existing Mission Engine path.
- Initial supported commands:
  - `/status`
  - `/briefing`
  - `/missions`
  - `/create <title>`
  - `Create mission: <title>`
  - `Summarize status`
  - `What is blocked?`
  - `What is pending?`

#### Dependencies

- Telegram Bot token already configured outside committed files.
- Mission Engine v0.2 available.
- Command Center process reachable locally.
- Existing BERTHIER parser.

#### Success Criteria

- Commander sends Telegram message.
- BERTHIER replies in Telegram.
- Unauthorized users are ignored or rejected.
- Creating a mission from Telegram creates a mission visible in Command Center.
- No external side effect occurs beyond the Telegram reply.

### Day 2 — Mission Updates from Telegram

#### Objective

Make mission control usable from Telegram.

#### Deliverables

- Mission short-ID display.
- Recent missions command.
- Mission detail command.
- Mission status update commands.
- Friendly error messages for unknown mission IDs.
- Confirmation messages after updates.

Supported command examples:

- `/missions`
- `/mission <id>`
- `/status <id>`
- `/update <id> active`
- `/update <id> blocked <reason>`
- `/update <id> completed`
- `Mark mission <id> active`
- `Mark mission <id> completed`
- `Mark mission <id> blocked: <reason>`

#### Dependencies

- Day 1 Telegram intake.
- Existing mission update path.
- Existing mission event logging.

#### Success Criteria

- Commander can update mission status from Telegram.
- Blocked updates require a reason.
- Mission timeline reflects Telegram updates.
- Mission status updates do not trigger execution.

### Day 3 — Daily Briefing

#### Objective

Make BERTHIER useful every morning.

#### Deliverables

- Manual `/briefing` command.
- Briefing text generated from existing mission, command, and approval state.
- Concise recommended focus list.
- Blocker summary.
- Pending approval summary.

Briefing includes:

1. mission count,
2. active missions,
3. blocked missions,
4. pending approvals,
5. high/critical priorities,
6. stale or neglected missions if detectable,
7. recommended top 3 focus items.

#### Dependencies

- Mission Engine state.
- Approval records.
- Telegram reply formatting.

#### Success Criteria

- Commander can send `/briefing` and receive a useful daily briefing.
- Briefing is concise enough to read on Telegram.
- Briefing does not require model routing to function.
- Briefing does not perform any external action.

### Day 4 — Workload Summary

#### Objective

Give the commander workload visibility without implementing Agent Assignment v0.3.

#### Deliverables

- `/workload` command.
- Missions grouped by existing `owner_agent` field.
- Blocked count by owner.
- High/critical count by owner.
- Pending approval count.
- Unknown/unassigned owner warning if present.

#### Dependencies

- Existing mission `owner_agent` field.
- Existing mission status and priority fields.
- Existing approval records.

#### Success Criteria

- Commander can ask `/workload` and see who owns what.
- Workload summary is generated without new schema.
- Workload summary does not imply autonomous workers.
- Workload summary does not trigger reassignment or execution.

### Day 5 — Minimal Model Routing

#### Objective

Make BERTHIER more useful for safe reasoning and summaries.

#### Deliverables

- Safe model routing wrapper.
- Model use only for non-mutating, read-only synthesis.
- Deterministic fallback if model call fails.
- Initial model-assisted commands:
  - `/focus`
  - `/prioritize`
  - `/summarize`
  - `/explain <mission>`

Allowed model outputs:

- summaries,
- recommendations,
- classifications,
- explanations,
- drafts.

Forbidden model outputs:

- direct execution,
- deployment,
- posting,
- deletion,
- external account modification,
- SKP execution,
- GitHub write action.

#### Dependencies

- Provider credentials configured outside git.
- Safe provider invocation path.
- Mission state retrieval.
- Policy gate before response.

#### Success Criteria

- BERTHIER can answer “What should I focus on today?” with useful reasoning.
- Model failure does not break mission commands.
- No model output triggers side effects.
- No provider credentials are exposed.

### Day 6 — SKP Assistant Workflows

#### Objective

Make BERTHIER useful for SKP operational planning without automation.

#### Deliverables

- `/skp status`
- `/skp checklist`
- `/skp next`
- `/skp risk`
- `/skp mission <title>`
- SKP response templates.
- Approval-gated response when execution is requested.

Allowed SKP assistant behavior:

- create SKP-related missions,
- prepare checklists,
- summarize operational steps,
- identify risks,
- draft approval requests,
- recommend manual next steps.

Forbidden SKP assistant behavior:

- browser automation,
- login,
- posting,
- purchasing,
- account changes,
- external side effects,
- hidden Playwright runs,
- background jobs.

#### Dependencies

- Telegram command routing.
- Mission creation path.
- Approval request path.
- Optional model routing for wording and checklist quality.

#### Success Criteria

- Commander can use BERTHIER to plan SKP work.
- Execution requests are blocked or converted into approval-gated requests.
- No SKP workflow actually runs.
- No hidden execution occurs.

### Day 7 — GitHub Intelligence and Alpha Stabilization

#### Objective

Add useful read-only project intelligence and stabilize Alpha for daily use.

#### Deliverables

- `/github status` or `/repo status`.
- Read-only repo summary.
- Recent commits summary.
- Changed files summary if local repo is available.
- Optional GitHub API read-only summary if configured safely.
- Alpha smoke test checklist.
- Error logging review.
- Command Center reflection check.

Allowed GitHub intelligence:

- read repo state,
- summarize branch and recent commits,
- summarize open issues/PRs if safe read access exists,
- summarize CI status if safe read access exists.

Forbidden GitHub actions:

- create PR,
- merge PR,
- push commits,
- create issue unless separately approved,
- change repo settings,
- modify secrets.

#### Dependencies

- Local git repo or GitHub read token.
- Telegram reply path.
- Model routing optional for summaries.

#### Success Criteria

- Commander can ask for project status from Telegram.
- BERTHIER can summarize local/GitHub state read-only.
- Alpha features are stable enough for daily use.
- Safety posture remains intact.

## 4. Minimal Architecture Required

Only the following components are required for VOC Alpha:

```text
Telegram
  ↓
Telegram Intake Adapter
  ↓
BERTHIER Command Router
  ↓
Mission Engine v0.2
  ↓
SQLite
  ↓
Telegram Response
```

Optional safe model path:

```text
Telegram
  ↓
BERTHIER Command Router
  ↓
Safe Intent Classifier
  ↓
Model Router
  ↓
Read-only Synthesis
  ↓
Telegram Response
```

Command Center remains:

```text
Command Center
  ↓
Mission Engine SQLite
  ↓
Mission Registry / Reports / Infrastructure
```

Required Alpha components:

- Telegram intake adapter.
- Telegram allowlist.
- Telegram response sender.
- Existing BERTHIER parser integration.
- Daily briefing function.
- Workload summary function.
- Safe model routing wrapper.
- SKP assistant prompt/workflow layer.
- Read-only GitHub/repo intelligence.

Not required for Alpha:

- new database schema,
- D1 migration,
- workers,
- queues,
- autonomous orchestration,
- Agent Assignment v0.3,
- new approval model,
- Telegram group support,
- public dashboard exposure.

## 5. Telegram Workflow Design

### Design Principles

Telegram BERTHIER should be:

- simple,
- fast,
- forgiving,
- commander-only initially,
- safe by default,
- useful without opening the Command Center.

### Core Commands

#### `/briefing`

Returns daily operational briefing.

Example output:

```text
Daily briefing, Sire.

Missions: 14
Active: 3
Blocked: 2
Pending approvals: 1

Top focus:
1. Resolve deployment checklist blocker.
2. Complete Telegram intake smoke test.
3. Review SKP operating checklist.
```

#### `/missions`

Lists recent or active missions.

Example output:

```text
Missions, Sire:

abc123 — active — Telegram BERTHIER MVP
bcd234 — blocked — SKP checklist
cde345 — queued — GitHub read-only summary
```

#### `/create <title>`

Creates a mission.

Example:

```text
/create Fix deployment checklist
```

Response:

```text
Mission created, Sire.

ID: abc123
Title: Fix deployment checklist
Status: queued
Owner: berthier
```

#### `/update <id> <status>`

Updates mission status.

Examples:

```text
/update abc123 active
/update abc123 completed
/update abc123 blocked Waiting for API key
```

Response:

```text
Mission updated, Sire.

Fix deployment checklist
queued → active
```

#### `/status`

Returns concise VOC status.

Example output:

```text
VOC status, Sire:

Missions: 14
Active: 3
Blocked: 2
Completed: 6
Pending approvals: 1
```

#### `/workload`

Returns owner-based workload using existing `missions.owner_agent`.

Example output:

```text
Workload, Sire:

BERTHIER: 5 missions, 1 blocked
LANNES: 3 missions, 0 blocked
NEY: 2 missions, 1 blocked
DAVOUT: 1 mission, 1 pending approval
```

### Natural Language Compatibility

Also support existing BERTHIER phrases:

```text
Create mission: <title>
Summarize status
What is blocked?
What is pending?
Mark mission <id> active
Mark mission <id> completed
Mark mission <id> blocked: <reason>
```

### Safety Response Pattern

If commander asks for execution:

```text
Approval required, Sire.

I will not execute this from VOC Alpha.
I can record it as a mission or prepare an approval request.
```

## 6. SKP Assistant Workflow Design

### Purpose

BERTHIER assists SKP operational work through planning, checklists, risk review, and mission creation.

SKP Alpha is not automation.

### Allowed SKP Commands

```text
/skp status
/skp checklist
/skp next
/skp risk
/skp mission <title>
```

### Allowed Behavior

BERTHIER may:

- create SKP missions,
- produce SKP checklists,
- identify risks,
- summarize known steps,
- draft approval requests,
- recommend manual next actions,
- explain what information is missing.

### Forbidden Behavior

BERTHIER must not:

- run SKP automation,
- launch Playwright,
- log into accounts,
- post content,
- purchase anything,
- message external parties,
- modify accounts,
- trigger external workflows,
- start background jobs,
- hide execution behind summaries.

### Approval Discipline

If a command asks for execution, BERTHIER must stop and respond with approval-gated language.

Example:

```text
Approval required, Sire.

I will not run SKP automation in VOC Alpha.
I can create a mission and prepare the approval request for manual review.
```

### Useful SKP Alpha Output

Example `/skp next` output:

```text
SKP next step, Sire:

1. Confirm the current objective.
2. Identify whether login/account state is required.
3. Identify external side effects.
4. Prepare an approval request before automation.
5. Execute manually until an approved automation path exists.
```

## 7. Model Routing Strategy

### Routing Principle

Use models to improve BERTHIER replies, summaries, and reasoning. Do not use models to execute actions.

Deterministic Mission Engine commands remain primary for mission creation and updates.

### qwen3

Use for:

- lightweight classification,
- short Telegram reply drafting,
- simple mission summaries,
- workload summary wording,
- low-risk formatting.

Do not use for:

- strategic planning,
- ambiguous operational decisions,
- high-stakes recommendations,
- approval bypass.

### DeepSeek

Use for:

- technical reasoning,
- codebase questions,
- GitHub/repo analysis,
- implementation planning,
- debugging explanations.

### MiMo

Use for:

- alternate reasoning,
- fallback technical analysis,
- second opinion on plans,
- flexible reasoning where useful.

### OpenRouter

Use for:

- premium synthesis,
- fallback routing,
- broad reasoning,
- daily briefing polish,
- final response quality when local models are insufficient.

### Ollama Local

Use for:

- private lightweight work,
- inexpensive local summaries,
- simple classification,
- fallback when remote providers should not be used.

### Ollama Cloud

Use for:

- Ollama-compatible remote fallback,
- lightweight remote tasks,
- cases where local Ollama is unavailable or insufficient.

### Practical Alpha Routing Order

1. Deterministic parser first.
2. Ollama Local/qwen3 for simple summaries.
3. DeepSeek for technical/repo reasoning.
4. OpenRouter for high-quality synthesis.
5. MiMo as alternate reasoning path.
6. Ollama Cloud as Ollama-compatible fallback.
7. If model routing fails, return deterministic Mission Engine summary.

### Model Safety Rules

Model calls may produce:

- summaries,
- recommendations,
- drafts,
- classifications,
- explanations.

Model calls must not:

- execute,
- deploy,
- post,
- delete,
- modify accounts,
- trigger SKP,
- trigger GitHub writes,
- bypass approvals.

## 8. Deployment Sequence

### 1. Deploy Telegram BERTHIER MVP

Deploy first:

- Telegram intake.
- Commander allowlist.
- BERTHIER parser routing.
- Telegram replies.
- Mission creation.
- Mission status updates.
- Status summary.

This is the highest-value Alpha feature.

### 2. Deploy Manual Daily Briefing

Deploy next:

- `/briefing` command.
- Mission/approval/blocker summary.
- Top focus recommendations.

No scheduler is required for Alpha.

### 3. Deploy Workload Summary

Deploy:

- `/workload` command.
- Use existing `missions.owner_agent`.
- No Agent Assignment implementation.

### 4. Deploy Safe Model Routing

Deploy:

- model wrapper for safe summaries,
- deterministic fallback,
- no side-effect path,
- provider secret redaction.

### 5. Deploy SKP Assistant

Deploy:

- `/skp` planning commands,
- checklist output,
- risk review,
- mission creation for SKP tasks,
- approval-gated execution refusal.

### 6. Deploy GitHub/Repo Intelligence

Deploy:

- read-only local repo status,
- optional GitHub read-only status,
- no write actions.

### 7. Stabilize Command Center Integration

Verify:

- Telegram-created missions appear in Command Center.
- `/berthier` still works.
- Mission Registry still works.
- Reports still work.
- Infrastructure view still works.
- No safety regression.

## 9. What To Postpone

Explicitly postpone:

- Agent Assignment implementation.
- Planning v0.4.
- Approval Expansion v0.5.
- Future autonomous runtime.
- Agent Assignment v0.3 database implementation.
- New assignment schema.
- New ownership migration.
- D1 migration.
- Cloudflare architecture rewrite.
- Agent Board rewrite.
- Public agent profile create/update UI.
- Multi-agent orchestration.
- Autonomous agents.
- Background workers.
- Queue system.
- Rich Telegram interface.
- Telegram group support.
- Multi-user support.
- Scheduled autonomous workflows.
- SKP execution.
- Playwright automation.
- GitHub write workflows.
- PR creation or merge workflows.
- External posting.
- Billing/account modifications.

## 10. Definition of VOC Alpha Success

VOC Alpha is successful when the commander can use BERTHIER through Telegram every day.

### Telegram Success

- Commander can message BERTHIER.
- BERTHIER replies reliably.
- Unauthorized users are rejected or ignored.
- Errors are visible in logs.

### Mission Success

- Commander can create missions from Telegram.
- Commander can update mission status from Telegram.
- Commander can block missions with reasons.
- Commander can complete missions.
- Telegram-created missions appear in Command Center.

### Briefing Success

- Commander can request `/briefing`.
- Briefing includes mission count, blockers, pending approvals, high-priority work, and recommended focus.
- Briefing is readable on Telegram.

### Workload Success

- Commander can request `/workload`.
- Workload uses existing mission ownership.
- Workload summary is useful without Agent Assignment v0.3.

### SKP Success

- Commander can request SKP checklist, next step, and risk review.
- BERTHIER can create SKP-related missions.
- SKP execution remains blocked without explicit future approval.

### Model Routing Success

- BERTHIER can use models for safe summaries and reasoning.
- Model failure does not break deterministic commands.
- No model output executes anything.

### Safety Success

- No autonomous agents.
- No hidden execution.
- No self-modifying behavior.
- No background autonomous loops.
- No provider-triggered side effects.
- No Telegram-triggered external side effects beyond BERTHIER replies.
- No SKP execution.
- No GitHub writes.
- Approval discipline remains intact.

### Final Alpha Standard

VOC Alpha succeeds when:

> The commander opens Telegram each morning, asks BERTHIER for a briefing, creates or updates missions during the day, checks blockers and workload, and receives useful safe operational guidance without needing to open the Command Center except for deeper review.
