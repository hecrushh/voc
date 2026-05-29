import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@/components/ui";
import { agents } from "@/lib/agents";

export default function AgentBoardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Agent Board"
        title="Command staff readiness"
        description="All agents are role definitions in v0.1. They are displayed for planning and mission ownership only; no autonomous agent process is running."
      />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{agent.name}</CardTitle>
                <div className="mt-2 text-lg font-semibold text-foreground">{agent.title}</div>
              </div>
              <StatusBadge status={agent.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Domain</div>
                <div className="mt-1 text-sm">{agent.domain}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Responsibilities</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agent.responsibilities.map((item) => (
                    <span key={item} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">v0.1 constraints</div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {agent.constraints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
