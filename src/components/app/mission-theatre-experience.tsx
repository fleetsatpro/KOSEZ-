import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  History,
  Leaf,
  MapPin,
  Mic2,
  RotateCcw,
  ShieldCheck,
  Sprout,
  Target,
  Users,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BlossomPlant } from "@/components/app/plant";
import { RecordControl } from "@/components/app/record-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import {
  LEARNER_MEMORY,
  TODAY_MISSION,
  planAllows,
  type MissionScene,
} from "@/lib/blossom/data";
import {
  activeMissionRun,
  evaluateMission,
  missionAttemptCount,
  missionExecutionReady,
  missionObjective,
  missionStepFromRun,
  nextMissionChallenge,
  summariseMissionHistory,
  type MissionChallenge,
  type MissionMode,
  type MissionReflection,
  type MissionRun,
  type MissionStep,
} from "@/lib/blossom/mission";
import {
  hasSource,
  journeySnapshot,
  personaliseMission,
  resolveMemory,
} from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";

const STEPS: Array<{ id: MissionStep; label: string }> = [
  { id: "brief", label: "Entrer" },
  { id: "prepare", label: "Préparer" },
  { id: "execute", label: "Oser" },
  { id: "reflect", label: "Ancrer" },
];

const MODES: Record<MissionMode, {
  title: string;
  kicker: string;
  body: string;
  icon: typeof Users;
}> = {
  "real-world": {
    title: "Terrain",
    kicker: "Dans la vraie vie",
    body: "Faites la scène avec une personne réelle, puis consignez ce qui s'est réellement passé.",
    icon: Users,
  },
  practice: {
    title: "Studio",
    kicker: "Répétition guidée",
    body: "Parlez ici. Le micro mesure uniquement la durée de votre prise de parole.",
    icon: Mic2,
  },
};

const CHALLENGES: Record<MissionChallenge, {
  title: string;
  kicker: string;
  body: string;
}> = {
  core: {
    title: "Fondation",
    kicker: "Le geste essentiel",
    body: "Une ouverture puis un choix. Rien de plus à porter aujourd'hui.",
  },
  stretch: {
    title: "Extension",
    kicker: "Quand le geste tient",
    body: "Même scène, avec une petite relance seulement si elle vient naturellement.",
  },
};

