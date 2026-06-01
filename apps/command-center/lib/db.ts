import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  Approval,
  ApprovalInput,
  ApprovalRiskLevel,
  ApprovalStatus,
  CommandRecord,
  CommandInput,
  CommandRiskLevel,
  CommandSource,
  CommandStatus,
  Mission,
  MissionEvent,
  MissionEventInput,
  MissionInput,
  MissionPriority,
  MissionStatus
} from "@/lib/types";

const DB_PATH = process.env.VOC_DB_PATH ?? "/opt/voc/data/voc.db";

let db: DatabaseSync | undefined;

const allowedStatuses: MissionStatus[] = ["queued", "active", "blocked", "pending_approval", "approved", "rejected", "executed", "completed", "cancelled"];
const missionStatusSql = allowedStatuses.map((status) => `'${status}'`).join(", ");
const allowedPriorities: MissionPriority[] = ["low", "normal", "high", "critical"];
const allowedCommandSources: CommandSource[] = ["berthier_ui", "telegram", "system", "future_api"];
const allowedCommandStatuses: CommandStatus[] = ["received", "parsed", "rejected", "converted_to_mission", "awaiting_approval", "completed"];
const allowedRiskLevels: CommandRiskLevel[] = ["low", "medium", "high", "critical"];
const allowedApprovalStatuses: ApprovalStatus[] = ["requested", "approved", "rejected", "modified", "expired"];
const allowedApprovalRiskLevels: ApprovalRiskLevel[] = ["low", "medium", "high", "critical"];

function getDb() {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(`
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
        resolved_at TEXT,
        FOREIGN KEY (linked_mission_id) REFERENCES missions(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK (status IN ('queued', 'active', 'blocked', 'pending_approval', 'approved', 'rejected', 'executed', 'completed', 'cancelled')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        owner_agent TEXT NOT NULL,
        source_command_id TEXT,
        requires_approval INTEGER NOT NULL DEFAULT 0,
        approval_id TEXT,
        due_at TEXT,
        blocked_reason TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (source_command_id) REFERENCES commands(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        requested_by_agent TEXT NOT NULL,
        mission_id TEXT,
        command_id TEXT,
        summary TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'rejected', 'modified', 'expired')),
        approved_by TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        resolution_note TEXT,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL,
        FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS mission_events (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        command_id TEXT,
        agent_id TEXT,
        event_type TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
        FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE SET NULL
      );
    `);
    ensureColumn("missions", "source_command_id", "TEXT");
    ensureColumn("missions", "requires_approval", "INTEGER NOT NULL DEFAULT 0");
    ensureColumn("missions", "approval_id", "TEXT");
    ensureColumn("missions", "due_at", "TEXT");
    ensureColumn("missions", "blocked_reason", "TEXT");
    ensureColumn("missions", "completed_at", "TEXT");
    ensureColumn("missions", "artifact_path", "TEXT");
    migrateMissionStatusConstraint();
    ensureColumn("commands", "linked_mission_id", "TEXT");
    ensureColumn("mission_events", "command_id", "TEXT");
    ensureColumn("mission_events", "agent_id", "TEXT");
    ensureColumn("mission_events", "metadata_json", "TEXT NOT NULL DEFAULT '{}'");


  }

  return db;
}

