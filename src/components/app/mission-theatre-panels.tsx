import {
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Headphones,
  History,
  Target,
  Users,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/app/primitives";
import { type MissionScene } from "@/lib/blossom/data";
import {
  evaluateMission,
  type MissionReflection,
  type MissionRun,
  type MissionChallenge,
  type MissionMode,
  type MissionStep,
  missionObjective,
  summariseMissionHistory,
} from "@/lib/blossom/mission";
import {
  CHALLENGES,
  MODES,
  STEPS,
  formatDuration,
  speakModel,
} from "./mission-theatre-shared";

export function ProgressRail({ step, completed }: { step: MissionStep; completed: boolean }) {
  const current = STEPS.findIndex((item) => item.id === step);
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
      <div className="flex items-center gap-2">
        {STEPS.map((item, index) => {
          const active = current === index;
          const done = completed || index < current;
          return (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={[
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "border-border text-subtle",
                ].join(" ")}
              >
                {done ? <Check className="size-3.5" /> : String(index + 1).padStart(2, "0")}
              </span>
              <span className={`hidden truncate text-[10px] font-semibold uppercase tracking-[0.15em] sm:block ${active ? "text-fg" : "text-subtle"}`}>
                {item.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className={`h-px min-w-3 flex-1 ${index < current ? "bg-primary/40" : "bg-border"}`} aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SceneCard({
  scene,
  objective,
}: {
  scene: MissionScene;
  objective: ReturnType<typeof missionObjective>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-border)]">
      <div className="relative aspect-video bg-surface-2">
        <img src={TODAY_MISSION.sceneImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-fg/35" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-fg/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">{scene.time}</span>
            <span className="rounded-full bg-fg/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">{TODAY_MISSION.place}</span>
          </div>
          <h2 className="mt-3 max-w-xl font-display text-3xl leading-tight sm:text-4xl">{scene.atmosphere}</h2>
        </div>
      </div>
      <div className="grid gap-0 sm:grid-cols-3">
        <div className="p-5">
          <Eyebrow>La situation</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-muted">{objective.situation}</p>
        </div>
        <div className="border-t border-border p-5 sm:border-l sm:border-t-0">
          <Eyebrow>La pression</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-muted">{scene.pressure}</p>
        </div>
        <div className="border-t border-border p-5 sm:border-l sm:border-t-0">
          <Eyebrow>Le détail</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-muted">{scene.sensoryCue}</p>
        </div>
      </div>
    </section>
  );
}

export function ReserveDetails({ scene, objective }: { scene: MissionScene; objective: ReturnType<typeof missionObjective> }) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-border)]">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <Eyebrow>À garder en réserve</Eyebrow>
        <p className="mt-1 text-sm text-muted">Ouvrez seulement le détail dont vous avez besoin. Votre attention reste sur le geste.</p>
      </div>
      <div className="divide-y divide-border">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden sm:px-6">
            <Users className="size-4 text-primary" />
            <span className="flex-1 text-sm font-semibold">Les personnes</span>
            <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-2 border-t border-border p-5 sm:grid-cols-2 sm:p-6">
            {scene.people.map((person) => (
              <div key={person.name} className="rounded-lg bg-surface-2/55 p-4">
                <p className="text-sm font-semibold">{person.name} · {person.role}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{person.intent}</p>
              </div>
            ))}
          </div>
        </details>

        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden sm:px-6">
            <BookOpen className="size-4 text-primary" />
            <span className="flex-1 text-sm font-semibold">Le kit de langue</span>
            <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-2 border-t border-border p-5 sm:grid-cols-2 sm:p-6">
            {scene.languageKit.map((item) => (
              <button
                type="button"
                key={item.phrase}
                onClick={() => speakModel(item.phrase)}
                className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 p-4 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-surface"
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg">{item.phrase}</span>
                  <span className="mt-1 block text-xs text-muted">{item.use}</span>
                </span>
                <Volume2 className="size-4 shrink-0 text-primary" />
              </button>
            ))}
          </div>
        </details>

        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden sm:px-6">
            <CircleHelp className="size-4 text-primary" />
            <span className="flex-1 text-sm font-semibold">Le filet de sécurité</span>
            <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-2 border-t border-border p-5 sm:p-6">
            {scene.rescuePhrases.map((item) => (
              <button
                type="button"
                key={item.phrase}
                onClick={() => speakModel(item.phrase)}
                className="rounded-lg bg-surface-2/55 p-4 text-left hover:bg-surface-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-xl">“{item.phrase}”</p>
                  <Headphones className="size-4 text-primary" />
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{item.meaning}</p>
              </button>
            ))}
          </div>
        </details>

        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden sm:px-6">
            <Target className="size-4 text-primary" />
            <span className="flex-1 text-sm font-semibold">La trajectoire</span>
            <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border p-5 sm:p-6">
            <div className="grid gap-2">
              {scene.conversationTurns.map((turn, index) => (
                <div key={turn.label} className="flex items-center gap-3 rounded-lg bg-surface-2/45 p-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{turn.label}{turn.optional ? " · facultatif" : ""}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{turn.goal}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">{scene.constraints.join(" · ")}</p>
            <p className="mt-3 text-xs leading-5 text-muted">{objective.stretch}</p>
          </div>
        </details>
      </div>
    </section>
  );
}

export function SettingsDetails({
  mode,
  challenge,
  recommended,
  onMode,
  onChallenge,
}: {
  mode: MissionMode;
  challenge: MissionChallenge;
  recommended: MissionChallenge;
  onMode: (value: MissionMode) => void;
  onChallenge: (value: MissionChallenge) => void;
}) {
  return (
    <details className="group rounded-2xl border border-border bg-surface shadow-[var(--shadow-border)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden sm:px-6">
        <ShieldCheck className="size-4 text-primary" />
        <span className="flex-1">
          <span className="block text-sm font-semibold">Réglages de la mission</span>
          <span className="mt-0.5 block text-xs text-muted">{MODES[mode].title} · {CHALLENGES[challenge].title}</span>
        </span>
        <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border p-5 sm:p-6">
        <Eyebrow>Où pratiquer</Eyebrow>
        <p className="mt-1 text-sm text-muted">Le mode change la preuve enregistrée, pas la valeur du geste.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(["real-world", "practice"] as const).map((item) => {
            const meta = MODES[item];
            const Icon = meta.icon;
            const selected = item === mode;
            return (
              <button
                type="button"
                key={item}
                aria-pressed={selected}
                onClick={() => onMode(item)}
                className={[
                  "flex min-h-20 items-start gap-3 rounded-xl border p-4 text-left transition-[background-color,border-color,transform] duration-200",
                  selected ? "border-primary bg-primary/[0.06]" : "border-border hover:-translate-y-0.5 hover:bg-surface-2/45",
                ].join(" ")}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary"><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">{meta.kicker}</span>
                  <span className="mt-1 block font-display text-xl">{meta.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{meta.body}</span>
                </span>
                {selected ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <Eyebrow>Quelle profondeur</Eyebrow>
          <p className="mt-1 text-sm text-muted">BLOSSOM propose la suite logique à partir de votre dernier passage.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(["core", "stretch"] as const).map((item) => {
              const selected = item === challenge;
              return (
                <button
                  type="button"
                  key={item}
                  aria-pressed={selected}
                  onClick={() => onChallenge(item)}
                  className={[
                    "flex min-h-20 items-start gap-3 rounded-xl border p-4 text-left transition-[background-color,border-color,transform] duration-200",
                    selected ? "border-primary bg-primary/[0.06]" : "border-border hover:-translate-y-0.5 hover:bg-surface-2/45",
                  ].join(" ")}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-display text-lg text-primary">{item === "core" ? "01" : "02"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">{CHALLENGES[item].kicker}</span>
                    <span className="mt-1 block font-display text-xl">{CHALLENGES[item].title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{CHALLENGES[item].body}</span>
                  </span>
                  {recommended === item ? <Badge variant="outline">suite logique</Badge> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </details>
  );
}


export function MissionHistory({ history, runs }: { history: ReturnType<typeof summariseMissionHistory>; runs: MissionRun[] }) {
  if (!runs.length) return null;
  const topFriction = (Object.entries(history.friction) as Array<[MissionReflection["friction"], number]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <details className="group rounded-xl border border-border bg-surface shadow-[var(--shadow-border)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden sm:px-6">
        <History className="size-4 text-primary" />
        <span className="flex-1">
          <span className="block text-sm font-semibold">Journal de cette mission</span>
          <span className="mt-0.5 block text-xs text-muted">{runs.length} session{runs.length > 1 ? "s" : ""} · {formatDuration(history.totalPracticeSeconds)} de pratique micro</span>
        </span>
        <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border">
        <div className="grid gap-0 sm:grid-cols-3">
          <div className="p-5"><Eyebrow>Confiance</Eyebrow><p className="mt-2 font-display text-3xl tabular-nums">{history.averageConfidence || "—"}</p><p className="mt-1 text-xs text-muted">sur 5</p></div>
          <div className="border-t border-border p-5 sm:border-l sm:border-t-0"><Eyebrow>Tentatives</Eyebrow><p className="mt-2 font-display text-3xl tabular-nums">{history.totalMissionAttempts}</p><p className="mt-1 text-xs text-muted">au total</p></div>
          <div className="border-t border-border p-5 sm:border-l sm:border-t-0"><Eyebrow>Friction</Eyebrow><p className="mt-2 font-display text-2xl">{topFriction ? topFriction[0] : "Aucune"}</p><p className="mt-1 text-xs text-muted">{topFriction ? `${topFriction[1]} fois` : "Pas encore"}</p></div>
        </div>
        <div className="divide-y divide-border">
          {runs.slice().reverse().map((run, index) => {
            const evaluation = run.reflection ? evaluateMission(run.reflection) : null;
            const seconds = run.attempts.filter((attempt) => attempt.kind === "mission").reduce((sum, attempt) => sum + attempt.seconds, 0);
            return (
              <div key={run.id} className="grid gap-3 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold text-primary">{String(runs.length - index).padStart(2, "0")}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{run.mode === "practice" ? "Studio" : "Terrain"}</p><Badge variant="outline">{run.challenge === "stretch" ? "Extension" : "Fondation"}</Badge></div>
                  <p className="mt-1 text-xs text-muted">{new Date(run.startedAt).toLocaleDateString("fr-FR")} · {seconds ? formatDuration(seconds) : "sans capture"}</p>
                </div>
                <p className="text-sm font-semibold text-primary sm:text-right">{evaluation ? `${evaluation.evidenceCount}/3` : "en cours"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}


