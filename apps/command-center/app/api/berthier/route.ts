import { NextResponse } from "next/server";
import { listCommands } from "@/lib/db";
import { processBerthierCommand } from "@/lib/mission-engine.ts";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ commands: listCommands(25) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { command?: unknown };
    const commandText = String(body.command ?? "").trim();

    if (!commandText) {
      return NextResponse.json({ error: "Command text is required." }, { status: 400 });
    }

    const result = processBerthierCommand(commandText);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "BERTHIER command failed." }, { status: 400 });
  }
}
