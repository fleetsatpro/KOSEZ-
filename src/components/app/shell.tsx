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
import { useMessages, useDocumentLocale } from "@/lib/i18n";

function buildNav(m: ReturnType<typeof useMessages>) {
  return [
    {
      to: "/",
      label: m.nav.blossom,
      icon: Sprout,
      hint: ["/", "/plant", "/mission"],
      description: m.nav.blossomDesc,
    },
    {
      to: "/osez",
      label: m.nav.osez,
      icon: Mic,
      hint: ["/osez"],
      description: m.nav.osezDesc,
    },
    {
      to: "/explore",
      label: m.nav.explore,
      icon: Compass,
      hint: ["/explore", "/immersion"],
      description: m.nav.exploreDesc,
    },
    {
      to: "/connect",
      label: m.nav.connect,
      icon: User,
      hint: ["/connect", "/tandem"],
      description: m.nav.connectDesc,
    },
    {
      to: "/learn",
      label: m.nav.learn,
      icon: BookOpen,
      hint: ["/learn", "/pronlab", "/library"],
      description: m.nav.learnDesc,
    },
    {
      to: "/moi",
      label: m.nav.moi,
      icon: UserRound,
      hint: ["/moi"],
      description: m.nav.moiDesc,
    },
  ] as const;
}

function buildContextNav(m: ReturnType<typeof useMessages>) {
  return {
    blossom: [
      { to: "/", label: m.nav.blossom, icon: Sprout },
      { to: "/plant", label: m.nav.plant, icon: Sprout },
      { to: "/mission", label: m.nav.mission, icon: Target },
    ],
    osez: [
      { to: "/osez/pulse", label: m.nav.pulse, icon: Mic },
      { to: "/mission", label: m.nav.mission, icon: Target },
    ],
    explore: [
      { to: "/explore", label: m.nav.explore, icon: Compass },
      { to: "/immersion", label: m.nav.immersion, icon: MapPin },
    ],
    connect: [
      { to: "/connect", label: m.nav.presences, icon: User },
      { to: "/tandem", label: m.nav.tandem, icon: Users },
    ],
    learn: [
      { to: "/learn/curriculum", label: m.nav.curriculum, icon: Sprout },
      { to: "/pronlab", label: m.nav.pronlab, icon: Mic },
      { to: "/library", label: m.nav.library, icon: BookOpen },
      { to: "/learn/review", label: m.nav.review, icon: RotateCcw },
      { to: "/learn/progress", label: m.nav.progress, icon: ChartNoAxesCombined },
      { to: "/learn/history", label: m.nav.history, icon: History },
      { to: "/learn/labs", label: m.nav.labs, icon: FlaskConical },
    ],
    moi: [] as { to: string; label: string; icon: typeof Sprout }[],
  } as const;
}

function contextKey(pathname: string) {
  if (pathname === "/" || pathname === "/plant" || pathname === "/mission") return "blossom";
  if (pathname === "/osez" || pathname.startsWith("/osez/")) return "osez";
  if (pathname === "/explore" || pathname === "/immersion") return "explore";
  if (pathname === "/connect" || pathname.startsWith("/tandem")) return "connect";
  if (pathname === "/learn" || pathname.startsWith("/learn/") || pathname === "/library" || pathname.startsWith("/library/") || pathname === "/pronlab" || pathname.startsWith("/pronlab/")) return "learn";
  return "moi";
}

function contextNavFor(pathname: string, m: ReturnType<typeof useMessages>) {
  return buildContextNav(m)[contextKey(pathname)];
}

