import { listApprovals, listMissions } from "./db.ts";
import type { Mission } from "./types.ts";

export type OwnerWorkload = {
  owner: string;
  total: number;
  queued: number;
  active: number;
  blocked: number;
  completed: number;
  cancelled: number;
  highPriority: number;
  pendingApprovals: number;
};

export function summarizeWorkload(): string {
  const workloads = calculateWorkload();
  if (workloads.length === 0) return "Workload, Sire:\n\nNo missions recorded.";

  return [
    "Workload, Sire:",
    "",
    ...workloads.map((item) =>
      `${item.owner.toUpperCase()}: ${item.total} missions, ${item.active} active, ${item.blocked} blocked, ${item.highPriority} high/critical, ${item.pendingApprovals} pending approvals`
    )
  ].join("\n");
}

export function calculateWorkload(): OwnerWorkload[] {
  const missions = listMissions();
  const approvals = listApprovals("requested");
  const byOwner = new Map<string, OwnerWorkload>();

  for (const mission of missions) {
    const owner = normalizeOwner(mission.owner_agent);
    const current = byOwner.get(owner) ?? emptyWorkload(owner);
    applyMission(current, mission);
    byOwner.set(owner, current);
  }

  for (const approval of approvals) {
    const owner = normalizeOwner(approval.requested_by_agent);
    const current = byOwner.get(owner) ?? emptyWorkload(owner);
    current.pendingApprovals += 1;
    byOwner.set(owner, current);
  }

  return [...byOwner.values()].sort((a, b) => b.active - a.active || b.blocked - a.blocked || a.owner.localeCompare(b.owner));
}

function applyMission(workload: OwnerWorkload, mission: Mission) {
  workload.total += 1;
  workload[mission.status] += 1;
  if (mission.priority === "critical" || mission.priority === "high") workload.highPriority += 1;
}

function emptyWorkload(owner: string): OwnerWorkload {
  return {
    owner,
    total: 0,
    queued: 0,
    active: 0,
    blocked: 0,
    completed: 0,
    cancelled: 0,
    highPriority: 0,
    pendingApprovals: 0
  };
}

function normalizeOwner(owner: string | null | undefined): string {
  const normalized = String(owner ?? "unknown").trim().toLowerCase();
  return normalized || "unknown";
}
