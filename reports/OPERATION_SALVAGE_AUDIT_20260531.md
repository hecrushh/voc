# Operation Salvage Audit — 2026-05-31

## Executive Summary

- GitHub/local is not yet proven complete. Local `master` is clean but ahead of `origin/master` by one commit: `42b6c59 feat: add Telegram agent workbench routing`.
- VPS-only files could not be determined because SSH authentication to `103.180.165.87` failed for the attempted users.
- VPS untracked, modified, and deleted file state could not be determined without SSH access.
- VPS storage urgency could not be assessed without SSH access.
- A repo-local `AGENTS.md` and `RTK.md` were not found. The active Codex session instruction references `@RTK.md`, but no `RTK.md` exists in this workspace.

## Local Baseline

| Item | Value |
|---|---|
| Path | `/Users/raksan/Documents/CODE/voc` |
| Branch | `master` |
| Remote | `origin git@github.com:hecrushh/voc.git` |
| Status summary | Clean working tree; ahead of `origin/master` by 1 commit |
| Local inventory | `/tmp/voc-local-files.txt`, 39 files at max depth 3 excluding generated directories |

Latest local commits:

```text
42b6c59 feat: add Telegram agent workbench routing
3a6d3da feat: add natural language BERTHIER Telegram chat
68c442a docs: record VOC Alpha planning and phase reports
1203f88 docs: record VOC Alpha launch state
fd77586 feat: add read-only repo intelligence
01cb7f4 feat: add Telegram SKP assistant
0a54336 feat: add safe model routing fallback
c451227 feat: add Telegram workload summary
ea242cb feat: add Telegram daily briefing
455d005 feat: add Telegram mission lookup helpers
```

Local `git status --untracked-files=all`:

```text
On branch master
Your branch is ahead of 'origin/master' by 1 commit.

nothing to commit, working tree clean
```

Local instruction-file check:

- `AGENTS.md`: not present in `/Users/raksan/Documents/CODE/voc`
- `RTK.md`: not present in `/Users/raksan/Documents/CODE/voc`
- Session-level AGENTS instruction references `@RTK.md`; missing file was reported, not created.

## VPS Repo Discovery

VPS target: `103.180.165.87`

| Path | Branch | Remote | Latest commit | Status summary |
|---|---|---|---|---|
| Unknown | Unknown | Unknown | Unknown | Blocked: SSH authentication failed |

SSH probes attempted:

```text
ssh -o BatchMode=yes -o ConnectTimeout=10 root@103.180.165.87 hostname
ssh -o BatchMode=yes -o ConnectTimeout=10 raksan@103.180.165.87 hostname
ssh -o BatchMode=yes -o ConnectTimeout=10 ubuntu@103.180.165.87 hostname
ssh -o BatchMode=yes -o ConnectTimeout=10 debian@103.180.165.87 hostname
```

Observed result:

```text
Permission denied (publickey,password).
```

Read-only VPS discovery commands were not run because no SSH session could be established.

## VOC Diff Findings

### VPS-only files

Unknown. Requires successful SSH access and `/opt/voc` inventory.

### Local-only files

Unknown relative to VPS. Local repo includes Phase D commit `42b6c59`, which is not yet pushed to `origin/master`.

### VPS untracked files

Unknown. Requires:

```text
cd /opt/voc
git ls-files --others --exclude-standard
```

### VPS modified files

Unknown. Requires:

```text
cd /opt/voc
git ls-files --modified
git diff --stat
git diff --name-only
```

### VPS deleted files

Unknown. Requires:

```text
cd /opt/voc
git ls-files --deleted
```

### Ignored/suspicious files

Unknown on VPS. Local suspicious categories to inspect on VPS without printing values:

- `.env`
- `.env.*`
- `data/*.db`
- runtime logs
- local prompt/report markdown files not tracked by Git
- scripts outside expected app directories
- model or Ollama data under `/root/.ollama`

## Storage Findings

| Path | Size | Cleanup recommendation | Risk level |
|---|---:|---|---|
| `/opt` | Unknown | Run read-only `du` first | Unknown |
| `/root` | Unknown | Run read-only `du` first | Unknown |
| `/home` | Unknown | Run read-only `du` first | Unknown |
| `/var/lib/docker` | Unknown | Run `docker system df` before any cleanup | Unknown |
| `/root/.ollama` | Unknown | Inventory model sizes before any cleanup | Unknown |

