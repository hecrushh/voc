import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Meter, StatusBadge } from "@/components/ui";
import { getInfrastructureStatus } from "@/lib/infrastructure";

export const dynamic = "force-dynamic";

export default async function InfrastructurePage() {
  const infrastructure = await getInfrastructureStatus();

  return (
    <>
      <PageHeader
        eyebrow="Infrastructure"
        title="Read-only infrastructure status"
        description="VPS, Docker, GitHub, Cloudflare, Ollama, 9Router, and OpenCode status posture. GitHub and Cloudflare do not call external services or display credentials."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>VPS resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-medium">Component</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Detail</th>
                  <th className="py-3 pr-4 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {infrastructure.services.map((service) => (
                  <tr key={service.name} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-medium">{service.name}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{service.detail}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{service.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Status doctrine</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-5">
          <div><StatusBadge status="online" /> <p className="mt-2">Reachable and healthy during the read-only check.</p></div>
          <div><StatusBadge status="degraded" /> <p className="mt-2">Reachable, but returned an unhealthy response or crossed a resource threshold.</p></div>
          <div><StatusBadge status="restricted" /> <p className="mt-2">Intentionally blocked by least-privilege runtime policy.</p></div>
          <div><StatusBadge status="planned" /> <p className="mt-2">Installed, manual, or future integration with no persistent service expected.</p></div>
          <div><StatusBadge status="offline" /> <p className="mt-2">Expected persistent service is not reachable.</p></div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Model inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {infrastructure.models.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {infrastructure.models.map((model) => (
                <div key={model} className="rounded-md border border-border bg-background p-4 text-sm">
                  {model}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Ollama returned no model inventory during this read-only check.</div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
