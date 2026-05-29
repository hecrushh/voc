export type StatusTone = "online" | "degraded" | "offline" | "unknown" | "planned";

export type Agent = {
  id: string;
  name: string;
  title: string;
  domain: string;
  status: "Offline / Planned";
  responsibilities: string[];
  constraints: string[];
};

export type MissionStatus = "queued" | "active" | "blocked" | "completed" | "cancelled";
export type MissionPriority = "low" | "normal" | "high" | "critical";

export type Mission = {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  owner_agent: string;
  created_at: string;
  updated_at: string;
};

export type MissionInput = {
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  owner_agent: string;
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
  models: string[];
};
