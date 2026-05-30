# VOC Command Center Runbook

## Architecture Tree

```text
/opt/voc
├── apps
│   └── command-center
│       ├── app
│       │   ├── api
│       │   ├── agents
│       │   ├── infrastructure
│       │   ├── memory
│       │   └── missions
│       ├── components
│       └── lib
├── docs
├── memory
├── docker-compose.yml
└── RUNBOOK.md
```

## Database Schema

SQLite database path inside the container:

```text
/app/data/voc.db
```

Docker Compose persists this through the named volume `voc_command-center-data`.

Schema:

```sql
CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('queued', 'active', 'blocked', 'completed', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  owner_agent TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE mission_events (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);
```

## Commands

Install dependencies:

```bash
cd /opt/voc/apps/command-center
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run with Docker Compose:

```bash
cd /opt/voc
docker compose up --build
```

The Compose service uses host networking so read-only checks can reach host-local Ollama and any manually started 9Router instance bound to loopback. Next.js is explicitly bound to `127.0.0.1:3010`, not all interfaces.

9Router runtime decision:

- `/usr/bin/9router` is installed and reports version `0.4.66`.
- No `9router.service` unit is installed.
- No process currently listens on `127.0.0.1:20128`.
- The dashboard treats unreachable 9Router as `planned` while `NINE_ROUTER_RUNTIME_MODE=manual`.

Hermes provider posture:

- OpenAI: premium fallback and general reasoning, detected by `OPENAI_API_KEY` presence only.
- DeepSeek: coding and reasoning, detected by `DEEPSEEK_API_KEY` presence only.
- Xiaomi MiMo: alternate reasoning and coding, detected by `MIMO_API_KEY` presence only.
- Ollama Cloud: remote Ollama-compatible provider, detected by `OLLAMA_API_KEY` presence only.
- Ollama Local: private/local lightweight provider, detected by local Ollama API reachability only.
- The Command Center does not call external model APIs during status checks.
- The Command Center never displays credential values, prefixes, fingerprints, or secret-bearing URLs.

Hermes runtime discovery:

- Host inspection during the Hermes runtime discovery mission found `/usr/local/bin/hermes`.
- `hermes --version` reported `Hermes Agent v0.15.1 (2026.5.29)`.
- Root-user Hermes metadata exists, but secret-bearing files were not opened or printed.
- Command Center reports `Hermes Runtime` as `installed` or `missing` from the runtime environment PATH.
- Command Center reports `Hermes Configuration` as `configured` or `unconfigured` from safe filesystem metadata only.
- The status adapter checks standard metadata locations only and does not read config file contents.
- Docker does not automatically expose host Hermes binaries or root-user Hermes config to Command Center.

Hermes install/config plan:

1. Install or update Hermes on the host outside the Command Center UI.
2. Keep Hermes secrets in the approved Hermes config location or process environment, not in git.
3. Confirm `which hermes` and `hermes --version` locally.
4. Confirm config metadata exists without printing config contents.
5. Decide separately whether Command Center should see host Hermes through a safe read-only adapter.
6. Do not enable Hermes prompt routing, model calls, or tool execution from the UI until BERTHIER command intake, approval gates, and audit logging exist.

## Safe Secret Setup

Use `/opt/voc/.env.example` as a placeholder reference only. Do not put real API keys in committed files, documentation, memory files, command output, or issue text.

Recommended handling:

```bash
cd /opt/voc
cp .env.example .env
chmod 600 .env
```

Then edit `.env` locally and replace placeholder values with real provider keys. `.env` is ignored by git.

For local development, export only the variables needed by the process:

```bash
export OPENAI_API_KEY=...
export DEEPSEEK_API_KEY=...
export MIMO_API_KEY=...
export OLLAMA_API_KEY=...
cd /opt/voc/apps/command-center
npm run dev
```

Do not paste real values into chat or terminal transcripts. Do not run `env`, `printenv`, or secret-bearing `docker compose config` output in a shared context. If Docker Compose is later wired to consume a secret env file directly, treat `docker compose config` as sensitive because Compose may render resolved environment values.

## Security Notes

- The Compose service binds to `127.0.0.1:3010`.
- Docker host networking is used only to inspect loopback services such as Ollama and 9Router.
- Docker socket access remains restricted for the unprivileged app process. The UI reports this as `restricted`, not degraded, because the restriction is intentional.
- Documentation, memory, and reports mounts are read-only.
- Infrastructure integrations are read-only.
- Secrets are never displayed. GitHub and Cloudflare report configuration posture only.
- Hermes provider statuses report environment-variable presence only and never reveal API keys.
- Hermes runtime discovery reports binary/configuration posture only and never reads secret-bearing config contents.
- Mission Engine v0.2 is implemented through commits `1266e27`, `ca5ad78`, `2e2900a`, and `15dc4cb`.
- No autonomous agents, Telegram interface, provider execution, external action execution, external deployments, or cloud calls are implemented.
- Risky BERTHIER commands are approval-gated and converted into approval requests instead of being executed.

## UI Summary

- Strategic Overview: VPS health, Ollama, models, 9Router, missions.
- Agent Board: ten command roles, all `Offline / Planned`.
- Mission Registry: mission CRUD backed by SQLite.
- Memory Vault: read-only explorer for `/opt/voc/docs` and `/opt/voc/memory`.
- Reports: read-only explorer for Markdown reports in `/opt/voc/reports`.
- Infrastructure: read-only status for VPS, Docker, GitHub, Cloudflare, Hermes runtime, Hermes providers, and Ollama.

## VOC Alpha Telegram Interface

VOC Alpha adds a commander-facing Telegram interface to existing BERTHIER and Mission Engine v0.2 capabilities.

Environment variables:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_ALLOWED_USER_IDS
TELEGRAM_WEBHOOK_SECRET optional
```

Supported Alpha commands:

```text
/status
/missions
/mission <id>
/create <title>
/update <id> active|completed|blocked <reason>
/briefing
/workload
/focus
/skp status
/skp checklist
/skp next
/skp risk
/skp mission <title>
/repo status
/github status
```

Safety posture:

- Telegram is an intake and response channel only.
- Mission creation and mission status updates use existing Mission Engine paths.
- `/briefing`, `/workload`, `/repo status`, and `/github status` are read-only summaries.
- SKP assistant is planning/checklist only.
- GitHub intelligence is read-only.
- Provider routing has deterministic fallback and does not execute side effects.
- No autonomous agents, workers, queues, Playwright execution, GitHub writes, SKP execution, or approval bypass were added.
