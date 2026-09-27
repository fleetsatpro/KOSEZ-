import { createFileRoute } from "@tanstack/react-router";
import { MissionTheatreExperience } from "@/components/app/mission-theatre-experience";
import { LearningSurfaceGate } from "@/components/app/learning-surface-gate";

export const Route = createFileRoute("/_app/mission")({
  component: () => (
    <LearningSurfaceGate surface="mission">
      <MissionTheatreExperience />
    </LearningSurfaceGate>
  ),
});
