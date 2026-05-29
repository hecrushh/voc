# VOC Architecture

## System Overview

VOC is organized around BERTHIER as the central interface, coordinator, and memory manager.

```text
Telegram / Web Dashboard
        |
        v
BERTHIER Interface Layer
        |
        v
Command Router + Policy Engine
        |
        v
Agent Orchestrator
        |
        +--> Soult
        +--> Ney
        +--> Lannes
        +--> Davout
        +--> Massena
        +--> Murat
        +--> Caulaincourt
        +--> Colbert
        +--> Imperial Guard
        |
        v
Shared Memory + Knowledge Base + Task System
        |
        v
Queues / Jobs / Integrations / Logs
```

## Primary Components

### Interface Layer

- Telegram bot
- Web dashboard
- Future voice interface

### BERTHIER Core

- Intent recognition
- Task triage
- Delegation
- Daily briefing
- Memory updates
- Approval routing
- Final response composition

### Agent Orchestrator

- Assigns tasks to agents
- Tracks status
- Prevents agent conflicts
- Enforces permissions
- Maintains activity timeline

### Shared Memory

- Personal preferences
- Projects
- Decisions
- Tasks
- Calendar
- Contacts
- Business context
- Agent outputs

### Execution Layer

- Queues
- Scheduled jobs
- Playwright automation
- GitHub operations
- SKP workflows
- Tipper workflows
- Long-running agents

## Memory Architecture

VOC uses layered memory.

### Session Memory

- Current conversation
- Active command
- Temporary reasoning context

### Working Memory

- Active tasks
- Open projects
- Pending approvals
- Current priorities

### Long-Term Memory

- Preferences
- Personal rules
- Recurring routines
- Business strategy
- Project history
- Key decisions

### Knowledge Base

- Documents
- Repositories
- Notes
- PRDs
- Research
- Technical specs
- Marketing plans

### Operational Memory

- Job runs
- Deployment events
- GitHub activity
- Bot activity
- Agent logs

BERTHIER is the only agent allowed to update strategic memory without approval. Other agents propose memory updates; BERTHIER confirms and writes them.

## Knowledge Base Architecture

Use a hybrid model:

```text
Postgres / D1 structured records
        +
Object storage for raw documents
        +
Vector index for semantic retrieval
        +
Full-text search for exact lookup
```

Knowledge types:

- Personal instructions
- Business notes
- Product docs
- Engineering docs
- Marketing assets
- Financial records
- Research reports
- Repository summaries
- Automation runbooks
- Decision logs

Recommended retrieval flow:

1. BERTHIER receives request.
2. Query classifier identifies domain.
3. Retrieve structured records.
4. Retrieve semantic documents.
5. Retrieve recent activity.
6. Compose grounded answer.
7. Optionally delegate to specialist.

## Database Schema

Core tables:

```sql
users
- id
- name
- preferred_address
- timezone
- created_at

agents
- id
- code_name
- title
- role
- status
- permissions_json

commands
- id
- source
- raw_text
- normalized_intent
- commander_id
- status
- created_at

tasks
- id
- title
- description
- owner_agent
- status
- priority
- due_at
- requires_approval
- created_by
- created_at
- completed_at

task_events
- id
- task_id
- agent_id
- event_type
- body
- created_at

memories
- id
- memory_type
- scope
- title
- body
- confidence
- source
- created_at
- updated_at

documents
- id
- title
- type
- source
- storage_url
- text_hash
- created_at

document_chunks
- id
- document_id
- chunk_text
- embedding_id
- metadata_json

approvals
- id
- action_type
- requested_by_agent
- summary
- risk_level
- status
- approved_by
- created_at
- resolved_at

integrations
- id
- provider
- status
- credentials_ref
- permissions_json

jobs
- id
- job_type
- queue_name
- payload_json
- status
- attempts
- scheduled_for
- started_at
- completed_at

logs
- id
- level
- source
- message
- metadata_json
- created_at

notifications
- id
- channel
- title
- body
- status
- sent_at
```

