import { NextResponse } from "next/server";
import { createMission, listMissionEvents, listMissions, validateMissionInput } from "@/lib/db";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ missions: listMissions() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mission = createMission(validateMissionInput(body));
    return NextResponse.json({ mission, events: listMissionEvents(mission.id) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid mission." }, { status: 400 });
  }
}
