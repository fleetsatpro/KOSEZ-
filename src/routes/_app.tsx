import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app/shell";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isPending } = useCurrentUserState();

  if (authEnabled && isPending) {
    return (
      <div className="modern-ui flex min-h-dvh items-center justify-center bg-bg text-fg">
        <div className="text-center">
          <span className="mx-auto block size-2 animate-pulse rounded-full bg-primary" />
          <p className="mt-4 text-sm text-muted">Préparation de votre espace…</p>
        </div>
      </div>
    );
  }

  if (authEnabled && !user) {
    return <Navigate to="/login" />;
  }

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
