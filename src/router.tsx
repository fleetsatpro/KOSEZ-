import { createRouter, Link } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { MESSAGES } from "@/lib/i18n/messages";
import { routeTree } from "./routeTree.gen";

/**
 * NotFound is outside the app shell. Import message *data* only from
 * `@/lib/i18n/messages` — never the `@/lib/i18n` barrel (Zustand store).
 * Store in the router module collapses Nitro SSR (`ssr_exports` missing → 500).
 */
function NotFound() {
  const m = MESSAGES.fr;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
      <p className="font-display text-2xl tracking-tight">{m.errors.notFound}</p>
      <p className="mt-2 text-sm text-muted">{m.errors.notFoundDetail}</p>
      <Link to="/" className="mt-6 text-sm text-primary">
        {m.errors.backToBlossom}
      </Link>
    </main>
  );
}

// getRouter is a framework-required factory export, not a React component.
 // eslint-disable-next-line react-refresh/only-export-components
export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
  });
}
