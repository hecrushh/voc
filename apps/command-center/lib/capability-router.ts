import type { WorkbenchAgentId } from "./agent-workbench.ts";

export type Capability = "coding" | "research" | "marketing" | "security" | "devops" | "planning";

export const allCapabilities: Capability[] = ["coding", "research", "marketing", "security", "devops", "planning"];

export const capabilityAgentMap: Record<Capability, WorkbenchAgentId> = {
  coding: "lannes",
  research: "caulaincourt",
  marketing: "murat",
  security: "davout",
  devops: "massena",
  planning: "berthier",
};

export type CapabilityRoute = {
  capability: Capability;
  agent: WorkbenchAgentId;
};

const capabilityPatterns: Array<{ pattern: RegExp; capability: Capability }> = [
  { pattern: /\b(coding|code|backend|api|program|implement|develop|refactor|debug)\b/i, capability: "coding" },
  { pattern: /\b(research|riset|competitor|market\s*research|analisis|study|investigate|evaluate)\b/i, capability: "research" },
  { pattern: /\b(marketing|content|copy|campaign|brand|launch|positioning|promosi)\b/i, capability: "marketing" },
  { pattern: /\b(security|secure|audit|threat|risk|secret|credential|vulnerability|keamanan)\b/i, capability: "security" },
  { pattern: /\b(devops|deploy|vps|docker|infrastructure|infra|pipeline|build|runtime|storage)\b/i, capability: "devops" },
  { pattern: /\b(plan|planning|coordinate|strategy|roadmap|prd|skp|review|status|briefing)\b/i, capability: "planning" },
];

export function classifyCapability(text: string): CapabilityRoute {
  for (const entry of capabilityPatterns) {
    if (entry.pattern.test(text)) {
      return { capability: entry.capability, agent: capabilityAgentMap[entry.capability] };
    }
  }
  return { capability: "planning", agent: capabilityAgentMap.planning };
}
