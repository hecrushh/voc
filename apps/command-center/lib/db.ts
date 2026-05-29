import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { Mission, MissionInput, MissionPriority, MissionStatus } from "@/lib/types";

const DB_PATH = process.env.VOC_DB_PATH ?? "/opt/voc/data/voc.db";

let db: DatabaseSync | undefined;

const allowedStatuses: MissionStatus[] = ["queued", "active", "blocked", "completed", "cancelled"];
const allowedPriorities: MissionPriority[] = ["low", "normal", "high", "critical"];

function getDb() {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(`
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
  }

  return db;
}

function rowToMission(row: Record<string, unknown>): Mission {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as MissionStatus,
    priority: row.priority as MissionPriority,
    owner_agent: String(row.owner_agent),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export function validateMissionInput(input: Partial<MissionInput>): MissionInput {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const status = input.status ?? "queued";
  const priority = input.priority ?? "normal";
  const ownerAgent = String(input.owner_agent ?? "berthier").trim();

  if (!title) {
    throw new Error("Mission title is required.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Mission status is invalid.");
  }

  if (!allowedPriorities.includes(priority)) {
    throw new Error("Mission priority is invalid.");
  }

  if (!ownerAgent) {
    throw new Error("Mission owner_agent is required.");
  }

  return {
    title,
    description,
    status,
    priority,
    owner_agent: ownerAgent
  };
}

export function listMissions(): Mission[] {
  const rows = getDb()
    .prepare("SELECT * FROM missions ORDER BY updated_at DESC, created_at DESC")
    .all() as Record<string, unknown>[];

  return rows.map(rowToMission);
}

export function createMission(input: MissionInput): Mission {
  const mission = validateMissionInput(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  getDb()
    .prepare(`
      INSERT INTO missions (id, title, description, status, priority, owner_agent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, mission.title, mission.description, mission.status, mission.priority, mission.owner_agent, now, now);

  logMissionEvent(id, "created", `Mission created: ${mission.title}`, now);

  return getMission(id) as Mission;
}

export function getMission(id: string): Mission | null {
  const row = getDb().prepare("SELECT * FROM missions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToMission(row) : null;
}

export function updateMission(id: string, input: Partial<MissionInput>): Mission | null {
  const current = getMission(id);

  if (!current) {
    return null;
  }

  const next = validateMissionInput({
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    status: input.status ?? current.status,
    priority: input.priority ?? current.priority,
    owner_agent: input.owner_agent ?? current.owner_agent
  });
  const now = new Date().toISOString();

  getDb()
    .prepare(`
      UPDATE missions
      SET title = ?, description = ?, status = ?, priority = ?, owner_agent = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(next.title, next.description, next.status, next.priority, next.owner_agent, now, id);

  logMissionEvent(id, "updated", `Mission updated: ${next.title}`, now);

  return getMission(id);
}

export function deleteMission(id: string): boolean {
  const result = getDb().prepare("DELETE FROM missions WHERE id = ?").run(id);
  return result.changes > 0;
}

function logMissionEvent(missionId: string, eventType: string, summary: string, createdAt: string) {
  getDb()
    .prepare(`
      INSERT INTO mission_events (id, mission_id, event_type, summary, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(randomUUID(), missionId, eventType, summary, createdAt);
}
