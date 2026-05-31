import {
  createApproval,
  createCommand,
  createMission,
  listApprovals,
  listMissions,
  updateCommand,
  updateMission
} from "./db.ts";
import type { Approval, CommandRecord, CommandRiskLevel, Mission, MissionPriority, MissionStatus } from "./types.ts";

export type BerthierOutcome =
  | "answer_directly"
  | "create_mission"
  | "update_mission"
  | "request_approval"
  | "refuse_unsafe"
  | "mark_as_future_capability";

export type BerthierCommandResult = {
  outcome: BerthierOutcome;
  response: string;
  command: CommandRecord;
  mission: Mission | null;
  approval: Approval | null;
  parsed: ParsedBerthierCommand;
};

type ParsedBerthierCommand =
  | { intent: "create_mission"; title: string; priority: MissionPriority; owner_agent: string }
  | { intent: "update_status"; mission_id: string; status: MissionStatus; blocked_reason?: string }
  | { intent: "assign_mission"; mission_id: string; owner_agent: string }
  | { intent: "summarize_status" }
  | { intent: "list_blocked" }
  | { intent: "list_pending_approvals" }
  | { intent: "request_approval"; action_type: string; summary: string; risk_level: CommandRiskLevel }
  | { intent: "future_capability"; summary: string }
  | { intent: "unknown"; summary: string };

const riskyActionPatterns = [
  { pattern: /\bdeploy\b|\bproduction\b/i, action_type: "production_deployment", risk_level: "high" as CommandRiskLevel },
  { pattern: /\bpost\b|\bsocial media\b|\bpublish\b/i, action_type: "external_publication", risk_level: "high" as CommandRiskLevel },
  { pattern: /\bdelete\b|\bdestroy\b|\bremove data\b/i, action_type: "data_deletion", risk_level: "critical" as CommandRiskLevel },
  { pattern: /\bsecret\b|\bapi key\b|\bcredential\b/i, action_type: "secret_management", risk_level: "critical" as CommandRiskLevel },
  { pattern: /\bskp\b|\btipper\b|\bplaywright\b|\bautomation\b/i, action_type: "external_automation", risk_level: "high" as CommandRiskLevel }
];

export function parseBerthierCommand(rawText: string): ParsedBerthierCommand {
  const text = rawText.trim();

  const createMatch = text.match(/^create mission:\s*(.+)$/i) ?? text.match(/^add mission:\s*(.+)$/i);
  if (createMatch) {
    return {
      intent: "create_mission",
      title: createMatch[1].trim(),
      priority: "normal",
      owner_agent: "berthier"
    };
  }

  const blockedMatch = text.match(/^mark mission\s+([a-f0-9-]+)\s+blocked(?::\s*(.+))?$/i);
  if (blockedMatch) {
    return {
      intent: "update_status",
      mission_id: blockedMatch[1],
      status: "blocked",
      blocked_reason: blockedMatch[2]?.trim()
    };
  }

  const completeMatch = text.match(/^mark mission\s+([a-f0-9-]+)\s+(?:complete|completed|done)$/i);
  if (completeMatch) {
    return {
      intent: "update_status",
      mission_id: completeMatch[1],
      status: "completed"
    };
  }

  const activeMatch = text.match(/^mark mission\s+([a-f0-9-]+)\s+active$/i);
  if (activeMatch) {
    return {
      intent: "update_status",
      mission_id: activeMatch[1],
      status: "active"
    };
  }

  const assignMatch = text.match(/^assign mission\s+([a-f0-9-]+)\s+to\s+([a-z_ -]+)$/i);
  if (assignMatch) {
    return {
      intent: "assign_mission",
      mission_id: assignMatch[1],
      owner_agent: normalizeAgentId(assignMatch[2])
    };
  }

  if (/^(summarize voc state|summarize status|status summary)$/i.test(text)) {
    return { intent: "summarize_status" };
  }

  if (/^(what is blocked\??|list blocked missions)$/i.test(text)) {
    return { intent: "list_blocked" };
  }

  if (/^(what is pending\??|list pending approvals|what needs approval\??)$/i.test(text)) {
    return { intent: "list_pending_approvals" };
  }

  if (/\bremember\b|\bmemory\b/i.test(text)) {
    return { intent: "future_capability", summary: "Writable memory is reserved for Phase 2D and is not active in this command path." };
  }

  const risky = riskyActionPatterns.find((entry) => entry.pattern.test(text));
  if (risky) {
    return { intent: "request_approval", action_type: risky.action_type, risk_level: risky.risk_level, summary: text };
  }

  return { intent: "unknown", summary: text };
}