function isActive(pathname: string, hint: readonly string[]) {
  return hint.some((path) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`),
  );
}

function SyncStatus() {
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    let disposed = false;
    const refresh = () => {
      setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
      void mutationStatusCounts().then((counts) => {
        if (!disposed) {
          setPending(counts.pending);
          setConflicts(counts.conflicts);
        }
      });
    };

    refresh();
    const changeEvent = syncChangeEventName();
    window.addEventListener(changeEvent, refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    const timer = window.setInterval(refresh, 5000);
    return () => {
      disposed = true;
      window.removeEventListener(changeEvent, refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const icon = conflicts ? (
    <CloudOff className="size-3.5 text-muted" strokeWidth={1.7} />
  ) : !online ? (
    <CloudOff className="size-3.5 text-muted" strokeWidth={1.7} />
  ) : pending ? (
    <LoaderCircle className="size-3.5 animate-spin text-primary" strokeWidth={1.7} />
  ) : (
    <Cloud className="size-3.5 text-primary" strokeWidth={1.7} />
  );
  const m = useMessages();
  const label = conflicts
    ? m.sync.conflict
    : !online
      ? m.sync.offline
      : pending
        ? m.sync.syncing
        : m.sync.synced;
  const detail = conflicts
    ? conflicts === 1
      ? m.sync.conflictDetailOne
      : m.sync.conflictDetailMany.replace("{n}", String(conflicts))
    : pending
      ? pending === 1
        ? m.sync.pendingOne
        : m.sync.pendingMany.replace("{n}", String(pending))
      : m.sync.nonePending;

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const m = useMessages();
  useDocumentLocale();
  const NAV = buildNav(m);
  const hasEntered = useBlossom((s) => s.hasEntered);
  const parentMode = useBlossom((s) => s.parentMode);
  const teacherMode = useBlossom((s) => s.teacherMode);
  const orgMode = useBlossom((s) => s.orgMode);
  const adminMode = useBlossom((s) => s.adminMode);
  const childMode = useBlossom((s) => s.childMode);
  const setChildMode = useBlossom((s) => s.setChildMode);
  const { access, pending: accessPending } = useBlossomWorkspaceAccess();
  const journey = useJourney();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const contextNav = contextNavFor(pathname, m);
  const contextLabel =
    contextKey(pathname) === "learn"
      ? "Atelier LEARN"
      : contextKey(pathname) === "osez"
        ? "Parler"
        : contextKey(pathname) === "explore"
          ? "Sortir"
          : contextKey(pathname) === "connect"
            ? "Présences"
            : contextKey(pathname) === "blossom"
              ? m.context.blossom
              : m.context.moi;
  const hideChrome =
    pathname === "/mission" || pathname.startsWith("/osez/") || pathname.startsWith("/tandem/");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!accessPending && childMode && !access.isChild) {
      setChildMode(false);
    }
  }, [access.isChild, accessPending, childMode, setChildMode]);

  useEffect(() => {
    if (!accessPending && adminMode && !access.isAdmin) {
      useBlossom.getState().setAdminMode(false);
    }
  }, [access.isAdmin, accessPending, adminMode]);

  if (!mounted || !hasEntered) return <Welcome />;
  if (!accessPending && childMode && access.isChild) {
    return (
      <div className="child-skin paper-grain min-h-dvh bg-bg text-fg">
        <ChildHome />
      </div>
    );
  }

  if (!accessPending && adminMode && access.isAdmin) {
    return (
      <div className="modern-ui paper-grain min-h-dvh bg-bg text-fg">
        <AdminStudio />
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
              {m.moi.title}
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

          {contextNav.length > 0 && (
            <nav className="mt-8" aria-label="Navigation contextuelle">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
                {contextLabel}
              </p>
              <div className="mt-2 grid gap-0.5">
                {contextNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg",
                        active && "bg-primary/8 text-primary",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-3.5" strokeWidth={1.7} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}

          <div className="mb-4 space-y-2 rounded-2xl">
            <NotificationCenter />
            <div className="rounded-2xl border border-border bg-bg/70 px-4 py-3 shadow-[var(--shadow-border)]">
              <SyncStatus />
              <div className="mt-3 border-t border-border pt-3">
                <UserButton />
              </div>
            </div>
          </div>

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
                ? String(journey.remaining) + " →"
                : m.context.blossom}
            </p>
          </div>
        </aside>
      )}

      <div className={cn("min-h-dvh", !hideChrome && "lg:pl-[246px]")}>
        {!hideChrome && (
          <div className="flex items-center gap-2 border-b border-border/60 bg-bg/80 px-3 py-2 backdrop-blur-md lg:hidden">
            <nav className="min-w-0 flex-1" aria-label="Navigation secondaire">
              <div className="mx-auto flex max-w-full gap-1 overflow-x-auto pb-0.5">
                {contextNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "shrink-0 rounded-full border border-transparent px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle transition",
                      (pathname === item.to || pathname.startsWith(`${item.to}/`)) && "border-primary/20 bg-primary/8 text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            <NotificationCenter compact />
          </div>
        )}
        {children}
      </div>

      {!hideChrome && (
        <nav
          className="kosez-mobile-nav fixed inset-x-0 bottom-0 z-20 border-t lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Navigation principale"
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
