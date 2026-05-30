import { AlertTriangle, LockKeyhole, RadioTower, ScrollText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, StatusBadge, Textarea } from "@/components/ui";
import { getInfrastructureStatus } from "@/lib/infrastructure";
import type { ServiceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatusTable({ items, noun }: { items: ServiceStatus[]; noun: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-3 pr-4 font-medium">{noun}</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 pr-4 font-medium">Detail</th>
            <th className="py-3 pr-4 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="border-b border-border/70">
              <td className="py-3 pr-4 font-medium">{item.name}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={item.status} />
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{item.detail}</td>
              <td className="py-3 pr-4 text-muted-foreground">{item.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BerthierPage() {
  const infrastructure = await getInfrastructureStatus();
  const hermesRuntime = infrastructure.runtimes.find((runtime) => runtime.name === "Hermes Runtime");
  const hermesConfig = infrastructure.runtimes.find((runtime) => runtime.name === "Hermes Configuration");
  const configuredProviders = infrastructure.providers.filter((provider) => provider.status === "configured" || provider.status === "online").length;

  return (
    <>
      <PageHeader
        eyebrow="BERTHIER"
        title="Chief of Staff command surface"
        description="Read-only command intake draft for VOC coordination. This page displays Hermes runtime posture and provider metadata only; it cannot submit, execute, or call models."
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Command intake draft — disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
              <div className="mb-2 flex items-center gap-2 font-medium text-amber-50">
                <LockKeyhole className="h-4 w-4" />
                Intake is deliberately non-functional
              </div>
              No POST endpoint exists for BERTHIER. These fields are read-only UI scaffolding: no submit handler, no autonomous execution, no provider/model calls, and no secrets are displayed.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-muted-foreground">Commander</span>
                <Input value="VOC" readOnly aria-label="Commander" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted-foreground">Priority</span>
                <Input value="Draft only" readOnly aria-label="Priority" />
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Command objective</span>
              <Textarea
                value="Draft command text may be composed here in a future controlled workflow, but this release intentionally does not transmit or execute anything."
                readOnly
                aria-label="Command objective"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Submission</div>
                <div className="mt-2 font-semibold">Disabled</div>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Execution</div>
                <div className="mt-2 font-semibold">Manual only</div>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">LLM calls</div>
                <div className="mt-2 font-semibold">None</div>
              </div>
            </div>

            <Button type="button" disabled className="w-full md:w-auto">
              Submit disabled by safety doctrine
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hermes runtime posture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-medium">
                      <RadioTower className="h-4 w-4 text-primary" />
                      Runtime
                    </div>
                    <StatusBadge status={hermesRuntime?.status ?? "missing"} />
                  </div>
                  <p className="text-sm text-muted-foreground">{hermesRuntime?.detail ?? "Hermes runtime status unavailable"}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-medium">
                      <ScrollText className="h-4 w-4 text-primary" />
                      Configuration
                    </div>
                    <StatusBadge status={hermesConfig?.status ?? "unconfigured"} />
                  </div>
                  <p className="text-sm text-muted-foreground">{hermesConfig?.detail ?? "Hermes configuration metadata unavailable"}</p>
                </div>
              </div>
              <StatusTable items={infrastructure.runtimes} noun="Hermes metadata" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provider posture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="text-2xl font-semibold">{configuredProviders}/{infrastructure.providers.length}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Configured or locally reachable providers</div>
                <p className="mt-2 text-sm text-muted-foreground">Credential checks detect presence only. Values are hidden and no model call is made.</p>
              </div>
              <StatusTable items={infrastructure.providers} noun="Provider" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Safety doctrine</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
            <div className="mb-2 font-medium text-foreground">Observe, do not act</div>
            BERTHIER is a command surface only. It does not invoke agents, shell commands, tools, APIs, or LLM providers.
          </div>
          <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            <LockKeyhole className="mb-3 h-5 w-5 text-fuchsia-200" />
            <div className="mb-2 font-medium text-foreground">Secrets stay sealed</div>
            Configuration status is derived from metadata and environment-variable presence only; secret values are never rendered.
          </div>
          <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            <AlertTriangle className="mb-3 h-5 w-5 text-amber-300" />
            <div className="mb-2 font-medium text-foreground">No autonomous execution</div>
            Command intake is intentionally disabled until explicit approval, authorization, audit logging, and manual review controls exist.
          </div>
          <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            <ScrollText className="mb-3 h-5 w-5 text-sky-300" />
            <div className="mb-2 font-medium text-foreground">Reuse safe checks</div>
            Live posture comes from the existing getInfrastructureStatus path, preserving the same read-only filesystem and network probes used by Infrastructure.
          </div>
        </CardContent>
      </Card>
    </>
  );
}
