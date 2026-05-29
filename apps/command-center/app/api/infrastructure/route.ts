import { NextResponse } from "next/server";
import { getInfrastructureStatus } from "@/lib/infrastructure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getInfrastructureStatus());
}
