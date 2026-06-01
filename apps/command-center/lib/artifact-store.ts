import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Mission } from "./types.ts";
import type { Capability } from "./capability-router.ts";
import type { ProviderStrategy } from "./provider-strategy.ts";

const ARTIFACT_DIR = "reports/artifacts";
const SUMMARY_LINES = 24;

export type ArtifactMetadata = {
  mission: Mission;
  agent: string;
  capability: Capability;
  providerStrategy: ProviderStrategy;
  content: string;
  createdAt?: string;
};

export function artifactPathForMission(missionId: string): string {
  return join(ARTIFACT_DIR, `${missionId}.md`);
}

export function writeMissionArtifact(input: ArtifactMetadata): string {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const artifactPath = artifactPathForMission(input.mission.id);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const body = [
    `Mission ID: ${input.mission.id}`,
    `Created: ${createdAt}`,
    `Agent: ${input.agent}`,
    `Capability: ${input.capability}`,
    `Provider Strategy: ${input.providerStrategy}`,
    `Title: ${input.mission.title}`,
    "",
    "---",
    "",
    input.content
  ].join("\n");
  writeFileSync(artifactPath, body.endsWith("\n") ? body : `${body}\n`, "utf8");
  return artifactPath;
}

export function readMissionArtifact(artifactPath: string): string | null {
  if (!artifactPath || !existsSync(artifactPath)) return null;
  return readFileSync(artifactPath, "utf8");
}

export function summarizeMissionArtifact(artifactPath: string, maxLines = SUMMARY_LINES): string | null {
  const content = readMissionArtifact(artifactPath);
  if (!content) return null;
  const lines = content.split(/\r?\n/);
  const summary = lines.slice(0, maxLines).join("\n").trim();
  if (lines.length <= maxLines) return summary;
  return `${summary}\n...`;
}
