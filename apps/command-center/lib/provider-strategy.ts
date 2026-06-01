import type { Capability } from "./capability-router.ts";

export type ProviderStrategy = "worker_pool" | "command_brain";

const strategyMap: Record<Capability, ProviderStrategy> = {
  coding: "worker_pool",
  research: "worker_pool",
  marketing: "worker_pool",
  security: "worker_pool",
  devops: "worker_pool",
  planning: "command_brain",
};

export function resolveProviderStrategy(capability: Capability): ProviderStrategy {
  return strategyMap[capability];
}

export function formatProviderStrategy(strategy: ProviderStrategy): string {
  return strategy === "command_brain" ? "command_brain" : "worker_pool";
}