For MVP, use Postgres if available. If the ecosystem is Cloudflare-first, use D1 for app data and object storage/vector DB separately.

## Queue Architecture

VOC should not execute everything synchronously.

Queue types:

- `command.queue`: incoming Telegram and web commands
- `agent.queue`: agent work assignments
- `automation.queue`: Playwright, SKP, and Tipper jobs
- `approval.queue`: human review checkpoints
- `notification.queue`: Telegram reminders, alerts, summaries
- `memory.queue`: summarization, embedding, indexing

Recommended tools:

- Cloudflare Queues if using Workers
- BullMQ + Redis if using VPS/Node
- Temporal if workflows become complex
- Cron + PM2 only for early MVP, not long-term orchestration

## Telegram Architecture

Telegram is the primary command interface.

```text
Telegram Bot
   |
Webhook Receiver
   |
Command Parser
   |
BERTHIER
   |
Router / Agent Orchestrator
   |
Response + Task Updates
```

Telegram features:

- Direct command messages
- Daily briefing
- Reminder creation
- Approval buttons
- Task status
- Agent delegation summaries
- Automation launch controls

Security:

- Allowlisted Telegram IDs
- Signed webhook validation where possible
- No secrets in messages
- High-risk actions require explicit approval

## Web Dashboard Architecture

Modules:

- Command Center
- Daily Briefing
- Tasks
- Calendar
- Reminders
- Agent Activity
- Knowledge Base
- Engineering
- Marketing
- Finance
- SKP Automation
- Tipper Operations
- Logs
- Notifications

The dashboard is the strategic command center. Telegram is the fast command surface.

## Human Approval Workflows

No approval needed:

- Summaries
- Drafts
- Research
- Planning
- Task creation
- Local analysis
- Non-sensitive reminders

Approval required:

- Sending external messages
- Posting to social media
- Opening PRs
- Merging PRs
- Running production automations
- Changing infrastructure
- Modifying billing
- Deleting data
- Triggering SKP or Tipper jobs with real-world effects

Approval format:

```text
Action requested, Sire:
Agent: Davout
Action: Rotate production API key
Risk: High
Reason: Existing key may be exposed
Approve / Reject / Modify
```

## Security Model

Principles:

- BERTHIER coordinates; agents receive scoped permissions.
- Secrets are never stored in agent memory.
- All external actions are logged.
- High-risk actions require approval.
- Agents cannot silently escalate privileges.

Security controls:

- Role-based access control
- Per-agent tool permissions
- Secret manager
- Audit log
- Approval gates
- Rate limits
- Telegram allowlist
- Web dashboard authentication
- Session expiration
- Encrypted database fields for sensitive memory
- Separate production and staging credentials

## Monitoring Strategy

System metrics:

- Bot uptime
- Queue depth
- Job failures
- Agent latency
- Memory retrieval latency
- Database errors
- Integration errors
- Token usage
- Cost per agent/task

Operational metrics:

- Tasks completed
- Pending approvals
- Failed automations
- Missed reminders
- Daily briefing delivery
- Agent delegation volume

Recommended stack:

- MVP: PM2 logs, Docker logs, Uptime Kuma, Telegram alerts, basic database health checks
- Later: Grafana, Prometheus, Loki, Sentry, OpenTelemetry

## Backup Strategy

Backup targets:

- Database
- Memory store
- Knowledge documents
- Configuration
- Agent definitions
- Automation logs
- Approval history

Backup schedule:

- Database: daily
- Documents: daily incremental
- Config: on change
- Logs: retained 30-90 days
- Critical memory: versioned

Recovery goals:

- MVP RPO: 24 hours
- MVP RTO: 4 hours
- Mature VOC RPO: 1 hour
- Mature VOC RTO: 30 minutes

## Logging Strategy

Every action should be reconstructable.

Log types:

- Command received
- Intent classified
- Agent delegated
- Tool called
- Approval requested
- Approval resolved
- Job started
- Job completed
- Job failed
- Memory created
- Memory updated
- External action performed

Logs should distinguish:

