# VOC Command Center PRD

## Product Summary

VOC Command Center is the first visible control surface for Virtual Operations Command. It gives BERTHIER and the commander a single place to inspect system state, infrastructure readiness, agent roster, memory categories, and mission flow.

The prototype is not a full operating system. It is the foundation for one.

## Goals

- Show current VOC state clearly.
- Create a modern dark command-center interface.
- Represent the seven MVP agents.
- Track memory and missions in a structured way.
- Show local infrastructure status for Ollama, 9Router, OpenCode, VPS resources, and model inventory.
- Prepare for future multi-agent orchestration without building it prematurely.

## Non-Goals

- No autonomous agent execution.
- No public deployment.
- No new software installation without approval.
- No Telegram bot implementation in this prototype unless separately authorized.
- No SKP or Tipper automation.
- No vector search.
- No full monitoring stack.
- No production infrastructure modification.

## Users

Primary user: the commander.

Primary interface identity: BERTHIER.

Specialist role audiences:

- NEY: frontend state and UI plans.
- LANNES: backend/API readiness.
- DAVOUT: security posture.
- MASSENA: infrastructure posture.
- MURAT: product/marketing context.
- IMPERIAL GUARD: automation readiness.

## Required Pages

### Dashboard

Must include:

- System status.
- VPS health.
- Active models.
- Agent status.
- Memory status.
- Current missions.

Useful widgets:

- Overall readiness banner.
- Service status row.
- Resource usage strip.
- Current mission list.
- Recent log events.
- Agent readiness summary.

### Agents

Must include:

- BERTHIER.
- NEY.
- LANNES.
- DAVOUT.
- MASSENA.
- MURAT.
- IMPERIAL GUARD.

Each agent card should show:

- Title.
- Domain.
- Status.
- Current mission.
- Permissions summary.
- Future capabilities.

### Memory

Must include:

- Strategic memory.
- Operational memory.
- Project memory.
- Logs.

Each entry should show:

- Title.
- Type.
- Source.
- Timestamp.
- Tags.

MVP can start with read-only or fixture-backed data, then become editable after the storage model is stable.

### Missions

Must include:

- Mission queue.
- Active missions.
- Completed missions.

Recommended extra lane:

- Blocked missions.

Each mission should show:

- Title.
- Owner agent.
- Priority.
- Status.
- Created/updated time.
- Notes.

### Infrastructure

Must include:

- Ollama status.
- 9Router status.
- OpenCode status.
- VPS resources.
- Model inventory.

Each component should show:

- Status.
- Detail.
- Last checked time.
- Source.

## UX Requirements

- Modern UI.
- Dark mode.
- Responsive.
- Command-center aesthetic.
- Military operations room inspiration.
- Dense enough for operational scanning.
- No marketing landing page.
- No decorative clutter.
- Clear status vocabulary.
- Mobile layout must preserve the five core sections.

## Visual Direction

Use a restrained operations-room visual language:

- Dark neutral background.
- High-contrast text.
- Status colors for online, degraded, offline, blocked, planned.
- Compact panels.
- Tables where data comparison matters.
- Clear route navigation.
- Avoid oversized hero sections.
- Avoid one-note color palettes.

## Technical Requirements

- Local-first.
- Lightweight on 4 CPU and 8 GB RAM.
- Modular frontend components.
- Clear data adapters.
- Read-only infrastructure checks at first.
- No secret exposure.
- Easy migration from fixtures to SQLite or another store.

## Acceptance Criteria

- The dashboard renders at desktop and mobile widths.
- The five required pages exist.
- The seven required agents appear.
- Infrastructure statuses can be shown from fixtures or read-only adapters.
- The UI clearly marks planned/inactive features.
- Mission queue, active missions, and completed missions are visible.
- Memory is separated into strategic, operational, project, and logs.
- No autonomous action is triggered from the UI.
- No production service is changed.

## First Wireframe Structure

```text
App Shell
├── Left navigation or top navigation on mobile
├── Header status strip
├── Main content area
└── Recent activity footer or side rail

Dashboard
├── System readiness
├── VPS health
├── Active models
├── Agent status
├── Memory status
└── Current missions

Agents
└── Agent roster grid

Memory
├── Strategic memory
├── Operational memory
├── Project memory
└── Logs

Missions
├── Queue
├── Active
├── Blocked
└── Completed

Infrastructure
├── Service statuses
├── VPS resources
└── Model inventory
```

## Release Plan

Prototype 0:

- Static wireframe with fixture data.

Prototype 1:

- Local API and real read-only infrastructure checks.

Prototype 2:

- Persistent memory and mission store.

Prototype 3:

- BERTHIER command intake and approval model.

Prototype 4:

- Controlled specialist agent workflows.
