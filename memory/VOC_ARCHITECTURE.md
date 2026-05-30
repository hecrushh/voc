# VOC Architecture

## Architecture Principle

VOC is a local-first personal AI operations system. BERTHIER coordinates. Ollama provides primary inference. 9Router provides model routing. OpenCode provides coding execution support. The first Command Center is a command visibility surface, not a full agent autonomy platform.

## Current State

```text
VPS
├── Ubuntu 24.04
├── Ollama
│   └── qwen3:4b
├── 9Router
│   └── localhost:20128
├── OpenCode
└── /opt/voc
    └── docs
```

## Target MVP Architecture

```text
Browser
  |
  v
VOC Command Center UI
  |
  v
VOC Local API
  |
  +--> Agent Registry
  +--> Mission Store
  +--> Memory Store
  +--> Infrastructure Status Adapters
  |    +--> VPS resources
  |    +--> Ollama status
  |    +--> 9Router status
  |    +--> OpenCode status
  |    +--> Model inventory
  |
  v
Local Files or SQLite
```

## Deliberate MVP Constraints

- No external database required for the prototype.
- No vector search in the first build.
- No autonomous specialist agent workers.
- No public exposure until authentication exists.
- No production infrastructure changes.
- No background automation except read-only status checks.
- No new software installation without explicit approval.

## Recommended Runtime Shape

Start with one web application and one local data store.

Preferred implementation options:

1. If Node/TypeScript and package tooling are already available: a small Next.js or Vite/React app with local API routes.
2. If avoiding dependency installation is required: static HTML/CSS/JS with JSON fixtures.
3. If backend-first is preferred later: a small Node or Python local API that serves static UI and JSON endpoints.

The architecture should remain portable. Do not depend on a heavyweight orchestration platform for the first prototype.

## Data Boundaries

### Agent Registry

Source of truth for the seven MVP agents:

- BERTHIER
- NEY
- LANNES
- DAVOUT
- MASSENA
- MURAT
- IMPERIAL GUARD

Fields:

```text
id
name
title
domain
status
responsibilities
permissions
memory_scope
current_mission_id
last_activity_at
```

### Mission Store

Tracks work as command objects, not free-form notes.

Fields:

```text
id
title
summary
status: queued | active | blocked | completed | cancelled
priority: low | normal | high | critical
owner_agent
created_at
updated_at
completed_at
source
notes
```

### Memory Store

Four MVP categories:

- Strategic memory: long-lived priorities, rules, doctrine, commander preferences.
- Operational memory: current state, service events, recent decisions.
- Project memory: product, engineering, marketing, and automation context.
- Logs: append-only operational events.

Fields:

```text
id
type: strategic | operational | project | log
title
body
source
confidence
created_at
updated_at
tags
```

### Infrastructure Status

Read-only status objects:

```text
component
status: online | degraded | restricted | planned | offline
detail
checked_at
source
```

Adapters:

- VPS: CPU, RAM, swap, disk, load average, uptime.
- Ollama: service reachability, installed models, active model if available.
- 9Router: reachability on `localhost:20128`.
- OpenCode: binary or service presence.
- Model inventory: installed local models, routing availability.

## UI Route Map

```text
/
  Dashboard

/agents
  Agent registry and role readiness

/memory
  Strategic, operational, project memory, logs

/missions
  Queue, active, completed, blocked

/infrastructure
  Ollama, 9Router, OpenCode, VPS, models
```

## Component Map

- App shell: dark command-center frame, navigation, status strip.
- Status cards: compact and scan-friendly.
- Health meter: resource usage and service status.
- Agent roster: seven role panels with readiness state.
- Mission board: queued, active, completed lanes.
- Memory console: categorized lists with source and timestamp.
- Infrastructure table: service, status, detail, checked time.
- Activity log: recent append-only events.

## Security Architecture

Phase 1 security rules:

- Bind locally only during prototype development.
- Do not expose to the public internet.
- Do not store secrets in JSON fixtures, logs, or memory.
- Status adapters must be read-only.
- Any future action that changes infrastructure requires explicit approval.

Before public exposure:

- Add authentication.
- Add TLS through a reverse proxy.
- Add request logging.
- Add allowlisted users.
- Add dashboard session expiration.
- Add DAVOUT security review.

## Performance Budget

The VPS has 4 CPU, 8 GB RAM, and 8 GB swap. The Command Center should be lightweight.

MVP budget:

- Idle RAM target: under 300 MB for app process where practical.
- Avoid persistent heavy workers.
- Avoid embedding/vector jobs.
- Avoid browser automation in the first prototype.
- Poll status at conservative intervals.
- Cache status results briefly.

## Future Architecture

After the MVP is stable:

```text
Command Center + Telegram
        |
        v
BERTHIER Command Core
        |
        v
Policy Engine + Approval Gates
        |
        v
Agent Orchestrator
        |
        +--> NEY
        +--> LANNES
        +--> DAVOUT
        +--> MASSENA
        +--> MURAT
        +--> IMPERIAL GUARD
        |
        v
Memory + Missions + Jobs + Logs
        |
        v
Ollama / 9Router / OpenCode / Integrations
```

Future pieces:

- Telegram command intake.
- Approval workflow.
- Job queue.
- Agent-specific tools.
- GitHub/OpenCode execution adapter.
- SKP and Tipper automation adapters.
- Document ingestion.
- Vector retrieval.
- Backup and restore.
- Monitoring and alerts.
