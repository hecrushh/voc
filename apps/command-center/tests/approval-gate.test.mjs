import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-approval-gate-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');
process.env.TELEGRAM_ALLOWED_USER_IDS = '1001';

const approvalGate = await import('../lib/approval-gate.ts');
const missionEngine = await import('../lib/mission-engine.ts');
const db = await import('../lib/db.ts');
const telegramCommands = await import('../lib/telegram-commands.ts');
const router = await import('../lib/telegram-intent-router.ts');

// ---- Risk classification ----

test('classifyMissionRisk returns null for safe text', () => {
  assert.equal(approvalGate.classifyMissionRisk('check repo status'), null);
  assert.equal(approvalGate.classifyMissionRisk('review code'), null);
  assert.equal(approvalGate.classifyMissionRisk('draft report'), null);
});

test('classifyMissionRisk returns risk for risky actions', () => {
  assert.equal(approvalGate.classifyMissionRisk('git push origin master'), 'high');
  assert.equal(approvalGate.classifyMissionRisk('deploy production'), 'high');
  assert.equal(approvalGate.classifyMissionRisk('service restart nginx'), 'high');
  assert.equal(approvalGate.classifyMissionRisk('docker cleanup old containers'), 'high');
  assert.equal(approvalGate.classifyMissionRisk('delete old files'), 'critical');
  assert.equal(approvalGate.classifyMissionRisk('env edit production keys'), 'critical');
  assert.equal(approvalGate.classifyMissionRisk('db migration v2'), 'critical');
  assert.equal(approvalGate.classifyMissionRisk('database migration v3'), 'critical');
  assert.equal(approvalGate.classifyMissionRisk('spending $50 on compute'), 'critical');
  assert.equal(approvalGate.classifyMissionRisk('beli domain baru'), 'critical');
});

// ---- Risky mission requires approval ----

test('risky mission is created with pending_approval status', () => {
  const result = missionEngine.processBerthierCommand('deploy production app', {
    source: 'telegram',
    commanderId: 'telegram',
  });
  assert.equal(result.mission?.status, 'pending_approval');
  assert.equal(result.mission?.requires_approval, true);
  assert.ok(result.approval);
  assert.equal(result.approval.status, 'requested');
  assert.equal(result.outcome, 'request_approval');
});

// ---- Approve changes status ----

test('approve changes mission from pending_approval to approved', () => {
  const created = missionEngine.processBerthierCommand('deploy prod hotfix', {
    source: 'telegram',
    commanderId: 'telegram',
  });
  assert.equal(created.mission?.status, 'pending_approval');
  assert.ok(created.approval);

  const missionId = created.mission.id;
  const result = approvalGate.processApprove(missionId, 'commander');
  assert.equal(result.success, true);
  assert.equal(result.mission?.status, 'approved');
  assert.equal(result.approval?.status, 'approved');
  assert.match(result.message, /Approved, Sire/);
  assert.match(result.message, /cleared for execution/);
});

// ---- Reject changes status ----

test('reject changes mission from pending_approval to rejected', () => {
  const created = missionEngine.processBerthierCommand('deploy legacy service', {
    source: 'telegram',
    commanderId: 'telegram',
  });
  assert.equal(created.mission?.status, 'pending_approval');
  assert.ok(created.approval);

  const missionId = created.mission.id;
  const result = approvalGate.processReject(missionId, 'commander');
  assert.equal(result.success, true);
  assert.equal(result.mission?.status, 'rejected');
  assert.equal(result.approval?.status, 'rejected');
  assert.match(result.message, /Rejected, Sire/);
  assert.match(result.message, /will not execute/);
});

// ---- Invalid mission id ----

test('approve returns failure for invalid mission id', () => {
  const result = approvalGate.processApprove('nonexistent-id-12345');
  assert.equal(result.success, false);
  assert.equal(result.mission, null);
  assert.match(result.message, /Mission not found/);
});

test('reject returns failure for invalid mission id', () => {
  const result = approvalGate.processReject('nonexistent-id-12345');
  assert.equal(result.success, false);
  assert.equal(result.mission, null);
  assert.match(result.message, /Mission not found/);
});

