import { createFileRoute } from "@tanstack/react-router";
import { MissionDashboard } from "@/components/app/mission-dashboard";

export const Route = createFileRoute("/_app/mission")({
  component: MissionDashboard,
});
