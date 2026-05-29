import { NextResponse } from "next/server";
import { agents } from "@/lib/agents";
import { listMissions } from "@/lib/db";
import { getInfrastructureStatus } from "@/lib/infrastructure";
import { listMemoryFiles } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [infrastructure, missions, memoryFiles] = await Promise.all([
    getInfrastructureStatus(),
    Promise.resolve(listMissions()),
    listMemoryFiles()
  ]);

  const missionSummary = missions.reduce(
    (summary, mission) => ({ ...summary, [mission.status]: (summary[mission.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return NextResponse.json({
    infrastructure,
    agents,
    missions,
    missionSummary,
    memorySummary: {
      files: memoryFiles.length,
      docs: memoryFiles.filter((file) => file.section === "docs").length,
      memory: memoryFiles.filter((file) => file.section === "memory").length
    }
  });
}
