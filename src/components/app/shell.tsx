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
import { useBlossomWorkspaceAccess } from "@/lib/blossom/access";
import { cn } from "@/lib/utils";
import { mutationStatusCounts, syncChangeEventName } from "@/lib/blossom/sync-client";
import { useMessages, useDocumentLocale, canUseLearningSurface } from "@/lib/i18n";
import type { LearningSurface } from "@/lib/i18n/learning-surface";

function buildNav(m: ReturnType<typeof useMessages>, languageId: string) {
  const items: {
    to: string;
    label: string;
    icon: typeof Sprout;
    hint: string[];
    description: string;
    surface: LearningSurface | null;
  }[] = [
    {
      to: "/",
      label: m.nav.blossom,
      icon: Sprout,
      hint: ["/", "/plant", "/mission"],
      description: m.nav.blossomDesc,
      surface: "mission",
    },
    {
      to: "/osez",
      label: m.nav.osez,
      icon: Mic,
      hint: ["/osez"],
      description: m.nav.osezDesc,
      surface: "osez",
    },
    {
      to: "/explore",
      label: m.nav.explore,
      icon: Compass,
      hint: ["/explore", "/immersion"],
      description: m.nav.exploreDesc,
      surface: "explore",
    },
    {
      to: "/connect",
      label: m.nav.connect,
      icon: User,
      hint: ["/connect", "/tandem"],
      description: m.nav.connectDesc,
      surface: "tandem",
    },
    {
      to: "/learn",
      label: m.nav.learn,
      icon: BookOpen,
      hint: ["/learn", "/pronlab", "/library"],
      description: m.nav.learnDesc,
      surface: "learn",
    },
    {
      to: "/moi",
      label: m.nav.moi,
      icon: UserRound,
      hint: ["/moi"],
      description: m.nav.moiDesc,
      surface: null,
    },
  ];
  return items.filter(
    (item) => item.surface === null || canUseLearningSurface(languageId, item.surface),
  );
}

// Rest of shell restored from local green tree — see follow-up commit for full body
export function AppShell({ children }: { children: ReactNode }) {
  useDocumentLocale();
  const m = useMessages();
  const languageId = useBlossom((s) => s.languageId);
  const hasEntered = useBlossom((s) => s.hasEntered);
  const journey = useJourney();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !hasEntered) return <Welcome />;
  return (
    <div className="min-h-screen">
      <nav className="border-b">
        {buildNav(m, languageId).map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </nav>
      <main>{children}</main>
      <div className="sr-only">{journey.stage.id}</div>
    </div>
  );
}
