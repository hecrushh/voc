import { createCommand, createMission, logMissionEvent, updateCommand, updateMission } from "./db.ts";
import { routeSafeModelTask, type ProviderName, type SafeModelCategory } from "./model-router.ts";
import type { CommandRecord, Mission, MissionPriority } from "./types.ts";
import { classifyCapability, type Capability } from "./capability-router.ts";
import { writeMissionArtifact } from "./artifact-store.ts";
import { resolveProviderStrategy, formatProviderStrategy, type ProviderStrategy } from "./provider-strategy.ts";

export type WorkbenchAgentId =
  | "berthier"
  | "lannes"
  | "ney"
  | "davout"
  | "massena"
  | "murat"
  | "caulaincourt"
  | "colbert"
  | "soult";

export type WorkbenchArtifactKind =
  | "mission_note"
  | "report_markdown"
  | "implementation_plan"
  | "code_diff_proposal"
  | "checklist"
  | "marketing_draft"
  | "research_brief";

export type AgentWorkbenchRoute = {
  agentId: WorkbenchAgentId;
  agentName: string;
  provider: ProviderName;
  category: SafeModelCategory;
  artifactKind: WorkbenchArtifactKind;
  priority: MissionPriority;
  title: string;
  rationale: string;
  capability: Capability;
  providerStrategy: ProviderStrategy;
};

export type AgentWorkbenchResult = {
  route: AgentWorkbenchRoute;
  mission: Mission;
  command: CommandRecord;
  artifact: string;
};

type RouteRule = {
  agentId: WorkbenchAgentId;
  agentName: string;
  provider: ProviderName;
  category: SafeModelCategory;
  artifactKind: WorkbenchArtifactKind;
  priority: MissionPriority;
  pattern: RegExp;
  titlePrefix: string;
  rationale: string;
};

const directAgentPatterns = /\b(lannes|ney|davout|massena|murat|caulaincourt|colbert|soult)\b/i;
const workbenchIntentPattern =
  /\b(minta|suruh|assign|route|bantu|review|cek|check|audit|riset|research|draft|buatkan|siapkan|plan|planning|coding|backend|frontend|security|marketing|devops|product|finance|cost|repo|ui|api|database|skp)\b/i;

const routeRules: RouteRule[] = [
  {
    agentId: "lannes",
    agentName: "LANNES",
    provider: "deepseek",
    category: "technical_reasoning",
    artifactKind: "code_diff_proposal",
    priority: "normal",
    pattern: /\b(lannes|backend|api|database|db|sqlite|server|coding|code|repo review|review backend)\b/i,
    titlePrefix: "Backend workbench task",
    rationale: "Backend, API, database, or coding intent."
  },
  {
    agentId: "ney",
    agentName: "NEY",
    provider: "deepseek",
    category: "technical_reasoning",
    artifactKind: "implementation_plan",
    priority: "normal",
    pattern: /\b(ney|frontend|ui|ux|page|component|tailwind|css|missions page|dashboard)\b/i,
    titlePrefix: "Frontend workbench task",
    rationale: "Frontend or UI intent."
  },
  {
    agentId: "davout",
    agentName: "DAVOUT",
    provider: "openrouter",
    category: "technical_reasoning",
    artifactKind: "checklist",
    priority: "high",
    pattern: /\b(davout|security|risk|secret|credential|approval|threat|audit keamanan|secure)\b/i,
    titlePrefix: "Security workbench task",
    rationale: "Security, risk, or approval-gate intent."
  },
  {
    agentId: "massena",
    agentName: "MASSENA",
    provider: "deepseek",
    category: "technical_reasoning",
    artifactKind: "checklist",
    priority: "high",
    pattern: /\b(massena|devops|vps|docker|cloudflare|tunnel|build|runtime|storage|disk)\b/i,
    titlePrefix: "DevOps workbench task",
    rationale: "Runtime, VPS, Docker, or deployment-preparation intent."
  },
  {
    agentId: "murat",
    agentName: "MURAT",
    provider: "openrouter",
    category: "drafting",
    artifactKind: "marketing_draft",
    priority: "normal",
    pattern: /\b(murat|marketing|content|copy|campaign|launch|brand|positioning|tipper draft|draft marketing)\b/i,
    titlePrefix: "Marketing workbench task",
    rationale: "Marketing, content, or positioning intent."
  },
  {
    agentId: "caulaincourt",
    agentName: "CAULAINCOURT",
    provider: "openrouter",
    category: "reasoning",
    artifactKind: "research_brief",
    priority: "normal",
    pattern: /\b(caulaincourt|research|riset|competitor|market|integrasi|integration|evaluate|investigate)\b/i,
    titlePrefix: "Research workbench task",
    rationale: "Research or analysis intent."
  },
  {
    agentId: "colbert",
    agentName: "COLBERT",
    provider: "mimo",
    category: "reasoning",
    artifactKind: "report_markdown",
    priority: "normal",
    pattern: /\b(colbert|finance|cost|budget|spend|harga|biaya)\b/i,
    titlePrefix: "Finance workbench task",
    rationale: "Cost, finance, or resource-planning intent."
  },
  {
    agentId: "berthier",
    agentName: "BERTHIER",
    provider: "openrouter",
    category: "reasoning",
    artifactKind: "checklist",
    priority: "normal",
    pattern: /\b(berthier.*(?:report|laporan|plan|kerjakan)|chief of staff|coordinator|koordinasi|mission plan|skp bridge)\b/i,
    titlePrefix: "Coordination workbench task",
    rationale: "Coordination or SKP bridge planning intent."
  },
  {
    agentId: "soult",
    agentName: "SOULT",
    provider: "openrouter",
    category: "reasoning",
    artifactKind: "implementation_plan",
    priority: "normal",
    pattern: /\b(soult|product|prd|roadmap|feature|strategy|strategi)\b/i,
    titlePrefix: "Product workbench task",
    rationale: "Product strategy or roadmap intent."
  }
];

