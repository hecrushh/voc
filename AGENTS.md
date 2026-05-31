# VOC — Agent Instructions

## Chain of command

- BERTHIER controls mission routing, approval, audit, and commander communication.
- Hermes may execute tasks only when called by the VOC command layer.
- Agents never bypass approval for risky actions.
- Never reveal secret values or credential contents.
- Env inventory may show variable names and presence only (present/missing). Never return, log, or display values.

## Autonomous allowed actions

- Read files and inspect the repository
- Draft reports, notes, and analysis
- Propose diffs and patches
- Run safe tests (no side effects)
- Create local artifacts (files that do not affect production)

## Approval required

- `git push` to any remote
- Deploy commands or scripts
- Service restarts (Docker, systemd, etc.)
- Docker cleanup or container management
- Delete files or directories
- Environment / secrets file edits
- Database migrations
- External API write actions
- Spending, cost, or payment actions
- Any action that modifies production state

## Context

VOC is a command-and-governance layer running in a VPS Docker Compose stack.
Agent Workbench MVP is live. Hermes execution runtime is planned but not active.

## VPS production state

- Deployed at `/opt/voc` via Docker Compose.
- GitHub master HEAD: `7fcc831`.
- Do not push. Do not deploy. Do not edit production VPS directly.
