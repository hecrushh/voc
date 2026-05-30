import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-briefing-workload-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

const engine = await import('../lib/mission-engine.ts');
const briefing = await import('../lib/briefing.ts');
const telegramCommands = await import('../lib/telegram-commands.ts');

test('generates deterministic daily briefing from mission state', () => {
  const critical = engine.processBerthierCommand('Create mission: Critical launch blocker');
  engine.processBerthierCommand(`Mark mission ${critical.mission.id} blocked: Waiting for Telegram secret`);
  engine.processBerthierCommand('Deploy production now');

  const text = briefing.generateDailyBriefing();
  assert.match(text, /Daily briefing, Sire/);
  assert.match(text, /Blockers: 2|Blockers: 1/);
  assert.match(text, /Pending approvals: 1/);
  assert.match(text, /Top focus:/);
});

test('Telegram /briefing returns useful briefing output', () => {
  const response = telegramCommands.handleTelegramCommand('/briefing');
  assert.match(response.text, /Daily briefing, Sire/);
  assert.match(response.text, /Missions:/);
  assert.match(response.text, /Top focus:/);
});
