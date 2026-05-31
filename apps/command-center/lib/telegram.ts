import { handleTelegramCommand } from "./telegram-commands.ts";

export type TelegramMessage = {
  message_id?: number;
  text?: string;
  chat?: { id?: number | string };
  from?: { id?: number | string; username?: string };
};

export type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
};

export type TelegramHandleResult = {
  ok: boolean;
  status: "handled" | "ignored" | "unauthorized" | "invalid" | "send_failed";
  chatId?: string;
  responseText?: string;
  error?: string;
};

export function getAllowedTelegramUserIds(): Set<string> {
  return new Set(
    String(process.env.TELEGRAM_ALLOWED_USER_IDS ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

export function isAllowedTelegramUser(userId: unknown, allowed = getAllowedTelegramUserIds()): boolean {
  if (allowed.size === 0) return false;
  return allowed.has(String(userId ?? ""));
}

export function validateTelegramWebhookSecret(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true;
  return request.headers.get("x-telegram-bot-api-secret-token") === expected;
}

export async function handleTelegramUpdate(update: TelegramUpdate, send = sendTelegramMessage): Promise<TelegramHandleResult> {
  const message = update.message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id;
  const userId = message?.from?.id;

  if (!message || !text || chatId === undefined || chatId === null) {
    return { ok: true, status: "ignored" };
  }

  if (!isAllowedTelegramUser(userId)) {
    return { ok: false, status: "unauthorized", chatId: String(chatId) };
  }

  try {
    const response = handleTelegramCommand(text);
    await send(String(chatId), response.text);
    return { ok: true, status: "handled", chatId: String(chatId), responseText: response.text };
  } catch (error) {
    let intentType = "unknown";
    try {
      const { classifyTelegramIntent } = await import("./telegram-intent-router.ts");
      const classification = classifyTelegramIntent(text); intentType = "intent" in classification ? classification.intent : classification.type;
    } catch {}
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[BERTHIER_ERROR]", {
      message: text.slice(0, 200),
      intentType,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack ?? "no stack"
    });
    const errorText = "BERTHIER encountered an error, Sire. The command was not executed.";
    try {
      await send(String(chatId), errorText);
    } catch {
      return { ok: false, status: "send_failed", chatId: String(chatId), error: err.message };
    }
    return { ok: false, status: "invalid", chatId: String(chatId), responseText: errorText, error: err.message };
  }
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3900) })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed with HTTP ${response.status}.`);
  }
}
