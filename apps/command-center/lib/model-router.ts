export type SafeModelCategory = "summary" | "drafting" | "classification" | "reasoning" | "technical_reasoning";
export type ProviderName = "ollama_local" | "deepseek" | "openrouter" | "mimo" | "ollama_cloud" | "qwen3";

export type ModelRouteRequest = {
  category: SafeModelCategory;
  prompt: string;
  fallback: string;
  preferredProvider?: ProviderName;
};

export type ModelRouteResult = {
  usedProvider: ProviderName | "deterministic_fallback";
  text: string;
  safe: boolean;
  reason: string;
};

const forbiddenPatterns = [
  /\bexecute\b/i,
  /\bdeploy\b/i,
  /\bpost\b/i,
  /\bpublish\b/i,
  /\bdelete\b/i,
  /\bmodify account\b/i,
  /\bpush\b/i,
  /\bmerge\b/i,
  /\bcreate\s+pr\b/i,
  /\bcreate\s+issue\b/i,
  /\brun\s+skp\b/i,
  /\bplaywright\b/i,
  /\bpurchase\b|\bbuy\b/i
];

export function routeSafeModelTask(request: ModelRouteRequest): ModelRouteResult {
  const safety = validateModelRequest(request.prompt);
  if (!safety.safe) {
    return { usedProvider: "deterministic_fallback", text: request.fallback, safe: false, reason: safety.reason };
  }

  const provider = selectProvider(request.category, request.preferredProvider);
  if (!provider) {
    return { usedProvider: "deterministic_fallback", text: request.fallback, safe: true, reason: "No configured provider available; deterministic fallback returned." };
  }

  // VOC Alpha intentionally keeps model calls optional and side-effect free. Provider
  // selection is exposed for routing decisions; deterministic fallback preserves core UX.
  return { usedProvider: provider, text: request.fallback, safe: true, reason: `${provider} available; deterministic Alpha fallback returned without side effects.` };
}

export function validateModelRequest(prompt: string): { safe: boolean; reason: string } {
  const forbidden = forbiddenPatterns.find((pattern) => pattern.test(prompt));
  if (forbidden) return { safe: false, reason: "Model request contains forbidden execution intent." };
  return { safe: true, reason: "Model request is read-only." };
}

export function selectProvider(category: SafeModelCategory, preferredProvider?: ProviderName): ProviderName | null {
  const configured = getProviderStatus();
  if (preferredProvider && configured[preferredProvider]) return preferredProvider;

  const order: ProviderName[] =
    category === "technical_reasoning"
      ? ["deepseek", "openrouter", "mimo", "ollama_cloud", "ollama_local"]
      : category === "reasoning"
        ? ["openrouter", "deepseek", "mimo", "ollama_cloud", "ollama_local"]
        : ["qwen3", "ollama_local", "openrouter", "ollama_cloud", "deepseek", "mimo"];

  return order.find((provider) => configured[provider]) ?? null;
}

export function getProviderStatus(): Record<ProviderName, boolean> {
  const ollamaLocal = Boolean(process.env.OLLAMA_LOCAL_AVAILABLE === "1" || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST);
  return {
    qwen3: ollamaLocal || Boolean(process.env.QWEN3_AVAILABLE === "1"),
    ollama_local: ollamaLocal,
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    mimo: Boolean(process.env.MIMO_API_KEY),
    ollama_cloud: Boolean(process.env.OLLAMA_API_KEY)
  };
}
