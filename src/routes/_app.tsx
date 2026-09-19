import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app/shell";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!bg-surface !text-fg !border-border !shadow-[var(--shadow-border)]",
        }}
      />
    </AppShell>
  );
}
