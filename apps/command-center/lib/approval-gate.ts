/**
 * BERTHIER Approval Gate (Phase E.2).
 * Risk classification for missions, and approve/reject flow.
 * No side effects beyond DB updates triggered by processApprove/processReject.
 */

import { getApproval, updateApproval, getMission, updateMission, logMissionEvent } from "./db.ts";
import type { Approval, ApprovalRiskLevel, Mission } from "./types.ts";

// ---- Risk classification ----

type RiskPattern = { pattern: RegExp; category: string; risk: ApprovalRiskLevel };

const riskPatterns: RiskPattern[] = [
  { pattern: /\bgit\s+push\b/i, category: "git_push", risk: "high" },
  { pattern: /\bpush\b(?!\s+notification)/i, category: "git_push", risk: "high" },
  { pattern: /\bdeploy\b/i, category: "deploy", risk: "high" },
  { pattern: /\bservice\s+restart\b/i, category: "service_restart", risk: "high" },
  { pattern: /\brestart\b/i, category: "service_restart", risk: "high" },
  { pattern: /\bdocker\s+(cleanup|prune|rm|kill)\b/i, category: "docker_cleanup", risk: "high" },
  { pattern: /\bdelete\b|\bhapus\b/i, category: "delete_files", risk: "critical" },
  { pattern: /\benv\b.*\bedit\b|\bsecrets?\b.*\bedit\b|\bedit\b.*\benv\b|\bedit\b.*\bsecrets?\b/i, category: "env_secrets_edit", risk: "critical" },
  { pattern: /\b(db|database)\s+migration\b/i, category: "db_migration", risk: "critical" },
  { pattern: /\bmigrasi\b.*\b(database|db)\b/i, category: "db_migration", risk: "critical" },
  { pattern: /\bexternal\s+api\s+write\b/i, category: "external_api_write", risk: "high" },
  { pattern: /\bspending\b|\bcost\b|\bbayar\b|\bbeli\b|\bpurchase\b/i, category: "spending", risk: "critical" },
];

export function classifyMissionRisk(text: string): ApprovalRiskLevel | null {
  for (const { pattern, risk } of riskPatterns) {
    if (pattern.test(text)) return risk;
  }
  return null;
}

// ---- Approve / Reject ----

export type ApprovalResult = {
  success: boolean;
  mission: Mission | null;
  approval: Approval | null;
  message: string;
};

export function processApprove(missionId: string, approvedBy = "berthier"): ApprovalResult {
  const mission = getMission(missionId);
  if (!mission) return { success: false, mission: null, approval: null, message: `Mission not found: ${missionId}` };
  if (!mission.requires_approval || !mission.approval_id) {
    return { success: false, mission, approval: null, message: `Mission ${shortId(mission.id)} does not require approval.` };
  }
  const approval = getApproval(mission.approval_id);
  if (!approval) return { success: false, mission, approval: null, message: `Approval record not found for mission ${shortId(mission.id)}.` };
  if (approval.status !== "requested") {
    return { success: false, mission, approval, message: `Approval for mission ${shortId(mission.id)} is already ${approval.status}.` };
  }

  updateApproval(approval.id, { status: "approved", approved_by: approvedBy, resolution_note: "Approved via BERTHIER approval gate." });
  const updated = updateMission(mission.id, { status: "approved", blocked_reason: null }) as Mission;
  logMissionEvent({
    mission_id: mission.id,
    agent_id: approvedBy,
    event_type: "approval_granted",
    summary: `Mission ${shortId(mission.id)} approved by ${approvedBy}. Status changed from blocked to queued.`,
    metadata_json: JSON.stringify({ approval_id: approval.id, previous_status: mission.status }),
  });
  const freshApproval = getApproval(approval.id) as Approval;
  return { success: true, mission: updated, approval: freshApproval, message: `Approved, Sire. Mission ${shortId(mission.id)} is cleared for execution.` };
}

export function processReject(missionId: string, rejectedBy = "berthier"): ApprovalResult {
  const mission = getMission(missionId);
  if (!mission) return { success: false, mission: null, approval: null, message: `Mission not found: ${missionId}` };
  if (!mission.requires_approval || !mission.approval_id) {
    return { success: false, mission, approval: null, message: `Mission ${shortId(mission.id)} does not require approval.` };
  }
  const approval = getApproval(mission.approval_id);
  if (!approval) return { success: false, mission, approval: null, message: `Approval record not found for mission ${shortId(mission.id)}.` };
  if (approval.status !== "requested") {
    return { success: false, mission, approval, message: `Approval for mission ${shortId(mission.id)} is already ${approval.status}.` };
  }

  updateApproval(approval.id, { status: "rejected", approved_by: rejectedBy, resolution_note: "Rejected via BERTHIER approval gate." });
  const updated = updateMission(mission.id, { status: "rejected", blocked_reason: "Rejected by commander." }) as Mission;
  logMissionEvent({
    mission_id: mission.id,
    agent_id: rejectedBy,
    event_type: "approval_rejected",
    summary: `Mission ${shortId(mission.id)} rejected by ${rejectedBy}. Status changed from blocked to cancelled.`,
    metadata_json: JSON.stringify({ approval_id: approval.id, previous_status: mission.status }),
  });
  const freshApproval = getApproval(approval.id) as Approval;
  return { success: true, mission: updated, approval: freshApproval, message: `Rejected, Sire. Mission ${shortId(mission.id)} will not execute.` };
}

// ---- Formatting ----

export function formatApprovalResult(result: ApprovalResult): string {
  return result.message;
}

// ---- Helpers ----

function shortId(id: string): string {
  return id.slice(0, 8);
}