const DEFAULT_REFLECTION: MissionReflection = {
  objectiveAchieved: true,
  stayedInTargetLanguage: "partly",
  confidence: 3,
  friction: "hesitation",
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes} min${remainder ? ` ${remainder} s` : ""}`;
}

function speakModel(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function ProgressRail({ step, completed }: { step: MissionStep; completed: boolean }) {
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

function SceneCard({
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

function ReserveDetails({ scene, objective }: { scene: MissionScene; objective: ReturnType<typeof missionObjective> }) {
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

function SettingsDetails({
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

function PrepareStage({
  objective,
  run,
  onWarmup,
  onContinue,
}: {
  objective: ReturnType<typeof missionObjective>;
  run: MissionRun | null;
  onWarmup: (seconds: number) => void;
  onContinue: () => void;
}) {
  const [warmupOpen, setWarmupOpen] = useState(false);
  const warmupDone = missionAttemptCount(run, "warmup") > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>Une seule préparation</Eyebrow>
            <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Rendez la phrase disponible.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Écoutez. Dites-la une fois. Puis arrêtez de préparer.</p>
          </div>
          <Target className="mt-1 hidden size-5 text-primary sm:block" />
        </div>

        <button
          type="button"
          onClick={() => speakModel(objective.supportPhrase)}
          className="mt-8 flex w-full items-start justify-between gap-5 rounded-xl border border-primary/15 bg-primary/[0.05] p-5 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary/[0.08]"
        >
          <div>
            <Eyebrow className="text-primary">Phrase d'appui</Eyebrow>
            <p className="mt-3 font-display text-3xl leading-tight sm:text-5xl">“{objective.supportPhrase}”</p>
            <p className="mt-3 text-xs text-muted">Elle vous aide à démarrer. Elle n'a pas besoin d'être récité.</p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Volume2 className="size-4" /></span>
        </button>
      </section>

      <section className="rounded-2xl bg-fg p-5 text-primary-foreground shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex items-start gap-3">
          <Mic2 className="mt-0.5 size-4 text-primary-foreground/55" />
          <div>
            <Eyebrow className="text-primary-foreground/50">Optionnel</Eyebrow>
            <p className="mt-2 font-display text-2xl">Échauffer la voix</p>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/65">Cela compte comme pratique, jamais comme preuve de réussite.</p>
          </div>
        </div>
        {!warmupDone && !warmupOpen ? (
          <Button
            variant="outline"
            className="mt-6 w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => setWarmupOpen(true)}
          >
            Maintenir pour parler
          </Button>
        ) : null}
        {warmupOpen && !warmupDone ? (
          <div className="mt-6 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.05] p-5">
            <RecordControl inverted cta="Maintenir pour parler" onFinished={(seconds) => { onWarmup(seconds ?? 0); setWarmupOpen(false); }} />
          </div>
        ) : null}
        {warmupDone ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.05] p-4">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground text-primary"><Check className="size-4" /></span>
            <div>
              <p className="text-sm font-semibold">Échauffement enregistré</p>
              <p className="mt-0.5 text-xs text-primary-foreground/55">Maintenant, entrez dans la scène.</p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-border)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted">{objective.stretch}</p>
          <Button size="lg" onClick={onContinue} className="w-full sm:w-auto">Entrer dans la scène <ArrowRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function ExecuteStage({
  mode,
  challenge,
  objective,
  attemptCount,
  onFinished,
  onManualDone,
}: {
  mode: MissionMode;
  challenge: MissionChallenge;
  objective: ReturnType<typeof missionObjective>;
  attemptCount: number;
  onFinished: (seconds: number) => void;
  onManualDone: () => void;
}) {
  const attemptsLeft = Math.max(0, 2 - attemptCount);
  const rescue = objective.scene?.rescuePhrases[0];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-border)]">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow className="text-primary-foreground/55">Oser</Eyebrow>
              <h2 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">Faites-le avant de l'analyser.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/68 sm:text-base">Une phrase d'appui. Une vraie réponse. Puis laissez l'échange respirer.</p>
            </div>
            <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.06] px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/45">Passages</p>
              <p className="mt-1 font-display text-2xl tabular-nums">{attemptsLeft}</p>
              <p className="text-xs text-primary-foreground/55">encore disponibles</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.05] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/45">Votre impulsion</p>
                <p className="mt-3 font-display text-3xl leading-tight sm:text-5xl">“{objective.supportPhrase}”</p>
              </div>
              <button
                type="button"
                onClick={() => speakModel(objective.supportPhrase)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/10"
                aria-label="Écouter la phrase d'appui"
              >
                <Headphones className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-primary-foreground/10 pt-5">
              <Target className="size-4 text-primary-foreground/55" />
              <p className="text-sm text-primary-foreground/70">
                {challenge === "stretch" ? "Ouvrir · choisir · relancer" : "Ouvrir · choisir"}
              </p>
            </div>

            {mode === "practice" ? (
              <div className="mt-8 rounded-xl bg-fg/25 p-5 sm:p-7">
                <RecordControl inverted cta="Maintenir pour parler" onFinished={(seconds) => onFinished(seconds ?? 0)} />
              </div>
            ) : (
              <div className="mt-8 rounded-xl bg-fg/20 p-5 text-center sm:p-7">
                <MapPin className="mx-auto size-7 text-primary-foreground/60" />
                <p className="mt-4 font-display text-2xl sm:text-3xl">Entrez dans la vraie scène.</p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-primary-foreground/60">Faites uniquement le geste demandé. Revenez quand vous l'avez réellement tenté.</p>
                <Button size="lg" className="mt-6 bg-primary-foreground text-fg hover:bg-primary-foreground/90" onClick={onManualDone}>
                  <Check className="size-4" /> J'ai fait le geste
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {rescue ? (
        <details className="group rounded-xl border border-border bg-surface shadow-[var(--shadow-border)]">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 [&::-webkit-details-marker]:hidden">
            <CircleHelp className="size-4 text-primary" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">J'ai besoin d'un secours</span>
              <span className="mt-0.5 block text-xs text-muted">Seulement si la conversation bloque.</span>
            </span>
            <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border p-5">
            <button type="button" onClick={() => speakModel(rescue.phrase)} className="w-full rounded-lg bg-surface-2/55 p-4 text-left hover:bg-surface-2">
              <p className="font-display text-xl">“{rescue.phrase}”</p>
              <p className="mt-2 text-xs leading-5 text-muted">{rescue.meaning}</p>
            </button>
          </div>
        </details>
      ) : null}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <ShieldCheck className="size-4 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted">
          {mode === "practice"
            ? "Le micro mesure uniquement la durée de parole de cette prise."
            : "Le terrain repose sur votre propre retour, pas sur une fausse mesure automatique."}
        </p>
      </div>
    </div>
  );
}

const REFLECTION_STEPS = [
  { id: "action", label: "Action", question: "Le geste demandé a-t-il réellement eu lieu ?" },
  { id: "language", label: "Langue", question: "Qu'est-il arrivé à la langue cible ?" },
  { id: "confidence", label: "Disponibilité", question: "À quel point le geste vous semblait disponible ?" },
  { id: "friction", label: "Friction", question: "Qu'est-ce qui vous a ralenti le plus ?" },
] as const;

function ReflectionChoice({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        "rounded-xl border p-4 text-left transition-[background-color,border-color,transform] duration-200",
        selected ? "border-primary bg-primary/[0.05]" : "border-border bg-surface hover:-translate-y-0.5 hover:bg-surface-2/45",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
          {selected ? <Check className="size-3" /> : null}
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
        </div>
      </div>
    </button>
  );
}

function ReflectionStage({
  draft,
  saved,
  run,
  history,
  onChange,
  onSave,
  onRedo,
  onFinish,
}: {
  draft: MissionReflection;
  saved: boolean;
  run: MissionRun | null;
  history: ReturnType<typeof summariseMissionHistory>;
  onChange: (next: MissionReflection) => void;
  onSave: () => void;
  onRedo: () => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const evaluation = saved ? evaluateMission(draft) : null;
  const question = REFLECTION_STEPS[index]!;

  function next() {
    if (index < REFLECTION_STEPS.length - 1) {
      setIndex((value) => value + 1);
    } else {
      onSave();
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Bilan de terrain</Eyebrow>
            <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Gardez une trace de ce qui était vrai.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Une question à la fois. Quatre réponses suffisent pour choisir la prochaine marche.</p>
          </div>
          {run?.attempts.filter((attempt) => attempt.kind === "mission").length ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted">
              <Clock3 className="size-3.5 text-primary" />
              {formatDuration(run.attempts.filter((attempt) => attempt.kind === "mission").reduce((sum, attempt) => sum + attempt.seconds, 0))} parlées
            </span>
          ) : null}
        </div>

        {!saved ? (
          <>
            <div className="mt-8 flex gap-2" aria-label={`Question ${index + 1} sur ${REFLECTION_STEPS.length}`}>
              {REFLECTION_STEPS.map((item, itemIndex) => (
                <span key={item.id} className={`h-1.5 flex-1 rounded-full ${itemIndex <= index ? "bg-primary" : "bg-surface-2"}`} />
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border bg-surface-2/35 p-5 sm:p-7">
              <Eyebrow>{String(index + 1).padStart(2, "0")} · {question.label}</Eyebrow>
              <h3 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">{question.question}</h3>

              <div className="mt-6">
                {index === 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ReflectionChoice label="Oui" detail="La scène a réellement été tentée." selected={draft.objectiveAchieved} onClick={() => onChange({ ...draft, objectiveAchieved: true })} />
                    <ReflectionChoice label="Pas encore" detail="L'ouverture n'est pas sortie cette fois." selected={!draft.objectiveAchieved} onClick={() => onChange({ ...draft, objectiveAchieved: false })} />
                  </div>
                ) : null}
                {index === 1 ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ReflectionChoice label="Du début à la fin" selected={draft.stayedInTargetLanguage === "yes"} onClick={() => onChange({ ...draft, stayedInTargetLanguage: "yes" })} />
                    <ReflectionChoice label="Par moments" selected={draft.stayedInTargetLanguage === "partly"} onClick={() => onChange({ ...draft, stayedInTargetLanguage: "partly" })} />
                    <ReflectionChoice label="J'ai basculé" selected={draft.stayedInTargetLanguage === "no"} onClick={() => onChange({ ...draft, stayedInTargetLanguage: "no" })} />
                  </div>
                ) : null}
                {index === 2 ? (
                  <div>
                    <div className="grid grid-cols-5 gap-2">
                      {([1, 2, 3, 4, 5] as const).map((score) => (
                        <button
                          type="button"
                          key={score}
                          aria-label={`Confiance ${score} sur 5`}
                          aria-pressed={draft.confidence === score}
                          onClick={() => onChange({ ...draft, confidence: score })}
                          className={`flex min-h-14 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums ${draft.confidence === score ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-surface-2"}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between text-[11px] text-subtle"><span>Bloqué</span><span>Naturel</span></div>
                  </div>
                ) : null}
                {index === 3 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {([
                      ["hesitation", "Hésitation"],
                      ["vocabulary", "Vocabulaire"],
                      ["switching", "Retour au français"],
                      ["confidence", "Confiance"],
                      ["none", "Rien de notable"],
                    ] as const).map(([value, label]) => (
                      <ReflectionChoice key={value} label={label} selected={draft.friction === value} onClick={() => onChange({ ...draft, friction: value })} />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>Retour</Button>
                <Button size="lg" onClick={next}>{index === REFLECTION_STEPS.length - 1 ? "Enregistrer le bilan" : "Continuer"}<ArrowRight className="size-4" /></Button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {evaluation ? (
        <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-border)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <Eyebrow className="text-primary-foreground/55">Ce que vous avez montré</Eyebrow>
              <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                {evaluation.outcome === "advance"
                  ? "Le geste peut changer de scène."
                  : evaluation.outcome === "stabilise"
                    ? "Le geste est là. On le stabilise."
                    : "On garde la même cible."}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/70">{evaluation.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5">{evaluation.evidenceCount}/3 signaux réunis</span>
                {history.averageConfidence ? <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5">Confiance moyenne {history.averageConfidence}/5</span> : null}
              </div>
            </div>
            <div className="border-t border-primary-foreground/10 bg-fg/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <Eyebrow className="text-primary-foreground/55">Le prochain geste</Eyebrow>
              <p className="mt-3 font-display text-2xl leading-snug">{evaluation.nextAction}</p>
              <div className="mt-6 grid gap-2">
                <Button
                  variant="outline"
                  onClick={onRedo}
                  disabled={!missionExecutionReady(run)}
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <RotateCcw className="size-4" /> Refaire le geste
                </Button>
                <Button onClick={onFinish} className="bg-primary-foreground text-fg hover:bg-primary-foreground/90">
                  Terminer la mission <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MissionHistory({ history, runs }: { history: ReturnType<typeof summariseMissionHistory>; runs: MissionRun[] }) {
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

export function MissionTheatreExperience() {
  const navigate = useNavigate();
  const log = useBlossom((state) => state.activityLog);
  const attempts = useBlossom((state) => state.pronlabAttempts);
  const plan = useBlossom((state) => state.plan);
  const sessions = useBlossom((state) => state.missionSessions);
  const startMissionRun = useBlossom((state) => state.startMissionRun);
  const recordMissionAttempt = useBlossom((state) => state.recordMissionAttempt);
  const saveMissionReflection = useBlossom((state) => state.saveMissionReflection);
  const completeMissionSession = useBlossom((state) => state.completeMissionSession);
  const reopenMissionSession = useBlossom((state) => state.reopenMissionSession);

  const session = sessions[TODAY_MISSION.id];
  const run = activeMissionRun(session);
  const completedRuns = session?.runs.filter((item) => item.completedAt) ?? [];
  const previousRun = completedRuns.at(-1) ?? null;
  const previousEvaluation = previousRun?.reflection ? evaluateMission(previousRun.reflection) : null;
  const history = summariseMissionHistory(session?.runs ?? []);
  const recommendedChallenge = nextMissionChallenge(previousEvaluation?.outcome);
  const already = hasSource(log, TODAY_MISSION.id);

  const [step, setStep] = useState<MissionStep>(() => missionStepFromRun(run));
  const [mode, setMode] = useState<MissionMode>(run?.mode ?? "real-world");
  const [challenge, setChallenge] = useState<MissionChallenge>(run?.challenge ?? recommendedChallenge);
  const [saved, setSaved] = useState(Boolean(run?.reflection));
  const [reflection, setReflection] = useState<MissionReflection>(run?.reflection ?? DEFAULT_REFLECTION);

  useEffect(() => {
    if (run?.mode) setMode(run.mode);
    if (run?.challenge) setChallenge(run.challenge);
    if (run?.reflection) {
      setReflection(run.reflection);
      setSaved(true);
    }
  }, [run?.id, run?.mode, run?.challenge, run?.reflection]);

  const memoryEnabled = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const objective = missionObjective(TODAY_MISSION, memory, memoryEnabled, previousEvaluation?.outcome);
  const personalised = personaliseMission(TODAY_MISSION, memory, memoryEnabled);
  const journey = journeySnapshot(log);

  function startSession() {
    const id = startMissionRun(TODAY_MISSION.id, mode, challenge);
    if (!id) return;
    setStep("prepare");
    setSaved(false);
    setReflection(DEFAULT_REFLECTION);
    track("mission_session_started", { mode, challenge });
  }

  function finishAttempt(seconds: number) {
    const ok = recordMissionAttempt(TODAY_MISSION.id, "mission", "microphone", seconds);
    if (!ok) return;
    setSaved(false);
    setStep("reflect");
  }

  function finishRealWorld() {
    const ok = recordMissionAttempt(TODAY_MISSION.id, "mission", "manual", 0);
    if (!ok) return;
    setSaved(false);
    setStep("reflect");
  }

  function saveReflection() {
    const ok = saveMissionReflection(TODAY_MISSION.id, reflection);
    if (!ok) {
      toast("Faites d'abord au moins un passage de mission.");
      return;
    }
    setSaved(true);
  }

  function finishSession() {
    const result = completeMissionSession(TODAY_MISSION.id);
    if (result.ok || result.reason === "already") {
      navigate({ to: "/" });
      return;
    }
    toast("Le bilan doit être enregistré avant de terminer.");
  }

  return (
    <Page className="max-w-5xl">
      <header className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to="/"><ArrowLeft className="size-4" />Retour</Link></Button>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle"><span>{TODAY_MISSION.language}</span><span className="size-1 rounded-full bg-subtle" aria-hidden /><span>{TODAY_MISSION.durationMin} min</span></div>
      </header>

      <div className="mt-4">
        <ProgressRail step={step} completed={already && Boolean(session?.runs.some((item) => item.completedAt))} />
      </div>

      {step === "brief" ? (
        <div className="mt-8 space-y-6">
          <header className="max-w-3xl">
            <Eyebrow>Une mission, pas une fiche</Eyebrow>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">La vraie scène commence avant la bonne phrase.</h1>
            <p className="mt-5 text-base leading-7 text-muted sm:text-lg">Aujourd'hui, vous allez faire une seule chose utile en anglais — puis laisser BLOSSOM apprendre de ce qui s'est réellement passé.</p>
          </header>

          <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="flex flex-col rounded-2xl bg-primary p-6 text-primary-foreground shadow-[var(--shadow-border)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Eyebrow className="text-primary-foreground/55">Mission du jour</Eyebrow>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="bg-primary-foreground text-primary">{TODAY_MISSION.language}</Badge>
                    <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground">{TODAY_MISSION.level}</Badge>
                    <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground">{TODAY_MISSION.durationMin} min</Badge>
                  </div>
                </div>
                <Sprout className="size-6 text-primary-foreground/45" />
              </div>

              <h2 className="mt-8 font-display text-4xl leading-tight sm:text-5xl">{personalised.title}</h2>
              <p className="mt-4 text-base leading-7 text-primary-foreground/75">{personalised.prompt}</p>

              <div className="mt-auto border-t border-primary-foreground/10 pt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">Un seul geste</p>
                <p className="mt-2 font-display text-2xl">“{objective.supportPhrase}”</p>
                <p className="mt-3 text-sm leading-6 text-primary-foreground/65">{objective.situation}</p>
              </div>
            </div>
            {objective.scene ? <SceneCard scene={objective.scene} objective={objective} /> : null}
          </section>

          {objective.scene ? <ReserveDetails scene={objective.scene} objective={objective} /> : null}

          <SettingsDetails
            mode={mode}
            challenge={challenge}
            recommended={recommendedChallenge}
            onMode={setMode}
            onChallenge={setChallenge}
          />

          {personalised.leo ? (
            <Surface>
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary"><Sprout className="size-4" /></span>
                <div><Eyebrow>Léo · repère discret</Eyebrow><p className="mt-2 text-sm leading-6">{personalised.leo}</p></div>
              </div>
            </Surface>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[0.72fr_1fr]">
            <BlossomPlant stageId={journey.stage.id} stageLabel={journey.stage.label} points={journey.points} nextAt={journey.stage.nextAt} remaining={journey.remaining} compact />
            <Surface>
              <Eyebrow>Votre croissance</Eyebrow>
              <p className="mt-2 font-display text-2xl">{journey.stage.verb}, sans forcer.</p>
              <p className="mt-3 text-sm leading-6 text-muted">Une mission terminée nourrit votre parcours. Une tentative imparfaite vous montre simplement ce qui doit devenir plus disponible.</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4"><Leaf className="size-4 text-primary" /><p className="text-xs text-muted">{journey.points} points · {journey.stage.label}</p></div>
            </Surface>
          </div>

          <div className="sticky bottom-3 z-10 rounded-xl border border-border bg-surface/95 p-3 shadow-[var(--shadow-border)] backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 px-1"><MapPin className="size-4 text-primary" /><div><p className="text-sm font-semibold">{TODAY_MISSION.place}</p><p className="text-xs text-muted">{MODES[mode].title} · {CHALLENGES[challenge].title}</p></div></div>
              <Button size="lg" onClick={startSession} className="w-full sm:w-auto">Entrer dans la préparation<ArrowRight className="size-4" /></Button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "prepare" ? (
        <div className="mt-8 space-y-8">
          <header className="max-w-3xl"><Eyebrow>02 · Préparer</Eyebrow><h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">Rendez le premier mot facile.</h1><p className="mt-5 text-base leading-7 text-muted sm:text-lg">Vous pouvez vous échauffer. Vous n'avez pas besoin de répéter toute la scène.</p></header>
          <PrepareStage objective={objective} run={run} onWarmup={(seconds) => { recordMissionAttempt(TODAY_MISSION.id, "warmup", "microphone", seconds); }} onContinue={() => setStep("execute")} />
        </div>
      ) : null}

      {step === "execute" ? (
        <div className="mt-8 space-y-8">
          <header className="max-w-3xl"><Eyebrow>03 · Oser</Eyebrow><h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">Parlez avant de vous corriger.</h1><p className="mt-5 text-base leading-7 text-muted sm:text-lg">Votre seule responsabilité ici : faire le geste.</p></header>
          <ExecuteStage mode={run?.mode ?? mode} challenge={run?.challenge ?? challenge} objective={objective} attemptCount={missionAttemptCount(run, "mission")} onFinished={finishAttempt} onManualDone={finishRealWorld} />
        </div>
      ) : null}

      {step === "reflect" ? (
        <div className="mt-8 space-y-8">
          <header className="max-w-3xl"><Eyebrow>04 · Ancrer</Eyebrow><h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">Gardez le geste. Laissez tomber le reste.</h1><p className="mt-5 text-base leading-7 text-muted sm:text-lg">Le bilan transforme l'expérience en prochaine petite étape.</p></header>
          <ReflectionStage
            draft={reflection}
            saved={saved}
            run={run}
            history={history}
            onChange={(next) => { setReflection(next); setSaved(false); }}
            onSave={saveReflection}
            onRedo={() => {
              const reopened = reopenMissionSession(TODAY_MISSION.id);
              if (!reopened) { toast("Cette session ne peut plus être reprise."); return; }
              setSaved(false);
              setReflection(DEFAULT_REFLECTION);
              setStep("execute");
            }}
            onFinish={finishSession}
          />
        </div>
      ) : null}

      <div className="mt-10"><MissionHistory history={history} runs={session?.runs ?? []} /></div>

      {already ? (
        <Surface className="mt-5 border border-primary/15 bg-primary/[0.04]">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-semibold">Cette mission a déjà nourri votre BLOSSOM.</p><p className="mt-1 text-xs leading-5 text-muted">Vous pouvez refaire le geste pour apprendre. La mission ne sera simplement pas créditée deux fois.</p></div></div>
        </Surface>
      ) : null}
    </Page>
  );
}
