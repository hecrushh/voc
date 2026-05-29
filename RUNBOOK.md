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

## Security Notes

- The Compose service binds to `127.0.0.1:3010`.
- Documentation and memory mounts are read-only.
- Infrastructure integrations are read-only.
- Secrets are never displayed. GitHub and Cloudflare report configuration posture only.
- No autonomous agents, tool execution, external deployments, or cloud calls are implemented.

## UI Summary

- Strategic Overview: VPS health, Ollama, models, 9Router, missions.
- Agent Board: ten command roles, all `Offline / Planned`.
- Mission Registry: mission CRUD backed by SQLite.
- Memory Vault: read-only explorer for `/opt/voc/docs` and `/opt/voc/memory`.
- Infrastructure: read-only status for VPS, Docker, GitHub, and Cloudflare.
