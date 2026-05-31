export type StatusTone =
  | "online"
  | "degraded"
  | "restricted"
  | "planned"
  | "offline"
  | "configured"
  | "unconfigured"
  | "installed"
  | "missing";

export type Agent = {
  id: string;
  name: string;
  title: string;
  domain: string;
  status: "Offline / Planned";
  responsibilities: string[];
  constraints: string[];
};

export type MissionStatus = "queued" | "active" | "blocked" | "pending_approval" | "approved" | "rejected" | "executed" | "completed" | "cancelled";
export type MissionPriority = "low" | "normal" | "high" | "critical";

export type Mission = {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  owner_agent: string;
  source_command_id: string | null;
  requires_approval: boolean;
  approval_id: string | null;
  due_at: string | null;
  blocked_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MissionInput = {
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  owner_agent: string;
  source_command_id?: string | null;
  requires_approval?: boolean;
  approval_id?: string | null;
  due_at?: string | null;
  blocked_reason?: string | null;
  completed_at?: string | null;
};

export type CommandSource = "berthier_ui" | "telegram" | "system" | "future_api";
export type CommandStatus = "received" | "parsed" | "rejected" | "converted_to_mission" | "awaiting_approval" | "completed";
export type CommandRiskLevel = "low" | "medium" | "high" | "critical";

export type CommandRecord = {
  id: string;
  source: CommandSource;
  raw_text: string;
  parsed_intent: string;
  commander_id: string;
  status: CommandStatus;
  risk_level: CommandRiskLevel;
  linked_mission_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type CommandInput = {
  source: CommandSource;
  raw_text: string;
  parsed_intent: string;
  commander_id: string;
  status: CommandStatus;
  risk_level: CommandRiskLevel;
  linked_mission_id?: string | null;
  resolved_at?: string | null;
};

export type ApprovalStatus = "requested" | "approved" | "rejected" | "modified" | "expired";
export type ApprovalRiskLevel = "low" | "medium" | "high" | "critical";

export type Approval = {
  id: string;
  action_type: string;
  requested_by_agent: string;
  mission_id: string | null;
  command_id: string | null;
  summary: string;
  risk_level: ApprovalRiskLevel;
  status: ApprovalStatus;
  approved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
};

export type ApprovalInput = {
  action_type: string;
  requested_by_agent: string;
  mission_id?: string | null;
  command_id?: string | null;
  summary: string;
  risk_level: ApprovalRiskLevel;
  status: ApprovalStatus;
  approved_by?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
};

export type MissionEvent = {
  id: string;
  mission_id: string;
  command_id: string | null;
  agent_id: string | null;
  event_type: string;
  summary: string;
  metadata_json: string;
  created_at: string;
};

export type MissionEventInput = {
  mission_id: string;
  command_id?: string | null;
  agent_id?: string | null;
  event_type: string;
  summary: string;
  metadata_json?: string;
  created_at?: string;
};

export type MemoryFile = {
  id: string;
  title: string;
  section: "docs" | "memory";
  path: string;
  size: number;
  updated_at: string;
  excerpt: string;
};

export type MemoryFileDetail = MemoryFile & {
  content: string;
};

export type ResourceMetric = {
  label: string;
  value: string;
  detail?: string;
  percent?: number;
};

export type ServiceStatus = {
  name: string;
  status: StatusTone;
  detail: string;
  checked_at: string;
  source: string;
};

export type InfrastructureStatus = {
  checked_at: string;
  vps: {
    status: StatusTone;
    metrics: ResourceMetric[];
  };
  services: ServiceStatus[];
  runtimes: ServiceStatus[];
  providers: ServiceStatus[];
  models: string[];
};
