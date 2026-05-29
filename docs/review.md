# VOC MVP Review

## Review Scope

This review evaluates the current VOC planning documents for speed to MVP.

The MVP should include only:

- BERTHIER
- Telegram Bot
- Memory
- Tasks
- Reminders
- Daily Briefings

Everything else should be deferred to later phases.

## Executive Assessment

The current documents are directionally strong for the full VOC vision, but they are too broad for the first usable version. The main issue is that later-phase concepts appear inside the MVP architecture: agent orchestration, approvals, web dashboard, queues, integrations, automation, multi-agent permissions, object storage, vector search, and operational monitoring.

For the MVP, VOC should be a single-agent Telegram assistant with a small persistent database and a reliable reminder/briefing loop.

The fastest path is:

```text
Telegram Bot
    |
    v
BERTHIER Service
    |
    +--> Tasks
    +--> Reminders
    +--> Memory
    +--> Daily Briefing
```

Do not build an operating system yet. Build BERTHIER as a dependable daily command assistant.

## 1. Architectural Weaknesses

### Full OS Architecture Is Introduced Too Early

The architecture document begins with a complete system: web dashboard, command router, policy engine, agent orchestrator, specialist agents, shared memory, queues, jobs, integrations, and logs.

This weakens MVP execution because it encourages building infrastructure before the core behavior is proven.

MVP correction:

- Remove Agent Orchestrator from Phase 1.
- Remove specialist agent execution from Phase 1.
- Remove web dashboard from Phase 1.
- Remove automation systems from Phase 1.
- Keep one BERTHIER service that receives Telegram messages and writes to a database.

### BERTHIER Responsibilities Are Too Broad For MVP

BERTHIER is assigned delegation, cross-agent coordination, approval routing, strategic memory management, and decision support.

For MVP, BERTHIER should do fewer things well:

- Understand simple Telegram commands.
- Save and recall memory.
- Create and list tasks.
- Create and fire reminders.
- Generate a daily briefing.
- Address the commander as Sire.

MVP correction:

- Treat delegation as a text label only, not an agent workflow.
- Treat decision support as a later capability.
- Treat strategic memory as simple notes and preferences at first.

### Memory Architecture Is Too Heavy

The documents define session memory, working memory, long-term memory, knowledge base, operational memory, document chunks, embeddings, object storage, and full-text search.

This is appropriate later, but too much for MVP.

MVP correction:

- Use one `memories` table.
- Use simple categories: `preference`, `fact`, `project`, `note`.
- Use keyword search first.
- Defer embeddings, document chunking, object storage, and vector retrieval.

### Queue Design Is Premature

The queue architecture includes command queues, agent queues, automation queues, approval queues, notification queues, and memory queues.

For MVP, this creates operational complexity before there is enough workload to justify it.

MVP correction:

- Use direct command handling for Telegram messages.
- Use one scheduler mechanism for reminders and daily briefings.
- Defer Redis, BullMQ, Cloudflare Queues, and Temporal unless reminders cannot be made reliable without them.

### Database Schema Is Too Broad

The current schema includes agents, task events, documents, document chunks, approvals, integrations, jobs, logs, and notifications.

For the MVP, only a few tables are required.

Recommended MVP schema:

```sql
users
- id
- telegram_id
- display_name
- preferred_address
- timezone
- created_at

messages
- id
- user_id
- telegram_message_id
- direction
- body
- created_at

memories
- id
- user_id
- type
- title
- body
- created_at
- updated_at

tasks
- id
- user_id
- title
- description
- status
- priority
- due_at
- created_at
- completed_at

reminders
- id
- user_id
- title
- remind_at
- recurrence_rule
- status
- created_at
- sent_at

briefing_items
- id
- user_id
- item_type
- title
- body
- briefing_date
- created_at
```

Optional but useful:

```sql
system_events
- id
- user_id
- event_type
- summary
- created_at
```

Avoid separate `agents`, `jobs`, `approvals`, `integrations`, `documents`, and `document_chunks` in Phase 1.

## 2. Unnecessary Complexity

### Specialist Agents Should Be Deferred

The agents document is useful for the long-term vision, but it should not influence the MVP implementation.

For Phase 1:

- SOULT, NEY, LANNES, DAVOUT, MASSENA, MURAT, CAULAINCOURT, COLBERT, and IMPERIAL GUARD should exist only in documentation.
- BERTHIER may create a task titled "Ask Davout to review authentication", but no DAVOUT service should run.
- No agent permissions model is needed yet.

### Web Dashboard Should Be Deferred

The dashboard adds frontend, authentication, navigation, and deployment concerns.

