import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-artifact-persistence-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

rmSync('reports/artifacts', { recursive: true, force: true });

const telegramCommands = await import('../lib/telegram-commands.ts');
const db = await import('../lib/db.ts');

test('agent workbench creates artifact file', () => {
  const response = telegramCommands.handleTelegramCommand('Berthier, minta Lannes review backend VOC');
  const mission = response.workbench?.mission;
  assert.ok(mission, 'workbench mission should exist');

  const storedMission = db.getMission(mission.id);
  assert.ok(storedMission?.artifact_path, 'mission should persist artifact_path');
  assert.ok(existsSync(storedMission.artifact_path), 'artifact file should exist');
});

test('artifact file contains metadata and generated content', () => {
  const response = telegramCommands.handleTelegramCommand('Berthier, buatkan draft marketing untuk Tipper');
  const mission = response.workbench?.mission;
  assert.ok(mission, 'workbench mission should exist');
  const storedMission = db.getMission(mission.id);
  assert.ok(storedMission?.artifact_path, 'artifact path should be persisted');

  const artifact = readFileSync(storedMission.artifact_path, 'utf8');
  assert.match(artifact, new RegExp(`Mission ID: ${storedMission.id}`));
  assert.match(artifact, /Created:/);
  assert.match(artifact, /Agent: MURAT/);
  assert.match(artifact, /Capability: marketing/);
  assert.match(artifact, /Provider Strategy: worker_pool/);
  assert.match(artifact, /Title:/);
  assert.match(artifact, /# Marketing Draft/);
});

test('status mission query returns mission metadata and artifact path', () => {
  const created = telegramCommands.handleTelegramCommand('Berthier, riset integrasi SKP bridge');
  const id = created.workbench?.mission.id.slice(0, 8);
  assert.ok(id, 'mission short id should exist');

  const response = telegramCommands.handleTelegramCommand(`status mission ${id}`);
  assert.match(response.text, new RegExp(`Mission: ${id}`));
  assert.match(response.text, /Status: queued/);
  assert.match(response.text, /Agent: caulaincourt/);
  assert.match(response.text, /Capability: research/);
  assert.match(response.text, /Artifact: reports\/artifacts\//);
});

test('open mission query returns artifact summary', () => {
  const created = telegramCommands.handleTelegramCommand('Berthier, minta Lannes review backend VOC artifact summary');
  const id = created.workbench?.mission.id.slice(0, 8);
  assert.ok(id, 'mission short id should exist');

  const response = telegramCommands.handleTelegramCommand(`buka mission ${id}`);
  assert.match(response.text, new RegExp(`Mission: ${id}`));
  assert.match(response.text, /Artifact Summary:/);
  assert.match(response.text, /Mission ID:/);
  assert.match(response.text, /Capability: coding/);
  assert.match(response.text, /# Code Diff Proposal/);
});

test('missing mission handling works for status and open queries', () => {
  const status = telegramCommands.handleTelegramCommand('status mission deadbeef');
  assert.match(status.text, /Mission not found/);

  const open = telegramCommands.handleTelegramCommand('open mission deadbeef');
  assert.match(open.text, /Mission not found/);
});
