# VOC Master Plan

## BERTHIER Assessment

VOC currently exists as a documented command system, not an implemented application. The VPS foundation is present: Ubuntu 24.04, 4 CPU, 8 GB RAM, 8 GB swap, Ollama, `qwen3:4b`, 9Router on `localhost:20128`, OpenCode, and `/opt/voc/docs`.

The immediate mission is to produce the first working VOC Command Center prototype without pretending the full multi-agent operating system already exists. The correct posture is disciplined staging:

1. Architecture and planning.
2. Static or lightly mocked Command Center UI structure.
3. Local status adapters for Ollama, 9Router, OpenCode, VPS resources, model inventory, memory, missions, and agent registry.
4. Minimal backend/API.
5. Real orchestration only after the command layer, memory model, and approval policy are stable.

## Current Audit

### `/opt/voc`

Current structure:

```text
/opt/voc
└── docs
    ├── agents.md
    ├── architecture.md
    ├── review.md
    ├── roadmap.md
    └── vision.md
```

There is no application source code, no runtime configuration, no package manifest, no dashboard, no API service, no database schema, no service definitions, no memory directory, and no mission/task state store.

### `vision.md`

The vision is clear and useful. VOC is defined as Virtual Operations Command, with BERTHIER as the normal interface and Chief of Staff. It establishes the command tone, the requirement to address the commander as `Sire`, the role of delegated agents, memory discipline, approval gates, and the eventual scope across executive assistance, engineering, product, marketing, finance, research, and automation.

Gap: it does not separate the first Command Center prototype from the final operating-system vision.

### `architecture.md`

The target architecture describes interface layers, BERTHIER core, command router, policy engine, agent orchestrator, shared memory, queues, jobs, integrations, logs, Telegram, dashboard, security, monitoring, backups, approvals, and schema concepts.

Gap: it is too broad for first implementation and mixes MVP, target architecture, and future integrations. It also references agents not included in the current Command Center requirement, such as SOULT, CAULAINCOURT, and COLBERT.

### `agents.md`

The agent model is strong. It defines BERTHIER, SOULT, NEY, LANNES, DAVOUT, MASSENA, MURAT, CAULAINCOURT, COLBERT, and IMPERIAL GUARD with responsibilities, memory rules, permissions, and delegation flow.

Gap: the requested prototype only includes BERTHIER, NEY, LANNES, DAVOUT, MASSENA, MURAT, and IMPERIAL GUARD. The dashboard should show those seven first and keep the rest deferred.

### `roadmap.md`

The roadmap correctly emphasizes command discipline before autonomy and phases the system from BERTHIER to engineering agents, marketing agents, automation, and mature VOC OS.

Gap: it still places a Telegram-first MVP ahead of the Command Center. For this mission, the Command Center prototype becomes the first visible planning and status surface, while Telegram remains a later command interface unless explicitly prioritized.

### `review.md`

The review is the strongest MVP guardrail. It warns against building the entire operating system too early and recommends BERTHIER, Telegram, memory, tasks, reminders, and daily briefings only.

Gap: the review intentionally defers the web dashboard, but the current mission explicitly asks for a Command Center prototype. Therefore the prototype must be status-first and orchestration-ready, not a full autonomous dashboard.

## Gap Analysis

### Missing Folders

Required next structure:

```text
/opt/voc
├── apps
│   ├── command-center
│   └── api
├── config
├── data
│   ├── memory
│   ├── missions
│   └── logs
├── docs
├── memory
├── scripts
└── services
```

Do not create these folders until the implementation phase begins. The only folder created in this planning phase is `/opt/voc/memory`.

### Missing Architecture Pieces

- Command Center frontend architecture.
- Backend/API boundary.
- Local status adapter contract.
- Agent registry file.
- Mission state model.
- Memory state model.
- UI route map.
- MVP acceptance criteria.
- Security boundary for local-only status checks.
- 9Router integration contract.
- Ollama/model inventory status contract.
- OpenCode presence/status contract.
- VPS resource collection strategy.

### Missing Implementation Plans

- Which app framework to use.
- How to run the prototype without disturbing production services.
- Whether data starts as JSON files or SQLite.
- How to represent agents before they are autonomous.
- How to distinguish mock status from real status.
- How to avoid heavy monitoring stacks on the VPS.
- How to stage the UI without installing new software immediately.

## Proposed Direction

The first Command Center should be a local-first dashboard backed by small local adapters. It should display real infrastructure status where simple and safe, and clearly display placeholder or planned state where systems are not implemented.

The prototype must not:

- Start autonomous agents.
- Modify infrastructure.
- Install new software without approval.
- Expose the dashboard publicly.
- Create production deployments.
- Store secrets in memory.
- Claim specialist agents are operational when they are role definitions.

## MVP Definition

The Command Center MVP includes five sections:

1. Dashboard: system status, VPS health, active models, agent status, memory status, current missions.
2. Agents: BERTHIER, NEY, LANNES, DAVOUT, MASSENA, MURAT, IMPERIAL GUARD.
3. Memory: strategic memory, operational memory, project memory, logs.
4. Missions: queue, active missions, completed missions.
5. Infrastructure: Ollama, 9Router, OpenCode, VPS resources, model inventory.

## Command Policy

BERTHIER remains the command interface. Specialist agents appear as staff roles with status and mission ownership, not independent processes.

Initial statuses:

- BERTHIER: planning active.
- NEY: frontend role defined.
- LANNES: backend role defined.
- DAVOUT: security role defined.
- MASSENA: devops role defined.
- MURAT: marketing role defined.
- IMPERIAL GUARD: automation role defined, inactive until approval gates exist.

## Step-by-Step Sequence

1. Finalize architecture documents in `/opt/voc/memory`.
2. Create a UI wireframe route map and component inventory.
3. Choose the smallest viable local app stack already available on the VPS, or request approval before installing anything.
4. Create `/opt/voc/apps/command-center` only after stack confirmation.
5. Build static dashboard shell with responsive dark command-center layout.
6. Add local data fixtures for agents, missions, memory categories, and infrastructure statuses.
7. Add a minimal API layer that reads safe local status only.
8. Replace fixtures gradually with real adapters.
9. Add authentication before any public exposure.
10. Add persistent mission and memory storage.
11. Add BERTHIER command intake after the dashboard state model is stable.
12. Add specialist automation only after approval workflow and logs exist.

## Success Criteria

- A user can open the Command Center and understand VOC state within 10 seconds.
- The UI distinguishes operational, planned, inactive, and degraded components.
- VPS and model status are visible without heavy monitoring tools.
- Agent roles are visible without implying unsupervised autonomy.
- Memory and missions have clear structure.
- The architecture remains small enough for 4 CPU and 8 GB RAM.
- No existing production service is modified during planning.
