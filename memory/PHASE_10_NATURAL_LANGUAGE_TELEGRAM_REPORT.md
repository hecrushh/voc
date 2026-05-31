# Phase 10 Natural Language Telegram Report

## Files Changed

- `/opt/voc/apps/command-center/lib/telegram-intent-router.ts`
- `/opt/voc/apps/command-center/lib/telegram-commands.ts`
- `/opt/voc/apps/command-center/tests/telegram-natural-language.test.mjs`

Unrelated pre-existing working tree note:

- `/opt/voc/docker-compose.yml` remains modified but was not touched, staged, committed, or pushed by this task.

## Intent Router Design

Added a deterministic-first Telegram natural language intent router.

Supported intents:

- `status_query`
- `briefing_request`
- `workload_query`
- `mission_list`
- `mission_create`
- `mission_update`
- `skp_planning`
- `repo_status`
- `general_berthier_chat`
- `unknown_safe_fallback`
- `approval_required`

Routing behavior:

1. Slash commands continue through the existing slash command path.
2. Non-slash Telegram messages enter the natural language router.
3. Deterministic keyword/rule matching runs first.
4. Natural language mission creation is normalized to existing `Create mission: ...` Mission Engine input.
5. Natural language mission updates are normalized to existing `Mark mission <id> <status>` Mission Engine input.
6. Mission references still resolve through the existing short-ID/full-ID helper.
7. Status, briefing, workload, SKP planning, and repo status route to existing safe handlers.
8. Unknown messages receive a concise safe fallback with examples.

Indonesian examples validated:

- `apa status VOC?`
- `apa yang harus saya kerjakan hari ini?`
- `Berthier, ada mission apa?`
- `buat mission baru untuk cek SKP besok`
- `tandai mission <id> selesai`
- `gimana status SKP?`
- `cek repo VOC`

## Provider/model routing behavior

Model-assisted classification is implemented as the second-stage fallback path via the existing safe model router.

Behavior:

- Deterministic classifier is preferred for all supported production examples.
- Low-confidence/unknown messages call `routeSafeModelTask` with category `classification` and preferred provider `qwen3`.
- Current Alpha model router remains side-effect free and deterministic-fallback capable.
- Provider output is not allowed to trigger execution directly.
- General BERTHIER chat uses the safe model routing wrapper with deterministic fallback text.
- Telegram responses do not expose provider names to the commander.

Allowed model output categories remain:

- classification
- summary
- draft
- recommendation/reasoning

## Safety rules preserved

Preserved hard constraints:

- No autonomous execution.
- No hidden execution.
- No browser automation.
- No SKP execution.
- No GitHub writes from Telegram.
- No external side effects.
- No provider output can directly execute an action.
- No queues.
- No workers.
- No background loops.
- Slash command behavior remains intact.

Risky natural language requests are approval-gated with a refusal-style response. Example covered by tests:

```text
jalankan Playwright untuk login SKP dan posting sekarang
```

## Tests executed

Commands executed from `/opt/voc/apps/command-center`:

```bash
node --test tests/*.test.mjs
npm run typecheck
npm run build
```

Test summary:

```text
# tests 34
# suites 0
# pass 34
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

## Build result

Build command:

```bash
npm run build
```

Build output summary:

```text
✓ Compiled successfully
✓ Generating static pages (10/10)
```

Relevant routes still build:

```text
ƒ /api/telegram
ƒ /api/berthier
ƒ /api/missions
ƒ /berthier
ƒ /missions
```

## Commit hash

```text
3a6d3da
```

Commit message:

```text
feat: add natural language BERTHIER Telegram chat
```

## Push result

Push command:

```bash
git push origin master
```

Push result:

```text
To github.com:hecrushh/voc.git
   68c442a..3a6d3da  master -> master
```

## Known limitations

- The model-assisted classifier path currently uses the existing Alpha-safe router, which returns deterministic fallback text rather than making direct provider calls.
- Natural language parsing is rule-based for the supported Alpha examples and intentionally conservative.
- Mission update requires a recognizable mission ID or prefix in the message.
- Blocked mission updates without an explicit reason are still rejected by Mission Engine safety rules.
- Live Telegram provider behavior was not exercised directly in this task; validation is through handler tests, typecheck, and production build.
- `/opt/voc/docker-compose.yml` has unrelated uncommitted modifications that were intentionally left untouched.

## Next recommended work

- Exercise the natural language flow through live Telegram with the commander allowlist enabled.
- Add a small live smoke checklist for Telegram phrases after deployment reload.
- Expand Indonesian synonyms only after observing real commander phrasing.
- Add optional confidence logging without exposing provider internals in Telegram replies.
- Keep provider-backed chat read-only unless separately approved with explicit safety boundaries.
