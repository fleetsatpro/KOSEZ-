
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { RouterNotFound } from "@/components/app/router-not-found";
import { routeTree } from "./routeTree.gen";

/**
 * The router factory is framework infrastructure; the NotFound UI lives in
 * its own component module so React Fast Refresh can preserve HMR boundaries.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: RouterNotFound,
  });
}
