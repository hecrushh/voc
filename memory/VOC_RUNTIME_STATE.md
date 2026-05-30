# VOC Runtime State

## Timestamp

Recorded during VOC Command Center Mission Engine v0.2 stabilization.

## Current Runtime

- Command Center runs locally at `http://127.0.0.1:3010`.
- Commit `76a3287` added the BERTHIER command surface at `/berthier`.
- Commit `1266e27` added the BERTHIER audit and execution-plan reports.
- Commit `ca5ad78` added Mission Engine persistence: `commands`, `approvals`, expanded `mission_events`, and linked mission audit fields.
- Commit `2e2900a` added BERTHIER deterministic command parser v0 and Mission Engine service behavior.
- Commit `15dc4cb` wired controlled BERTHIER intake, approval endpoints, and mission timeline UI.
- Mission Engine v0.2 is implemented.
- `/berthier` is now controlled Mission Engine v0.2 intake for mission state, command records, status summaries, and approval requests.
- `/berthier` performs no autonomous execution and makes no provider calls.
- `/berthier` displays no secrets.
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
- No Telegram interface is active.
- No provider execution is active.
- No external action execution is active.
- Risky commands are approval-gated and converted into approval requests instead of being executed.
- No tool execution is exposed through the UI.
- The BERTHIER `/berthier` command surface is functional only for controlled Mission Engine v0.2 state changes.
- `/berthier` does not trigger autonomous execution or external side effects.
- `/berthier` makes no provider calls.
- No external cloud calls are made for GitHub or Cloudflare.
- No secrets are displayed.
- Infrastructure integrations remain read-only.
