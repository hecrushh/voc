import { generateDailyBriefing } from "./briefing.ts";
import { summarizeWorkload } from "./workload.ts";
import { routeSafeModelTask } from "./model-router.ts";
import { isAgentWorkbenchRequest } from "./agent-workbench.ts";
import { getEnvInventory, formatEnvInventory } from "./env-inventory.ts";

export type TelegramIntent =
  | "status_query"
  | "briefing_request"
  | "workload_query"
  | "mission_list"
  | "mission_create"
  | "mission_update"
  | "agent_workbench_task"
  | "skp_planning"
  | "repo_status"
  | "env_inventory"
  | "general_berthier_chat"
  | "unknown_safe_fallback"
  | "approval_required";

export type TelegramIntentClassification = {
  intent: TelegramIntent;
  confidence: number;
  normalizedCommand?: string;
  reason: string;
  language: "id" | "en";
};

const missionIdPattern = "([a-f0-9]{6,}(?:-[a-f0-9-]+)?)";
const riskyPattern = /\b(deploy|execute|run|jalankan|eksekusi|otomatisasi|automation|playwright|browser|login|post|posting|publish|push|merge|create\s+pr|buat\s+pr|delete|hapus|purchase|buy|beli|account|akun)\b/i;

export function classifyTelegramIntent(text: string): TelegramIntentClassification {
  const trimmed = text.trim();
  const language = detectLanguage(trimmed);
  const lower = normalizeForMatching(trimmed);

  if (!trimmed) return { intent: "unknown_safe_fallback", confidence: 1, reason: "empty_message", language };

  if (riskyPattern.test(lower)) {
    return { intent: "approval_required", confidence: 0.95, reason: "risky_execution_request", language };
  }

  const createMission = matchMissionCreate(trimmed);
  if (createMission) {
    return {
      intent: "mission_create",
      confidence: 0.95,
      normalizedCommand: `Create mission: ${createMission}`,
      reason: "mission_create_keywords",
      language
    };
  }

  const updateMission = matchMissionUpdate(trimmed);
  if (updateMission) {
    return {
      intent: "mission_update",
      confidence: 0.95,
      normalizedCommand: updateMission,
      reason: "mission_update_keywords",
      language
    };
  }

  if (isAgentWorkbenchRequest(trimmed)) {
    return { intent: "agent_workbench_task", confidence: 0.9, reason: "agent_workbench_keywords", language };
  }

  if (/\b(skp|oauth|tipper)\b/i.test(lower)) {
    return { intent: "skp_planning", confidence: 0.9, normalizedCommand: mapSkpCommand(lower), reason: "skp_keywords", language };
  }

  if (/\b(repo|repository|git|github|commit|branch)\b/i.test(lower) && /\b(voc|status|cek|check|lihat|keadaan|summary|ringkasan)\b/i.test(lower)) {
    return { intent: "repo_status", confidence: 0.9, normalizedCommand: "/repo status", reason: "repo_status_keywords", language };
  }

  if (/\b(env|envir?onment|secret|konfigurasi|config)\b/i.test(lower) && /\b(cek|check|inventory|inventaris|status)\b/i.test(lower)) {
    return { intent: "env_inventory", confidence: 0.9, reason: "env_inventory_keywords", language };
  }

  if (/\b(mission|missions|misi|tugas|daftar|list|ada apa|apa saja)\b/i.test(lower) && /\b(mission|missions|misi|tugas|daftar|list)\b/i.test(lower)) {
    return { intent: "mission_list", confidence: 0.85, normalizedCommand: "/missions", reason: "mission_list_keywords", language };
  }

  if (/\b(workload|beban|owner|siapa pegang|siapa yang pegang|penanggung jawab)\b/i.test(lower)) {
    return { intent: "workload_query", confidence: 0.85, normalizedCommand: "/workload", reason: "workload_keywords", language };
  }

  if (/\b(hari ini|today|prioritas|priority|fokus|focus|kerjakan|briefing|brief|pagi|morning)\b/i.test(lower)) {
    return { intent: "briefing_request", confidence: 0.85, normalizedCommand: "/briefing", reason: "briefing_keywords", language };
  }

  if (/\b(status|keadaan|gimana|bagaimana|sekarang|current|sistem|voc)\b/i.test(lower)) {
    return { intent: "status_query", confidence: 0.8, normalizedCommand: "Summarize status", reason: "status_keywords", language };
  }

  if (/\b(jelaskan|explain|apa itu|saran|recommend|rekomendasi|berthier)\b/i.test(lower)) {
    return { intent: "general_berthier_chat", confidence: 0.65, reason: "general_chat_keywords", language };
  }

  return modelAssistedClassification(trimmed, language);
}

export function isSlashCommand(text: string): boolean {
  return /^\/\w+/.test(text.trim());
}

export function formatApprovalRequired(language: "id" | "en", request: string): string {
  if (language === "id") {
    return [
      "Approval required, Sire.",
      "",
      "Saya tidak akan mengeksekusi aksi berisiko dari Telegram.",
      "Saya bisa bantu ubah ini menjadi mission atau approval request untuk ditinjau.",
      "",
      `Permintaan: ${request}`
    ].join("\n");
  }
  return [
    "Approval required, Sire.",
    "",
    "I will not execute risky actions from Telegram.",
    "I can help turn this into a mission or approval request for review.",
    "",
    `Request: ${request}`
  ].join("\n");
}