export function isAgentWorkbenchRequest(text: string): boolean {
  const normalized = stripBerthierAddress(text);
  const addressedToBerthier = /^berthier[:,]?\s+/i.test(text.trim());
  return (
    directAgentPatterns.test(normalized) ||
    (workbenchIntentPattern.test(normalized) && routeRules.some((rule) => rule.pattern.test(normalized))) ||
    (addressedToBerthier && /\b(kerjakan|buatkan\s+report|buatkan\s+laporan|siapkan\s+plan)\b/i.test(normalized))
  );
}

export function routeAgentWorkbenchTask(text: string): AgentWorkbenchRoute {
  const normalized = stripBerthierAddress(text);
  const rule = routeRules.find((entry) => entry.pattern.test(normalized)) ?? routeRules[7];
  const capabilityResult = classifyCapability(text);
  return {
    agentId: rule.agentId,
    agentName: rule.agentName,
    provider: rule.provider,
    category: rule.category,
    artifactKind: rule.artifactKind,
    priority: rule.priority,
    title: `${rule.titlePrefix}: ${summarizeTaskTitle(normalized)}`,
    rationale: rule.rationale,
    capability: capabilityResult.capability,
    providerStrategy: resolveProviderStrategy(capabilityResult.capability),
  };
}

export function createAgentWorkbenchTask(text: string): AgentWorkbenchResult {
  const route = routeAgentWorkbenchTask(text);
  const command = createCommand({
    source: "telegram",
    raw_text: text,
    parsed_intent: "agent_workbench_task",
    commander_id: "telegram",
    status: "received",
    risk_level: route.priority === "high" || route.priority === "critical" ? "medium" : "low"
  });
  const artifact = buildDeterministicArtifact(route, text);
  const routed = routeSafeModelTask({
    category: route.category,
    preferredProvider: route.provider,
    prompt: `Prepare a side-effect-free ${route.artifactKind} for ${route.agentName}: ${text}`,
    fallback: artifact
  });
  const mission = createMission({
    title: route.title,
    description: routed.text,
    status: "queued",
    priority: route.priority,
    owner_agent: route.agentId,
    source_command_id: command.id,
    requires_approval: false
  });
  logMissionEvent({
    mission_id: mission.id,
    command_id: command.id,
    agent_id: route.agentId,
    event_type: "artifact_prepared",
    summary: `${route.agentName} prepared ${route.artifactKind}.`,
    metadata_json: JSON.stringify({
      capability: route.capability,
      providerStrategy: route.providerStrategy,
      provider: routed.usedProvider,
      requested_provider: route.provider,
      artifact_kind: route.artifactKind,
      safe: routed.safe,
      reason: routed.reason
    })
  });
  const artifactPath = writeMissionArtifact({
    mission,
    agent: route.agentName,
    capability: route.capability,
    providerStrategy: route.providerStrategy,
    content: routed.text,
    createdAt: new Date().toISOString()
  });
  updateMission(mission.id, { artifact_path: artifactPath });
  const completedCommand = updateCommand(command.id, {
    status: "converted_to_mission",
    linked_mission_id: mission.id,
    resolved_at: new Date().toISOString()
  }) as CommandRecord;

  return { route, mission, command: completedCommand, artifact: routed.text };
}