export function processBerthierCommand(
  rawText: string,
  options: { source?: "berthier_ui" | "telegram" | "system" | "future_api"; commanderId?: string } = {}
): BerthierCommandResult {
  const parsed = parseBerthierCommand(rawText);
  const initialRisk = parsed.intent === "request_approval" ? parsed.risk_level : "low";
  let command = createCommand({
    source: options.source ?? "berthier_ui",
    raw_text: rawText,
    parsed_intent: parsed.intent,
    commander_id: options.commanderId ?? "voc",
    status: "received",
    risk_level: initialRisk
  });

  if (parsed.intent === "create_mission") {
    const mission = createMission({
      title: parsed.title,
      description: "Created by BERTHIER command intake.",
      status: "queued",
      priority: parsed.priority,
      owner_agent: parsed.owner_agent,
      source_command_id: command.id,
      requires_approval: false
    });
    command = updateCommand(command.id, { status: "converted_to_mission", linked_mission_id: mission.id, resolved_at: new Date().toISOString() }) as CommandRecord;
    return {
      outcome: "create_mission",
      response: `Mission created, Sire: ${mission.title}`,
      command,
      mission,
      approval: null,
      parsed
    };
  }

  if (parsed.intent === "update_status") {
    if (parsed.status === "blocked" && !parsed.blocked_reason) {
      command = updateCommand(command.id, { status: "rejected", resolved_at: new Date().toISOString() }) as CommandRecord;
      return {
        outcome: "refuse_unsafe",
        response: "I cannot mark a mission blocked without a reason, Sire.",
        command,
        mission: null,
        approval: null,
        parsed
      };
    }

    const mission = updateMission(parsed.mission_id, {
      status: parsed.status,
      blocked_reason: parsed.blocked_reason,
      source_command_id: command.id
    });
    command = updateCommand(command.id, {
      status: mission ? "completed" : "rejected",
      linked_mission_id: mission?.id ?? null,
      resolved_at: new Date().toISOString()
    }) as CommandRecord;
    return {
      outcome: mission ? "update_mission" : "refuse_unsafe",
      response: mission ? `Mission updated, Sire: ${mission.title}` : "Mission not found, Sire.",
      command,
      mission,
      approval: null,
      parsed
    };
  }

  if (parsed.intent === "assign_mission") {
    const mission = updateMission(parsed.mission_id, {
      owner_agent: parsed.owner_agent,
      source_command_id: command.id
    });
    command = updateCommand(command.id, {
      status: mission ? "completed" : "rejected",
      linked_mission_id: mission?.id ?? null,
      resolved_at: new Date().toISOString()
    }) as CommandRecord;
    return {
      outcome: mission ? "update_mission" : "refuse_unsafe",
      response: mission ? `Mission assigned to ${parsed.owner_agent}, Sire.` : "Mission not found, Sire.",
      command,
      mission,
      approval: null,
      parsed
    };
  }

  if (parsed.intent === "request_approval") {
    const mission = createMission({
      title: `Approval required: ${parsed.action_type}`,
      description: parsed.summary,
      status: "pending_approval",
      priority: parsed.risk_level === "critical" ? "critical" : "high",
      owner_agent: "berthier",
      source_command_id: command.id,
      requires_approval: true,
      blocked_reason: "Awaiting explicit approval before any external side effect."
    });
    const approval = createApproval({
      action_type: parsed.action_type,
      requested_by_agent: "berthier",
      mission_id: mission.id,
      command_id: command.id,
      summary: parsed.summary,
      risk_level: parsed.risk_level,
      status: "requested"
    });
    const linkedMission = updateMission(mission.id, { approval_id: approval.id, source_command_id: command.id }) as Mission;
    command = updateCommand(command.id, { status: "awaiting_approval", linked_mission_id: mission.id }) as CommandRecord;
    return {
      outcome: "request_approval",
      response: `Approval required, Sire: ${parsed.summary}`,
      command,
      mission: linkedMission,
      approval,
      parsed
    };
  }

  if (parsed.intent === "list_blocked") {
    command = updateCommand(command.id, { status: "completed", resolved_at: new Date().toISOString() }) as CommandRecord;
    return answer(command, parsed, summarizeBlockedMissions());
  }

  if (parsed.intent === "list_pending_approvals") {
    command = updateCommand(command.id, { status: "completed", resolved_at: new Date().toISOString() }) as CommandRecord;
    return answer(command, parsed, summarizePendingApprovals());
  }

  if (parsed.intent === "summarize_status") {
    command = updateCommand(command.id, { status: "completed", resolved_at: new Date().toISOString() }) as CommandRecord;
    return answer(command, parsed, summarizeCurrentState());
  }

  command = updateCommand(command.id, { status: "rejected", resolved_at: new Date().toISOString() }) as CommandRecord;
  return {
    outcome: parsed.intent === "future_capability" ? "mark_as_future_capability" : "refuse_unsafe",
    response:
      parsed.intent === "future_capability"
        ? `${parsed.summary} Sire.`
        : "I cannot execute that command in Mission Engine v0.2, Sire.",
    command,
    mission: null,
    approval: null,
    parsed
  };
}

function answer(command: CommandRecord, parsed: ParsedBerthierCommand, response: string): BerthierCommandResult {
  return {
    outcome: "answer_directly",
    response,
    command,
    mission: null,
    approval: null,
    parsed
  };
}

export function summarizeCurrentState(): string {
  const missions = listMissions();
  const pendingApprovals = listApprovals("requested");
  const blocked = missions.filter((mission) => mission.status === "blocked");
  return `Current VOC state, Sire: ${missions.length} missions, ${blocked.length} blocked, ${pendingApprovals.length} pending approvals.`;
}

function summarizeBlockedMissions(): string {
  const blocked = listMissions().filter((mission) => mission.status === "blocked");
  if (blocked.length === 0) {
    return "No blocked missions, Sire.";
  }
  return `Blocked missions, Sire: ${blocked.map((mission) => `${mission.title}${mission.blocked_reason ? ` (${mission.blocked_reason})` : ""}`).join("; ")}.`;
}

function summarizePendingApprovals(): string {
  const approvals = listApprovals("requested");
  if (approvals.length === 0) {
    return "No pending approvals, Sire.";
  }
  return `Pending approval requests, Sire: ${approvals.map((approval) => `${approval.action_type} - ${approval.summary}`).join("; ")}.`;
}

function normalizeAgentId(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}
