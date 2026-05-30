import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-mission-engine-db-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

const db = await import('../lib/db.ts');

test('createCommand stores a received BERTHIER UI command with audit fields', () => {
  const command = db.createCommand({
    source: 'berthier_ui',
    raw_text: 'Create mission: Stabilize Mission Engine',
    parsed_intent: 'create_mission',
    commander_id: 'voc',
    status: 'received',
    risk_level: 'low'
  });

  assert.equal(command.source, 'berthier_ui');
  assert.equal(command.raw_text, 'Create mission: Stabilize Mission Engine');
  assert.equal(command.parsed_intent, 'create_mission');
  assert.equal(command.commander_id, 'voc');
  assert.equal(command.status, 'received');
  assert.equal(command.risk_level, 'low');
  assert.ok(command.created_at);
  assert.equal(command.resolved_at, null);
});

test('createApproval stores a requested approval linked to command and mission context', () => {
  const command = db.createCommand({
    source: 'berthier_ui',
    raw_text: 'Deploy production now',
    parsed_intent: 'request_approval',
    commander_id: 'voc',
    status: 'awaiting_approval',
    risk_level: 'high'
  });
  const mission = db.createMission({
    title: 'Review production deployment request',
    description: 'Approval-gated deployment request.',
    status: 'queued',
    priority: 'high',
    owner_agent: 'davout',
    source_command_id: command.id,
    requires_approval: true
  });

  const approval = db.createApproval({
    action_type: 'production_deployment',
    requested_by_agent: 'berthier',
    mission_id: mission.id,
    command_id: command.id,
    summary: 'Approve production deployment request.',
    risk_level: 'high',
    status: 'requested'
  });

  assert.equal(approval.status, 'requested');
  assert.equal(approval.risk_level, 'high');
  assert.equal(approval.command_id, command.id);
  assert.equal(approval.mission_id, mission.id);
  assert.equal(approval.approved_by, null);
  assert.equal(approval.resolved_at, null);
});

test('mission creation writes expanded timeline events linked to the source command', () => {
  const command = db.createCommand({
    source: 'berthier_ui',
    raw_text: 'Create mission: Build command parser',
    parsed_intent: 'create_mission',
    commander_id: 'voc',
    status: 'converted_to_mission',
    risk_level: 'low'
  });

  const mission = db.createMission({
    title: 'Build command parser',
    description: '',
    status: 'queued',
    priority: 'normal',
    owner_agent: 'lannes',
    source_command_id: command.id,
    requires_approval: false
  });
  const events = db.listMissionEvents(mission.id);

  assert.equal(events.length, 1);
  assert.equal(events[0].event_type, 'mission_created');
  assert.equal(events[0].mission_id, mission.id);
  assert.equal(events[0].command_id, command.id);
  assert.equal(events[0].agent_id, 'lannes');
  assert.deepEqual(JSON.parse(events[0].metadata_json), { status: 'queued', priority: 'normal' });
});

test('status updates use explicit transition events and reject blocked without reason', () => {
  const mission = db.createMission({
    title: 'Validate timeline updates',
    description: '',
    status: 'queued',
    priority: 'normal',
    owner_agent: 'berthier'
  });

  assert.throws(
    () => db.updateMission(mission.id, { status: 'blocked' }),
    /Blocked missions require a reason/i
  );

  const updated = db.updateMission(mission.id, { status: 'active' });
  const events = db.listMissionEvents(mission.id);

  assert.equal(updated.status, 'active');
  assert.equal(events.at(-1).event_type, 'status_changed');
  assert.match(events.at(-1).summary, /queued → active/);
});
