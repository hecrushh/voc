import { listApprovals, listMissions } from "./db.ts";
import type { Mission } from "./types.ts";
import { shortMissionId } from "./telegram-commands.ts";

const statusOrder = ["queued", "active", "blocked", "completed", "cancelled"] as const;

export function generateDailyBriefing(): string {
  const missions = listMissions();
  const approvals = listApprovals("requested");
  const blocked = missions.filter((mission) => mission.status === "blocked");
  const highPriority = missions.filter((mission) => mission.priority === "critical" || mission.priority === "high");
  const focus = selectTopFocus(missions);

  return [
    "Daily briefing, Sire.",
    "",
    formatMissionCounts(missions),
    "",
    formatBlockedSummary(blocked),
    "",
    `Pending approvals: ${approvals.length}`,
    approvals.slice(0, 3).map((approval) => `- ${approval.action_type}: ${approval.summary}`).join("\n"),
    "",
    `High-priority missions: ${highPriority.length}`,
    highPriority.slice(0, 3).map((mission) => `- ${shortMissionId(mission.id)} — ${mission.priority} — ${mission.title}`).join("\n"),
    "",
    "Top focus:",
    focus.length > 0 ? focus.map((mission, index) => `${index + 1}. ${shortMissionId(mission.id)} — ${mission.title} (${mission.status}/${mission.priority})`).join("\n") : "1. No active focus items recorded."
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function formatMissionCounts(missions: Mission[]): string {
  const counts = new Map<string, number>();
  for (const mission of missions) counts.set(mission.status, (counts.get(mission.status) ?? 0) + 1);
  return [
    `Missions: ${missions.length}`,
    ...statusOrder.map((status) => `${capitalize(status)}: ${counts.get(status) ?? 0}`)
  ].join("\n");
}

export function formatBlockedSummary(blocked: Mission[]): string {
  if (blocked.length === 0) return "Blockers: none.";
  return [
    `Blockers: ${blocked.length}`,
    ...blocked.slice(0, 5).map((mission) => `- ${shortMissionId(mission.id)} — ${mission.title}${mission.blocked_reason ? `: ${mission.blocked_reason}` : ""}`)
  ].join("\n");
}

export function selectTopFocus(missions: Mission[]): Mission[] {
  const rank = (mission: Mission) => {
    const priorityScore = mission.priority === "critical" ? 0 : mission.priority === "high" ? 1 : mission.priority === "normal" ? 2 : 3;
    const statusScore = mission.status === "blocked" ? 0 : mission.status === "active" ? 1 : mission.status === "queued" ? 2 : 9;
    return priorityScore * 10 + statusScore;
  };
  return missions
    .filter((mission) => mission.status !== "completed" && mission.status !== "cancelled")
    .sort((a, b) => rank(a) - rank(b) || a.updated_at.localeCompare(b.updated_at))
    .slice(0, 3);
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
