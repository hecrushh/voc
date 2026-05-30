# IMPLEMENT VOC Alpha

Status: Concrete implementation checklist  
Source: `/opt/voc/memory/VOC_ALPHA_7_DAY_PLAN.md`  
Goal: Commander can use BERTHIER from Telegram within 7 days  
Scope: Execution document only; no code, migrations, RFCs, or architecture redesign in this document

This checklist optimizes for immediate usefulness. It explicitly does not implement Agent Assignment, Planning v0.4, Approval Expansion v0.5, future autonomous runtime, schema migrations, or new governance layers.

## 1. Current Assets Inventory

### Existing files expected to change

Primary implementation files likely to change:

- `/opt/voc/apps/command-center/lib/mission-engine.ts`
- `/opt/voc/apps/command-center/lib/db.ts`
- `/opt/voc/apps/command-center/lib/types.ts`
- `/opt/voc/apps/command-center/app/api/berthier/route.ts`
- `/opt/voc/apps/command-center/app/api/missions/route.ts`
- `/opt/voc/apps/command-center/app/api/missions/[id]/route.ts`
- `/opt/voc/apps/command-center/app/api/overview/route.ts`
- `/opt/voc/apps/command-center/app/berthier/berthier-console.tsx`
- `/opt/voc/apps/command-center/app/missions/mission-registry.tsx`
- `/opt/voc/apps/command-center/package.json`

Files to reference but avoid changing unless needed:

- `/opt/voc/apps/command-center/lib/infrastructure.ts`
- `/opt/voc/apps/command-center/lib/agents.ts`
- `/opt/voc/apps/command-center/lib/memory.ts`
- `/opt/voc/apps/command-center/app/infrastructure/page.tsx`
- `/opt/voc/apps/command-center/app/agents/page.tsx`
- `/opt/voc/apps/command-center/app/reports/page.tsx`
- `/opt/voc/RUNBOOK.md`
- `/opt/voc/memory/VOC_RUNTIME_STATE.md`
- `/opt/voc/memory/VOC_ALPHA_7_DAY_PLAN.md`

### New files expected

Create only practical Alpha files:

