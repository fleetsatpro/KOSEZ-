import { createFileRoute } from "@tanstack/react-router";
import { MissionTheatreExperience } from "@/components/app/mission-theatre-experience";

export const Route = createFileRoute("/_app/mission")({
  validateSearch: (search: Record<string, unknown>) => ({
    missionId:
      typeof search.missionId === "string" && search.missionId.trim()
        ? search.missionId.trim()
        : undefined,
  }),
  component: MissionRoute,
});

function MissionRoute() {
  const { missionId } = Route.useSearch();
  return <MissionTheatreExperience missionId={missionId} />;
}
