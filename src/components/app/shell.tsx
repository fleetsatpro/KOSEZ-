import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Mic,
  Sprout,
  User,
} from "lucide-react";
import { Welcome } from "@/components/app/welcome";
import { ParentView } from "@/components/app/parent-view";
import { TeacherStudio } from "@/components/app/teacher-studio";
import { OrgStudio } from "@/components/app/org-studio";
import { ChildHome } from "@/components/app/child-home";
import { Wordmark } from "@/components/app/primitives";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

const NAV = [
  {
    to: "/",
    label: "BLOSSOM",
    icon: Sprout,
    hint: ["/", "/plant", "/mission", "/explore", "/connect", "/tandem"],
    description: "Votre parcours",
  },
  {
    to: "/osez",
    label: "OSEZ",
    icon: Mic,
    hint: ["/osez"],
    description: "Parler maintenant",
  },
  {
    to: "/learn",
    label: "ATELIER",
    icon: BookOpen,
    hint: ["/learn", "/pronlab", "/library", "/immersion"],
    description: "Pratiquer & ancrer",
  },
  {
    to: "/moi",
    label: "MOI",
    icon: User,
    hint: ["/moi"],
    description: "Votre espace",
  },
] as const;

function isActive(pathname: string, hint: readonly string[]) {
  return hint.some((path) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const hasEntered = useBlossom((s) => s.hasEntered);
  const parentMode = useBlossom((s) => s.parentMode);
  const teacherMode = useBlossom((s) => s.teacherMode);
  const orgMode = useBlossom((s) => s.orgMode);
  const childMode = useBlossom((s) => s.childMode);
  const journey = useJourney();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideChrome =
    pathname.startsWith("/osez/") || pathname.startsWith("/tandem/");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasEntered) return <Welcome />;
  if (childMode) {
    return (
      <div className="child-skin paper-grain min-h-dvh bg-bg text-fg">
        <ChildHome />
      </div>
    );
  }
  if (parentMode) {
    return (
      <div className="paper-grain min-h-dvh bg-bg text-fg">
        <ParentView />
      </div>
    );
  }
  if (orgMode) {
    return (
      <div className="paper-grain min-h-dvh bg-bg text-fg">
        <OrgStudio />
      </div>
    );
  }
  if (teacherMode) {
    return (
      <div className="paper-grain min-h-dvh bg-bg text-fg">
        <TeacherStudio />
      </div>
    );
  }

  return (
    <div className="modern-ui paper-grain min-h-dvh bg-bg text-fg">
      {!hideChrome && (
        <aside className="kosez-sidebar fixed inset-y-0 left-0 z-20 hidden flex-col border-r px-5 py-8 lg:flex">
          <div className="flex items-start justify-between gap-4">
            <Wordmark />
            <span
              className="mt-1 flex size-8 items-center justify-center rounded-full bg-surface-2 text-primary"
              aria-hidden
            >
              <Sprout className="size-4" strokeWidth={1.7} />
            </span>
          </div>

          <nav className="mt-12" aria-label="Navigation principale">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Votre espace
            </p>
            <div className="mt-3 grid gap-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.hint);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "kosez-sidebar-link group flex min-h-14 items-center gap-3 rounded-xl px-3.5 transition-[background-color,color,transform] duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted hover:-translate-y-0.5 hover:bg-surface-2 hover:text-fg",
                    )}
                    aria-current={active ? "page" : undefined}
                    data-active={active}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-primary-foreground/10 text-primary-foreground"
                          : "bg-surface-2 text-primary",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={active ? 2 : 1.7} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium tracking-wide">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px]",
                          active
                            ? "text-primary-foreground/65"
                            : "text-subtle",
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-auto rounded-2xl border border-border bg-bg/70 p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                  BLOSSOM
                </p>
                <p className="mt-1 font-display text-lg">{journey.stage.label}</p>
              </div>
              <span className="font-display text-xl tabular-nums text-primary">
                {journey.points}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.max(4, Math.round(journey.progress * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              {journey.stage.nextAt
                ? `${journey.remaining} point${journey.remaining > 1 ? "s" : ""} avant le prochain stade.`
                : "Votre croissance continue."}
            </p>
          </div>
        </aside>
      )}

      <div className={cn("min-h-dvh", !hideChrome && "lg:pl-[246px]")}>{children}</div>

      {!hideChrome && (
        <nav
          className="kosez-mobile-nav fixed inset-x-0 bottom-0 z-20 border-t lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Navigation principale"
        >
          <ul className="grid grid-cols-4 px-1 pt-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.hint);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "kosez-mobile-link flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[0.625rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-150",
                      active
                        ? "bg-primary/8 text-primary"
                        : "text-subtle",
                    )}
                    aria-current={active ? "page" : undefined}
                    data-active={active}
                  >
                    <Icon className="size-4" strokeWidth={active ? 2 : 1.6} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
