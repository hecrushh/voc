# VOC Runtime State

## Timestamp

Recorded during VOC Command Center MVP v0.1 runtime stabilization.

## Current Runtime

- Command Center runs locally at `http://127.0.0.1:3010`.
- Docker Compose uses host networking so read-only checks can inspect loopback services.
- Next.js is bound to `127.0.0.1:3010`.
- Mission persistence uses SQLite at `/app/data/voc.db` inside the container.
- SQLite persistence is backed by Docker volume `voc_command-center-data`.
- Documentation and memory are mounted read-only.

## Status Vocabulary

Runtime statuses are standardized to:

- `online`: reachable and healthy.
- `degraded`: reachable but unhealthy or resource pressure is high.
- `restricted`: intentionally blocked by least-privilege policy.
- `planned`: installed, manual, or future integration with no persistent service expected.
- `offline`: expected persistent service is not reachable.

## 9Router Decision

Observed state:

- `/usr/bin/9router` exists.
- `9router --version` reports `0.4.66`.
- There is no `9router.service` unit.
- There is no process listening on `127.0.0.1:20128`.
- `9router --help` behaves like a long-running interactive CLI under non-interactive inspection.

Decision:

- 9Router is treated as a manual/planned runtime in Command Center MVP v0.1.
- If a 9Router listener responds on `NINE_ROUTER_URL`, the dashboard reports `online` or `degraded`.
- If no listener responds and `NINE_ROUTER_RUNTIME_MODE=manual`, the dashboard reports `planned`, not `offline`.

## Docker Decision

Observed state:

- Docker service is active on the VPS.
- The Command Center container runs as an unprivileged user.
- `/var/run/docker.sock` is mounted read-only but is not readable by the app process.

Decision:

- The app must not run as root just to inspect Docker.
- Docker socket access remains intentionally blocked.
- The dashboard reports Docker as `restricted`, not `degraded`.
- This avoids granting the dashboard effective Docker host control.

## Security Posture

- No autonomous agents are active.
- No tool execution is exposed through the UI.
- No external cloud calls are made for GitHub or Cloudflare.
- No secrets are displayed.
- Infrastructure integrations remain read-only.
