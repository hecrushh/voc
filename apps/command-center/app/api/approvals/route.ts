import { NextResponse } from "next/server";
import { listApprovals } from "@/lib/db";
import type { ApprovalStatus } from "@/lib/types";

export const runtime = "nodejs";

const statuses: ApprovalStatus[] = ["requested", "approved", "rejected", "modified", "expired"];

export function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as ApprovalStatus | null;

  if (status && !statuses.includes(status)) {
    return NextResponse.json({ error: "Approval status is invalid." }, { status: 400 });
  }

  return NextResponse.json({ approvals: listApprovals(status ?? undefined) });
}