export function formatGeneralBerthierChat(text: string, language: "id" | "en"): string {
  const fallback = language === "id"
    ? [
        "Siap, Sire.",
        "",
        "Keadaan VOC bisa saya bantu melalui briefing, status mission, workload, SKP planning, dan repo status.",
        "Kirim contoh: ‘status VOC’, ‘briefing hari ini’, ‘buat mission: ...’, atau ‘cek repo VOC’."
      ].join("\n")
    : [
        "Ready, Sire.",
        "",
        "I can help with VOC briefing, mission status, workload, SKP planning, and repo status.",
        "Try: ‘VOC status’, ‘today briefing’, ‘create mission: ...’, or ‘check VOC repo’."
      ].join("\n");
  return routeSafeModelTask({ category: "reasoning", prompt: `Safe BERTHIER chat response only: ${text}`, fallback }).text;
}

export function formatUnknownSafeFallback(language: "id" | "en"): string {
  if (language === "id") {
    return "Saya belum menangkap maksudnya, Sire. Coba: status VOC, briefing hari ini, daftar mission, buat mission: <judul>, workload, SKP status, atau cek repo VOC.";
  }
  return "I did not catch the intent, Sire. Try: VOC status, today briefing, missions, create mission: <title>, workload, SKP status, or check VOC repo.";
}

export function mapIntentToDirectResponse(classification: TelegramIntentClassification): string | null {
  if (classification.intent === "briefing_request") return generateDailyBriefing();
  if (classification.intent === "workload_query") return summarizeWorkload();
  if (classification.intent === "env_inventory") return formatEnvInventory(getEnvInventory());
  return null;
}

function matchMissionCreate(text: string): string | null {
  const patterns = [
    /^buat\s+mission(?:\s+baru)?(?:\s+untuk|:)?\s+(.+)$/i,
    /^buat\s+misi(?:\s+baru)?(?:\s+untuk|:)?\s+(.+)$/i,
    /^create\s+mission(?:\s+for|:)?\s+(.+)$/i,
    /^add\s+mission(?:\s+for|:)?\s+(.+)$/i,
    /^mission\s+baru(?:\s+untuk|:)?\s+(.+)$/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function matchMissionUpdate(text: string): string | null {
  const lower = text.toLowerCase();
  const idMatch = lower.match(new RegExp(missionIdPattern, "i"));
  if (!idMatch) return null;
  const id = idMatch[1];

  if (/\b(selesai|completed|complete|done|rampung)\b/i.test(lower)) return `Mark mission ${id} completed`;
  if (/\b(active|aktif|mulai|in progress)\b/i.test(lower)) return `Mark mission ${id} active`;
  if (/\b(blocked|blokir|terblokir|hambatan|tertahan)\b/i.test(lower)) {
    const reasonMatch = text.match(/(?:karena|because|reason:|blocked:)\s+(.+)$/i);
    const reason = reasonMatch?.[1]?.trim();
    return reason ? `Mark mission ${id} blocked: ${reason}` : `Mark mission ${id} blocked`;
  }
  return null;
}

function mapSkpCommand(lower: string): string {
  if (/\b(checklist|ceklist|daftar)\b/i.test(lower)) return "/skp checklist";
  if (/\b(next|berikut|selanjutnya|apakan|perlu|apa yang)\b/i.test(lower)) return "/skp next";
  if (/\b(risk|risiko|resiko)\b/i.test(lower)) return "/skp risk";
  return "/skp status";
}

function modelAssistedClassification(text: string, language: "id" | "en"): TelegramIntentClassification {
  const fallback = "unknown_safe_fallback";
  const routed = routeSafeModelTask({
    category: "classification",
    preferredProvider: "qwen3",
    prompt: `Classify this Telegram message into a safe BERTHIER intent only. Message: ${text}`,
    fallback
  });

  const modelIntent = parseModelIntent(routed.text);
  if (modelIntent) return { intent: modelIntent, confidence: 0.55, reason: `model_assisted_${routed.usedProvider}`, language };
  return { intent: "unknown_safe_fallback", confidence: 0.5, reason: `model_assisted_fallback_${routed.usedProvider}`, language };
}

function parseModelIntent(text: string): TelegramIntent | null {
  const value = text.trim().toLowerCase();
  const allowed: TelegramIntent[] = [
    "status_query",
    "briefing_request",
    "workload_query",
    "mission_list",
    "mission_create",
    "mission_update",
    "agent_workbench_task",
    "skp_planning",
    "repo_status",
    "env_inventory",
    "general_berthier_chat",
    "unknown_safe_fallback"
  ];
  return allowed.find((intent) => value.includes(intent)) ?? null;
}

function detectLanguage(text: string): "id" | "en" {
  return /\b(apa|yang|harus|saya|kerjakan|hari ini|buat|tandai|selesai|gimana|bagaimana|cek|perlu|sekarang|misi|tugas|tolong|jelaskan)\b/i.test(text)
    ? "id"
    : "en";
}

function normalizeForMatching(text: string): string {
  return text.toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
}
