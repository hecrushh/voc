import { NextResponse } from "next/server";
import { getMemoryFile, listMemoryFiles } from "@/lib/memory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (filePath) {
    const file = await getMemoryFile(filePath);

    if (!file) {
      return NextResponse.json({ error: "Memory file not found." }, { status: 404 });
    }

    return NextResponse.json({ file });
  }

  return NextResponse.json({ files: await listMemoryFiles() });
}
