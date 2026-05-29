import { NextResponse } from "next/server";
import { agents } from "@/lib/agents";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ agents });
}
