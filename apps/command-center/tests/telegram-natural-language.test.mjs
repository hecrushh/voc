import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-natural-language-telegram-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');
process.env.TELEGRAM_ALLOWED_USER_IDS = '1001';

const router = await import('../lib/telegram-intent-router.ts');
const telegramCommands = await import('../lib/telegram-commands.ts');
const db = await import('../lib/db.ts');

test('classifies deterministic Indonesian Telegram intents', () => {
  assert.equal(router.classifyTelegramIntent('apa status VOC?').intent, 'status_query');
  assert.equal(router.classifyTelegramIntent('apa yang harus saya kerjakan hari ini?').intent, 'briefing_request');
  assert.equal(router.classifyTelegramIntent('Berthier, ada mission apa?').intent, 'mission_list');
  assert.equal(router.classifyTelegramIntent('gimana status SKP?').intent, 'skp_planning');
  assert.equal(router.classifyTelegramIntent('cek repo VOC').intent, 'repo_status');
});

test('creates mission from Indonesian natural language', () => {
  const response = telegramCommands.handleTelegramCommand('buat mission baru untuk cek SKP besok');
  assert.match(response.text, /Mission created, Sire/);
  assert.match(response.text, /cek SKP besok/);
  assert.equal(response.result?.command.source, 'telegram');
  assert.ok(db.listMissions().some((mission) => mission.title === 'cek SKP besok'));
});

test('answers natural language status query without slash command', () => {
  const response = telegramCommands.handleTelegramCommand('VOC, status sekarang gimana?');
  assert.match(response.text, /Current VOC state, Sire/);
});

test('updates mission status from Indonesian natural language', () => {
  const created = telegramCommands.handleTelegramCommand('Buat mission: validasi natural update');
  const id = created.result?.mission?.id.slice(0, 8);
  assert.ok(id);

  const updated = telegramCommands.handleTelegramCommand(`tandai mission ${id} selesai`);
  assert.match(updated.text, /Mission updated, Sire/);
  assert.match(updated.text, /Status: completed/);
});

test('routes SKP planning from natural language without execution', () => {
  const response = telegramCommands.handleTelegramCommand('SKP perlu saya apakan sekarang?');
  assert.match(response.text, /SKP next step, Sire/);
  assert.doesNotMatch(response.text, /Playwright started|executed/i);
});

test('uses safe fallback for unknown natural language', () => {
  const response = telegramCommands.handleTelegramCommand('hmm nanti mungkin begitu saja');
  assert.match(response.text, /belum menangkap maksudnya|did not catch/i);
  assert.match(response.text, /Sire/);
});

test('refuses or approval-gates natural language execution requests', () => {
  const response = telegramCommands.handleTelegramCommand('jalankan Playwright untuk login SKP dan posting sekarang');
  assert.match(response.text, /Approval required, Sire/);
  assert.match(response.text, /tidak akan mengeksekusi|will not execute/i);
});

test('slash commands still work after natural language router', () => {
  const status = telegramCommands.handleTelegramCommand('/status');
  assert.match(status.text, /Current VOC state|VOC status|Sire/);

  const missions = telegramCommands.handleTelegramCommand('/missions');
  assert.match(missions.text, /Missions, Sire|No missions recorded, Sire/);
});
