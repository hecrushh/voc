import { AlertTriangle, LockKeyhole, RadioTower, ScrollText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@/components/ui";
import { listApprovals, listCommands } from "@/lib/db";
import { getInfrastructureStatus } from "@/lib/infrastructure";
import type { ServiceStatus } from "@/lib/types";
import { BerthierConsole } from "./berthier-console";

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
  const commands = listCommands(25);
  const approvals = listApprovals("requested");
  const hermesRuntime = infrastructure.runtimes.find((runtime) => runtime.name === "Hermes Runtime");
  const hermesConfig = infrastructure.runtimes.find((runtime) => runtime.name === "Hermes Configuration");
  const configuredProviders = infrastructure.providers.filter((provider) => provider.status === "configured" || provider.status === "online").length;

  return (
    <>
      <PageHeader
        eyebrow="BERTHIER"
        title="Chief of Staff command surface"
        description="Controlled Mission Engine v0.2 intake. BERTHIER can create and update mission state, request approvals, and report current status without autonomous agents, Telegram, provider execution, or external side effects."
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <BerthierConsole initialCommands={commands} initialApprovals={approvals} />

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
            Mission Engine v0.2 can write mission, command, event, and approval records only. It still cannot invoke autonomous workers.
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