- `/opt/voc/apps/command-center/lib/telegram.ts`
- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/lib/briefing.ts`
- `/opt/voc/apps/command-center/lib/workload.ts`
- `/opt/voc/apps/command-center/lib/model-router.ts`
- `/opt/voc/apps/command-center/lib/skp-assistant.ts`
- `/opt/voc/apps/command-center/lib/github-intelligence.ts`
- `/opt/voc/apps/command-center/app/api/telegram/route.ts`
- `/opt/voc/apps/command-center/tests/telegram-commands.test.mjs`
- `/opt/voc/apps/command-center/tests/briefing-workload.test.mjs`
- `/opt/voc/apps/command-center/tests/model-router-safety.test.mjs`
- `/opt/voc/apps/command-center/tests/skp-assistant.test.mjs`
- `/opt/voc/apps/command-center/tests/github-intelligence.test.mjs`

### Implementation order

1. Confirm current Mission Engine v0.2 behavior through existing tests.
2. Add Telegram command normalization layer.
3. Add Telegram API route or process entrypoint.
4. Add briefing/workload helpers.
5. Add SKP assistant helper.
6. Add model router as safe optional layer.
7. Add read-only GitHub/repo intelligence.
8. Wire deployment environment.
9. Run Alpha smoke test.

### Dependencies

- Telegram bot token available from environment or secret file, not committed.
- Commander Telegram ID allowlist available from environment.
- Command Center can write to existing SQLite DB.
- Existing Mission Engine v0.2 functions remain stable.
- Provider credentials remain outside git.
- GitHub access is read-only for Alpha if enabled.

### Validation steps

- `node --test tests/*.test.mjs`
- `npm run typecheck`
- `npm run build`
- Send Telegram test command from commander account.
- Confirm unauthorized Telegram sender is rejected or ignored.
- Confirm mission appears in Command Center after Telegram creation.
- Confirm no provider call is required for deterministic commands.
- Confirm no external side effect occurs beyond Telegram reply.

## 2. Existing Files To Reuse

### Exact files expected to change

Reuse and extend:

- `/opt/voc/apps/command-center/lib/mission-engine.ts`
  - Existing BERTHIER parser and command processor.
  - Add Alpha command support only where necessary.

- `/opt/voc/apps/command-center/lib/db.ts`
  - Existing mission, command, approval, and event functions.
  - Reuse without schema changes.

- `/opt/voc/apps/command-center/lib/types.ts`
  - Add small Alpha types only if needed.
  - Do not introduce new database schema types.

- `/opt/voc/apps/command-center/app/api/berthier/route.ts`
  - Reuse route behavior as reference for Telegram intake.

- `/opt/voc/apps/command-center/app/api/missions/route.ts`
  - Reuse existing mission list/create paths.

- `/opt/voc/apps/command-center/app/api/missions/[id]/route.ts`
  - Reuse existing mission read/update paths.

- `/opt/voc/apps/command-center/tests/mission-engine-commands.test.mjs`
  - Extend existing command coverage.

- `/opt/voc/apps/command-center/tests/mission-engine-db.test.mjs`
  - Extend only if required for Alpha regressions.

### Implementation order

1. Read existing `processBerthierCommand` behavior.
2. Keep existing natural-language commands working.
3. Add slash-command normalization outside the core parser first.
4. Only change `mission-engine.ts` when normalization is insufficient.
5. Keep all mission persistence in existing SQLite tables.

### Dependencies

- Current command parser supports mission creation, status updates, blocked list, pending approvals, and approval requests.
- Existing `db.ts` supports mission CRUD and event logging.
- Existing tests define regression baseline.

### Validation steps

- Existing tests still pass unchanged before Alpha additions.
- `/berthier` web console still accepts existing commands.
- Mission creation through web path still works.
- Mission update through web path still works.
- Approval-gated risky command behavior still works.

## 3. Telegram Integration Files

### Exact files expected to change

Create:

- `/opt/voc/apps/command-center/lib/telegram.ts`
- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/app/api/telegram/route.ts`
- `/opt/voc/apps/command-center/tests/telegram-commands.test.mjs`

Modify:

- `/opt/voc/apps/command-center/package.json`
  - Add test script only if currently missing and approved.
  - Avoid adding heavy dependencies unless necessary.

- `/opt/voc/apps/command-center/lib/mission-engine.ts`
  - Only if slash-command normalization cannot map cleanly to existing parser.

### Implementation order

1. Define Telegram environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ALLOWED_USER_IDS`
   - optional `TELEGRAM_WEBHOOK_SECRET`

2. Implement Telegram update validation:
   - parse incoming update,
   - extract chat ID,
   - extract sender ID,
   - extract text,
   - reject non-allowlisted users.

3. Implement command normalization:
   - `/create <title>` -> `Create mission: <title>`
   - `/status` -> `Summarize status`
   - `/missions` -> new recent mission summary helper or existing summary fallback
   - `/briefing` -> briefing helper
   - `/workload` -> workload helper
   - `/update <id> active` -> `Mark mission <id> active`
   - `/update <id> completed` -> `Mark mission <id> completed`
   - `/update <id> blocked <reason>` -> `Mark mission <id> blocked: <reason>`
   - natural language commands pass through unchanged.

4. Implement Telegram reply sender:
   - send text only,
   - no rich UI required,
   - no external action beyond reply.

5. Add API route:
   - `POST /api/telegram`
   - validates webhook secret if used,
   - handles only Telegram updates,
   - returns 200 after handling safe reply.

6. Add tests for normalization and allowlist behavior.

### Dependencies

- Telegram bot token is configured securely.
- Public webhook route available if using webhook.
- Alternative polling process is acceptable only if supervised and non-autonomous beyond receiving Telegram updates.
- Mission Engine v0.2 command processor works.

### Validation steps

- Send `/status` from commander Telegram account.
- Send `/status` from unauthorized Telegram account and verify ignored/rejected.
- Send `/create Alpha smoke test mission` and confirm mission exists.
- Send `/update <id> active` and confirm mission status changes.
- Send `/update <id> blocked` without reason and confirm rejection.
- Confirm Telegram route does not expose secrets in response/logs.

## 4. BERTHIER Integration Files

### Exact files expected to change

Modify:

- `/opt/voc/apps/command-center/lib/mission-engine.ts`
- `/opt/voc/apps/command-center/app/api/berthier/route.ts`
- `/opt/voc/apps/command-center/app/berthier/berthier-console.tsx`
- `/opt/voc/apps/command-center/tests/mission-engine-commands.test.mjs`

Create if helpful:

- `/opt/voc/apps/command-center/lib/berthier-alpha.ts`

### Implementation order

1. Keep existing `processBerthierCommand` as the core command path.
2. Add Alpha-only helper for:
   - recent missions,
   - mission details by short ID,
   - briefing,
   - workload,
   - SKP commands,
   - read-only repo status.
3. Route Telegram slash commands to either:
   - existing `processBerthierCommand`, or
   - Alpha helper function.
4. Ensure all BERTHIER responses address commander as `Sire`.
5. Ensure risky/execution requests are rejected or converted into approval requests.

### Dependencies

- Existing parser supports core mission actions.
- Existing `createApproval` path works for risky requests.
- Existing UI `/berthier` route remains stable.

### Validation steps

- Existing `/berthier` tests pass.
- Telegram and web `/berthier` produce compatible mission state.
- Risky commands still produce approval-gated responses.
- Unknown commands do not execute anything.

## 5. Mission Engine Integration Files

### Exact files expected to change

Modify:

- `/opt/voc/apps/command-center/lib/db.ts`
- `/opt/voc/apps/command-center/lib/mission-engine.ts`
- `/opt/voc/apps/command-center/lib/types.ts`
- `/opt/voc/apps/command-center/tests/mission-engine-db.test.mjs`
- `/opt/voc/apps/command-center/tests/mission-engine-commands.test.mjs`

Create:

- `/opt/voc/apps/command-center/lib/briefing.ts`
- `/opt/voc/apps/command-center/lib/workload.ts`
- `/opt/voc/apps/command-center/tests/briefing-workload.test.mjs`

### Implementation order

1. Add helper to resolve mission by full ID or unique short prefix.
2. Add helper to list recent missions in Telegram-friendly format.
3. Add helper to produce mission detail summary.
4. Add briefing helper using existing mission, command, and approval data.
5. Add workload helper using existing `missions.owner_agent`.
6. Ensure all helpers are read-only except explicit mission create/update commands.

### Dependencies

- Existing SQLite mission table.
- Existing mission events.
- Existing approvals table.
- Existing mission statuses and priorities.

### Validation steps

- Short ID resolves only when unique.
- Ambiguous short ID returns clear error.
- Briefing works with zero missions.
- Briefing works with blocked missions and pending approvals.
- Workload summary groups by `owner_agent`.
- Workload summary does not mutate mission state.

## 6. Provider Routing Integration Files

### Exact files expected to change

Create:

- `/opt/voc/apps/command-center/lib/model-router.ts`
- `/opt/voc/apps/command-center/tests/model-router-safety.test.mjs`

Modify if needed:

- `/opt/voc/apps/command-center/lib/infrastructure.ts`
- `/opt/voc/apps/command-center/lib/mission-engine.ts`
- `/opt/voc/apps/command-center/lib/briefing.ts`
- `/opt/voc/apps/command-center/lib/skp-assistant.ts`
- `/opt/voc/apps/command-center/lib/github-intelligence.ts`

### Implementation order

1. Implement provider configuration detection without exposing secrets.
2. Add safe intent categories:
   - `summary`
   - `classification`
   - `briefing_polish`
   - `technical_reasoning`
   - `drafting`
3. Add denylist for execution intents:
   - deploy,
   - post,
   - delete,
   - modify account,
   - run automation,
   - GitHub write,
   - SKP execution.
4. Route deterministic mission commands before model calls.
5. Add model fallback order:
   - Ollama Local/qwen3 for lightweight summaries,
   - DeepSeek for technical/repo reasoning,
   - OpenRouter for high-quality synthesis,
   - MiMo as alternate,
   - Ollama Cloud as compatible fallback.
6. Ensure model failures return deterministic fallback responses.

### Dependencies

- Provider keys configured outside git.
- Ollama Local available for local lightweight tasks.
- No provider call required for core Telegram commands.

### Validation steps

- Missing provider key does not crash BERTHIER.
- Model router never receives raw secrets.
- Model output is returned only as text.
- Model output cannot trigger execution.
- Deterministic fallback works when all providers unavailable.

## 7. Daily Briefing Implementation Checklist

### Exact files expected to change

Create:

- `/opt/voc/apps/command-center/lib/briefing.ts`
- `/opt/voc/apps/command-center/tests/briefing-workload.test.mjs`

Modify:

- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/lib/mission-engine.ts` if briefing command is added to core parser
- `/opt/voc/apps/command-center/app/api/berthier/route.ts` if web route should support briefing

### Implementation order

1. Build deterministic briefing from existing state.
2. Include mission counts by status.
3. Include blocked missions.
4. Include pending approvals.
5. Include high/critical missions.
6. Include top 3 focus recommendations using simple deterministic priority:
   - critical blocked,
   - critical active,
   - high blocked,
   - high active,
   - oldest active/queued.
7. Add optional model polish only after deterministic briefing works.
8. Wire `/briefing` Telegram command.

### Dependencies

- `listMissions()`.
- `listApprovals('requested')`.
- Mission priority/status fields.
- Telegram response sender.

### Validation steps

- `/briefing` works with empty DB.
- `/briefing` includes blockers when present.
- `/briefing` includes pending approvals when present.
- `/briefing` remains under Telegram message length limits or splits safely.
- `/briefing` performs no external side effects.

## 8. Workload Summary Implementation Checklist

### Exact files expected to change

Create:

- `/opt/voc/apps/command-center/lib/workload.ts`
- `/opt/voc/apps/command-center/tests/briefing-workload.test.mjs`

Modify:

- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/lib/mission-engine.ts` if workload command is added to core parser

### Implementation order

1. Read missions with existing `listMissions()`.
2. Group missions by existing `owner_agent`.
3. Count active, queued, blocked, completed, cancelled by owner.
4. Count high/critical missions by owner.
5. Count pending approvals by requested agent if available.
6. Format concise Telegram output.
7. Wire `/workload` Telegram command.

### Dependencies

- Existing `missions.owner_agent` field.
- Existing mission status and priority.
- Existing approvals table.
- No Agent Assignment implementation.

### Validation steps

- `/workload` works with no missions.
- `/workload` groups by owner.
- `/workload` shows blocked counts.
- `/workload` does not mutate DB.
- `/workload` does not imply autonomous workers.

## 9. SKP Assistant Checklist

### Exact files expected to change

Create:

- `/opt/voc/apps/command-center/lib/skp-assistant.ts`
- `/opt/voc/apps/command-center/tests/skp-assistant.test.mjs`

Modify:

- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/lib/mission-engine.ts` if SKP commands are added to parser

### Implementation order

1. Add SKP command recognizer:
   - `/skp status`
   - `/skp checklist`
   - `/skp next`
   - `/skp risk`
   - `/skp mission <title>`
2. Implement deterministic checklist responses.
3. Implement SKP mission creation through existing Mission Engine path.
4. Detect execution language:
   - run,
   - automate,
   - launch,
   - login,
   - post,
   - buy,
   - submit,
   - scrape,
   - Playwright.
5. Convert execution requests into refusal or approval-gated planning response.
6. Add optional safe model polish only after deterministic SKP helper works.

### Dependencies

- Existing mission creation.
- Existing approval request behavior.
- Telegram command routing.
- No browser automation.

### Validation steps

- `/skp checklist` returns checklist.
- `/skp next` returns safe next step.
- `/skp mission <title>` creates a mission.
- “run SKP now” does not execute.
- No Playwright or browser process starts.
- No external account action occurs.

## 10. GitHub Intelligence Checklist

### Exact files expected to change

Create:

- `/opt/voc/apps/command-center/lib/github-intelligence.ts`
- `/opt/voc/apps/command-center/tests/github-intelligence.test.mjs`

Modify:

- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/lib/model-router.ts` if summaries use model routing

### Implementation order

1. Implement local repo read-only summary first:
   - branch,
   - recent commits,
   - working tree status,
   - changed files.
2. Add Telegram command:
   - `/repo status`
   - `/github status`
3. Add optional GitHub API read-only mode if token/config exists.
4. Explicitly block write actions:
   - create PR,
   - merge PR,
   - push,
   - create issue,
   - change settings.
5. Add model summary only for read-only data.

### Dependencies

- Local `/opt/voc` git repository.
- Optional GitHub token/config outside git.
- No GitHub write permission required for Alpha.

### Validation steps

- `/repo status` returns branch and status.
- Works without GitHub token using local repo fallback.
- GitHub token absence does not crash command.
- No GitHub write API is called.
- No secrets are printed.

## 11. Deployment Checklist

### Exact files expected to change

Likely modify:

- `/opt/voc/apps/command-center/package.json`
- `/opt/voc/docker-compose.yml` only if necessary for env wiring or route exposure
- `/opt/voc/.env.example` only for placeholder variable names, never secrets
- `/opt/voc/RUNBOOK.md` after successful deployment
- `/opt/voc/memory/VOC_RUNTIME_STATE.md` after successful deployment

Create only if needed:

- `/opt/voc/apps/command-center/scripts/set-telegram-webhook.mjs`

### Implementation order

1. Implement app route and local tests first.
2. Configure environment variables outside git:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ALLOWED_USER_IDS`
   - optional `TELEGRAM_WEBHOOK_SECRET`
   - provider keys as already configured.
3. Choose deployment mode:
   - webhook via `voc.tipper.cloud`, preferred if already routed,
   - polling only if webhook route is not ready.
4. If webhook:
   - expose only Telegram webhook path,
   - verify secret token,
   - keep Command Center dashboard private/local unless separately approved.
5. Deploy Command Center update.
6. Register Telegram webhook.
7. Send smoke test commands.
8. Monitor logs.

### Dependencies

- DNS/Cloudflare route for `voc.tipper.cloud` if webhook is used.
- Telegram token and allowlist.
- Docker/Next.js deployment path currently working.
- No new database migration.

### Validation steps

- `npm run build` passes.
- Container starts.
- Webhook endpoint responds to Telegram.
- `/status` works from Telegram.
- `/create` creates visible mission.
- Unauthorized sender cannot use bot.
- Logs contain no secrets.

## 12. Testing Checklist

### Exact files expected to change

Existing tests:

- `/opt/voc/apps/command-center/tests/mission-engine-commands.test.mjs`
- `/opt/voc/apps/command-center/tests/mission-engine-db.test.mjs`

New tests:

- `/opt/voc/apps/command-center/tests/telegram-commands.test.mjs`
- `/opt/voc/apps/command-center/tests/briefing-workload.test.mjs`
- `/opt/voc/apps/command-center/tests/model-router-safety.test.mjs`
- `/opt/voc/apps/command-center/tests/skp-assistant.test.mjs`
- `/opt/voc/apps/command-center/tests/github-intelligence.test.mjs`

### Implementation order

1. Add Telegram command normalization tests.
2. Add briefing/workload pure function tests.
3. Add SKP safety tests.
4. Add model router denylist tests.
5. Add repo intelligence read-only tests.
6. Extend mission-engine command tests for Alpha commands.
7. Run full test suite.

### Dependencies

- Node test runner.
- Temporary test DB via `VOC_DB_PATH` as current tests use.
- No real Telegram network call required for unit tests.
- No real provider call required for model router safety tests.
- No real GitHub API required for local repo fallback tests.

### Validation steps

Run:

```bash
cd /opt/voc/apps/command-center
node --test tests/*.test.mjs
npm run typecheck
npm run build
```

Manual smoke tests:

- Telegram `/status`.
- Telegram `/briefing`.
- Telegram `/create Alpha test mission`.
- Telegram `/missions`.
- Telegram `/update <id> active`.
- Telegram `/workload`.
- Telegram `/skp checklist`.
- Telegram `/repo status`.

Safety smoke tests:

- Telegram “deploy production now” creates approval-gated response, not execution.
- Telegram “run SKP now” refuses execution or creates approval-gated plan.
- Unauthorized Telegram user is rejected or ignored.

## 13. Alpha Launch Checklist

### Exact files expected to change

Final documentation updates after successful implementation:

- `/opt/voc/RUNBOOK.md`
- `/opt/voc/memory/VOC_RUNTIME_STATE.md`
- `/opt/voc/memory/VOC_TASK_ROADMAP.md`

Do not update these as “implemented” until launch is verified.

### Implementation order

1. Confirm Telegram MVP works.
2. Confirm mission creation/update works.
3. Confirm briefing works.
4. Confirm workload works.
5. Confirm SKP assistant planning works.
6. Confirm repo/GitHub intelligence works read-only.
7. Confirm model routing is safe and optional.
8. Confirm Command Center reflects Telegram-created state.
9. Confirm logs and error handling are sufficient.
10. Confirm no safety regression.
11. Update runtime docs.
12. Announce Alpha ready.

### Dependencies

- Telegram bot configured.
- Command Center deployed.
- SQLite persistence intact.
- Provider keys available only if model routing is enabled.
- GitHub read-only path available or local repo fallback working.

### Validation steps

Alpha launch requires all of the following:

- Commander can use BERTHIER from Telegram.
- `/briefing` returns useful daily summary.
- `/create` creates mission.
- `/update` updates mission.
- `/missions` lists missions.
- `/workload` summarizes owner load.
- `/skp checklist` returns safe operational checklist.
- `/repo status` or `/github status` returns read-only project intelligence.
- No autonomous agents exist.
- No hidden execution exists.
- No self-modifying behavior exists.
- No background autonomous loops exist.
- No SKP execution occurs.
- No GitHub writes occur.
- No provider-triggered side effects occur.
- No Telegram-triggered external side effects occur beyond BERTHIER replies.
- Approval discipline remains intact.

Final Alpha standard:

> Commander can use BERTHIER from Telegram every day for briefing, mission creation, mission updates, workload summaries, SKP planning assistance, and read-only operational intelligence without autonomous execution.