For MVP, Telegram is enough.

Defer:

- Command Center
- Agent Activity
- Knowledge Base UI
- Engineering
- Marketing
- Finance
- SKP Automation
- Tipper Operations
- Logs UI

MVP replacement:

- Use Telegram commands for listing tasks, reminders, and memories.
- Use database access/admin tools manually during development if needed.

### Approval Workflows Should Be Deferred

Approvals matter once VOC can perform external actions. The MVP should not perform external actions beyond Telegram replies and reminders.

Therefore, approvals are unnecessary for Phase 1.

MVP correction:

- Hard-disable external side effects.
- BERTHIER can say, "I cannot perform that action yet, Sire."
- Add approval workflows only when GitHub, posting, deployments, payments, or automations are introduced.

### Integrations Should Be Deferred

Codex, Hermes, OpenCode, 9Router, GitHub, SKP Bot, Tipper, Playwright, Docker, and PM2 are all later-phase concerns except whatever runtime is used to host the bot.

For MVP:

- Telegram is the only product integration.
- Database is the only persistence integration.
- Scheduler/cron is the only background mechanism.

### Monitoring Stack Should Be Minimal

Grafana, Prometheus, Loki, Sentry, OpenTelemetry, Uptime Kuma, and rich metrics are excessive for MVP.

MVP correction:

- Log process errors.
- Log reminder delivery failures.
- Send a Telegram admin alert if the daily briefing fails.
- Keep deployment/runtime monitoring manual or very lightweight.

## 3. Over-Engineering Risks

### Risk: Building Infrastructure Instead Of Assistant Behavior

The current plan may lead to building routers, queues, agents, dashboards, and schemas before BERTHIER is useful.

Mitigation:

- Make Telegram behavior the milestone.
- Every MVP task must support one of these commands:
  - "Berthier, remember..."
  - "Berthier, remind me..."
  - "Berthier, add a task..."
  - "Berthier, what are my tasks?"
  - "Berthier, what is my briefing today?"

### Risk: Agent Branding Replaces Product Function

The command structure is compelling, but Phase 1 should not spend engineering time simulating a hierarchy.

Mitigation:

- Keep agent names in docs.
- Implement only BERTHIER.
- Use plain task categories instead of agent routing.

### Risk: Memory Becomes A Research Project

Vector search, document ingestion, confidence scores, and memory scopes can consume a lot of time.

Mitigation:

- Start with explicit saves only.
- Use predictable commands:
  - "Berthier, remember that..."
  - "Berthier, forget..."
  - "Berthier, what do you remember about..."
- Add inferred memory later.

### Risk: Daily Briefing Depends On Too Many Sources

The documents imply briefings may include projects, agents, automation, finance, engineering, SKP, and Tipper.

For MVP, there are no integrations to supply that data.

Mitigation:

- MVP briefing should include only:
  - Today's date
  - Due tasks
  - Upcoming reminders
  - Overdue tasks
  - Selected memories/preferences if relevant

### Risk: Reminder Reliability Is Under-Specified

Reminders are one of the core MVP features, but the docs spend more time on agents and integrations than on reminder mechanics.

Mitigation:

- Define reminder parsing, storage, timezone behavior, delivery attempts, missed reminder recovery, and recurrence support.
- Start with one-time reminders.
- Add recurring reminders after one-time reminders are reliable.

## 4. Missing Capabilities

### Telegram Command Contract

The docs need a concrete command contract for MVP.

Required MVP commands:

```text
Berthier, remember that [fact]
Berthier, what do you remember about [topic]?
Berthier, forget [memory/topic]

Berthier, add a task to [task]
Berthier, list my tasks
Berthier, mark [task] done
Berthier, what is due today?

Berthier, remind me to [thing] at [time/date]
Berthier, list my reminders
Berthier, cancel reminder [name/id]

Berthier, give me my daily briefing
Berthier, send my briefing every day at [time]
```

### Timezone Handling

The MVP must store and apply the commander's timezone.

Required behavior:

- Store `timezone` on the user profile.
- Parse relative dates against that timezone.
- Confirm ambiguous times.
- Display reminder times in the commander's timezone.

### Reminder Delivery Reliability

Required behavior:

- Track reminder status: `pending`, `sent`, `failed`, `cancelled`.
- Retry failed sends.
- On service restart, send or report missed reminders.
- Avoid duplicate reminder sends.

### Daily Briefing Schedule

Required behavior:

- Store preferred briefing time.
- Generate briefing on demand.
- Send scheduled briefing automatically.
- Include overdue tasks, due tasks, and upcoming reminders.

### Memory Management Commands

Required behavior:

