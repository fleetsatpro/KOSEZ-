import { createFileRoute } from "@tanstack/react-router";
import { HomeDashboard } from "@/components/app/home-dashboard";

export const Route = createFileRoute("/_app/")({
  component: BlossomHome,
});

function BlossomHome() {
  // Home owns the full viewport stage — no Page chrome.
  return <HomeDashboard />;
}
