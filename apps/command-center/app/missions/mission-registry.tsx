"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, StatusBadge, Textarea } from "@/components/ui";
import type { Agent, Mission, MissionInput, MissionPriority, MissionStatus } from "@/lib/types";

const statuses: MissionStatus[] = ["queued", "active", "blocked", "completed", "cancelled"];
const priorities: MissionPriority[] = ["low", "normal", "high", "critical"];

const emptyForm: MissionInput = {
  title: "",
  description: "",
  status: "queued",
  priority: "normal",
  owner_agent: "berthier"
};

export function MissionRegistry({ initialMissions, agents }: { initialMissions: Mission[]; agents: Agent[] }) {
  const [missions, setMissions] = useState(initialMissions);
  const [form, setForm] = useState<MissionInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        missions: missions.filter((mission) => mission.status === status)
      })),
    [missions]
  );

  function startEdit(mission: Mission) {
    setEditingId(mission.id);
    setForm({
      title: mission.title,
      description: mission.description,
      status: mission.status,
      priority: mission.priority,
      owner_agent: mission.owner_agent
    });
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submitMission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const endpoint = editingId ? `/api/missions/${editingId}` : "/api/missions";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = (await response.json()) as { mission?: Mission; error?: string };

    setSaving(false);

    if (!response.ok || !payload.mission) {
      setError(payload.error ?? "Mission save failed.");
      return;
    }

    setMissions((current) =>
      editingId ? current.map((mission) => (mission.id === payload.mission?.id ? payload.mission : mission)) : [payload.mission as Mission, ...current]
    );
    resetForm();
  }

  async function removeMission(id: string) {
    const response = await fetch(`/api/missions/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setError("Mission delete failed.");
      return;
    }

    setMissions((current) => current.filter((mission) => mission.id !== id));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editingId ? "Edit mission" : "New mission"}</CardTitle>
          {editingId ? (
            <Button type="button" variant="ghost" size="icon" onClick={resetForm} aria-label="Cancel edit">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitMission}>
            <label className="block text-sm">
              <span className="mb-2 block text-muted-foreground">Title</span>
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted-foreground">Description</span>
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-2 block text-muted-foreground">Status</span>
                <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MissionStatus })}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-muted-foreground">Priority</span>
                <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as MissionPriority })}>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-2 block text-muted-foreground">Owner agent</span>
              <Select value={form.owner_agent} onChange={(event) => setForm({ ...form, owner_agent: event.target.value })}>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </Select>
            </label>
            {error ? <div className="rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</div> : null}
            <Button type="submit" disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Saving" : editingId ? "Update mission" : "Create mission"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-2">
        {grouped.map((group) => (
          <Card key={group.status}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{group.status}</CardTitle>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{group.missions.length}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.missions.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No missions in this state.</div>
              ) : (
                group.missions.map((mission) => (
                  <article key={mission.id} className="rounded-md border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{mission.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{mission.description || "No description supplied."}</p>
                      </div>
                      <StatusBadge status={mission.priority} />
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>Owner: {agents.find((agent) => agent.id === mission.owner_agent)?.name ?? mission.owner_agent}</div>
                      <div>Updated: {new Date(mission.updated_at).toLocaleString()}</div>
                      <div className="sm:col-span-2">ID: {mission.id}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(mission)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeMission(mission.id)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
