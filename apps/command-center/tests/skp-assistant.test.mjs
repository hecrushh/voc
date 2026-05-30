import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-skp-assistant-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

const skp = await import('../lib/skp-assistant.ts');
const telegramCommands = await import('../lib/telegram-commands.ts');
const db = await import('../lib/db.ts');

test('SKP checklist and next step are planning-only', () => {
  assert.match(skp.handleSkpCommand('/skp checklist'), /SKP checklist, Sire/);
  assert.match(skp.handleSkpCommand('/skp next'), /SKP next step, Sire/);
});

test('SKP mission command creates mission through Mission Engine', () => {
  const response = telegramCommands.handleTelegramCommand('/skp mission Prepare account risk review');
  assert.match(response.text, /SKP mission created, Sire/);
  assert.ok(db.listMissions().some((mission) => mission.title.includes('Prepare account risk review')));
});

test('SKP execution requests are blocked', () => {
  const response = telegramCommands.handleTelegramCommand('/skp run Playwright now');
  assert.match(response.text, /Approval required, Sire/);
  assert.match(response.text, /will not run SKP automation/i);
});
