# VOC Roadmap

## Recommended Strategy

The correct first move is command discipline, not autonomy.

Start with:

- BERTHIER
- Tasks
- Memory
- Reminders
- Approvals
- Logs

Then expand into specialist agents and automation.

## Phase 1: MVP Implementation

Goal: BERTHIER works as the personal executive assistant through Telegram.

Build:

- Telegram bot
- BERTHIER command parser
- Task database
- Reminder system
- Daily briefing
- Basic memory
- Manual agent delegation labels
- Approval workflow
- Web dashboard skeleton
- Logs

Agents:

- BERTHIER only as active agent
- Other agents represented as roles, not autonomous workers yet

MVP commands:

```text
Berthier, what is my agenda today?
Berthier, remind me tomorrow at 9.
Berthier, summarize Tipper progress.
Berthier, create a task for Lannes.
Berthier, what needs my approval?
```

Recommended stack:

- Node.js / TypeScript
- Telegram bot framework
- Postgres or D1
- Redis/BullMQ or Cloudflare Queues
- Next.js dashboard
- Docker Compose
- PM2 acceptable for early VPS deployment

MVP success criteria:

- VOC always addresses the commander as Sire.
- BERTHIER can store tasks and reminders.
- BERTHIER can produce daily briefings.
- BERTHIER can track active projects.
- VOC logs agent activity.
- VOC requests approval before risky actions.
- VOC maintains useful memory.
- VOC can summarize Tipper, SKP, engineering, marketing, and finance activity.

## Phase 2: Engineering Agents

Goal: Add NEY, LANNES, DAVOUT, and MASSENA.

Build:

- GitHub integration
- Repository indexing
- Engineering task workflows
- Code review summaries
- Security review reports
- Deployment status tracking
- Agent-specific memory scopes

Agent capabilities:

- NEY: frontend review and implementation planning
- LANNES: API/database architecture
- DAVOUT: threat analysis and hardening
- MASSENA: deployment, monitoring, backup checks

Approval gates:

- Repo edits
- PR creation
- Production deployments
- Secret changes

## Phase 3: Marketing Agents

Goal: Add MURAT, SOULT, CAULAINCOURT, and COLBERT as strategic operators.

Build:

- Product roadmap module
- PRD generator
- Market research workflows
- Campaign planner
- Cost dashboard
- Competitor intelligence
- Content calendar

Outputs:

- PRDs
- Launch plans
- Campaign briefs
- Financial summaries
- Competitor reports
- Prioritization memos

## Phase 4: Automation Agents

Goal: Activate IMPERIAL GUARD for controlled automation.

Build:

- SKP adapter
- Tipper adapter
- Playwright worker
- Scheduled workflows
- Job dashboard
- Screenshots and run logs
- Failure recovery tasks

Critical requirement:

- Automation should be approval-first until trust is proven.
- High-risk automations stay gated permanently.

## Phase 5: Full VOC Operating System

Goal: VOC becomes a persistent command operating system.

Build:

- Full memory graph
- Cross-agent planning
- Autonomous daily briefings
- Weekly strategy reviews
- Long-running research agents
- Budget-aware tool routing
- Advanced dashboard
- Multi-model routing
- Voice interface
- Mobile command mode
- Full audit and recovery system

End state:

- BERTHIER knows active priorities, risks, open loops, agent activity, and pending approvals.
- Specialist agents can operate within scoped permissions.
- IMPERIAL GUARD can run approved automation reliably.
- The commander can manage personal operations, engineering, marketing, research, finance, SKP, and Tipper from one command structure.

## Risks And Tradeoffs

### Agent Confusion

If every agent can act freely, VOC becomes noisy.

Recommendation:

- BERTHIER must remain the central coordinator.

### Memory Pollution

Bad memories create bad decisions.

Recommendation:

- Memory writes need type, source, confidence, and review controls.

### Automation Side Effects

Playwright, SKP, and Tipper jobs can perform real actions.

Recommendation:

- Use strict approval gates, dry-run modes, and logs.

### Tool Sprawl

Codex, OpenCode, Hermes, and 9Router may overlap.

Recommendation:

- Define each integration as an adapter with scoped permissions.

### Security Exposure

Telegram bots, GitHub tokens, browser automation, and server credentials are sensitive.

Recommendation:

- Use a secrets manager, allowlists, audit logs, and DAVOUT reviews.

### Overbuilding Early

A full multi-agent operating system is complex.

Recommendation:

- Start with BERTHIER, tasks, memory, reminders, approvals, and logs.
- Add autonomous agents only after the command layer is stable.
