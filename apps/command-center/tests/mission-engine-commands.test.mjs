import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-mission-engine-command-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

const engine = await import('../lib/mission-engine.ts');
const db = await import('../lib/db.ts');

test('BERTHIER create mission command creates mission, command, and timeline event', () => {
  const result = engine.processBerthierCommand('Create mission: Build command parser');

  assert.equal(result.outcome, 'create_mission');
  assert.match(result.response, /Sire/);
  assert.equal(result.mission?.title, 'Build command parser');
  assert.equal(result.command.status, 'converted_to_mission');
  assert.equal(result.command.linked_mission_id, result.mission?.id);

  const events = db.listMissionEvents(result.mission.id);
  assert.equal(events.at(-1).event_type, 'mission_created');
  assert.equal(events.at(-1).command_id, result.command.id);
});

test('BERTHIER update command marks a mission blocked only when a reason is supplied', () => {
  const created = engine.processBerthierCommand('Create mission: Validate blocked transition');

  const missingReason = engine.processBerthierCommand(`Mark mission ${created.mission.id} blocked`);
  assert.equal(missingReason.outcome, 'refuse_unsafe');
  assert.match(missingReason.response, /reason/i);

  const blocked = engine.processBerthierCommand(`Mark mission ${created.mission.id} blocked: Waiting for approval model`);
  assert.equal(blocked.outcome, 'update_mission');
  assert.equal(blocked.mission?.status, 'blocked');
  assert.equal(blocked.mission?.blocked_reason, 'Waiting for approval model');
  assert.match(blocked.response, /Sire/);

  const events = db.listMissionEvents(created.mission.id);
  assert.equal(events.at(-1).event_type, 'status_changed');
});

test('BERTHIER approval-gates risky external commands instead of executing them', () => {
  const result = engine.processBerthierCommand('Deploy production now');

  assert.equal(result.outcome, 'request_approval');
  assert.equal(result.command.status, 'awaiting_approval');
  assert.equal(result.approval?.status, 'requested');
  assert.equal(result.approval?.risk_level, 'high');
  assert.equal(result.mission?.requires_approval, true);
  assert.match(result.response, /approval/i);
  assert.match(result.response, /Sire/);
});

test('BERTHIER status commands summarize blocked missions and pending approvals', () => {
  const blockedMission = engine.processBerthierCommand('Create mission: Resolve blocker summary');
  engine.processBerthierCommand(`Mark mission ${blockedMission.mission.id} blocked: Awaiting Sire decision`);
  engine.processBerthierCommand('Post publicly to social media');

  const blocked = engine.processBerthierCommand('What is blocked?');
  assert.equal(blocked.outcome, 'answer_directly');
  assert.match(blocked.response, /Resolve blocker summary/);

  const pending = engine.processBerthierCommand('What is pending?');
  assert.equal(pending.outcome, 'answer_directly');
  assert.match(pending.response, /pending approval/i);
});
