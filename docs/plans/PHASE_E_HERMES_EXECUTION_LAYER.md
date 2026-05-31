# Phase E — Hermes Execution Layer

## Current VOC state

VOC is deployed on VPS at `/opt/voc` via Docker Compose. The Agent Workbench MVP is live. Telegram → BERTHIER → Agent Selector → mission/artifact template works for LANNES, NEY, MURAT, CAULAINCOURT. Missions are created, tracked, and reported. Commander communication flows through Telegram and the web command center.

## Target architecture

```
Telegram / Web UI
       │
       ▼
   BERTHIER (chief-of-staff brain + approval gate)
       │
       ▼
  Agent Selector (specialist routing)
       │
       ▼
  Hermes Adapter (execution runtime)
       │
       ▼
   Artifact (read-only output)
       │
       ▼
  Approval Gate (if risk detected)
       │
       ▼
   Execution (only after approval)
```

**BERTHIER** remains the commander-facing layer — it interprets intent, routes to agents, creates missions, enforces safety, and gates approvals.

**Hermes** is the execution layer, not the commander layer. It does not decide what to do; it only executes approved tasks from the VOC command chain. Hermes runs on the VPS as a daemon, receives parsed mission payloads, and performs defined actions (file operations, script runs, API calls) under strict safety constraints.

## Why Hermes is execution, not commander

- Separation of concerns: BERTHIER decides, Hermes does.
- Safety: the approval gate lives in BERTHIER, not Hermes.
- Auditability: every execution is logged with the mission ID and approval ID that authorized it.
- Swappable runtime: Hermes can be replaced without changing the command and governance model.

## Safety model

- Hermes never receives secret values — only references to env vars that BERTHIER has validated as present.
- Hermes never bypasses the approval gate.
- Hermes runs in a restricted container with no direct Docker socket access.
- All Hermes actions are logged to the VOC database.
- Hermes has a kill switch: if `HERMES_ENABLED` is not set to `true`, it refuses all execution.
- BERTHIER audits Hermes execution logs before reporting back to the commander.

## Env inventory model

- BERTHIER maintains an allowlist of known environment variable names.
- The env inventory function checks each name against `process.env` and returns only:
  - `"present"` — variable exists and is non-empty
  - `"missing"` — variable is not set or is empty
- Values are never returned, logged, or exposed.
- The inventory name list is fixed in code and expanded through code review, not at runtime.

### Current allowlist

- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`
- `OPENROUTER_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_IDS`
- `TELEGRAM_WEBHOOK_SECRET`
- `NINE_ROUTER_URL`
- `NINE_ROUTER_RUNTIME_MODE`
- `OLLAMA_BASE_URL`
- `VOC_DB_PATH`
- `VOC_ROOT`
- `NODE_ENV`
- `HOSTNAME`
- `PORT`

## Approval-gated autonomy model

- Autonomous allowed actions: read files, inspect repo, draft reports, propose diffs, run safe tests, create local artifacts.
- Approval required: git push, deploy, service restart, docker cleanup, delete files, env/secrets edit, database migration, external API write, spending/cost actions.
- The approval gate is a database record with status tracking (requested → approved/rejected).
- BERTHIER checks the gate before any restricted action.

## Future phases

### E.1 Env Inventory + Instruction Files (this phase)
- AGENTS.md and Phase E design doc
- Safe env inventory library
- Telegram natural language route for env checks
- Tests and commit

### E.2 Approval Gate
- Approval request table in DB (may already exist)
- Telegram routing for approve/reject workflows
- Commander-facing approval list in web UI
- BERTHIER-enforced gate for restricted actions

### E.3 Artifact Persistence
- Mission artifacts stored as files in `./artifacts/`
- Artifact metadata in database
- CLI and web viewing
- Retention policy for old artifacts

### E.4 Hermes Adapter
- Hermes agent code (daemon mode)
- Hermes → VPS shell gateway
- Hermes safety constraints (env gates, approval checks)
- Hermes logging and audit trail

### E.5 Autonomous Worker Daemon
- Periodic task daemon (cron-like)
- Queue-based execution from Hermes
- Health checks and restart policy
- Rate limiting and resource monitoring

### E.6 SKP Bridge
- Hermes → SKP Playwright integration
- SKP session lifecycle under BERTHIER approval
- SKP execution artifact storage
- SKP-specific approval policies