function ensureColumn(table: string, column: string, definition: string) {
  const database = db as DatabaseSync;
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!rows.some((row) => row.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

function migrateMissionStatusConstraint() {
  const database = db as DatabaseSync;
  const schema = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'missions'")
    .get() as { sql: string } | undefined;

  if (!schema?.sql || schema.sql.includes("'pending_approval'")) {
    return;
  }

  database.exec("PRAGMA foreign_keys = OFF;");
  try {
    database.exec(`
      BEGIN TRANSACTION;

      CREATE TABLE missions_migrated (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK (status IN (${missionStatusSql})),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        owner_agent TEXT NOT NULL,
        source_command_id TEXT,
        requires_approval INTEGER NOT NULL DEFAULT 0,
        approval_id TEXT,
        due_at TEXT,
        blocked_reason TEXT,
        completed_at TEXT,
        artifact_path TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (source_command_id) REFERENCES commands(id) ON DELETE SET NULL
      );

      INSERT INTO missions_migrated (
        id, title, description, status, priority, owner_agent, source_command_id,
        requires_approval, approval_id, due_at, blocked_reason, completed_at, artifact_path,
        created_at, updated_at
      )
      SELECT
        id,
        title,
        COALESCE(description, ''),
        status,
        priority,
        owner_agent,
        source_command_id,
        COALESCE(requires_approval, 0),
        approval_id,
        due_at,
        blocked_reason,
        completed_at,
        artifact_path,
        created_at,
        updated_at
      FROM missions;

      DROP TABLE missions;
      ALTER TABLE missions_migrated RENAME TO missions;

      COMMIT;
    `);
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  } finally {
    database.exec("PRAGMA foreign_keys = ON;");
  }
}

function boolFromSql(value: unknown): boolean {
  return Number(value ?? 0) === 1;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function rowToMission(row: Record<string, unknown>): Mission {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as MissionStatus,
    priority: row.priority as MissionPriority,
    owner_agent: String(row.owner_agent),
    source_command_id: nullableString(row.source_command_id),
    requires_approval: boolFromSql(row.requires_approval),
    approval_id: nullableString(row.approval_id),
    due_at: nullableString(row.due_at),
    blocked_reason: nullableString(row.blocked_reason),
    completed_at: nullableString(row.completed_at),
    artifact_path: nullableString(row.artifact_path),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function rowToCommand(row: Record<string, unknown>): CommandRecord {
  return {
    id: String(row.id),
    source: row.source as CommandSource,
    raw_text: String(row.raw_text),
    parsed_intent: String(row.parsed_intent),
    commander_id: String(row.commander_id),
    status: row.status as CommandStatus,
    risk_level: row.risk_level as CommandRiskLevel,
    linked_mission_id: nullableString(row.linked_mission_id),
    created_at: String(row.created_at),
    resolved_at: nullableString(row.resolved_at)
  };
}

function rowToApproval(row: Record<string, unknown>): Approval {
  return {
    id: String(row.id),
    action_type: String(row.action_type),
    requested_by_agent: String(row.requested_by_agent),
    mission_id: nullableString(row.mission_id),
    command_id: nullableString(row.command_id),
    summary: String(row.summary),
    risk_level: row.risk_level as ApprovalRiskLevel,
    status: row.status as ApprovalStatus,
    approved_by: nullableString(row.approved_by),
    created_at: String(row.created_at),
    resolved_at: nullableString(row.resolved_at),
    resolution_note: nullableString(row.resolution_note)
  };
}

function rowToMissionEvent(row: Record<string, unknown>): MissionEvent {
  return {
    id: String(row.id),
    mission_id: String(row.mission_id),
    command_id: nullableString(row.command_id),
    agent_id: nullableString(row.agent_id),
    event_type: String(row.event_type),
    summary: String(row.summary),
    metadata_json: String(row.metadata_json ?? "{}"),
    created_at: String(row.created_at)
  };
}

export function validateMissionInput(input: Partial<MissionInput>): MissionInput {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const status = input.status ?? "queued";
  const priority = input.priority ?? "normal";
  const ownerAgent = String(input.owner_agent ?? "berthier").trim();
  const blockedReason = nullableString(input.blocked_reason)?.trim() || null;

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

  if (status === "blocked" && !blockedReason) {
    throw new Error("Blocked missions require a reason.");
  }

  return {
    title,
    description,
    status,
    priority,
    owner_agent: ownerAgent,
    source_command_id: input.source_command_id ?? null,
    requires_approval: Boolean(input.requires_approval ?? false),
    approval_id: input.approval_id ?? null,
    due_at: input.due_at ?? null,
    blocked_reason: blockedReason,
    completed_at: input.completed_at ?? null,
    artifact_path: input.artifact_path ?? null
  };
}

export function validateCommandInput(input: Partial<CommandInput>): CommandInput {
  const source = input.source ?? "berthier_ui";
  const rawText = String(input.raw_text ?? "").trim();
  const parsedIntent = String(input.parsed_intent ?? "unknown").trim();
  const commanderId = String(input.commander_id ?? "voc").trim();
  const status = input.status ?? "received";
  const riskLevel = input.risk_level ?? "low";

  if (!allowedCommandSources.includes(source)) {
    throw new Error("Command source is invalid.");
  }
  if (!rawText) {
    throw new Error("Command raw_text is required.");
  }
  if (!parsedIntent) {
    throw new Error("Command parsed_intent is required.");
  }
  if (!commanderId) {
    throw new Error("Command commander_id is required.");
  }
  if (!allowedCommandStatuses.includes(status)) {
    throw new Error("Command status is invalid.");
  }
  if (!allowedRiskLevels.includes(riskLevel)) {
    throw new Error("Command risk_level is invalid.");
  }

  return {
    source,
    raw_text: rawText,
    parsed_intent: parsedIntent,
    commander_id: commanderId,
    status,
    risk_level: riskLevel,
    linked_mission_id: input.linked_mission_id ?? null,
    resolved_at: input.resolved_at ?? null
  };
}

export function validateApprovalInput(input: Partial<ApprovalInput>): ApprovalInput {
  const actionType = String(input.action_type ?? "").trim();
  const requestedByAgent = String(input.requested_by_agent ?? "berthier").trim();
  const summary = String(input.summary ?? "").trim();
  const riskLevel = input.risk_level ?? "medium";
  const status = input.status ?? "requested";

  if (!actionType) {
    throw new Error("Approval action_type is required.");
  }
  if (!requestedByAgent) {
    throw new Error("Approval requested_by_agent is required.");
  }
  if (!summary) {
    throw new Error("Approval summary is required.");
  }
  if (!allowedApprovalRiskLevels.includes(riskLevel)) {
    throw new Error("Approval risk_level is invalid.");
  }
  if (!allowedApprovalStatuses.includes(status)) {
    throw new Error("Approval status is invalid.");
  }

  return {
    action_type: actionType,
    requested_by_agent: requestedByAgent,
    mission_id: input.mission_id ?? null,
    command_id: input.command_id ?? null,
    summary,
    risk_level: riskLevel,
    status,
    approved_by: input.approved_by ?? null,
    resolved_at: input.resolved_at ?? null,
    resolution_note: input.resolution_note ?? null
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
  const completedAt = mission.status === "completed" ? (mission.completed_at ?? now) : (mission.completed_at ?? null);

  getDb()
    .prepare(`
      INSERT INTO missions (
        id, title, description, status, priority, owner_agent, source_command_id,
        requires_approval, approval_id, due_at, blocked_reason, completed_at, artifact_path,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      mission.title,
      mission.description,
      mission.status,
      mission.priority,
      mission.owner_agent,
      mission.source_command_id ?? null,
      mission.requires_approval ? 1 : 0,
      mission.approval_id ?? null,
      mission.due_at ?? null,
      mission.blocked_reason ?? null,
      completedAt,
      mission.artifact_path ?? null,
      now,
      now
    );

  logMissionEvent({
    mission_id: id,
    command_id: mission.source_command_id,
    agent_id: mission.owner_agent,
    event_type: "mission_created",
    summary: `Mission created: ${mission.title}`,
    metadata_json: JSON.stringify({ status: mission.status, priority: mission.priority }),
    created_at: now
  });

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
    owner_agent: input.owner_agent ?? current.owner_agent,
    source_command_id: input.source_command_id ?? current.source_command_id,
    requires_approval: input.requires_approval ?? current.requires_approval,
    approval_id: input.approval_id ?? current.approval_id,
    due_at: input.due_at ?? current.due_at,
    blocked_reason: input.blocked_reason ?? current.blocked_reason,
    completed_at: input.completed_at ?? current.completed_at,
    artifact_path: input.artifact_path ?? current.artifact_path
  });
  const now = new Date().toISOString();
  const completedAt = next.status === "completed" && current.status !== "completed" ? now : (next.completed_at ?? null);

  getDb()
    .prepare(`
      UPDATE missions
      SET title = ?, description = ?, status = ?, priority = ?, owner_agent = ?,
          source_command_id = ?, requires_approval = ?, approval_id = ?, due_at = ?,
          blocked_reason = ?, completed_at = ?, artifact_path = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(
      next.title,
      next.description,
      next.status,
      next.priority,
      next.owner_agent,
      next.source_command_id ?? null,
      next.requires_approval ? 1 : 0,
      next.approval_id ?? null,
      next.due_at ?? null,
      next.blocked_reason ?? null,
      completedAt,
      next.artifact_path ?? null,
      now,
      id
    );

  const eventType = current.status !== next.status ? "status_changed" : current.owner_agent !== next.owner_agent ? "owner_changed" : "mission_updated";
  const summary =
    eventType === "status_changed"
      ? `Mission status changed: ${current.status} → ${next.status}`
      : eventType === "owner_changed"
        ? `Mission owner changed: ${current.owner_agent} → ${next.owner_agent}`
        : `Mission updated: ${next.title}`;

  logMissionEvent({
    mission_id: id,
    command_id: next.source_command_id,
    agent_id: next.owner_agent,
    event_type: eventType,
    summary,
    metadata_json: JSON.stringify({ status: next.status, priority: next.priority, blocked_reason: next.blocked_reason })
  });

  return getMission(id);
}

export function deleteMission(id: string): boolean {
  const result = getDb().prepare("DELETE FROM missions WHERE id = ?").run(id);
  return result.changes > 0;
}

export function createCommand(input: CommandInput): CommandRecord {
  const command = validateCommandInput(input);
  const id = randomUUID();
  const now = new Date().toISOString();

  getDb()
    .prepare(`
      INSERT INTO commands (id, source, raw_text, parsed_intent, commander_id, status, risk_level, linked_mission_id, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      command.source,
      command.raw_text,
      command.parsed_intent,
      command.commander_id,
      command.status,
      command.risk_level,
      command.linked_mission_id ?? null,
      now,
      command.resolved_at ?? null
    );

  return getCommand(id) as CommandRecord;
}

export function getCommand(id: string): CommandRecord | null {
  const row = getDb().prepare("SELECT * FROM commands WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToCommand(row) : null;
}

export function listCommands(limit = 25): CommandRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM commands ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Record<string, unknown>[];
  return rows.map(rowToCommand);
}

export function updateCommand(id: string, input: Partial<CommandInput>): CommandRecord | null {
  const current = getCommand(id);
  if (!current) {
    return null;
  }
  const next = validateCommandInput({
    source: input.source ?? current.source,
    raw_text: input.raw_text ?? current.raw_text,
    parsed_intent: input.parsed_intent ?? current.parsed_intent,
    commander_id: input.commander_id ?? current.commander_id,
    status: input.status ?? current.status,
    risk_level: input.risk_level ?? current.risk_level,
    linked_mission_id: input.linked_mission_id ?? current.linked_mission_id,
    resolved_at: input.resolved_at ?? current.resolved_at
  });
  getDb()
    .prepare(`
      UPDATE commands
      SET source = ?, raw_text = ?, parsed_intent = ?, commander_id = ?, status = ?, risk_level = ?, linked_mission_id = ?, resolved_at = ?
      WHERE id = ?
    `)
    .run(next.source, next.raw_text, next.parsed_intent, next.commander_id, next.status, next.risk_level, next.linked_mission_id ?? null, next.resolved_at ?? null, id);
  return getCommand(id);
}

export function createApproval(input: ApprovalInput): Approval {
  const approval = validateApprovalInput(input);
  const id = randomUUID();
  const now = new Date().toISOString();

  getDb()
    .prepare(`
      INSERT INTO approvals (
        id, action_type, requested_by_agent, mission_id, command_id, summary,
        risk_level, status, approved_by, created_at, resolved_at, resolution_note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      approval.action_type,
      approval.requested_by_agent,
      approval.mission_id ?? null,
      approval.command_id ?? null,
      approval.summary,
      approval.risk_level,
      approval.status,
      approval.approved_by ?? null,
      now,
      approval.resolved_at ?? null,
      approval.resolution_note ?? null
    );

  if (approval.mission_id) {
    logMissionEvent({
      mission_id: approval.mission_id,
      command_id: approval.command_id,
      agent_id: approval.requested_by_agent,
      event_type: "approval_requested",
      summary: approval.summary,
      metadata_json: JSON.stringify({ approval_id: id, risk_level: approval.risk_level, action_type: approval.action_type }),
      created_at: now
    });
  }

  return getApproval(id) as Approval;
}

export function getApproval(id: string): Approval | null {
  const row = getDb().prepare("SELECT * FROM approvals WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToApproval(row) : null;
}

export function listApprovals(status?: ApprovalStatus): Approval[] {
  const rows = status
    ? (getDb().prepare("SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC").all(status) as Record<string, unknown>[])
    : (getDb().prepare("SELECT * FROM approvals ORDER BY created_at DESC").all() as Record<string, unknown>[]);
  return rows.map(rowToApproval);
}

export function updateApproval(id: string, input: Partial<ApprovalInput>): Approval | null {
  const current = getApproval(id);
  if (!current) {
    return null;
  }
  const next = validateApprovalInput({
    action_type: input.action_type ?? current.action_type,
    requested_by_agent: input.requested_by_agent ?? current.requested_by_agent,
    mission_id: input.mission_id ?? current.mission_id,
    command_id: input.command_id ?? current.command_id,
    summary: input.summary ?? current.summary,
    risk_level: input.risk_level ?? current.risk_level,
    status: input.status ?? current.status,
    approved_by: input.approved_by ?? current.approved_by,
    resolved_at: input.resolved_at ?? current.resolved_at,
    resolution_note: input.resolution_note ?? current.resolution_note
  });
  const resolvedAt = next.status === "requested" ? next.resolved_at : (next.resolved_at ?? new Date().toISOString());

  getDb()
    .prepare(`
      UPDATE approvals
      SET action_type = ?, requested_by_agent = ?, mission_id = ?, command_id = ?, summary = ?,
          risk_level = ?, status = ?, approved_by = ?, resolved_at = ?, resolution_note = ?
      WHERE id = ?
    `)
    .run(
      next.action_type,
      next.requested_by_agent,
      next.mission_id ?? null,
      next.command_id ?? null,
      next.summary,
      next.risk_level,
      next.status,
      next.approved_by ?? null,
      resolvedAt ?? null,
      next.resolution_note ?? null,
      id
    );

  if (next.mission_id && next.status !== current.status) {
    logMissionEvent({
      mission_id: next.mission_id,
      command_id: next.command_id,
      agent_id: next.requested_by_agent,
      event_type: "approval_resolved",
      summary: `Approval ${next.status}: ${next.summary}`,
      metadata_json: JSON.stringify({ approval_id: id, status: next.status, resolution_note: next.resolution_note })
    });
  }

  return getApproval(id);
}

export function listMissionEvents(missionId: string): MissionEvent[] {
  const rows = getDb()
    .prepare("SELECT * FROM mission_events WHERE mission_id = ? ORDER BY created_at ASC")
    .all(missionId) as Record<string, unknown>[];
  return rows.map(rowToMissionEvent);
}

export function logMissionEvent(input: MissionEventInput): MissionEvent {
  const id = randomUUID();
  const createdAt = input.created_at ?? new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO mission_events (id, mission_id, command_id, agent_id, event_type, summary, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      input.mission_id,
      input.command_id ?? null,
      input.agent_id ?? null,
      input.event_type,
      input.summary,
      input.metadata_json ?? "{}",
      createdAt
    );
  return rowToMissionEvent({
    id,
    mission_id: input.mission_id,
    command_id: input.command_id ?? null,
    agent_id: input.agent_id ?? null,
    event_type: input.event_type,
    summary: input.summary,
    metadata_json: input.metadata_json ?? "{}",
    created_at: createdAt
  });
}
