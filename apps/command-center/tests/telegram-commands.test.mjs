import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-telegram-commands-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');
process.env.TELEGRAM_ALLOWED_USER_IDS = '1001';

const telegramCommands = await import('../lib/telegram-commands.ts');
const telegram = await import('../lib/telegram.ts');
const db = await import('../lib/db.ts');

test('normalizes Telegram slash commands to BERTHIER commands', () => {
  assert.equal(telegramCommands.normalizeTelegramCommand('/create Test mission'), 'Create mission: Test mission');
  assert.equal(telegramCommands.normalizeTelegramCommand('/status'), 'Summarize status');
  assert.equal(telegramCommands.normalizeTelegramCommand('/update abc123 active'), 'Mark mission abc123 active');
  assert.equal(telegramCommands.normalizeTelegramCommand('/update abc123 blocked Waiting'), 'Mark mission abc123 blocked: Waiting');
});

test('handles Telegram mission creation and records telegram command source', () => {
  const response = telegramCommands.handleTelegramCommand('/create Telegram alpha mission');
  assert.match(response.text, /Mission created, Sire/);
  assert.match(response.text, /Telegram alpha mission/);

  const missions = db.listMissions();
  assert.equal(missions[0].title, 'Telegram alpha mission');

  const commands = db.listCommands(1);
  assert.equal(commands[0].source, 'telegram');
});

test('handles Telegram mission update through Mission Engine', () => {
  const created = telegramCommands.handleTelegramCommand('/create Update from Telegram');
  assert.ok(created.result?.mission?.id);

  const updated = telegramCommands.handleTelegramCommand(`/update ${created.result.mission.id} active`);
  assert.match(updated.text, /Mission updated, Sire/);
  assert.match(updated.text, /Status: active/);
});

test('rejects blocked update without reason', () => {
  const created = telegramCommands.handleTelegramCommand('/create Missing blocked reason');
  const blocked = telegramCommands.handleTelegramCommand(`/update ${created.result?.mission?.id} blocked`);
  assert.match(blocked.text, /reason/i);
});

test('enforces Telegram commander allowlist', async () => {
  const sent = [];
  const unauthorized = await telegram.handleTelegramUpdate({
    message: { text: '/status', chat: { id: 2002 }, from: { id: 2002 } }
  }, async (chatId, text) => { sent.push({ chatId, text }); });

  assert.equal(unauthorized.status, 'unauthorized');
  assert.equal(sent.length, 0);

  const authorized = await telegram.handleTelegramUpdate({
    message: { text: '/status', chat: { id: 1001 }, from: { id: 1001 } }
  }, async (chatId, text) => { sent.push({ chatId, text }); });

  assert.equal(authorized.status, 'handled');
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /Current VOC state|VOC status|Sire/);
});
