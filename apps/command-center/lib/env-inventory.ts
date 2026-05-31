/**
 * Safe env inventory for BERTHIER.
 * Reports variable presence ("present" | "missing") only. Never exposes values.
 */

const ENV_ALLOWLIST = [
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "OPENROUTER_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ALLOWED_USER_IDS",
  "TELEGRAM_WEBHOOK_SECRET",
  "NINE_ROUTER_URL",
  "NINE_ROUTER_RUNTIME_MODE",
  "OLLAMA_BASE_URL",
  "VOC_DB_PATH",
  "VOC_ROOT",
  "NODE_ENV",
  "HOSTNAME",
  "PORT",
];

export type EnvEntry = { name: string; status: "present" | "missing" };
export type EnvInventory = EnvEntry[];

/**
 * Returns a safe inventory of environment variables.
 * Each entry shows only "present" or "missing". Values are never exposed.
 */
export function getEnvInventory(allowlist: string[] = ENV_ALLOWLIST): EnvInventory {
  return allowlist.map((name) => ({
    name,
    status: process.env[name] && process.env[name]!.trim().length > 0 ? "present" : "missing",
  }));
}

/**
 * Returns a formatted inventory report string for Telegram or web display.
 */
export function formatEnvInventory(inventory: EnvInventory): string {
  return ["Env inventory, Sire.", "", ...inventory.map((entry) => `${entry.name}: ${entry.status}`), "", "Secret values are redacted by design."].join("\n");
}
