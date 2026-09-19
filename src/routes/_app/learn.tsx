import { createFileRoute } from "@tanstack/react-router";
import { LearnDashboard } from "@/components/app/learn-dashboard";

export const Route = createFileRoute("/_app/learn")({
  component: LearnPage,
});

function LearnPage() {
  return <LearnDashboard />;
}
