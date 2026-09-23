import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { LearnDashboard } from "@/components/app/learn-dashboard";

export const Route = createFileRoute("/_app/learn")({
  component: LearnPage,
});

function LearnPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/+$/, "") || "/",
  });

  if (pathname === "/learn") {
    return <LearnDashboard />;
  }

  return <Outlet />;
}