- Explicit memory creation.
- Memory search.
- Memory deletion.
- Memory update or replacement.

Without deletion and correction, memory will become untrustworthy quickly.

### Minimal Safety Rules

Even without approval workflows, MVP needs safety boundaries.

Required behavior:

- Only respond to allowlisted Telegram IDs.
- Never reveal secrets.
- Never perform external side-effect actions.
- Keep a basic message history for debugging.
- Preserve the "Sire" address rule in system prompts and tests.

### Testable Acceptance Criteria

The docs should include concrete MVP acceptance tests.

Examples:

- Given "Berthier, remind me to call Alex tomorrow at 9", VOC creates a pending reminder with the correct date and timezone.
- Given a due reminder, VOC sends exactly one Telegram message.
- Given "Berthier, add a task to review invoices", VOC creates an open task.
- Given "Berthier, list my tasks", VOC returns open tasks only unless asked otherwise.
- Given "Berthier, remember that I prefer morning briefings", VOC saves a memory.
- Given "Berthier, what is my briefing today?", VOC returns due tasks, overdue tasks, and upcoming reminders.
- Every response addresses the commander as Sire.

## Recommended MVP Architecture

Use a deliberately small architecture:

```text
Telegram Webhook or Polling
        |
        v
BERTHIER App
        |
        +--> Command Parser
        +--> Task Service
        +--> Reminder Service
        +--> Memory Service
        +--> Briefing Service
        |
        v
SQLite or Postgres
        |
        v
Cron / In-Process Scheduler
```

Recommended implementation posture:

- One application service.
- One database.
- One Telegram bot.
- One scheduler.
- No web dashboard.
- No agent orchestrator.
- No vector DB.
- No job queue unless required by hosting.
- No external integrations besides Telegram.

## Recommended MVP Milestones

### Milestone 1: Telegram BERTHIER

- Bot receives and replies to allowlisted commander.
- All responses address the commander as Sire.
- Unknown commands receive a graceful fallback.

### Milestone 2: Tasks

- Add task.
- List tasks.
- Mark task complete.
- Show overdue and due-today tasks.

### Milestone 3: Reminders

- Create one-time reminder.
- List reminders.
- Cancel reminder.
- Deliver reminder reliably.

### Milestone 4: Memory

- Remember explicit fact.
- Search memories by keyword.
- Forget memory.
- Use relevant memory in replies when directly useful.

### Milestone 5: Daily Briefing

- Generate briefing on demand.
- Schedule daily briefing.
- Include due tasks, overdue tasks, and upcoming reminders.

## Deferred To Later Phases

Defer all of the following until the MVP is useful:

- Specialist agent execution
- Agent orchestrator
- Web dashboard
- Approval workflows
- GitHub integration
- Codex integration
- Hermes integration
- OpenCode integration
- 9Router integration
- SKP Bot integration
- Tipper integration
- Playwright automation
- Docker service topology
- PM2 process strategy beyond basic runtime needs
- Vector database
- Document ingestion
- Object storage
- Full-text search beyond basic database search
- Observability stack
- Multi-agent permissions
- Automation command
- Finance, marketing, engineering, and product modules

## Document Revisions Recommended

### vision.md

Keep the full vision, but add a clear section:

> Phase 1 intentionally implements only BERTHIER, Telegram, memory, tasks, reminders, and daily briefings.

Move examples involving Davout, Murat, SKP, and Tipper to later-phase examples.

### architecture.md

Add a separate "MVP Architecture" section before the full architecture.

The current full architecture should be labeled "Target Architecture" or "Future Architecture".

Remove MVP references to:

- Web dashboard
- Agent orchestrator
- Approval routing
- Queues
- Vector search
- Documents
- Integrations

### agents.md

Keep as long-term reference only.

Add:

> Phase 1 implements BERTHIER only. Other agents are role definitions and may be referenced in task labels, but no specialist agent services run in MVP.

### roadmap.md

Revise Phase 1 to include only:

- Telegram bot
- BERTHIER command parser
- Memory
- Tasks
- Reminders
- Daily briefing

Remove from Phase 1:

- Manual agent delegation labels
- Approval workflow
- Web dashboard skeleton
- Logs beyond minimal message/system events
- SKP, Tipper, engineering, marketing, and finance summaries

## Final Recommendation

Ship the smallest useful BERTHIER first.

The MVP should prove that VOC can reliably remember, remind, track tasks, and brief the commander through Telegram. Once that daily habit is useful, expand to agents, dashboards, integrations, approvals, and automation.

Until then, the system should avoid pretending to be a full operating command structure. It should earn that structure by becoming dependable in the commander's daily routine.
