import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Mic,
  Sprout,
  User,
  Users,
} from "lucide-react";
import { Welcome } from "@/components/app/welcome";
import { ParentView } from "@/components/app/parent-view";
import { TeacherStudio } from "@/components/app/teacher-studio";
import { OrgStudio } from "@/components/app/org-studio";
import { ChildHome } from "@/components/app/child-home";
import { Wordmark } from "@/components/app/primitives";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "BLOSSOM", icon: Sprout, hint: ["/", "/plant", "/mission"] },
  { to: "/osez", label: "OSEZ", icon: Mic, hint: ["/osez"] },
  { to: "/explore", label: "EXPLORE", icon: Compass, hint: ["/explore"] },
  { to: "/connect", label: "CONNECT", icon: Users, hint: ["/connect", "/tandem"] },
  { to: "/learn", label: "LEARN", icon: BookOpen, hint: ["/learn", "/pronlab", "/library", "/immersion"] },
  { to: "/moi", label: "MOI", icon: User, hint: ["/moi"] },
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
    <div className="paper-grain min-h-dvh bg-bg text-fg">
      {!hideChrome && (
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-surface/80 px-5 py-8 backdrop-blur-sm lg:flex">
          <Wordmark />
          <nav className="mt-10 flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.hint);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm tracking-wide transition-colors duration-150",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.7} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto text-xs leading-relaxed text-subtle">
            Your language.
            <br />
            Your journey.
            <br />
            Your BLOSSOM.
          </p>
        </aside>
      )}

      <div className={cn(!hideChrome && "lg:pl-56")}>{children}</div>

      {!hideChrome && (
        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid grid-cols-6 px-1 pt-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.hint);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium uppercase tracking-wider",
                      active ? "text-primary" : "text-subtle",
                    )}
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
