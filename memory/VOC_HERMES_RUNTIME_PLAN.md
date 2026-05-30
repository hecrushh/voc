# VOC Hermes Runtime Plan

## Purpose

Hermes is the planned runtime layer between VOC orchestration and model providers. Command Center discovery must show whether Hermes is available and whether configuration metadata exists, while never exposing config contents or secrets.

## Observed Host State

Checked on the VOC host during this mission:

- `which hermes` resolves to `/usr/local/bin/hermes`.
- `hermes --version` reports `Hermes Agent v0.15.1 (2026.5.29)`.
- Hermes metadata exists under the root user's Hermes directory.
- Secret-bearing files were not opened or printed.

## Command Center Status Model

The Infrastructure page exposes two Hermes runtime rows:

| Row | Status Values | Detection Method |
| --- | --- | --- |
| Hermes Runtime | `installed` or `missing` | `which hermes` and `hermes --version` in the Command Center runtime environment |
| Hermes Configuration | `configured` or `unconfigured` | Existence metadata for standard config paths only |

The standard config metadata locations are:

- `$HERMES_CONFIG_DIR` when set.
- `$HOME/.hermes`.
- `$HOME/.config/hermes`.
- `/etc/hermes`.

The status adapter may check for standard file names such as `config.yaml`, `config.yml`, `.env`, and `settings.json`, but it must not read, parse, log, or render their contents.

## Docker Boundary

Command Center runs inside a container. Host Hermes installation and root-user Hermes configuration are not automatically visible inside that container. This is intentional until a safe runtime-sharing strategy is approved.

Recommended next step:

1. Keep status discovery read-only.
2. Avoid mounting secret-bearing Hermes config directories into Command Center.
3. If host-level Hermes status is required, expose a minimal non-secret health marker or dedicated read-only adapter that returns only `installed`, `missing`, `configured`, and `unconfigured`.
4. Do not route prompts or execute Hermes model calls until BERTHIER command intake and approval policy are ready.

## Safety Rules

- Do not print API keys.
- Do not display config file contents.
- Do not display config-derived fingerprints or prefixes.
- Do not execute tools from the UI.
- Do not perform model calls during status discovery.
- Treat Hermes configuration changes as secret-management actions requiring approval.