Storage audit is blocked by SSH authentication failure. No cleanup was performed.

## Salvage Recommendations

### MUST COPY TO LOCAL

- Unknown until VPS inventory is available.
- Prioritize VPS-only docs, prompts, memory files, reports, scripts, runbooks, and non-secret configuration templates.

### MUST COMMIT TO GITHUB

- Local Phase D commit `42b6c59` exists locally and is ahead of `origin/master`.
- Do not push until the commander explicitly approves and VPS salvage risk is resolved.

### SAFE TO IGNORE

- Generated directories should remain excluded from salvage comparisons unless there is a specific reason:
  - `node_modules`
  - `.next`
  - `dist`
  - `build`
  - `coverage`
  - `.turbo`

### CANDIDATE FOR CLEANUP LATER

- Unknown until read-only VPS storage audit is completed.
- Likely candidates after review only:
  - stale `node_modules`
  - stale `.next`
  - unused Docker images
  - unused Docker build cache
  - old logs
  - unused model files

### NEEDS COMMANDER APPROVAL

- Provide valid SSH access method for `103.180.165.87`.
- Approve copying non-secret VPS-only files back to local after inventory review.
- Approve any GitHub push.
- Approve any cleanup.
- Approve any deployment or service restart.

## Exact Next Commands

Do not execute these until the commander approves and provides working SSH access.

### Option A — Verify SSH access only

```bash
ssh <approved-user>@103.180.165.87 hostname
```

### Option B — Read-only VPS discovery

```bash
ssh <approved-user>@103.180.165.87 'hostname'
ssh <approved-user>@103.180.165.87 'pwd'
ssh <approved-user>@103.180.165.87 'df -h'
ssh <approved-user>@103.180.165.87 'find /opt /root /home -name ".git" -type d 2>/dev/null'
```

### Option C — Read-only `/opt/voc` inventory

```bash
ssh <approved-user>@103.180.165.87 'cd /opt/voc && find . -maxdepth 5 -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/.git/*" ! -path "*/coverage/*" ! -path "*/.turbo/*" | sort > /tmp/voc-vps-files.txt'
scp <approved-user>@103.180.165.87:/tmp/voc-vps-files.txt /tmp/voc-vps-files.txt
diff -u /tmp/voc-local-files.txt /tmp/voc-vps-files.txt
```

### Option D — Read-only `/opt/voc` Git state

```bash
ssh <approved-user>@103.180.165.87 'cd /opt/voc && git status --untracked-files=all'
ssh <approved-user>@103.180.165.87 'cd /opt/voc && git diff --stat'
ssh <approved-user>@103.180.165.87 'cd /opt/voc && git diff --name-only'
ssh <approved-user>@103.180.165.87 'cd /opt/voc && git ls-files --others --exclude-standard'
ssh <approved-user>@103.180.165.87 'cd /opt/voc && git ls-files --modified'
ssh <approved-user>@103.180.165.87 'cd /opt/voc && git ls-files --deleted'
```

### Option E — Read-only storage audit

```bash
ssh <approved-user>@103.180.165.87 'df -h'
ssh <approved-user>@103.180.165.87 'du -h --max-depth=1 /opt 2>/dev/null | sort -hr'
ssh <approved-user>@103.180.165.87 'du -h --max-depth=1 /root 2>/dev/null | sort -hr'
ssh <approved-user>@103.180.165.87 'du -h --max-depth=1 /home 2>/dev/null | sort -hr'
ssh <approved-user>@103.180.165.87 'du -h --max-depth=1 /var/lib/docker 2>/dev/null | sort -hr'
ssh <approved-user>@103.180.165.87 'du -h --max-depth=1 /root/.ollama 2>/dev/null | sort -hr'
ssh <approved-user>@103.180.165.87 'docker system df 2>/dev/null || true'
```

## Safety Check

- No files were deleted.
- No services were restarted.
- No production runtime was modified.
- No GitHub push was performed.
- No deployment was performed.
- No secret values were printed.
