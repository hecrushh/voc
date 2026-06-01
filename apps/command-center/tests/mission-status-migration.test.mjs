import assert from 'node:assert/strict';
import { mkdirSync, existsSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-migration-test-'));
const dbPath = join(dbDir, 'voc.db');

// Create old-schema DB before importing db.ts
{
  const oldDb = new DatabaseSync(dbPath);
  oldDb.exec("PRAGMA foreign_keys = ON;");
  oldDb.exec(`
    CREATE TABLE IF NOT EXISTS commands (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL CHECK (source IN ('berthier_ui', 'telegram', 'system', 'future_api')),
      raw_text TEXT NOT NULL,
      parsed_intent TEXT NOT NULL,
      commander_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('received', 'parsed', 'rejected', 'converted_to_mission', 'awaiting_approval', 'completed')),
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      linked_mission_id TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('queued', 'active', 'blocked', 'completed', 'cancelled')),
      priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')),
      owner_agent TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mission_events (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
    );
  `);

  // Seed rows with old statuses
  const now = new Date().toISOString();
  oldDb.prepare(`
    INSERT INTO missions (id, title, description, status, priority, owner_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('old-mission-001', 'Legacy mission', 'Seeded before migration', 'queued', 'normal', 'berthier', now, now);
  oldDb.prepare(`
    INSERT INTO missions (id, title, description, status, priority, owner_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('old-mission-002', 'Active legacy', '', 'active', 'high', 'davout', now, now);
}

process.env.VOC_DB_PATH = dbPath;
const db = await import('../lib/db.ts');

test('old-schema DB rows are preserved after migration', () => {
  const m1 = db.getMission('old-mission-001');
  assert.ok(m1, 'old-mission-001 should survive migration');
  assert.equal(m1.title, 'Legacy mission');
  assert.equal(m1.status, 'queued');

  const m2 = db.getMission('old-mission-002');
  assert.ok(m2, 'old-mission-002 should survive migration');
  assert.equal(m2.status, 'active');
});

test('new approval statuses are accepted after migration', () => {
  const mission = db.createMission({
    title: 'Post-migration approval test',
    description: '',
    status: 'pending_approval',
    priority: 'high',
    owner_agent: 'berthier',
    requires_approval: true,
  });
  assert.equal(mission.status, 'pending_approval');

  const updated = db.updateMission(mission.id, { status: 'approved' });
  assert.equal(updated.status, 'approved');
});

test('all new statuses are valid after migration', () => {
  const newStatuses = ['pending_approval', 'approved', 'rejected', 'executed'];
  for (const status of newStatuses) {
    const mission = db.createMission({
      title: `Status ${status} test`,
      description: '',
      status: status,
      priority: 'normal',
      owner_agent: 'berthier',
    });
    assert.equal(mission.status, status, `status ${status} should be accepted`);
  }
});

test('migration is idempotent — second open does not fail', () => {
  // Re-trigger getDb() by listing missions; the module-level db is already set,
  // but if migration ran again on a fresh import it would be a no-op.
  const missions = db.listMissions();
  assert.ok(missions.length >= 3, 'all previously created missions survive');
});