export function formatAgentWorkbenchResponse(result: AgentWorkbenchResult): string {
  return [
    "Agent task prepared, Sire.",
    "",
    `Agent: ${result.route.agentName}`,
    `Capability: ${result.route.capability}`,
    `Provider Strategy: ${formatProviderStrategy(result.route.providerStrategy)}`,
    `Artifact: ${formatArtifactKind(result.route.artifactKind)}`,
    `Mission: ${result.mission.id.slice(0, 8)}`,
    `Title: ${result.mission.title}`,
    "",
    result.artifact
  ].join("\n");
}

function buildDeterministicArtifact(route: AgentWorkbenchRoute, text: string): string {
  const task = stripBerthierAddress(text);
  if (route.artifactKind === "marketing_draft") {
    return [
      "# Marketing Draft",
      "",
      `Owner: ${route.agentName}`,
      `Task: ${task}`,
      "",
      "- Clarify the target audience and offer.",
      "- Draft one concise angle and one supporting proof point.",
      "- Keep publication as a separate approval-gated action."
    ].join("\n");
  }
  if (route.artifactKind === "research_brief") {
    return [
      "# Research Brief",
      "",
      `Owner: ${route.agentName}`,
      `Question: ${task}`,
      "",
      "- Define the decision this research should support.",
      "- Gather source notes without executing external side effects.",
      "- Return findings, risks, and recommended next step."
    ].join("\n");
  }
  if (route.artifactKind === "code_diff_proposal") {
    return [
      "# Code Diff Proposal",
      "",
      `Owner: ${route.agentName}`,
      `Task: ${task}`,
      "",
      "- Inspect the relevant code paths before changing files.",
      "- Propose the smallest diff that satisfies the task.",
      "- Run tests/build locally before any commit or deploy approval."
    ].join("\n");
  }
  if (route.artifactKind === "checklist") {
    return [
      "# Checklist",
      "",
      `Owner: ${route.agentName}`,
      `Task: ${task}`,
      "",
      "- Confirm current state from read-only evidence.",
      "- Identify required changes and safety gates.",
      "- Prepare commands or follow-up work without executing side effects."
    ].join("\n");
  }
  if (route.artifactKind === "report_markdown") {
    return [
      "# Report",
      "",
      `Owner: ${route.agentName}`,
      `Task: ${task}`,
      "",
      "- Summarize current facts.",
      "- Separate assumptions from verified evidence.",
      "- Recommend a next action with cost/risk notes."
    ].join("\n");
  }
  return [
    "# Implementation Plan",
    "",
    `Owner: ${route.agentName}`,
    `Task: ${task}`,
    "",
    "- Scope the expected output.",
    "- Map affected files or systems.",
    "- Prepare a reviewable implementation path with validation."
  ].join("\n");
}

function stripBerthierAddress(text: string): string {
  return text
    .trim()
    .replace(/^berthier[:,]?\s*/i, "")
    .replace(/\s+/g, " ");
}

function summarizeTaskTitle(text: string): string {
  const withoutPolitePrefix = text
    .replace(/^(minta|suruh|tolong|please|assign|route|bantu)\s+/i, "")
    .trim();
  return withoutPolitePrefix.length > 88 ? `${withoutPolitePrefix.slice(0, 85).trim()}...` : withoutPolitePrefix;
}

function formatArtifactKind(kind: WorkbenchArtifactKind): string {
  return kind.replace(/_/g, " ");
}

function formatProviderName(provider: ProviderName): string {
  return provider.replace(/_/g, " ");
}