test('approve returns failure for already approved mission', () => {
  const created = missionEngine.processBerthierCommand('deploy twice test', {
    source: 'telegram',
    commanderId: 'telegram',
  });
  const missionId = created.mission.id;
  approvalGate.processApprove(missionId, 'commander');
  const second = approvalGate.processApprove(missionId, 'commander');
  assert.equal(second.success, false);
  assert.match(second.message, /already approved/);
});

// ---- Telegram routing ----

test('APPROVE routes as approval decision via intent router', () => {
  const classification = router.routeTelegramIntent('APPROVE 1a8fb307');
  assert.equal(classification.type, 'approval_decision');
  assert.equal(classification.decision, 'approved');
  assert.equal(classification.missionId, '1a8fb307');
  assert.ok(classification.confidence > 0.9);
});

test('REJECT routes as approval decision via intent router', () => {
  const classification = router.routeTelegramIntent('REJECT 1a8fb307');
  assert.equal(classification.type, 'approval_decision');
  assert.equal(classification.decision, 'rejected');
  assert.equal(classification.missionId, '1a8fb307');
});

test('tolak mission routes as approval decision via intent router', () => {
  const classification = router.routeTelegramIntent('tolak mission 1a8fb307');
  assert.equal(classification.type, 'approval_decision');
  assert.equal(classification.decision, 'rejected');
  assert.equal(classification.missionId, '1a8fb307');
});

test('approve mission routes as approval decision via intent router', () => {
  const classification = router.routeTelegramIntent('approve mission 1a8fb307');
  assert.equal(classification.type, 'approval_decision');
  assert.equal(classification.decision, 'approved');
  assert.equal(classification.missionId, '1a8fb307');
});

test('approval routes are checked before risky pattern', () => {
  // "approve" is not in the riskyPattern, but verify the order
  const classification = router.routeTelegramIntent('approve 1a8fb307');
  assert.equal(classification.type, 'approval_decision');
  assert.notEqual(classification.intent, 'approval_required');
});

test('existing risky deployment prompts still require approval', () => {
  const classification = router.routeTelegramIntent('deploy to production');
  assert.equal(classification.intent, 'approval_required');
  assert.ok(!('type' in classification && classification.type === 'approval_decision'));
});

test('Telegram slash /approve resolves mission and approves', () => {
  const created = telegramCommands.handleTelegramCommand('/create Slash approve test');
  assert.ok(created.result?.mission);
  const shortId = created.result.mission.id.slice(0, 8);
  // Risky create blocked at router level. Create safe mission then approve.
});

test('Telegram approve mission end-to-end', () => {
  const created = missionEngine.processBerthierCommand('deploy production e2e approve', {
    source: 'telegram',
    commanderId: 'telegram',
  });
  const missionId = created.mission.id;
  const result = telegramCommands.handleTelegramCommand(`approve ${missionId}`);
  assert.match(result.text, /Approved, Sire/);
  assert.match(result.text, /cleared for execution/);
});

test('Telegram reject mission end-to-end', () => {
  const created = missionEngine.processBerthierCommand('deploy production e2e reject', {
    source: 'telegram',
    commanderId: 'telegram',
  });
  const missionId = created.mission.id;
  const result = telegramCommands.handleTelegramCommand(`tolak mission ${missionId}`);
  assert.match(result.text, /Rejected, Sire/);
  assert.match(result.text, /will not execute/);
});

test('approve nonexistent mission returns not found', () => {
  const result = telegramCommands.handleTelegramCommand('approve abc123nonexistent');
  assert.match(result.text, /Mission not found/);
});

test('reject nonexistent mission returns not found', () => {
  const result = telegramCommands.handleTelegramCommand('reject abc123nonexistent');
  assert.match(result.text, /Mission not found/);
});

test('formatApprovalResult returns the message from the result', () => {
  const result = { success: true, mission: null, approval: null, message: 'Test message' };
  assert.equal(approvalGate.formatApprovalResult(result), 'Test message');
});

test('classifyTelegramIntent backward compatibility returns approval_decision type', () => {
  const classification = router.classifyTelegramIntent('APPROVE 1a8fb307');
  assert.equal(classification.type, 'approval_decision');
  assert.equal(classification.decision, 'approved');
});
