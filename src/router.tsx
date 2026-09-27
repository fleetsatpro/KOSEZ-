import { createRouter, Link } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
      <p className="font-display text-2xl tracking-tight">Page introuvable</p>
      <p className="mt-2 text-sm text-muted">Ce chemin n'existe pas dans le voyage.</p>
      <Link to="/" className="mt-6 text-sm text-primary">
        Retour à BLOSSOM
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
