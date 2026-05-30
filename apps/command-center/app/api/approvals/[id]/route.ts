import { NextResponse } from "next/server";
import { updateApproval } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const approval = updateApproval(id, body);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found." }, { status: 404 });
    }

    return NextResponse.json({ approval });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid approval." }, { status: 400 });
  }
}
