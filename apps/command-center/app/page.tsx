import { Bot, Cpu, Database, HardDrive, Server } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Meter, StatusBadge } from "@/components/ui";
import { agents } from "@/lib/agents";
import { listMissions } from "@/lib/db";
import { getInfrastructureStatus } from "@/lib/infrastructure";
import { listMemoryFiles } from "@/lib/memory";

export const dynamic = "force-dynamic";

export default async function StrategicOverviewPage() {
  const [infrastructure, missions, memoryFiles] = await Promise.all([
    getInfrastructureStatus(),
    Promise.resolve(listMissions()),
    listMemoryFiles()
  ]);

  const missionSummary = {
    queued: missions.filter((mission) => mission.status === "queued").length,
    active: missions.filter((mission) => mission.status === "active").length,
    blocked: missions.filter((mission) => mission.status === "blocked").length,
    completed: missions.filter((mission) => mission.status === "completed").length
  };

  const ollama = infrastructure.services.find((service) => service.name === "Ollama");
  const router = infrastructure.services.find((service) => service.name === "9Router");

  return (
    <>
      <PageHeader
        eyebrow="Strategic Overview"
        title="VOC operating picture"
        description="Read-only command summary for this VPS. Mission data is persisted in SQLite; infrastructure checks do not mutate services or display secrets."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>VPS status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-4 sm:col-span-2">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Ubuntu VPS</div>
                  <div className="text-sm text-muted-foreground">Checked {new Date(infrastructure.checked_at).toLocaleString()}</div>
                </div>
              </div>
              <StatusBadge status={infrastructure.vps.status} />
            </div>
            {infrastructure.vps.metrics.map((metric) => (
              <div key={metric.label} className="rounded-md border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <span className="font-semibold">{metric.value}</span>
                </div>
                {typeof metric.percent === "number" ? <Meter value={metric.percent} /> : null}
                {metric.detail ? <div className="mt-2 text-xs text-muted-foreground">{metric.detail}</div> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ollama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <Cpu className="h-5 w-5 text-primary" />
              <StatusBadge status={ollama?.status ?? "planned"} />
            </div>
            <div className="text-sm text-muted-foreground">{ollama?.detail ?? "Status unavailable"}</div>
            <div className="mt-4 text-2xl font-semibold">{infrastructure.models.length}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Installed models</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9Router</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <HardDrive className="h-5 w-5 text-primary" />
              <StatusBadge status={router?.status ?? "planned"} />
            </div>
            <div className="text-sm text-muted-foreground">{router?.detail ?? "Status unavailable"}</div>
            {router?.status === "planned" ? (
              <div className="mt-3 rounded-md border border-sky-400/20 bg-sky-400/10 p-3 text-xs text-sky-100">
                Planned means 9Router is installed for manual use but is not configured as a persistent service.
              </div>
            ) : null}
            <div className="mt-4 text-xs text-muted-foreground">{router?.source}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mission summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {Object.entries(missionSummary).map(([status, count]) => (
              <div key={status} className="rounded-md border border-border bg-background p-4">
                <div className="text-2xl font-semibold">{count}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{status}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <Bot className="h-5 w-5 text-primary" />
              <div className="text-2xl font-semibold">{agents.length}</div>
            </div>
            <div className="text-sm text-muted-foreground">All agents are intentionally shown as Offline / Planned. No autonomous worker is active in v0.1.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div className="text-2xl font-semibold">{memoryFiles.length}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Read-only markdown explorer over `/opt/voc/docs` and `/opt/voc/memory`.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Installed models</CardTitle>
        </CardHeader>
        <CardContent>
          {infrastructure.models.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {infrastructure.models.map((model) => (
                <span key={model} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {model}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No models reported by the Ollama API. This is live status, not a placeholder.</div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
