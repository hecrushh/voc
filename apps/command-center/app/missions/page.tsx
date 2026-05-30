import { PageHeader } from "@/components/page-header";
import { agents } from "@/lib/agents";
import { listMissionEvents, listMissions } from "@/lib/db";
import { MissionRegistry } from "./mission-registry";

export const dynamic = "force-dynamic";

export default function MissionsPage() {
  const missions = listMissions();
  const missionEvents = Object.fromEntries(missions.map((mission) => [mission.id, listMissionEvents(mission.id)]));

  return (
    <>
      <PageHeader
        eyebrow="Mission Registry"
        title="Mission queue and state control"
        description="CRUD for command missions backed by SQLite. Assigning an owner does not execute an agent; it only records planning ownership."
      />
      <MissionRegistry initialMissions={missions} initialEvents={missionEvents} agents={agents} />
    </>
  );
}
