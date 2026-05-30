import { processBerthierCommand } from "./mission-engine.ts";

const executionPattern = /\b(run|automate|launch|login|post|buy|purchase|submit|scrape|playwright|execute|browser)\b/i;

export function handleSkpCommand(text: string): string {
  const trimmed = text.trim();
  const command = trimmed.replace(/^\/skp(?:@\w+)?\s*/i, "").trim();

  if (!command || /^status$/i.test(command)) return skpStatus();
  if (/^checklist$/i.test(command)) return skpChecklist();
  if (/^(next|next step)$/i.test(command)) return skpNextStep();
  if (/^(risk|risk review)$/i.test(command)) return skpRiskReview();

  const missionMatch = command.match(/^mission\s+(.+)$/i);
  if (missionMatch) {
    const result = processBerthierCommand(`Create mission: SKP — ${missionMatch[1].trim()}`, { source: "telegram", commanderId: "telegram" });
    return result.mission ? `SKP mission created, Sire.\n\nID: ${result.mission.id.slice(0, 8)}\nTitle: ${result.mission.title}` : result.response;
  }

  if (executionPattern.test(command)) return skpExecutionBlocked(command);

  return [
    "SKP assistant, Sire.",
    "",
    "Available commands:",
    "- /skp status",
    "- /skp checklist",
    "- /skp next",
    "- /skp risk",
    "- /skp mission <title>",
    "",
    "Execution remains approval-gated and disabled in VOC Alpha."
  ].join("\n");
}

export function skpStatus(): string {
  return [
    "SKP status, Sire:",
    "",
    "Mode: planning and checklist assistance only.",
    "Execution: disabled.",
    "Browser automation: disabled.",
    "External account actions: disabled.",
    "Approval discipline: active."
  ].join("\n");
}

export function skpChecklist(): string {
  return [
    "SKP checklist, Sire:",
    "",
    "1. Confirm objective.",
    "2. Identify required account/session context.",
    "3. Identify external side effects.",
    "4. Create a mission for tracking.",
    "5. Prepare approval request before any execution.",
    "6. Execute manually until approved automation exists."
  ].join("\n");
}

export function skpNextStep(): string {
  return [
    "SKP next step, Sire:",
    "",
    "Create or select the SKP mission, define the exact desired outcome, then run the risk checklist before any external action."
  ].join("\n");
}

export function skpRiskReview(): string {
  return [
    "SKP risk review, Sire:",
    "",
    "- Does this touch an external account?",
    "- Does it post, purchase, message, submit, or modify data?",
    "- Does it require browser automation or Playwright?",
    "- Does it expose credentials or session state?",
    "- If yes to any item: approval required before execution."
  ].join("\n");
}

export function skpExecutionBlocked(request: string): string {
  return [
    "Approval required, Sire.",
    "",
    "I will not run SKP automation in VOC Alpha.",
    "I can create a mission and prepare an approval request for manual review.",
    "",
    `Requested action: ${request}`
  ].join("\n");
}
