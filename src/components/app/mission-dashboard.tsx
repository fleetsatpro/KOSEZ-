import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Headphones,
  History,
  MapPin,
  Mic2,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RecordControl } from "@/components/app/record-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import {
  LEARNER_MEMORY,
  TODAY_MISSION,
  planAllows,
} from "@/lib/blossom/data";
import {
  activeMissionRun,
  evaluateMission,
  missionAttemptCount,
  missionExecutionReady,
  missionObjective,
  type MissionMode,
  type MissionReflection,
  type MissionRun,
} from "@/lib/blossom/mission";
import { hasSource, journeySnapshot, personaliseMission, resolveMemory } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";

type SessionStep = "brief" | "prepare" | "execute" | "reflect";

const STEP_META: Array<{ id: SessionStep; label: string; compact: string }> = [
  { id: "brief", label: "Brief", compact: "01" },
  { id: "prepare", label: "Préparer", compact: "02" },
  { id: "execute", label: "Exécuter", compact: "03" },
  { id: "reflect", label: "Bilan", compact: "04" },
];

const MODE_META: Record<
  MissionMode,
  { title: string; eyebrow: string; body: string; cta: string }
> = {
  "real-world": {
    title: "Dans la vraie vie",
    eyebrow: "Mode terrain",
    body: "Sortez du parcours. Faites la scène avec une vraie personne, puis revenez noter ce qui s'est réellement passé.",
    cta: "Faire la scène réelle",
  },
  practice: {
    title: "Je m'entraîne ici",
    eyebrow: "Mode pratique",
    body: "Répétez la scène dans BLOSSOM. Le micro sert à mesurer la durée de parole, pas à fabriquer un faux score.",
    cta: "M'entraîner maintenant",
  },
};

const MISSION_SCENE_IMAGE = "/images/atelier.jpg";

const REFLECTION_DEFAULT: MissionReflection = {
  objectiveAchieved: true,
  stayedInTargetLanguage: "partly",
  confidence: 3,
  friction: "hesitation",
};

function initialStep(run: MissionRun | null): SessionStep {
  if (!run || run.completedAt) return "brief";
  if (run.reflection || missionAttemptCount(run, "mission") > 0) return "reflect";
  return "prepare";
}

function formatDuration(seconds: number) {
  if (seconds < 60) return String(seconds) + " s";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return String(minutes) + " min" + (remainder ? " " + String(remainder) + " s" : "");
}

