import { NextResponse } from "next/server";
import { deleteMission, getMission, updateMission } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const mission = getMission(id);

  if (!mission) {
    return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  }

  return NextResponse.json({ mission });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mission = updateMission(id, body);

    if (!mission) {
      return NextResponse.json({ error: "Mission not found." }, { status: 404 });
    }

    return NextResponse.json({ mission });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid mission." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  if (!deleteMission(id)) {
    return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
