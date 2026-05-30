import { listApprovals, listMissions } from "./db.ts";
import { processBerthierCommand } from "./mission-engine.ts";
import type { BerthierCommandResult } from "./mission-engine.ts";
import type { Mission } from "./types.ts";

export type TelegramCommandResponse = {
  text: string;
  result?: BerthierCommandResult;
};

export function normalizeTelegramCommand(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const createMatch = trimmed.match(/^\/create(?:@\w+)?\s+(.+)$/i);
  if (createMatch) return `Create mission: ${createMatch[1].trim()}`;

  const updateMatch = trimmed.match(/^\/update(?:@\w+)?\s+([a-f0-9-]+)\s+(active|completed|complete|done|queued|cancelled)(?:\s+(.+))?$/i);
  if (updateMatch) {
    const status = updateMatch[2].toLowerCase();
    const normalized = status === "complete" || status === "done" ? "completed" : status;
    return `Mark mission ${updateMatch[1]} ${normalized}`;
  }

  const blockedUpdateMatch = trimmed.match(/^\/update(?:@\w+)?\s+([a-f0-9-]+)\s+blocked(?:\s+(.+))?$/i);
  if (blockedUpdateMatch) {
    const reason = blockedUpdateMatch[2]?.trim();
    return reason ? `Mark mission ${blockedUpdateMatch[1]} blocked: ${reason}` : `Mark mission ${blockedUpdateMatch[1]} blocked`;
  }

  const statusMatch = trimmed.match(/^\/status(?:@\w+)?$/i);
  if (statusMatch) return "Summarize status";

  return trimmed;
}

export function handleTelegramCommand(text: string): TelegramCommandResponse {
  const normalized = normalizeTelegramCommand(text);
  if (!normalized) return { text: "Command text is required, Sire." };

  if (/^\/missions(?:@\w+)?$/i.test(normalized)) {
    return { text: formatRecentMissions() };
  }

  const missionDetail = normalized.match(/^\/(?:mission|status)(?:@\w+)?\s+([a-f0-9-]+)$/i);
  if (missionDetail) {
    return { text: formatMissionDetail(missionDetail[1]) };
  }

  const resolvedCommand = resolveMissionReferenceInCommand(normalized);
  if (resolvedCommand === "ambiguous") return { text: "Mission reference is ambiguous, Sire. Use a longer ID prefix." };
  if (resolvedCommand === "missing") return { text: "Mission not found, Sire." };

  const result = processBerthierCommand(resolvedCommand, { source: "telegram", commanderId: "telegram" });
  return { text: formatBerthierResult(result), result };
}

export function resolveMissionReferenceInCommand(command: string): string | "ambiguous" | "missing" {
  const match = command.match(/^(Mark mission|Assign mission)\s+([a-f0-9-]+)(.*)$/i);
  if (!match) return command;
  const resolved = resolveMissionByPrefix(match[2]);
  if (resolved === "ambiguous") return "ambiguous";
  if (!resolved) return "missing";
  return `${match[1]} ${resolved.id}${match[3]}`;
}

export function formatBerthierResult(result: BerthierCommandResult): string {
  if (result.mission && result.outcome === "create_mission") {
    return [
      "Mission created, Sire.",
      "",
      `ID: ${shortMissionId(result.mission.id)}`,
      `Title: ${result.mission.title}`,
      `Status: ${result.mission.status}`,
      `Owner: ${result.mission.owner_agent}`
    ].join("\n");
  }

  if (result.mission && result.outcome === "update_mission") {
    return [
      "Mission updated, Sire.",
      "",
      `${result.mission.title}`,
      `Status: ${result.mission.status}`,
      result.mission.blocked_reason ? `Reason: ${result.mission.blocked_reason}` : null
    ].filter(Boolean).join("\n");
  }

  return result.response;
}

export function formatRecentMissions(limit = 10): string {
  const missions = listMissions().slice(0, limit);
  if (missions.length === 0) return "No missions recorded, Sire.";
  return [
    "Missions, Sire:",
    "",
    ...missions.map((mission) => `${shortMissionId(mission.id)} — ${mission.status} — ${mission.title}`)
  ].join("\n");
}

export function formatMissionDetail(idOrPrefix: string): string {
  const mission = resolveMissionByPrefix(idOrPrefix);
  if (mission === "ambiguous") return "Mission reference is ambiguous, Sire. Use a longer ID prefix.";
  if (!mission) return "Mission not found, Sire.";
  return [
    `${mission.title}`,
    "",
    `ID: ${shortMissionId(mission.id)}`,
    `Status: ${mission.status}`,
    `Priority: ${mission.priority}`,
    `Owner: ${mission.owner_agent}`,
    mission.blocked_reason ? `Blocked reason: ${mission.blocked_reason}` : null,
    mission.requires_approval ? "Approval: required" : null,
    `Updated: ${mission.updated_at}`
  ].filter(Boolean).join("\n");
}

export function resolveMissionByPrefix(idOrPrefix: string): Mission | null | "ambiguous" {
  const needle = idOrPrefix.trim().toLowerCase();
  const matches = listMissions().filter((mission) => mission.id.toLowerCase().startsWith(needle));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return "ambiguous";
  return null;
}

export function shortMissionId(id: string): string {
  return id.slice(0, 8);
}

export function formatCompactStatus(): string {
  const missions = listMissions();
  const pendingApprovals = listApprovals("requested");
  const counts = new Map<string, number>();
  for (const mission of missions) counts.set(mission.status, (counts.get(mission.status) ?? 0) + 1);
  return [
    "VOC status, Sire:",
    "",
    `Missions: ${missions.length}`,
    `Queued: ${counts.get("queued") ?? 0}`,
    `Active: ${counts.get("active") ?? 0}`,
    `Blocked: ${counts.get("blocked") ?? 0}`,
    `Completed: ${counts.get("completed") ?? 0}`,
    `Pending approvals: ${pendingApprovals.length}`
  ].join("\n");
}
