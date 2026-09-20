import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Headphones,
  History,
  MapPin,
  MessageCircle,
  Mic2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Volume2,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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

const STEP_META: Array<{
  id: MissionStep;
  number: string;
  label: string;
  detail: string;
}> = [
  { id: "brief", number: "01", label: "Brief", detail: "Comprendre la scène" },
  { id: "prepare", number: "02", label: "Préparer", detail: "Rendre le premier mot facile" },
  { id: "execute", number: "03", label: "Exécuter", detail: "Faire le geste réel" },
  { id: "reflect", number: "04", label: "Bilan", detail: "Décider de la suite" },
];

const MODE_META: Record<
  MissionMode,
  {
    title: string;
    kicker: string;
    body: string;
    icon: typeof Users;
  }
> = {
  "real-world": {
    title: "Terrain",
    kicker: "Vraie conversation",
    body: "Faites la scène avec une vraie personne. Revenez ensuite consigner ce qui s'est réellement passé.",
    icon: Users,
  },
  practice: {
    title: "Studio",
    kicker: "Pratique guidée",
    body: "Restez dans BLOSSOM. Le micro mesure la durée de parole ; le système ne fabrique pas de diagnostic audio.",
    icon: Mic2,
  },
};

const CHALLENGE_META: Record<
  MissionChallenge,
  {
    title: string;
    kicker: string;
    body: string;
  }
> = {
  core: {
    title: "Fondation",
    kicker: "Geste essentiel",
    body: "Une ouverture, un choix, une réponse. On consolide avant d'ajouter de la complexité.",
  },
  stretch: {
    title: "Extension",
    kicker: "Après la maîtrise",
    body: "Même scène, mais avec une relance ou une précision supplémentaire.",
  },
};

const REFLECTION_DEFAULT: MissionReflection = {
  objectiveAchieved: true,
  stayedInTargetLanguage: "partly",
  confidence: 3,
  friction: "hesitation",
};

type SceneTab = "scene" | "kit" | "rescue" | "ladder";

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

function SectionTitle({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body?: string;
}) {
  return (
    <div>
      <Eyebrow>{kicker}</Eyebrow>
      <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{title}</h2>
      {body ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{body}</p> : null}
    </div>
  );
}

