import { createFileRoute } from "@tanstack/react-router";
import { MissionTheatreExperience } from "@/components/app/mission-theatre-experience";

export const Route = createFileRoute("/_app/mission")({
  component: MissionTheatreExperience,
});
