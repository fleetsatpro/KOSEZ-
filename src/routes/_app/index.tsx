import { createFileRoute } from "@tanstack/react-router";
import { HomeDashboard } from "@/components/app/home-dashboard";
import { Page } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/")({
  component: BlossomHome,
});

function BlossomHome() {
  return (
    <Page>
      <HomeDashboard />
    </Page>
  );
}