function speakModel(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function SessionStepper({
  step,
  completed,
}: {
  step: SessionStep;
  completed: boolean;
}) {
  const active = STEP_META.findIndex((item) => item.id === step);
  return (
    <div className="flex items-center justify-between gap-4 border-y border-border/70 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {STEP_META.map((item, index) => {
          const done = index < active || (completed && item.id === "reflect");
          const current = index === active;
          return (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
              <div
                className={[
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : current
                      ? "border-primary bg-surface text-primary"
                      : "border-border bg-transparent text-subtle",
                ].join(" ")}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" /> : item.compact}
              </div>
              <span
                className={[
                  "hidden truncate text-xs sm:block",
                  current ? "font-semibold text-fg" : "text-subtle",
                ].join(" ")}
              >
                {item.label}
              </span>
              {index < STEP_META.length - 1 ? (
                <span className="h-px min-w-3 flex-1 bg-border sm:mx-2" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-subtle">
        {String(active + 1).padStart(2, "0")} / 04
      </span>
    </div>
  );
}

function MissionRail({
  run,
  journey,
  completed,
  previousOutcome,
}: {
  run: MissionRun | null;
  journey: ReturnType<typeof journeySnapshot>;
  completed: boolean;
  previousOutcome: string | null;
}) {
  const missionAttempts = missionAttemptCount(run, "mission");
  const warmups = missionAttemptCount(run, "warmup");
  const evaluation = run?.reflection ? evaluateMission(run.reflection) : null;

  return (
    <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="bg-primary px-5 py-5 text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow className="text-primary-foreground/65">Mission control</Eyebrow>
            <Radio className="size-4 text-primary-foreground/65" />
          </div>
          <p className="mt-2 font-display text-2xl">Un geste réel, une trace utile.</p>
          <p className="mt-2 text-xs leading-relaxed text-primary-foreground/75">
            BLOSSOM conserve ce qui aide à décider quoi faire ensuite.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-2/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-subtle">Voyage</p>
              <p className="mt-1 font-display text-xl text-primary">{journey.points} pts</p>
              <p className="mt-1 text-[11px] text-muted">{journey.stage.label}</p>
            </div>
            <div className="rounded-lg bg-surface-2/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-subtle">Session</p>
              <p className="mt-1 font-display text-xl">{run ? run.mode === "practice" ? "Pratique" : "Terrain" : "Prête"}</p>
              <p className="mt-1 text-[11px] text-muted">
                {missionAttempts} tentative{missionAttempts > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Présence dans la scène</span>
              <span className="text-xs font-semibold text-primary">
                {warmups ? "Échauffée" : "Sans échauffement"}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: String(completed ? 100 : Math.min(85, 25 + missionAttempts * 30)) + "%" }}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <p className="text-xs font-semibold">Intégrité de la session</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Durée de parole et bilan déclaratif, sans faux diagnostic audio.
            </p>
          </div>

          {evaluation ? (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Preuves de réussite</span>
                <span className="font-display text-lg text-primary">
                  {evaluation.evidenceCount}/{evaluation.evidenceTotal}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-subtle">{evaluation.summary}</p>
            </div>
          ) : null}

          {previousOutcome ? (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-surface/70 px-3 py-3">
              <History className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[11px] leading-relaxed text-muted">
                Dernier passage · {previousOutcome}
              </p>
            </div>
          ) : null}
        </div>
      </Surface>

      <Surface className="hidden p-5 sm:block">
        <Eyebrow>Repère Léo</Eyebrow>
        <p className="mt-2 text-sm leading-relaxed text-muted">{LEARNER_MEMORY.leoNote}</p>
      </Surface>
    </aside>
  );
}

function ModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: MissionMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const item = MODE_META[mode];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "group rounded-2xl border p-5 text-left transition-[border-color,background-color,transform,box-shadow] duration-200",
        selected
          ? "border-primary bg-primary/[0.045] shadow-[var(--shadow-border-hover)]"
          : "border-border bg-surface hover:bg-surface-2/35",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">{item.eyebrow}</p>
          <p className="mt-2 font-display text-2xl">{item.title}</p>
        </div>
        <div
          className={[
            "flex size-7 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent",
          ].join(" ")}
        >
          <Check className="size-3.5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
      <span className={selected ? "mt-4 block text-xs font-semibold text-primary" : "mt-4 block text-xs text-subtle"}>
        {selected ? "Mode sélectionné" : "Sélectionner"}
      </span>
    </button>
  );
}

function BriefStep({
  mission,
  base,
  objective,
  mode,
  setMode,
  onStart,
  hasHistory,
}: {
  mission: ReturnType<typeof personaliseMission>;
  base: typeof TODAY_MISSION;
  objective: ReturnType<typeof missionObjective>;
  mode: MissionMode;
  setMode: (mode: MissionMode) => void;
  onStart: () => void;
  hasHistory: boolean;
}) {
  return (
    <div className="space-y-5">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="grid gap-0 bg-surface-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(270px,0.72fr)]">
          <div className="relative isolate overflow-hidden px-6 py-8 sm:px-9 sm:py-10">
            <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="absolute -bottom-28 left-0 size-72 rounded-full bg-clay/10 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge className="bg-surface text-primary shadow-none">{base.language} · {base.level}</Badge>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  {hasHistory ? "Votre historique compte" : "Première session"}
                </span>
              </div>

              <h2 className="mt-8 max-w-3xl font-display text-4xl leading-[1.01] tracking-tight sm:text-6xl">
                {mission.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                {mission.prompt}
              </p>

              <div className="mt-7 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-surface/65">
                <div className="p-3 sm:p-4">
                  <Clock3 className="size-3.5 text-primary" />
                  <p className="mt-2 text-xs text-muted">Durée</p>
                  <p className="mt-1 text-sm font-semibold">{base.durationMin} min</p>
                </div>
                <div className="p-3 sm:p-4">
                  <Target className="size-3.5 text-primary" />
                  <p className="mt-2 text-xs text-muted">Objectif</p>
                  <p className="mt-1 text-sm font-semibold">Oser</p>
                </div>
                <div className="p-3 sm:p-4">
                  <MapPin className="size-3.5 text-primary" />
                  <p className="mt-2 text-xs text-muted">Scène</p>
                  <p className="mt-1 truncate text-sm font-semibold">Saint-Pierre</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden lg:min-h-full">
            <img
              src={MISSION_SCENE_IMAGE}
              alt="Scène de la mission à Saint-Pierre"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fg/85 via-fg/15 to-transparent" aria-hidden />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-primary-foreground/15 bg-fg/65 p-4 text-primary-foreground backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">Scène</p>
              <p className="mt-1 font-display text-2xl">Déjeuner à Saint-Pierre</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[10px]">4 min</span>
                <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[10px]">A2</span>
                <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[10px]">English</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className="p-5 sm:p-6">
            <Eyebrow>À faire</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-muted">{objective.situation}</p>
          </div>
          <div className="p-5 sm:p-6">
            <Eyebrow>Signaux de réussite</Eyebrow>
            <div className="mt-3 space-y-2.5">
              {objective.successSignals.map((signal) => (
                <div key={signal} className="flex gap-2.5 text-xs leading-relaxed text-muted">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <Eyebrow>Phrase d'appui</Eyebrow>
            <p className="mt-2 font-display text-xl leading-snug">“What do you recommend?”</p>
            <p className="mt-2 text-xs leading-relaxed text-subtle">{objective.support}</p>
          </div>
        </div>
      </Surface>

      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Choisissez votre scène</Eyebrow>
            <p className="mt-1 text-sm text-muted">La mission ne devrait pas vous obliger à pratiquer de la même façon chaque jour.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ModeCard mode="real-world" selected={mode === "real-world"} onSelect={() => setMode("real-world")} />
          <ModeCard mode="practice" selected={mode === "practice"} onSelect={() => setMode("practice")} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded-xl border border-border bg-surface/65 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="size-3.5 text-primary" />
            {MODE_META[mode].title}
          </div>
          <p className="mt-1 pl-5 text-xs leading-relaxed text-muted">{MODE_META[mode].body}</p>
        </div>
        <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>
          {MODE_META[mode].cta}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function PrepareStep({
  mode,
  phrase,
  objective,
  warmupDone,
  onWarmup,
  onSkip,
  onContinue,
}: {
  mode: MissionMode;
  phrase: string;
  objective: ReturnType<typeof missionObjective>;
  warmupDone: boolean;
  onWarmup: (seconds: number) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const [showWarmup, setShowWarmup] = useState(false);

  return (
    <div className="space-y-5">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="bg-surface-2 px-6 py-8 sm:px-9 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline">{MODE_META[mode].eyebrow}</Badge>
            <span className="text-[11px] uppercase tracking-[0.17em] text-subtle">Préparation</span>
          </div>
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Réduisez la friction avant de parler.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Une phrase, un rythme, puis la scène. L'objectif n'est pas d'être prêt à 100 % ; il est de rendre le premier mot facile.
          </p>
        </div>

        <div className="grid gap-0 divide-y divide-border lg:grid-cols-[1.2fr_1fr] lg:divide-x lg:divide-y-0">
          <div className="p-6 sm:p-8">
            <Eyebrow>Phrase d'appui</Eyebrow>
            <button
              type="button"
              className="mt-3 flex w-full items-start justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-5 text-left transition-colors hover:bg-surface-2/40"
              onClick={() => speakModel(phrase)}
            >
              <div>
                <p className="font-display text-2xl leading-snug sm:text-3xl">{phrase}</p>
                <p className="mt-2 text-xs text-muted">Écouter le modèle · puis dites-le une fois à votre manière.</p>
              </div>
              <Volume2 className="mt-1 size-5 shrink-0 text-primary" />
            </button>

            <div className="mt-5 rounded-xl border border-border bg-surface-2/45 px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="text-xs font-semibold">Point de bascule</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{objective.stretch}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <Eyebrow>Échauffement facultatif</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Une courte prise de parole avant la scène. Elle est gardée comme historique de pratique, pas comme preuve de réussite.
            </p>

            {!showWarmup && !warmupDone ? (
              <Button variant="outline" className="mt-5 w-full" onClick={() => setShowWarmup(true)}>
                <Mic2 className="size-4" />
                Faire un échauffement
              </Button>
            ) : null}

            {showWarmup && !warmupDone ? (
              <div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground">
                <RecordControl
                  inverted
                  cta="Maintenir pour échauffer"
                  onFinished={(seconds) => {
                    onWarmup(seconds ?? 0);
                    setShowWarmup(false);
                  }}
                />
              </div>
            ) : null}

            {warmupDone ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.055] px-4 py-4">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Échauffement enregistré</p>
                  <p className="mt-1 text-xs text-muted">Le prochain geste peut rester imparfait.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Surface>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
        <Button variant="ghost" onClick={onSkip} className="justify-start">
          <ChevronDown className="size-4" />
          Passer la préparation
        </Button>
        <div />
        <Button size="lg" onClick={onContinue}>
          Entrer dans la scène
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ExecuteStep({
  mode,
  attemptCount,
  phrase,
  onAttemptFinished,
  onRealWorldDone,
}: {
  mode: MissionMode;
  attemptCount: number;
  phrase: string;
  onAttemptFinished: (seconds: number) => void;
  onRealWorldDone: () => void;
}) {
  const remaining = Math.max(0, 2 - attemptCount);

  return (
    <div className="space-y-5">
      <Surface className="overflow-hidden border border-primary/15 bg-primary p-0 text-primary-foreground">
        <div className="px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Eyebrow className="text-primary-foreground/60">
                {MODE_META[mode].eyebrow} · maintenant
              </Eyebrow>
              <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
                Faites la scène, pas l'exercice.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
                Ouvrez avec la phrase d'appui, puis laissez votre réponse devenir votre propre phrase.
              </p>
            </div>
            <div className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-primary-foreground/70">
              {attemptCount}/2 passages
            </div>
          </div>

          <div className="mt-9 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/50">Impulsion</p>
              <p className="mt-3 font-display text-2xl leading-snug sm:text-3xl">
                {phrase}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-primary-foreground/60">
                Puis commandez. Une seule relance suffit.
              </p>
            </div>

            <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] px-5 py-5 md:w-56">
              <div className="flex items-center gap-2">
                <Headphones className="size-4 text-primary-foreground/70" />
                <span className="text-xs font-semibold">Règle du tour</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-primary-foreground/60">
                Pas de script. Pas de correction pendant que vous parlez.
              </p>
            </div>
          </div>

          {mode === "practice" ? (
            <div className="mt-8 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] px-5 py-8 sm:px-8">
              <RecordControl inverted onFinished={(seconds) => onAttemptFinished(seconds ?? 0)} />
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] px-6 py-9 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-foreground/10">
                <MapPin className="size-7" />
              </div>
              <p className="mt-5 font-display text-2xl">Partez faire la scène.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/65">
                Quand vous avez réellement posé la question et tenu l'échange, revenez valider le passage.
              </p>
              <Button
                size="lg"
                className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                onClick={onRealWorldDone}
              >
                <Check className="size-4" />
                J'ai fait la mission
              </Button>
            </div>
          )}
        </div>
      </Surface>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-primary" />
          {mode === "practice"
            ? "Le contenu audio n'est pas conservé par ce contrôle."
            : "Ce passage repose sur votre déclaration, pas sur une capture audio."}
        </div>
        <span>{remaining} reprise{remaining > 1 ? "s" : ""} disponible{remaining > 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function ReflectionChoice({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        selected
          ? "border-primary bg-primary/[0.055] text-primary"
          : "border-border bg-surface hover:bg-surface-2/40",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <span className={selected ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground" : "size-5 rounded-full border border-border"}>
          {selected ? <Check className="size-3" /> : null}
        </span>
        {label}
      </span>
    </button>
  );
}

function Confidence({
  value,
  onChange,
}: {
  value: MissionReflection["confidence"];
  onChange: (value: MissionReflection["confidence"]) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {([1, 2, 3, 4, 5] as const).map((score) => (
        <button
          key={score}
          type="button"
          aria-label={"Confiance " + String(score) + " sur 5"}
          aria-pressed={value === score}
          onClick={() => onChange(score)}
          className={[
            "flex h-12 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors",
            value === score
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-muted hover:bg-surface-2/40",
          ].join(" ")}
        >
          {score}
        </button>
      ))}
    </div>
  );
}

function ReflectStep({
  run,
  draft,
  saved,
  onChange,
  onSave,
  onRedo,
  onFinish,
}: {
  run: MissionRun | null;
  draft: MissionReflection;
  saved: boolean;
  onChange: (next: MissionReflection) => void;
  onSave: () => void;
  onRedo: () => void;
  onFinish: () => void;
}) {
  const evaluation = saved ? evaluateMission(draft) : null;
  const attemptSeconds = run?.attempts
    .filter((attempt) => attempt.kind === "mission")
    .reduce((sum, attempt) => sum + attempt.seconds, 0) ?? 0;

  return (
    <div className="space-y-5">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="bg-surface-2 px-6 py-8 sm:px-9 sm:py-10">
          <Eyebrow>Bilan de terrain</Eyebrow>
          <h2 className="mt-2 max-w-3xl font-display text-4xl tracking-tight sm:text-5xl">
            Qu'est-ce qui s'est réellement passé ?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Pas de note artificielle. Trois signaux simples suffisent pour décider de la prochaine étape.
          </p>

          {attemptSeconds > 0 ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
              <Clock3 className="size-3.5 text-primary" />
              {formatDuration(attemptSeconds)} de parole sur vos passages
            </div>
          ) : null}
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <Eyebrow>01 · Objectif</Eyebrow>
            <p className="mt-2 text-sm font-semibold">Avez-vous réellement fait l'action demandée ?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ReflectionChoice
                label="Oui, je l'ai fait"
                selected={draft.objectiveAchieved}
                onClick={() => onChange({ ...draft, objectiveAchieved: true })}
              />
              <ReflectionChoice
                label="Pas encore"
                selected={!draft.objectiveAchieved}
                onClick={() => onChange({ ...draft, objectiveAchieved: false })}
              />
            </div>
          </div>

          <div>
            <Eyebrow>02 · Langue cible</Eyebrow>
            <p className="mt-2 text-sm font-semibold">Comment avez-vous tenu l'anglais ?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <ReflectionChoice
                label="Tout du long"
                selected={draft.stayedInTargetLanguage === "yes"}
                onClick={() => onChange({ ...draft, stayedInTargetLanguage: "yes" })}
              />
              <ReflectionChoice
                label="Par moments"
                selected={draft.stayedInTargetLanguage === "partly"}
                onClick={() => onChange({ ...draft, stayedInTargetLanguage: "partly" })}
              />
              <ReflectionChoice
                label="J'ai basculé"
                selected={draft.stayedInTargetLanguage === "no"}
                onClick={() => onChange({ ...draft, stayedInTargetLanguage: "no" })}
              />
            </div>
          </div>

          <div>
            <Eyebrow>03 · Confiance</Eyebrow>
            <p className="mt-2 text-sm font-semibold">À quel point le geste vous semblait disponible ?</p>
            <div className="mt-3">
              <Confidence
                value={draft.confidence}
                onChange={(confidence) => onChange({ ...draft, confidence })}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-subtle">
              <span>Bloqué</span>
              <span>Naturel</span>
            </div>
          </div>

          <div>
            <Eyebrow>Ce qui a gêné</Eyebrow>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {([
                ["hesitation", "Hésitation"],
                ["vocabulary", "Vocabulaire"],
                ["switching", "Retour au français"],
                ["confidence", "Confiance"],
                ["none", "Rien de notable"],
              ] as const).map(([value, label]) => (
                <ReflectionChoice
                  key={value}
                  label={label}
                  selected={draft.friction === value}
                  onClick={() => onChange({ ...draft, friction: value })}
                />
              ))}
            </div>
          </div>
        </div>
      </Surface>

      {!saved ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-xs leading-relaxed text-muted">
            Votre bilan est votre donnée d'apprentissage. Il ne prétend pas décrire la qualité sonore de votre anglais.
          </p>
          <Button size="lg" className="w-full sm:w-auto" onClick={onSave}>
            Enregistrer le bilan
            <Check className="size-4" />
          </Button>
        </div>
      ) : null}

      {evaluation ? (
        <Surface className="overflow-hidden border border-primary/15 p-0">
          <div className="bg-primary px-6 py-7 text-primary-foreground sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Eyebrow className="text-primary-foreground/65">Décision BLOSSOM</Eyebrow>
                <h3 className="mt-2 font-display text-3xl">
                  {evaluation.evidenceCount}/3 signaux confirmés.
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/75">
                  {evaluation.summary}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/10">
                {evaluation.outcome === "advance" ? <Trophy className="size-5" /> : <Sparkles className="size-5" />}
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <div className="rounded-xl border border-border bg-surface-2/45 px-4 py-4">
              <Eyebrow>Prochaine action</Eyebrow>
              <p className="mt-2 font-display text-xl leading-snug">{evaluation.nextAction}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
              <Button variant="outline" onClick={onRedo} disabled={!missionExecutionReady(run)}>
                <RotateCcw className="size-4" />
                Refaire
              </Button>
              <div />
              <Button onClick={onFinish}>
                Terminer la mission
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

export function MissionDashboard() {
  const navigate = useNavigate();
  const log = useBlossom((state) => state.activityLog);
  const attempts = useBlossom((state) => state.pronlabAttempts);
  const plan = useBlossom((state) => state.plan);
  const sessions = useBlossom((state) => state.missionSessions);
  const startMissionRun = useBlossom((state) => state.startMissionRun);
  const recordMissionAttempt = useBlossom((state) => state.recordMissionAttempt);
  const saveMissionReflection = useBlossom((state) => state.saveMissionReflection);
  const completeMissionSession = useBlossom((state) => state.completeMissionSession);

  const session = sessions[TODAY_MISSION.id];
  const persistedRun = activeMissionRun(session);
  const already = hasSource(log, TODAY_MISSION.id);
  const completedRuns = session?.runs.filter((run) => run.completedAt) ?? [];
  const previousRun = completedRuns.at(-1) ?? null;
  const previousEvaluation = previousRun?.reflection ? evaluateMission(previousRun.reflection) : null;

  const [step, setStep] = useState<SessionStep>(() => initialStep(persistedRun));
  const [mode, setMode] = useState<MissionMode>(persistedRun?.mode ?? "real-world");
  const [saved, setSaved] = useState(Boolean(persistedRun?.reflection));
  const [reflection, setReflection] = useState<MissionReflection>(
    persistedRun?.reflection ?? REFLECTION_DEFAULT,
  );
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (persistedRun?.mode) setMode(persistedRun.mode);
    if (persistedRun?.reflection) {
      setReflection(persistedRun.reflection);
      setSaved(true);
    }
  }, [persistedRun?.id, persistedRun?.reflection, persistedRun?.mode]);

  const memoryEnabled = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const personalised = personaliseMission(TODAY_MISSION, memory, memoryEnabled);
  const objective = missionObjective(TODAY_MISSION, memory, memoryEnabled);
  const journey = journeySnapshot(log);
  const run = activeMissionRun(session);
  const runAttempts = missionAttemptCount(run, "mission");
  const warmupDone = missionAttemptCount(run, "warmup") > 0;

  const previousOutcome = useMemo(
    () =>
      previousEvaluation
        ? previousEvaluation.outcome === "advance"
          ? "objectif tenu, prête à avancer"
          : previousEvaluation.outcome === "stabilise"
            ? "objectif tenu, geste à stabiliser"
            : "geste à reprendre"
        : null,
    [previousEvaluation],
  );

  function start() {
    const id = startMissionRun(TODAY_MISSION.id, mode);
    if (!id) return;
    setSaved(false);
    setReflection(REFLECTION_DEFAULT);
    setStep("prepare");
    track("mission_session_started", { mode });
  }

  function addAttempt(seconds: number, capture: "microphone" | "manual") {
    const ok = recordMissionAttempt(TODAY_MISSION.id, "mission", capture, seconds);
    if (!ok) return;
    setSaved(false);
    setStep("reflect");
  }

  function saveReflection() {
    const ok = saveMissionReflection(TODAY_MISSION.id, reflection);
    if (!ok) return;
    setSaved(true);
  }

  function finish() {
    const result = completeMissionSession(TODAY_MISSION.id);
    if (result.ok || result.reason === "already") {
      navigate({ to: "/" });
    }
  }

  return (
    <Page className="max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Session {TODAY_MISSION.level} · {TODAY_MISSION.language}
        </span>
      </div>

      <SessionStepper step={step} completed={already} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          {step === "brief" ? (
            <>
              <Eyebrow>Mission du jour · exécution réelle</Eyebrow>
              <h1 className="mt-2 max-w-5xl font-display text-5xl leading-[0.96] tracking-tight sm:text-7xl">
                Une compétence devient utile quand elle survit à l'écran.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                {memoryEnabled
                  ? "Cette mission s'ajuste à votre mémoire d'apprentissage, sans vous enfermer dans une correction."
                  : "Une mission courte, un geste précis, puis un bilan assez simple pour savoir quoi faire ensuite."}
              </p>
              <div className="mt-8">
                <BriefStep
                  mission={personalised}
                  base={TODAY_MISSION}
                  objective={objective}
                  mode={mode}
                  setMode={setMode}
                  onStart={start}
                  hasHistory={completedRuns.length > 0}
                />
              </div>
            </>
          ) : null}

          {step === "prepare" ? (
            <>
              <Eyebrow>Étape 02 · préparer</Eyebrow>
              <h1 className="mt-2 max-w-5xl font-display text-5xl leading-[0.96] tracking-tight sm:text-7xl">
                Facilitez le premier mot.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                L'échauffement est facultatif. La phrase d'appui est là pour vous lancer, pas pour être récitée.
              </p>
              <div className="mt-8">
                <PrepareStep
                  mode={run?.mode ?? mode}
                  phrase={personalised.title}
                  objective={objective}
                  warmupDone={warmupDone}
                  onWarmup={(seconds) => {
                    recordMissionAttempt(TODAY_MISSION.id, "warmup", "microphone", seconds);
                  }}
                  onSkip={() => setStep("execute")}
                  onContinue={() => setStep("execute")}
                />
              </div>
            </>
          ) : null}

          {step === "execute" ? (
            <>
              <Eyebrow>Étape 03 · exécuter</Eyebrow>
              <h1 className="mt-2 max-w-5xl font-display text-5xl leading-[0.96] tracking-tight sm:text-7xl">
                Maintenant, osez.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Une seule scène. Deux passages maximum. Vous décidez quand l'échange est suffisant.
              </p>
              <div className="mt-8">
                <ExecuteStep
                  mode={run?.mode ?? mode}
                  attemptCount={runAttempts}
                  phrase={personalised.title}
                  onAttemptFinished={(seconds) => addAttempt(seconds, "microphone")}
                  onRealWorldDone={() => addAttempt(0, "manual")}
                />
              </div>
            </>
          ) : null}

          {step === "reflect" ? (
            <>
              <Eyebrow>Étape 04 · bilan</Eyebrow>
              <h1 className="mt-2 max-w-5xl font-display text-5xl leading-[0.96] tracking-tight sm:text-7xl">
                Transformez ce qui s'est passé en prochaine action.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Votre bilan ne juge pas votre anglais. Il décide simplement si le geste doit être répété, stabilisé ou approfondi.
              </p>
              <div className="mt-8">
                <ReflectStep
                  run={run}
                  draft={reflection}
                  saved={saved}
                  onChange={(next) => {
                    setReflection(next);
                    setSaved(false);
                  }}
                  onSave={saveReflection}
                  onRedo={() => {
                    setSaved(false);
                    setStep("execute");
                  }}
                  onFinish={finish}
                />
              </div>
            </>
          ) : null}

          {completedRuns.length > 0 ? (
            <div className="mt-8">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface/55 px-4 py-4 text-left"
                onClick={() => setShowHistory((value) => !value)}
                aria-expanded={showHistory}
              >
                <div className="flex items-center gap-3">
                  <History className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Historique de cette mission</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {completedRuns.length} passage{completedRuns.length > 1 ? "s" : ""} terminé{completedRuns.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ChevronDown className={showHistory ? "size-4 rotate-180 text-subtle transition-transform" : "size-4 text-subtle transition-transform"} />
              </button>
              {showHistory ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
                  {completedRuns.slice().reverse().map((item, index) => {
                    const evaluation = item.reflection ? evaluateMission(item.reflection) : null;
                    const duration = item.attempts
                      .filter((attempt) => attempt.kind === "mission")
                      .reduce((sum, attempt) => sum + attempt.seconds, 0);
                    return (
                      <div
                        key={item.id}
                        className="grid gap-3 border-b border-border p-4 last:border-b-0 sm:grid-cols-[auto_1fr_auto]"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-primary">
                          {completedRuns.length - index}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {item.mode === "practice" ? "Pratique" : "Terrain"}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {new Date(item.startedAt).toLocaleDateString("fr-FR")} · {duration ? formatDuration(duration) : "sans capture"}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold text-primary">{evaluation?.evidenceCount ?? 0}/3</p>
                          <p className="mt-1 text-[11px] text-subtle">{evaluation?.outcome ?? "terminé"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {already && step === "brief" ? (
            <Surface className="mt-5 border border-primary/15 bg-primary/[0.045]">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Cette mission a déjà rapporté sa récompense.</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Vous pouvez tout de même la refaire pour vous entraîner. BLOSSOM empêchera simplement une deuxième attribution de points.
                  </p>
                </div>
              </div>
            </Surface>
          ) : null}
        </main>

        <MissionRail
          run={run}
          journey={journey}
          completed={already}
          previousOutcome={previousOutcome}
        />
      </div>
    </Page>
  );
}
