import { NextResponse } from "next/server";
import { handleTelegramUpdate, validateTelegramWebhookSecret } from "@/lib/telegram.ts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!validateTelegramWebhookSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized Telegram webhook." }, { status: 401 });
  }

  try {
    const update = await request.json();
    const result = await handleTelegramUpdate(update);
    return NextResponse.json({ ok: result.ok, status: result.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Telegram intake failed." }, { status: 400 });
  }
}