function StepRail({
  step,
  completed,
}: {
  step: MissionStep;
  completed: boolean;
}) {
  const current = STEP_META.findIndex((item) => item.id === step);

  return (
    <div className="rounded-2xl border border-border bg-surface/70 px-3 py-3 sm:px-4">
      <div className="flex items-center gap-2">
        {STEP_META.map((item, index) => {
          const active = index === current;
          const done = index < current || (completed && item.id === "reflect");
          return (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
              <div
                className={[
                  "flex size-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-surface text-primary"
                      : "border-border bg-transparent text-subtle",
                ].join(" ")}
              >
                {done ? <Check className="size-4" /> : item.number}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className={active ? "text-xs font-semibold text-fg" : "text-xs text-subtle"}>
                  {item.label}
                </p>
                <p className="truncate text-[10px] text-subtle">{item.detail}</p>
              </div>
              {index < STEP_META.length - 1 ? (
                <span className={index < current ? "h-px flex-1 bg-primary/40" : "h-px flex-1 bg-border"} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MissionScoreboard({
  run,
  journey,
  history,
  challenge,
}: {
  run: MissionRun | null;
  journey: ReturnType<typeof journeySnapshot>;
  history: ReturnType<typeof summariseMissionHistory>;
  challenge: MissionChallenge;
}) {
  const attempts = missionAttemptCount(run, "mission");
  const spoken = run?.attempts
    .filter((attempt) => attempt.kind === "mission")
    .reduce((sum, attempt) => sum + attempt.seconds, 0) ?? 0;

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <div className="rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.17em] text-subtle">Voyage</p>
        <p className="mt-2 font-display text-2xl text-primary">{journey.points}</p>
        <p className="mt-1 text-xs text-muted">{journey.stage.label}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.17em] text-subtle">Passages</p>
        <p className="mt-2 font-display text-2xl">{attempts}/2</p>
        <p className="mt-1 text-xs text-muted">{spoken ? formatDuration(spoken) + " parlées" : "Aucune capture"}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.17em] text-subtle">Historique</p>
        <p className="mt-2 font-display text-2xl">{history.completedRuns}</p>
        <p className="mt-1 text-xs text-muted">{history.averageConfidence ? "Confiance moyenne " + history.averageConfidence + "/5" : "Premier passage"}</p>
      </div>
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.055] px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.17em] text-primary">Intention</p>
        <p className="mt-2 font-display text-2xl">{challenge === "stretch" ? "Étendre" : "Ancrer"}</p>
        <p className="mt-1 text-xs text-muted">{CHALLENGE_META[challenge].kicker}</p>
      </div>
    </div>
  );
}

function SceneFrame({
  image,
  place,
  time,
  atmosphere,
  sensoryCue,
}: {
  image?: string;
  place: string;
  time: string;
  atmosphere: string;
  sensoryCue: string;
}) {
  return (
    <div className="relative min-h-[28rem] overflow-hidden rounded-[28px] bg-fg">
      <img
        src={image ?? "/images/atelier.jpg"}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-fg via-fg/25 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md">
            {time}
          </span>
          <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md">
            {place}
          </span>
        </div>
        <p className="mt-4 font-display text-4xl leading-none sm:text-5xl">{place}</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/75">
          {atmosphere}
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary-foreground/10 bg-fg/35 p-4 backdrop-blur-md">
          <Wind className="mt-0.5 size-4 shrink-0 text-primary-foreground/60" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/50">Détail de scène</p>
            <p className="mt-1 text-xs leading-relaxed text-primary-foreground/70">{sensoryCue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneTabs({
  active,
  onChange,
  scene,
  objective,
}: {
  active: SceneTab;
  onChange: (tab: SceneTab) => void;
  scene: NonNullable<ReturnType<typeof missionObjective>["scene"]>;
  objective: ReturnType<typeof missionObjective>;
}) {
  const items: Array<{ id: SceneTab; label: string; icon: typeof MapPin }> = [
    { id: "scene", label: "Scène", icon: MapPin },
    { id: "kit", label: "Language kit", icon: BookOpen },
    { id: "rescue", label: "Secours", icon: CircleHelp },
    { id: "ladder", label: "Tour de parole", icon: MessageCircle },
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-surface">
      <div className="flex overflow-x-auto border-b border-border px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-pressed={selected}
              className={[
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                selected ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface-2/50",
              ].join(" ")}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {active === "scene" ? (
        <div className="grid gap-0 lg:grid-cols-3">
          <div className="p-6 sm:p-7">
            <Eyebrow>Atmosphère</Eyebrow>
            <p className="mt-2 font-display text-2xl">{scene.atmosphere}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {objective.situation}
            </p>
          </div>
          <div className="border-t border-border p-6 sm:p-7 lg:border-l lg:border-t-0">
            <Eyebrow>Qui est là</Eyebrow>
            <div className="mt-4 space-y-4">
              {scene.people.map((person) => (
                <div key={person.name} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm text-primary">
                    {person.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{person.name} · {person.role}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{person.intent}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border p-6 sm:p-7 lg:border-l lg:border-t-0">
            <Eyebrow>La petite pression</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed">{scene.pressure}</p>
            <div className="mt-4 rounded-2xl bg-surface-2/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Note culturelle</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{scene.culturalNote}</p>
            </div>
          </div>
        </div>
      ) : null}

      {active === "kit" ? (
        <div className="p-5 sm:p-7">
          <div className="grid gap-3 md:grid-cols-2">
            {scene.languageKit.map((item) => (
              <button
                type="button"
                key={item.phrase}
                onClick={() => speakModel(item.phrase)}
                className="group rounded-2xl border border-border bg-surface-2/35 p-4 text-left transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl leading-snug">{item.phrase}</p>
                  <Volume2 className="mt-1 size-4 shrink-0 text-primary" />
                </div>
                <p className="mt-2 text-xs text-muted">{item.meaning}</p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">{item.use}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {active === "rescue" ? (
        <div className="grid gap-3 p-5 sm:p-7 md:grid-cols-3">
          {scene.rescuePhrases.map((item) => (
            <button
              type="button"
              key={item.phrase}
              onClick={() => speakModel(item.phrase)}
              className="rounded-2xl border border-border bg-surface-2/35 p-4 text-left transition-colors hover:bg-surface"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Secours</span>
                <Play className="size-3.5 text-subtle" />
              </div>
              <p className="mt-3 font-display text-lg leading-snug">“{item.phrase}”</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{item.meaning}</p>
            </button>
          ))}
        </div>
      ) : null}

      {active === "ladder" ? (
        <div className="p-5 sm:p-7">
          <div className="grid gap-2">
            {scene.conversationTurns.map((turn, index) => (
              <div key={turn.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/35 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{turn.label}</p>
                    {turn.optional ? <Badge variant="outline">facultatif</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{turn.goal}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-subtle" />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Règle d'or</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {scene.constraints.join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChallengeSelector({
  value,
  recommended,
  onChange,
}: {
  value: MissionChallenge;
  recommended: MissionChallenge;
  onChange: (value: MissionChallenge) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(["core", "stretch"] as const).map((item) => {
        const selected = value === item;
        const recommendedHere = recommended === item;
        return (
          <button
            type="button"
            key={item}
            aria-pressed={selected}
            onClick={() => onChange(item)}
            className={[
              "rounded-2xl border p-5 text-left transition-[border-color,background-color,transform,box-shadow]",
              selected
                ? "border-primary bg-primary/[0.05] shadow-[var(--shadow-border-hover)]"
                : "border-border bg-surface hover:bg-surface-2/35",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-subtle">
                  {CHALLENGE_META[item].kicker}
                </p>
                <p className="mt-2 font-display text-2xl">{CHALLENGE_META[item].title}</p>
              </div>
              <div className="flex items-center gap-2">
                {recommendedHere ? <Badge variant="clay">recommandé</Badge> : null}
                <span
                  className={[
                    "flex size-7 items-center justify-center rounded-full border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  ].join(" ")}
                >
                  {selected ? <Check className="size-3.5" /> : null}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{CHALLENGE_META[item].body}</p>
          </button>
        );
      })}
    </div>
  );
}

function MissionBrief({
  mission,
  objective,
  mode,
  onMode,
  challenge,
  recommendedChallenge,
  onChallenge,
  onStart,
  sceneImage,
  place,
  duration,
  level,
  language,
}: {
  mission: ReturnType<typeof personaliseMission>;
  objective: ReturnType<typeof missionObjective>;
  mode: MissionMode;
  onMode: (value: MissionMode) => void;
  challenge: MissionChallenge;
  recommendedChallenge: MissionChallenge;
  onChallenge: (value: MissionChallenge) => void;
  onStart: () => void;
  sceneImage?: string;
  place: string;
  duration: number;
  level: string;
  language: string;
}) {
  const [tab, setTab] = useState<SceneTab>("scene");

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.78fr)]">
        <div className="rounded-[30px] border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{language}</Badge>
              <Badge variant="outline">{level}</Badge>
              <Badge variant="outline">{String(duration)} min</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="size-3.5" />
              Mission adaptative
            </div>
          </div>

          <h2 className="mt-8 max-w-3xl font-display text-5xl leading-[0.96] tracking-tight sm:text-7xl">
            {mission.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {mission.prompt}
          </p>

          <div className="mt-7 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface-2/45 p-4">
              <Target className="size-4 text-primary" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-subtle">Geste cible</p>
              <p className="mt-1 text-sm font-semibold">Ouvrir + choisir</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2/45 p-4">
              <Users className="size-4 text-primary" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-subtle">Interaction</p>
              <p className="mt-1 text-sm font-semibold">1 à 2 tours</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2/45 p-4">
              <ShieldCheck className="size-4 text-primary" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-subtle">Risque</p>
              <p className="mt-1 text-sm font-semibold">Faible · réel</p>
            </div>
          </div>
        </div>

        <SceneFrame
          image={sceneImage}
          place={place}
          time={objective.scene?.time ?? "Aujourd'hui"}
          atmosphere={objective.scene?.atmosphere ?? objective.situation}
          sensoryCue={objective.scene?.sensoryCue ?? "Regardez autour de vous avant de parler."}
        />
      </div>

      {objective.scene ? (
        <SceneTabs active={tab} onChange={setTab} scene={objective.scene} objective={objective} />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionTitle
            kicker="Mission mode"
            title="Choisissez où le geste doit vivre."
            body="Le même objectif peut être joué sur le terrain ou répété ici. Ce choix reste attaché à votre session."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["real-world", "practice"] as const).map((item) => {
              const Meta = MODE_META[item];
              const Icon = Meta.icon;
              const selected = mode === item;
              return (
                <button
                  type="button"
                  key={item}
                  aria-pressed={selected}
                  onClick={() => onMode(item)}
                  className={[
                    "rounded-2xl border p-5 text-left transition-[border-color,background-color,transform,box-shadow]",
                    selected
                      ? "border-primary bg-primary/[0.05] shadow-[var(--shadow-border-hover)]"
                      : "border-border bg-surface hover:bg-surface-2/35",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <Badge variant={selected ? "default" : "outline"}>
                      {selected ? "sélectionné" : "choisir"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.17em] text-subtle">{Meta.kicker}</p>
                  <p className="mt-1 font-display text-2xl">{Meta.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{Meta.body}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Surface className="border border-primary/15 bg-primary/[0.045]">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 size-5 text-primary" />
            <div>
              <Eyebrow className="text-primary">Conception BLOSSOM</Eyebrow>
              <p className="mt-2 font-display text-xl leading-snug">
                Le mode décide de la preuve, pas de votre valeur.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Terrain = vous faites la scène et vous la déclarez. Studio = vous pratiquez et mesurez uniquement la durée de parole.
              </p>
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionTitle
            kicker="Challenge architecture"
            title="Choisissez la profondeur du geste."
            body="Le niveau de difficulté n'est pas une décoration : il décide combien de complexité vous ajoutez à la scène."
          />
          <div className="mt-4">
            <ChallengeSelector
              value={challenge}
              recommended={recommendedChallenge}
              onChange={onChallenge}
            />
          </div>
        </div>

        <Surface className="border border-primary/15 bg-primary/[0.045]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 text-primary" />
            <div>
              <Eyebrow className="text-primary">Léo · lecture du moment</Eyebrow>
              <p className="mt-2 text-sm leading-relaxed">
                {objective.support}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {objective.stretch}
              </p>
            </div>
          </div>
        </Surface>
      </div>

      <div className="sticky bottom-3 z-10 rounded-2xl border border-border bg-surface/95 p-3 shadow-[0_10px_40px_rgba(28,43,38,0.12)] backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-primary">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{place}</p>
              <p className="text-[11px] text-muted">{CHALLENGE_META[challenge].kicker} · prêt à partir</p>
            </div>
          </div>
          <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
            Entrer dans la mission
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrepareStage({
  mode,
  objective,
  challenge,
  warmupDone,
  phrase,
  onWarmup,
  onContinue,
}: {
  mode: MissionMode;
  objective: ReturnType<typeof missionObjective>;
  challenge: MissionChallenge;
  warmupDone: boolean;
  phrase: string;
  onWarmup: (seconds: number) => void;
  onContinue: () => void;
}) {
  const [showWarmup, setShowWarmup] = useState(false);
  const [selectedCue, setSelectedCue] = useState(0);
  const cues = objective.scene?.languageKit.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline">{MODE_META[mode].kicker}</Badge>
          <Badge variant={challenge === "stretch" ? "clay" : "outline"}>
            {CHALLENGE_META[challenge].title}
          </Badge>
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Eyebrow>Rituel de préparation</Eyebrow>
            <h2 className="mt-2 font-display text-5xl leading-[0.98] sm:text-6xl">
              Rendez le premier mot disponible.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Vous ne mémorisez pas une réponse. Vous préparez une impulsion et un secours, puis vous entrez dans la scène.
            </p>

            <button
              type="button"
              onClick={() => speakModel(phrase)}
              className="mt-7 flex w-full items-center justify-between gap-4 rounded-[24px] border border-primary/15 bg-primary/[0.05] p-5 text-left transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:bg-primary/[0.08]"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary">Phrase d'appui</p>
                <p className="mt-2 font-display text-2xl leading-snug sm:text-3xl">“{phrase}”</p>
                <p className="mt-2 text-xs text-muted">Écoutez → répétez une fois → laissez-la disparaître.</p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Volume2 className="size-5" />
              </div>
            </button>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {cues.map((cue, index) => (
                <button
                  type="button"
                  key={cue.phrase}
                  onClick={() => setSelectedCue(index)}
                  className={[
                    "rounded-2xl border p-4 text-left transition-colors",
                    selectedCue === index ? "border-primary bg-primary/[0.05]" : "border-border bg-surface-2/30 hover:bg-surface-2/55",
                  ].join(" ")}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em] text-subtle">Appui {String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-2 font-display text-lg">{cue.phrase}</p>
                  <p className="mt-1 text-xs text-muted">{cue.use}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] bg-fg p-6 text-primary-foreground">
            <Eyebrow className="text-primary-foreground/55">Micro-lab</Eyebrow>
            <p className="mt-2 font-display text-3xl">Une minute pour enlever la friction.</p>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
              L'échauffement est facultatif. Il compte comme pratique, pas comme preuve que la scène a été réussie.
            </p>

            {!showWarmup && !warmupDone ? (
              <Button variant="outline" className="mt-7 w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setShowWarmup(true)}>
                <Mic2 className="size-4" />
                Échauffer la voix
              </Button>
            ) : null}

            {showWarmup && !warmupDone ? (
              <div className="mt-7 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] p-5">
                <RecordControl
                  inverted
                  cta="Maintenir pour parler"
                  onFinished={(seconds) => {
                    onWarmup(seconds ?? 0);
                    setShowWarmup(false);
                  }}
                />
              </div>
            ) : null}

            {warmupDone ? (
              <div className="mt-7 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground text-primary">
                    <Check className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Échauffement enregistré</p>
                    <p className="mt-1 text-xs text-primary-foreground/60">Maintenant, plus besoin de vous préparer.</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-7 border-t border-primary-foreground/10 pt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/45">Point de bascule</p>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{objective.stretch}</p>
            </div>
          </div>
        </div>
      </div>

      <Surface className="border border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow>Prête ?</Eyebrow>
            <p className="mt-1 text-sm font-semibold">{MODE_META[mode].title} · {CHALLENGE_META[challenge].title}</p>
            <p className="mt-1 text-xs text-muted">{objective.scene?.pressure ?? objective.situation}</p>
          </div>
          <Button size="lg" onClick={onContinue} className="w-full sm:w-auto">
            Entrer dans la scène
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Surface>
    </div>
  );
}

function ExecuteStage({
  mode,
  challenge,
  objective,
  phrase,
  attemptCount,
  onFinished,
  onManualDone,
}: {
  mode: MissionMode;
  challenge: MissionChallenge;
  objective: ReturnType<typeof missionObjective>;
  phrase: string;
  attemptCount: number;
  onFinished: (seconds: number) => void;
  onManualDone: () => void;
}) {
  const attemptsLeft = Math.max(0, 2 - attemptCount);
  const [cueVisible, setCueVisible] = useState(true);
  const rescue = objective.scene?.rescuePhrases[0];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-primary/15 bg-primary text-primary-foreground">
        <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary-foreground text-primary shadow-none">{MODE_META[mode].kicker}</Badge>
                <Badge className="border-primary-foreground/20 bg-transparent text-primary-foreground">{CHALLENGE_META[challenge].title}</Badge>
              </div>
              <h2 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] tracking-tight sm:text-7xl">
                Faites le geste pendant que la scène est encore vivante.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
                Pas de perfection en direct. Utilisez l'impulsion, écoutez, répondez, puis laissez le silence exister.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.07] px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary-foreground/45">Fenêtre</p>
              <p className="mt-1 font-display text-2xl">{attemptsLeft}</p>
              <p className="text-[11px] text-primary-foreground/55">passage{attemptsLeft > 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_280px]">
            <div className="rounded-[26px] border border-primary-foreground/10 bg-primary-foreground/[0.055] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/45">Votre impulsion</p>
                <button
                  type="button"
                  onClick={() => speakModel(phrase)}
                  className="flex size-9 items-center justify-center rounded-full border border-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10"
                  aria-label="Écouter la phrase d'appui"
                >
                  <Headphones className="size-4" />
                </button>
              </div>
              <p className="mt-5 font-display text-3xl leading-snug sm:text-4xl">“{phrase}”</p>
              <p className="mt-3 text-sm text-primary-foreground/55">
                Puis choisissez. La deuxième phrase n'a pas besoin d'être parfaite.
              </p>

              {cueVisible ? (
                <div className="mt-7 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.045] p-4">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 size-4 text-primary-foreground/60" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary-foreground">Objectif en direct</p>
                      <p className="mt-1 text-xs leading-relaxed text-primary-foreground/60">
                        {challenge === "stretch"
                          ? "Ouvrir + choisir + relancer."
                          : "Ouvrir + choisir."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCueVisible(false)}
                      className="ml-auto text-[10px] uppercase tracking-[0.12em] text-primary-foreground/45 hover:text-primary-foreground/70"
                    >
                      masquer
                    </button>
                  </div>
                </div>
              ) : null}

              {mode === "practice" ? (
                <div className="mt-8 rounded-[24px] border border-primary-foreground/10 bg-primary-foreground/[0.055] p-6">
                  <RecordControl
                    inverted
                    cta="Maintenir pour parler"
                    onFinished={(seconds) => onFinished(seconds ?? 0)}
                  />
                </div>
              ) : (
                <div className="mt-8 rounded-[24px] border border-primary-foreground/10 bg-primary-foreground/[0.055] p-6 text-center sm:p-8">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-foreground/[0.08]">
                    <MapPin className="size-7" />
                  </div>
                  <p className="mt-5 font-display text-2xl sm:text-3xl">Allez dans la vraie scène.</p>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-primary-foreground/60">
                    Faites l'action demandée. Revenez ensuite cliquer sur la validation manuelle.
                  </p>
                  <Button
                    size="lg"
                    className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    onClick={onManualDone}
                  >
                    <Check className="size-4" />
                    J'ai fait la scène
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-[26px] bg-fg/[0.24] p-5">
              <div className="flex items-center gap-2">
                <CircleHelp className="size-4 text-primary-foreground/60" />
                <p className="text-xs font-semibold">Filet de sécurité</p>
              </div>
              {rescue ? (
                <>
                  <button
                    type="button"
                    onClick={() => speakModel(rescue.phrase)}
                    className="mt-5 w-full rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.05] p-4 text-left"
                  >
                    <p className="font-display text-xl leading-snug">“{rescue.phrase}”</p>
                    <p className="mt-2 text-xs leading-relaxed text-primary-foreground/55">{rescue.meaning}</p>
                  </button>
                  <p className="mt-4 text-[11px] leading-relaxed text-primary-foreground/45">
                    Utilisez un secours seulement quand vous en avez besoin. Le but est de rester dans la conversation.
                  </p>
                </>
              ) : null}

              <div className="mt-7 border-t border-primary-foreground/10 pt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/45">Contrainte</p>
                <p className="mt-2 text-xs leading-relaxed text-primary-foreground/65">
                  {objective.scene?.constraints?.[0] ?? "Une phrase courte vaut mieux qu'une phrase préparée."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 text-primary" />
          <span>
            {mode === "practice"
              ? "Le contrôle audio ne conserve pas le contenu du micro."
              : "Validation basée sur votre retour après la scène réelle."}
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.15em] text-subtle">
          {attemptCount}/2 passages utilisés
        </span>
      </div>
    </div>
  );
}

function ReflectionChoice({
  label,
  selected,
  onClick,
  detail,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  detail?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        "rounded-2xl border p-4 text-left transition-[border-color,background-color,transform]",
        selected
          ? "border-primary bg-primary/[0.05]"
          : "border-border bg-surface hover:bg-surface-2/35",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          ].join(" ")}
        >
          {selected ? <Check className="size-3" /> : null}
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {detail ? <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p> : null}
        </div>
      </div>
    </button>
  );
}

function ReflectionStage({
  run,
  draft,
  saved,
  onChange,
  onSave,
  onRedo,
  onFinish,
  history,
}: {
  run: MissionRun | null;
  draft: MissionReflection;
  saved: boolean;
  onChange: (next: MissionReflection) => void;
  onSave: () => void;
  onRedo: () => void;
  onFinish: () => void;
  history: ReturnType<typeof summariseMissionHistory>;
}) {
  const evaluation = saved ? evaluateMission(draft) : null;
  const spoken = run?.attempts
    .filter((attempt) => attempt.kind === "mission")
    .reduce((sum, attempt) => sum + attempt.seconds, 0) ?? 0;
  const frictionTotal = Object.values(history.friction).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Débrief de scène</Eyebrow>
            <h2 className="mt-2 max-w-4xl font-display text-5xl leading-[0.98] sm:text-6xl">
              Ne devinez pas. Regardez ce qui s'est passé.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Le système n'invente pas une note de prononciation. Il combine votre retour, votre comportement de session et l'historique pour décider de la suite.
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-primary">
            <History className="size-5" />
          </div>
        </div>

        {spoken ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/45 px-3 py-1.5 text-xs">
            <Clock3 className="size-3.5 text-primary" />
            {formatDuration(spoken)} de parole capturée
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface-2/35 p-5">
            <Eyebrow>01 · Action</Eyebrow>
            <p className="mt-2 text-sm font-semibold">Le geste demandé a-t-il réellement eu lieu ?</p>
            <div className="mt-3 grid gap-2">
              <ReflectionChoice
                label="Oui, j'ai fait l'action"
                detail="La scène a réellement été tentée."
                selected={draft.objectiveAchieved}
                onClick={() => onChange({ ...draft, objectiveAchieved: true })}
              />
              <ReflectionChoice
                label="Pas encore"
                detail="Je n'ai pas réussi à créer l'ouverture."
                selected={!draft.objectiveAchieved}
                onClick={() => onChange({ ...draft, objectiveAchieved: false })}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-surface-2/35 p-5">
            <Eyebrow>02 · Langue</Eyebrow>
            <p className="mt-2 text-sm font-semibold">Qu'est-il arrivé à la langue cible ?</p>
            <div className="mt-3 grid gap-2">
              <ReflectionChoice
                label="Tenue du début à la fin"
                selected={draft.stayedInTargetLanguage === "yes"}
                onClick={() => onChange({ ...draft, stayedInTargetLanguage: "yes" })}
              />
              <ReflectionChoice
                label="Tenue par moments"
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
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-border bg-surface-2/35 p-5">
            <Eyebrow>03 · Disponibilité</Eyebrow>
            <p className="mt-2 text-sm font-semibold">À quel point le geste vous semblait disponible ?</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map((score) => (
                <button
                  type="button"
                  key={score}
                  aria-label={"Confiance " + String(score) + " sur 5"}
                  aria-pressed={draft.confidence === score}
                  onClick={() => onChange({ ...draft, confidence: score })}
                  className={[
                    "flex h-14 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums",
                    draft.confidence === score
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:bg-surface-2/45",
                  ].join(" ")}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-subtle">
              <span>Bloqué</span>
              <span>Naturel</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-surface-2/35 p-5">
            <Eyebrow>04 · Friction dominante</Eyebrow>
            <p className="mt-2 text-sm font-semibold">Qu'est-ce qui vous a ralenti le plus ?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
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
      </div>

      {!saved ? (
        <div className="sticky bottom-3 z-10 rounded-2xl border border-border bg-surface/95 p-3 shadow-[0_10px_40px_rgba(28,43,38,0.12)] backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-surface-2">
                <ShieldCheck className="size-4 text-primary" />
              </div>
              <p className="text-xs leading-relaxed text-muted">Votre bilan devient une donnée d'apprentissage structurée.</p>
            </div>
            <Button size="lg" onClick={onSave} className="w-full sm:w-auto">
              Enregistrer le bilan
              <Check className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {evaluation ? (
        <div className="overflow-hidden rounded-[30px] border border-primary/15 bg-primary text-primary-foreground">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <Eyebrow className="text-primary-foreground/55">Décision de parcours</Eyebrow>
              <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                {evaluation.outcome === "advance"
                  ? "Le geste peut changer de scène."
                  : evaluation.outcome === "stabilise"
                    ? "Le geste est là. On le stabilise."
                    : "On garde la même cible et on reprend."}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/72">
                {evaluation.summary}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs">
                  {evaluation.evidenceCount}/3 signaux
                </span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs">
                  {history.completedRuns} passage{history.completedRuns > 1 ? "s" : ""} dans l'historique
                </span>
                {frictionTotal ? (
                  <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs">
                    {frictionTotal} friction{frictionTotal > 1 ? "s" : ""} observée{frictionTotal > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="border-t border-primary-foreground/10 bg-primary-foreground/[0.045] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <Eyebrow className="text-primary-foreground/55">Prochaine action</Eyebrow>
              <p className="mt-3 font-display text-2xl leading-snug">{evaluation.nextAction}</p>
              <div className="mt-6 grid gap-2">
                <Button variant="outline" onClick={onRedo} disabled={!missionExecutionReady(run)} className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <RotateCcw className="size-4" />
                  Refaire le geste
                </Button>
                <Button onClick={onFinish} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Terminer la mission
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistoryPanel({
  history,
  runs,
}: {
  history: ReturnType<typeof summariseMissionHistory>;
  runs: MissionRun[];
}) {
  const [open, setOpen] = useState(false);
  const topFriction = (Object.entries(history.friction) as Array<[MissionReflection["friction"], number]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0];

  if (runs.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-[22px] border border-border bg-surface px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-primary">
            <History className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Journal de cette mission</p>
            <p className="mt-0.5 text-xs text-muted">
              {runs.length} session{runs.length > 1 ? "s" : ""} · {formatDuration(history.totalPracticeSeconds)} de pratique micro
            </p>
          </div>
        </div>
        <ChevronDown className={open ? "size-4 rotate-180 text-subtle transition-transform" : "size-4 text-subtle transition-transform"} />
      </button>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-[22px] border border-border bg-surface">
          <div className="grid gap-0 border-b border-border lg:grid-cols-4">
            <div className="p-5">
              <Eyebrow>Confiance</Eyebrow>
              <p className="mt-2 font-display text-3xl">{history.averageConfidence || "—"}</p>
              <p className="mt-1 text-xs text-muted">sur 5</p>
            </div>
            <div className="border-t border-border p-5 lg:border-l lg:border-t-0">
              <Eyebrow>Tentatives</Eyebrow>
              <p className="mt-2 font-display text-3xl">{history.totalMissionAttempts}</p>
              <p className="mt-1 text-xs text-muted">sur toutes les sessions</p>
            </div>
            <div className="border-t border-border p-5 lg:border-l lg:border-t-0">
              <Eyebrow>Friction dominante</Eyebrow>
              <p className="mt-2 font-display text-2xl capitalize">{topFriction ? topFriction[0] : "Aucune"}</p>
              <p className="mt-1 text-xs text-muted">{topFriction ? String(topFriction[1]) + " occurrence(s)" : "Pas encore"}</p>
            </div>
            <div className="border-t border-border p-5 lg:border-l lg:border-t-0">
              <Eyebrow>Dernière décision</Eyebrow>
              <p className="mt-2 font-display text-2xl">{history.latestOutcome ?? "—"}</p>
              <p className="mt-1 text-xs text-muted">issue du dernier bilan</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {runs.slice().reverse().map((run, index) => {
              const evaluation = run.reflection ? evaluateMission(run.reflection) : null;
              const seconds = run.attempts
                .filter((attempt) => attempt.kind === "mission")
                .reduce((sum, attempt) => sum + attempt.seconds, 0);
              return (
                <div key={run.id} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-primary">
                    {String(runs.length - index).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{run.mode === "practice" ? "Studio" : "Terrain"}</p>
                      <Badge variant="outline">{run.challenge === "stretch" ? "Extension" : "Fondation"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(run.startedAt).toLocaleDateString("fr-FR")} · {seconds ? formatDuration(seconds) : "sans capture"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-primary">{evaluation ? String(evaluation.evidenceCount) + "/3" : "en cours"}</p>
                    <p className="mt-1 text-[11px] text-subtle">{evaluation?.outcome ?? "reprise possible"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MissionTheatre() {
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
  const [reflection, setReflection] = useState<MissionReflection>(
    run?.reflection ?? REFLECTION_DEFAULT,
  );

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
  const objective = missionObjective(
    TODAY_MISSION,
    memory,
    memoryEnabled,
    previousEvaluation?.outcome,
  );
  const personalised = personaliseMission(TODAY_MISSION, memory, memoryEnabled);
  const journey = journeySnapshot(log);
  const currentStep = step;

  function startSession() {
    const id = startMissionRun(TODAY_MISSION.id, mode, challenge);
    if (!id) return;
    setStep("prepare");
    setSaved(false);
    setReflection(REFLECTION_DEFAULT);
    track("mission_session_started", { mode, challenge });
  }

  function finishAttempt(seconds: number) {
    const ok = recordMissionAttempt(
      TODAY_MISSION.id,
      "mission",
      "microphone",
      seconds,
    );
    if (!ok) return;
    setSaved(false);
    setStep("reflect");
  }

  function finishRealWorld() {
    const ok = recordMissionAttempt(
      TODAY_MISSION.id,
      "mission",
      "manual",
      0,
    );
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
    <Page className="max-w-[1240px]">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Retour au voyage
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          <span>Mission</span>
          <span className="size-1 rounded-full bg-subtle" />
          <span>{TODAY_MISSION.language}</span>
        </div>
      </div>

      <div className="mt-5">
        <StepRail step={currentStep} completed={already} />
      </div>

      {step === "brief" ? (
        <>
          <div className="mt-10 max-w-5xl">
            <Eyebrow>Mission du jour · {TODAY_MISSION.level}</Eyebrow>
            <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl">
              La langue doit survivre à la vraie scène.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
              Une mission BLOSSOM n'est pas une fiche d'exercice : elle transforme une situation réelle en geste observable, répétable et progressivement plus libre.
            </p>
          </div>

          <div className="mt-10">
            <MissionBrief
              mission={personalised}
              objective={objective}
              mode={mode}
              onMode={setMode}
              challenge={challenge}
              recommendedChallenge={recommendedChallenge}
              onChallenge={setChallenge}
              onStart={startSession}
              sceneImage={TODAY_MISSION.sceneImage}
              place={TODAY_MISSION.place}
              duration={TODAY_MISSION.durationMin}
              level={TODAY_MISSION.level}
              language={TODAY_MISSION.language}
            />
          </div>

          <div className="mt-8">
            <MissionScoreboard
              run={run}
              journey={journey}
              history={history}
              challenge={challenge}
            />
          </div>
        </>
      ) : null}

      {step === "prepare" ? (
        <>
          <div className="mt-10 max-w-5xl">
            <Eyebrow>02 · préparation</Eyebrow>
            <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl">
              Moins réfléchir. Plus entrer.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
              Une impulsion, un filet de sécurité, puis la scène. La préparation s'arrête avant de devenir une répétition scolaire.
            </p>
          </div>
          <div className="mt-10">
            <PrepareStage
              mode={run?.mode ?? mode}
              objective={objective}
              challenge={run?.challenge ?? challenge}
              warmupDone={missionAttemptCount(run, "warmup") > 0}
              phrase={objective.supportPhrase}
              onWarmup={(seconds) => {
                recordMissionAttempt(
                  TODAY_MISSION.id,
                  "warmup",
                  "microphone",
                  seconds,
                );
              }}
              onContinue={() => setStep("execute")}
            />
          </div>
        </>
      ) : null}

      {step === "execute" ? (
        <>
          <div className="mt-10 max-w-5xl">
            <Eyebrow>03 · exécution</Eyebrow>
            <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl">
              Osez avant de corriger.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
              La bonne performance n'est pas une récitation propre. C'est une action qui tient quand la situation bouge.
            </p>
          </div>
          <div className="mt-10">
            <ExecuteStage
              mode={run?.mode ?? mode}
              challenge={run?.challenge ?? challenge}
              objective={objective}
              phrase={objective.supportPhrase}
              attemptCount={missionAttemptCount(run, "mission")}
              onFinished={finishAttempt}
              onManualDone={finishRealWorld}
            />
          </div>
        </>
      ) : null}

      {step === "reflect" ? (
        <>
          <div className="mt-10 max-w-5xl">
            <Eyebrow>04 · bilan</Eyebrow>
            <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl">
              Faites quelque chose de ce que vous venez de vivre.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
              Le bilan ne classe pas votre anglais. Il permet à BLOSSOM de choisir entre consolidation, répétition et extension.
            </p>
          </div>
          <div className="mt-10">
            <ReflectionStage
              run={run}
              draft={reflection}
              saved={saved}
              onChange={(next) => {
                setReflection(next);
                setSaved(false);
              }}
              onSave={saveReflection}
              onRedo={() => {
                const reopened = reopenMissionSession(TODAY_MISSION.id);
                if (!reopened) {
                  toast("Cette session ne peut plus être reprise.");
                  return;
                }
                setSaved(false);
                setReflection(REFLECTION_DEFAULT);
                setStep("execute");
              }}
              onFinish={finishSession}
              history={history}
            />
          </div>
        </>
      ) : null}

      <div className="mt-10">
        <HistoryPanel history={history} runs={session?.runs ?? []} />
      </div>

      {already ? (
        <Surface className="mt-8 border border-primary/15 bg-primary/[0.045]">
          <div className="flex gap-3">
            <Trophy className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">La récompense de cette mission est déjà attribuée.</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Vous pouvez continuer à pratiquer et créer d'autres passages. BLOSSOM évite simplement de créditer deux fois la même mission.
              </p>
            </div>
          </div>
        </Surface>
      ) : null}
    </Page>
  );
}
