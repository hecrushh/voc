import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { InfrastructureStatus, ResourceMetric, ServiceStatus, StatusTone } from "@/lib/types";

const execFileAsync = promisify(execFile);

async function commandExists(command: string) {
  try {
    await execFileAsync("which", [command], { timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

function checkedAt() {
  return new Date().toISOString();
}

function bytesToGiB(value: number) {
  return `${(value / 1024 / 1024).toFixed(1)} GiB`;
}

async function getVpsMetrics(): Promise<{ status: StatusTone; metrics: ResourceMetric[] }> {
  const [meminfo, loadavg, uptimeRaw, statvfs] = await Promise.all([
    readFile("/proc/meminfo", "utf8"),
    readFile("/proc/loadavg", "utf8"),
    readFile("/proc/uptime", "utf8"),
    execFileAsync("df", ["-k", "/"], { timeout: 1500 }).catch(() => null)
  ]);

  const mem = Object.fromEntries(
    meminfo.split("\n").flatMap((line) => {
      const match = line.match(/^([^:]+):\s+(\d+)/);
      return match ? [[match[1], Number(match[2])]] : [];
    })
  );

  const total = mem.MemTotal ?? 0;
  const available = mem.MemAvailable ?? 0;
  const swapTotal = mem.SwapTotal ?? 0;
  const swapFree = mem.SwapFree ?? 0;
  const used = total - available;
  const ramPercent = total ? Math.round((used / total) * 100) : undefined;
  const swapUsed = swapTotal - swapFree;
  const swapPercent = swapTotal ? Math.round((swapUsed / swapTotal) * 100) : undefined;
  const uptimeSeconds = Number(uptimeRaw.split(" ")[0] ?? 0);
  const uptimeDays = Math.floor(uptimeSeconds / 86400);
  const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);

  let diskMetric: ResourceMetric = { label: "Disk", value: "Unknown", detail: "df unavailable" };
  if (statvfs?.stdout) {
    const parts = statvfs.stdout.trim().split("\n").at(-1)?.split(/\s+/) ?? [];
    const size = Number(parts[1] ?? 0);
    const usedDisk = Number(parts[2] ?? 0);
    const usePercent = Number(String(parts[4] ?? "0").replace("%", ""));
    diskMetric = {
      label: "Disk",
      value: `${usePercent}%`,
      detail: `${bytesToGiB(usedDisk)} used of ${bytesToGiB(size)}`,
      percent: usePercent
    };
  }

  const metrics: ResourceMetric[] = [
    { label: "CPU load", value: loadavg.split(" ").slice(0, 3).join(" / "), detail: "1m / 5m / 15m" },
    { label: "RAM", value: `${ramPercent ?? 0}%`, detail: `${bytesToGiB(used)} used of ${bytesToGiB(total)}`, percent: ramPercent },
    { label: "Swap", value: `${swapPercent ?? 0}%`, detail: `${bytesToGiB(swapUsed)} used of ${bytesToGiB(swapTotal)}`, percent: swapPercent },
    diskMetric,
    { label: "Uptime", value: `${uptimeDays}d ${uptimeHours}h`, detail: "Read from /proc/uptime" }
  ];

  const pressure = [ramPercent ?? 0, swapPercent ?? 0, diskMetric.percent ?? 0];
  const status = pressure.some((value) => value >= 90) ? "degraded" : "online";

  return { status, metrics };
}

async function checkOllama(now: string): Promise<{ status: ServiceStatus; models: string[] }> {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags", { cache: "no-store" });

    if (!response.ok) {
      return {
        status: {
          name: "Ollama",
          status: "degraded",
          detail: `Responded with HTTP ${response.status}`,
          checked_at: now,
          source: "http://127.0.0.1:11434/api/tags"
        },
        models: []
      };
    }

    const data = (await response.json()) as { models?: Array<{ name?: string }> };
    const models = data.models?.flatMap((model) => (model.name ? [model.name] : [])) ?? [];

    return {
      status: {
        name: "Ollama",
        status: "online",
        detail: `${models.length} installed model${models.length === 1 ? "" : "s"}`,
        checked_at: now,
        source: "localhost API"
      },
      models
    };
  } catch {
    return {
      status: {
        name: "Ollama",
        status: "offline",
        detail: "Local API not reachable",
        checked_at: now,
        source: "http://127.0.0.1:11434"
      },
      models: []
    };
  }
}

async function checkRouter(now: string): Promise<ServiceStatus> {
  try {
    const response = await fetch("http://127.0.0.1:20128", { cache: "no-store" });
    return {
      name: "9Router",
      status: response.status < 500 ? "online" : "degraded",
      detail: `Local endpoint returned HTTP ${response.status}`,
      checked_at: now,
      source: "http://127.0.0.1:20128"
    };
  } catch {
    return {
      name: "9Router",
      status: "offline",
      detail: "Local endpoint not reachable",
      checked_at: now,
      source: "http://127.0.0.1:20128"
    };
  }
}

async function checkDocker(now: string): Promise<ServiceStatus> {
  const socketReadable = await access("/var/run/docker.sock", constants.R_OK)
    .then(() => true)
    .catch(() => false);

  return {
    name: "Docker",
    status: socketReadable ? "online" : "unknown",
    detail: socketReadable ? "Docker socket is present and readable" : "Docker socket is not readable by this process",
    checked_at: now,
    source: "/var/run/docker.sock"
  };
}

async function checkBinary(name: string, command: string, now: string): Promise<ServiceStatus> {
  const exists = await commandExists(command);

  return {
    name,
    status: exists ? "online" : "unknown",
    detail: exists ? `${command} binary found` : `${command} binary not found in PATH`,
    checked_at: now,
    source: "local PATH"
  };
}

async function checkCredentialPosture(name: string, envNames: string[], now: string): Promise<ServiceStatus> {
  const configured = envNames.some((envName) => Boolean(process.env[envName]));

  return {
    name,
    status: configured ? "planned" : "planned",
    detail: configured ? "Credential appears configured; value is intentionally hidden" : "No local credential configured; cloud calls disabled",
    checked_at: now,
    source: "environment posture only"
  };
}

export async function getInfrastructureStatus(): Promise<InfrastructureStatus> {
  const now = checkedAt();
  const [vps, ollama, router, docker, git, github, cloudflare, opencode] = await Promise.all([
    getVpsMetrics(),
    checkOllama(now),
    checkRouter(now),
    checkDocker(now),
    checkBinary("Git", "git", now),
    checkCredentialPosture("GitHub", ["GITHUB_TOKEN", "GH_TOKEN"], now),
    checkCredentialPosture("Cloudflare", ["CLOUDFLARE_API_TOKEN", "CF_API_TOKEN"], now),
    checkBinary("OpenCode", "opencode", now)
  ]);

  const services = [ollama.status, router, docker, git, github, cloudflare, opencode];

  await stat("/opt/voc").catch(() => null);

  return {
    checked_at: now,
    vps,
    services,
    models: ollama.models
  };
}
