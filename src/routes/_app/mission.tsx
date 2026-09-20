import { createFileRoute } from "@tanstack/react-router";
import { MissionTheatre } from "@/components/app/mission-theatre";

export const Route = createFileRoute("/_app/mission")({
  component: MissionTheatre,
});
