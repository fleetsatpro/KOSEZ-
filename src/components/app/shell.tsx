import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChartNoAxesCombined,
  Compass,
  FlaskConical,
  History,
  Mic,
  RotateCcw,
  Sprout,
  User,
  UserRound,
  Target,
  MapPin,
  Users,
  Cloud,
  CloudOff,
  LoaderCircle,
} from "lucide-react";
import { Welcome } from "@/components/app/welcome";
import { ParentView } from "@/components/app/parent-view";
import { TeacherStudio } from "@/components/app/teacher-studio";
import { OrgStudio } from "@/components/app/org-studio";
import { ChildHome } from "@/components/app/child-home";
import { AdminStudio } from "@/components/app/admin-studio";
import { Wordmark } from "@/components/app/primitives";
import { UserButton } from "@/lib/auth/gates";
import { NotificationCenter } from "@/components/app/notification-center";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { canUseLearningSurface } from "@/lib/i18n/learning-surface";
import { cn } from "@/lib/utils";

function buildNav(languageId: string, uiLocale: string) {
  const surfaces = [
    { to: "/plant", label: "Plant", icon: Sprout, surface: "plant" as const },
    { to: "/mission", label: "Mission", icon: Target, surface: "mission" as const },
    { to: "/osez", label: "Osez", icon: Mic, surface: "osez" as const },
    { to: "/pronlab", label: "Pron'Lab", icon: FlaskConical, surface: "pronlab" as const },
    { to: "/connect", label: "Tandem", icon: Users, surface: "tandem" as const },
    { to: "/pulse", label: "Pulse", icon: History, surface: "pulse" as const },
    { to: "/moi", label: "Moi", icon: UserRound, surface: "moi" as const },
  ];
  return surfaces.filter((s) => canUseLearningSurface(s.surface, languageId, uiLocale));
}

export function AppShell({ children }: { children: ReactNode }) {
  const hasEntered = useBlossom((s) => s.hasEntered);
  const parentMode = useBlossom((s) => s.parentMode);
  const teacherMode = useBlossom((s) => s.teacherMode);
  const orgMode = useBlossom((s) => s.orgMode);
  const adminMode = useBlossom((s) => s.adminMode);
  const childMode = useBlossom((s) => s.childMode);
  const languageId = useBlossom((s) => s.languageId);
  const uiLocale = useBlossom((s) => s.uiLocale);
  const journey = useJourney();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!hasEntered) return <Welcome />;
  if (parentMode) return <ParentView />;
  if (teacherMode) return <TeacherStudio />;
  if (orgMode) return <OrgStudio />;
  if (adminMode) return <AdminStudio />;
  if (childMode) return <ChildHome />;

  const nav = buildNav(languageId, uiLocale);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link to="/plant" className="flex items-center gap-2">
            <Wordmark className="h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