- What the commander asked
- What BERTHIER decided
- Which agent acted
- Which tool was used
- What changed externally
- Whether approval was granted

## Integration Plans

### Codex

Use Codex as an engineering execution engine.

Best fit:

- Codebase analysis
- Bug fixes
- PR creation
- Refactors
- Test writing
- Architecture review

VOC mapping:

- NEY uses Codex for frontend work.
- LANNES uses Codex for backend work.
- DAVOUT uses Codex for security review.
- MASSENA uses Codex for deployment scripts and infrastructure checks.

Approval required:

- Repository modification
- Pull request creation
- Production config changes

### Hermes

Assumption: Hermes is an internal or external messaging, intelligence, or agent service.

Integration plan:

- Treat Hermes as a tool provider until its exact role is defined.
- Wrap it behind a `HermesAdapter`.
- Do not let agents call it directly at first.
- BERTHIER should mediate all Hermes usage.

Needed clarification later:

- Is Hermes a model router, notification layer, research tool, or internal agent system?

### OpenCode

Use OpenCode as an alternate coding agent or local development assistant.

Best fit:

- Local code edits
- Repository inspection
- Lightweight development tasks
- Alternative to Codex for specific workflows

Architecture:

```text
BERTHIER -> Engineering Agent -> OpenCode Adapter -> Repo Workspace
```

Risk:

- Avoid having Codex and OpenCode modify the same repo concurrently unless a lock system exists.

### 9Router

Assumption: 9Router is a model-routing, API-routing, or automation-routing layer.

Integration plan:

- Use as a model gateway only if it provides reliable routing, logging, and fallback.
- Track model usage per agent.
- Route sensitive tasks only through trusted providers.
- Add policy controls by task type.

Example:

- DAVOUT: security-sensitive model only
- CAULAINCOURT: research-capable model
- SOULT: long-context strategy model
- IMPERIAL GUARD: deterministic automation model

### Telegram

Use for:

- Daily briefing
- Quick commands
- Reminders
- Approvals
- Agent updates
- Automation triggers

### GitHub

Use for:

- Repo inspection
- PR summaries
- Issue creation
- Code review
- Deployment status
- Security alerts

Agent ownership:

- NEY: frontend PRs
- LANNES: backend PRs
- DAVOUT: security reviews
- MASSENA: CI/CD and infra files

Approval required:

- Opening PRs, unless explicitly allowed
- Merging PRs
- Changing repo settings
- Modifying secrets

### SKP Bot

Use for:

- SKP automation workflows
- Scheduled Playwright jobs
- Telegram-triggered runs
- Status reporting

Architecture:

```text
BERTHIER -> IMPERIAL GUARD -> SKP Adapter -> SKP Bot
```

Approval required:

- Any workflow with external side effects
- Any workflow that spends money
- Any workflow that posts, buys, sells, messages, or modifies accounts

### Tipper

Use for:

- Product support
- Roadmap tracking
- Operational automation
- Status summaries
- Engineering task generation

Agent mapping:

- SOULT: roadmap and product decisions
- LANNES: backend
- NEY: frontend
- MURAT: launch and growth
- COLBERT: costs
- BERTHIER: status summaries

### Playwright

Use for:

- Browser automation
- QA checks
- SKP jobs
- Screenshots
- Regression testing
- Form workflows

Run model:

- Jobs run through IMPERIAL GUARD.
- Results stored with screenshots, logs, and status.
- Failed runs create tasks for the correct agent.

### Docker

Use for:

- Service isolation
- Reproducible deployments
- Worker containers
- Browser automation containers
- Local dev parity

Recommended services:

- `voc-api`
- `voc-dashboard`
- `voc-worker`
- `voc-bot`
- `voc-playwright`
- `voc-db`
- `voc-redis`

### PM2

PM2 is acceptable for MVP process management on a VPS.

Use for:

- Telegram bot
- API server
- Worker process
- Scheduled scripts

Tradeoff:

PM2 is simple and fast. Docker Compose is cleaner for multi-service operations. Long term, Docker should become the primary runtime and PM2 should either be removed or used only inside specific Node containers.
