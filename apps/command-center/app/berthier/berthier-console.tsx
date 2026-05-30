"use client";

import { useState } from "react";
import { CheckCircle2, Send, ShieldAlert, XCircle } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge, Textarea } from "@/components/ui";
import type { Approval, CommandRecord, Mission } from "@/lib/types";
import type { BerthierCommandResult } from "@/lib/mission-engine";

type BerthierConsoleProps = {
  initialCommands: CommandRecord[];
  initialApprovals: Approval[];
};

type ApiResult = {
  result?: BerthierCommandResult;
  error?: string;
};

export function BerthierConsole({ initialCommands, initialApprovals }: BerthierConsoleProps) {
  const [commandText, setCommandText] = useState("Create mission: ");
  const [commands, setCommands] = useState(initialCommands);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [lastResult, setLastResult] = useState<BerthierCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitCommand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/berthier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: commandText })
    });
    const payload = (await response.json()) as ApiResult;
    setSubmitting(false);

    if (!response.ok || !payload.result) {
      setError(payload.error ?? "BERTHIER command failed.");
      return;
    }

    setLastResult(payload.result);
    setCommands((current) => [payload.result!.command, ...current.filter((command) => command.id !== payload.result!.command.id)].slice(0, 25));
    if (payload.result.approval) {
      setApprovals((current) => [payload.result!.approval as Approval, ...current.filter((approval) => approval.id !== payload.result!.approval?.id)]);
    }
    setCommandText("");
  }

  async function resolveApproval(approval: Approval, status: "approved" | "rejected") {
    const response = await fetch(`/api/approvals/${approval.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, approved_by: "voc", resolution_note: `${status} through BERTHIER console` })
    });
    const payload = (await response.json()) as { approval?: Approval; error?: string };

    if (!response.ok || !payload.approval) {
      setError(payload.error ?? "Approval update failed.");
      return;
    }

    setApprovals((current) => current.map((item) => (item.id === payload.approval?.id ? payload.approval : item)));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Controlled command intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-sky-400/25 bg-sky-400/10 p-4 text-sm text-sky-100">
            BERTHIER intake is active for Mission Engine v0.2 only: mission creation, mission status updates, status summaries, blocked mission lists, and approval requests. No autonomous agents, Telegram, provider calls, or external execution are enabled.
          </div>
          <form className="space-y-3" onSubmit={submitCommand}>
            <label className="block text-sm">
              <span className="mb-2 block text-muted-foreground">Command</span>
              <Textarea
                value={commandText}
                onChange={(event) => setCommandText(event.target.value)}
                placeholder="Create mission: Build command parser"
                required
              />
            </label>
            {error ? <div className="rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</div> : null}
            <Button type="submit" disabled={submitting} className="w-full md:w-auto">
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Submitting" : "Submit controlled command"}
            </Button>
          </form>

          {lastResult ? (
            <div className="rounded-md border border-border bg-background p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="font-medium">BERTHIER response</div>
                <StatusBadge status={lastResult.outcome} />
              </div>
              <p className="text-sm text-muted-foreground">{lastResult.response}</p>
              {lastResult.mission ? <MissionSummary mission={lastResult.mission} /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvals.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No pending approvals.</div>
          ) : (
            approvals.map((approval) => (
              <article key={approval.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldAlert className="h-4 w-4 text-amber-300" />
                      {approval.action_type}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{approval.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={approval.risk_level} />
                    <StatusBadge status={approval.status} />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">ID: {approval.id}</div>
                {approval.status === "requested" ? (
                  <div className="mt-4 flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => resolveApproval(approval, "approved")}>
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => resolveApproval(approval, "rejected")}>
                      <XCircle className="mr-2 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent command history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {commands.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No commands recorded.</div>
          ) : (
            commands.map((command) => (
              <div key={command.id} className="rounded-md border border-border bg-background p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{command.raw_text}</span>
                  <div className="flex gap-2">
                    <StatusBadge status={command.parsed_intent} />
                    <StatusBadge status={command.status} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(command.created_at).toLocaleString()} · Risk: {command.risk_level} · Mission: {command.linked_mission_id ?? "none"}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MissionSummary({ mission }: { mission: Mission }) {
  return (
    <div className="mt-4 rounded-md border border-border/70 p-3 text-xs text-muted-foreground">
      Mission: {mission.title} · Status: {mission.status} · Owner: {mission.owner_agent} · ID: {mission.id}
    </div>
  );
}
