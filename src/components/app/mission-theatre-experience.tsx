import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BlossomPlant } from "@/components/app/plant";
import { Eyebrow, Page, Wordmark } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LEARNER_MEMORY,
  missionForId,
  missionsForLevel,
  planAllows,
} from "@/lib/blossom/data";
import {
  journeySnapshot,
  hasSource,
  personaliseMission,
  resolveMemory,
} from "@/lib/blossom/engine";
import {
  activeMissionRun,
  evaluateMission,
  missionAttemptCount,
  missionObjective,
  missionStepFromRun,
  nextMissionChallenge,
  summariseMissionHistory,
  type MissionChallenge,
  type MissionMode,
  type MissionReflection,
  type MissionStep,
} from "@/lib/blossom/mission";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import { MissionHistory, ProgressRail } from "./mission-theatre-panels";
import {
  ExecuteStage,
  PrepareStage,
  ReflectionStage,
} from "./mission-theatre-flow";
import { CHALLENGES, DEFAULT_REFLECTION, MODES } from "./mission-theatre-shared";


type GrowthSnapshot = {
  before: ReturnType<typeof journeySnapshot>;
  after: ReturnType<typeof journeySnapshot>;
  evaluation: ReturnType<typeof evaluateMission>;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function CinematicTop({
  step,
  language,
}: {
  step: MissionStep;
  language: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>
      <Wordmark />
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
        <span>{String(["brief", "prepare", "execute", "reflect"].indexOf(step) + 1).padStart(2, "0")}</span>
        <span className="size-1 rounded-full bg-subtle" aria-hidden />
        <span>{language}</span>
      </div>
    </div>
  );
}

function SceneReel({
  mission,
  personalised,
  mode,
  challenge,
  modeOpen,
  onModeOpen,
  onMode,
  challengeOpen,
  onChallengeOpen,
  onChallenge,
  onStart,
}: {
  mission: {
    sceneImage?: string;
    level: string;
    durationMin: number;
    place: string;
  };
  personalised: ReturnType<typeof personaliseMission>;
  mode: MissionMode;
  challenge: MissionChallenge;
  modeOpen: boolean;
  onModeOpen: (next: boolean) => void;
  onMode: (next: MissionMode) => void;
  challengeOpen: boolean;
  onChallengeOpen: (next: boolean) => void;
  onChallenge: (next: MissionChallenge) => void;
  onStart: () => void;
}) {
  const scene = mission;
  return (
    <section className="relative min-h-[calc(100svh-73px)] overflow-hidden">
      <img
        src={scene.sceneImage ?? "/images/atelier.jpg"}
        alt=""
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/25"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-73px)] max-w-[1240px] flex-col justify-end px-5 pb-8 pt-16 sm:pb-10 lg:px-8 lg:pb-12">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-white/65">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{scene.level}</span>
            <span className="size-1 rounded-full bg-white/35" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{scene.durationMin} min</span>
            <span className="size-1 rounded-full bg-white/35" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{scene.place}</span>
          </div>

          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            Focus du jour
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(3rem,8vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.065em] text-white">
            {personalised.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {personalised.prompt}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/65">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-3.5 text-primary" />
              {scene.place}
            </span>
            <span className="inline-flex items-center gap-2">
              <Sprout className="size-3.5 text-primary" />
              {CHALLENGES[challenge].title}
            </span>
          </div>
        </div>

        <div className="mt-9 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <button
                    type="button"
                    aria-expanded={modeOpen}
                    onClick={() => onModeOpen(!modeOpen)}
                    className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white/75 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    Mode · {MODES[mode].title}
                    <ChevronDown className={modeOpen ? "size-3.5 rotate-180 transition-transform" : "size-3.5 transition-transform"} />
                  </button>
                  {modeOpen ? (
                    <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-xl sm:grid-cols-2">
                      {(["real-world", "practice"] as const).map((item) => {
                        const selected = item === mode;
                        const Icon = MODES[item].icon;
                        return (
                          <button
                            type="button"
                            key={item}
                            aria-pressed={selected}
                            onClick={() => {
                              onMode(item);
                              onModeOpen(false);
                            }}
                            className={[
                              "flex min-h-14 items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                              selected
                                ? "bg-primary text-primary-foreground"
                                : "text-white/75 hover:bg-white/10 hover:text-white",
                            ].join(" ")}
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/15">
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold">{MODES[item].title}</span>
                              <span className={selected ? "mt-0.5 block text-[10px] text-primary-foreground/65" : "mt-0.5 block text-[10px] text-white/45"}>
                                {MODES[item].kicker}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div>
                  <button
                    type="button"
                    aria-expanded={challengeOpen}
                    onClick={() => onChallengeOpen(!challengeOpen)}
                    className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white/75 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    Pression · {CHALLENGES[challenge].title}
                    <ChevronDown className={challengeOpen ? "size-3.5 rotate-180 transition-transform" : "size-3.5 transition-transform"} />
                  </button>
                  {challengeOpen ? (
                    <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-xl sm:grid-cols-2">
                      {(["core", "stretch"] as const).map((item) => {
                        const selected = item === challenge;
                        return (
                          <button
                            type="button"
                            key={item}
                            aria-pressed={selected}
                            onClick={() => {
                              onChallenge(item);
                              onChallengeOpen(false);
                            }}
                            className={[
                              "min-h-14 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                              selected
                                ? "bg-primary text-primary-foreground"
                                : "text-white/75 hover:bg-white/10 hover:text-white",
                            ].join(" ")}
                          >
                            <span className="block text-xs font-semibold">{CHALLENGES[item].title}</span>
                            <span className={selected ? "mt-0.5 block text-[10px] text-primary-foreground/65" : "mt-0.5 block text-[10px] text-white/45"}>
                              {CHALLENGES[item].kicker}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              onClick={onStart}
              className="min-h-12 w-full rounded-xl px-6 sm:w-auto"
            >
              Entrer dans la scène
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GrowthCeremony({
  growth,
  reducedMotion,
  canStretch,
  onHome,
  onReplay,
}: {
  growth: GrowthSnapshot;
  reducedMotion: boolean;
  canStretch: boolean;
  onHome: () => void;
  onReplay: () => void;
}) {
  const [released, setReleased] = useState(false);
  const [drawn, setDrawn] = useState(reducedMotion);

  useEffect(() => {
    setReleased(false);
    setDrawn(reducedMotion);
    const frame = window.requestAnimationFrame(() => setDrawn(true));
    const timeout = window.setTimeout(
      () => setReleased(true),
      reducedMotion ? 1200 : 4200,
    );
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [reducedMotion]);

  const pointDelta = growth.after.points - growth.before.points;
  const rootWidth = Math.max(
    18,
    Math.min(88, 18 + pointDelta * 8 + (growth.after.stage.id !== growth.before.stage.id ? 28 : 0)),
  );
  const stageChanged = growth.after.stage.id !== growth.before.stage.id;
  const progressDelta = Math.round(
    (growth.after.progress - growth.before.progress) * 100,
  );

  return (
    <div className="min-h-[100svh] bg-bg px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl flex-col justify-center">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            Post-crédit · BLOSSOM
          </p>
          <h1 className="mt-4 font-display text-[clamp(3rem,8vw,6rem)] leading-[0.88] tracking-[-0.06em]">
            Un geste. Une racine.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">
            Votre action vient d'être enregistrée. Voici la conséquence — sans score à jouer.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[26px] border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">Avant</span>
              <span className="text-xs tabular-nums text-muted">{growth.before.points} pts</span>
            </div>
            <BlossomPlant
              linked={false}
              compact
              stageId={growth.before.stage.id}
              stageLabel={growth.before.stage.label}
              points={growth.before.points}
              nextAt={growth.before.stage.nextAt}
              remaining={growth.before.remaining}
            />
          </div>

          <div className="rounded-[26px] border border-primary/15 bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Après</span>
              <span className="text-xs tabular-nums text-primary">+{pointDelta} pts</span>
            </div>
            <BlossomPlant
              linked={false}
              compact
              stageId={growth.after.stage.id}
              stageLabel={growth.after.stage.label}
              points={growth.after.points}
              nextAt={growth.after.stage.nextAt}
              remaining={growth.after.remaining}
            />
          </div>
        </div>

        <div className="mt-7 rounded-[26px] border border-border bg-surface-2/40 p-5 sm:p-7">
          <div className="relative h-20 overflow-hidden">
            <div
              className={[
                "absolute left-1/2 top-1/2 h-px -translate-y-1/2 origin-left bg-primary transition-[width] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                drawn ? "" : "w-0",
              ].join(" ")}
              style={{ width: drawn ? `${rootWidth / 2}%` : "0%" }}
              aria-hidden
            />
            <div
              className={[
                "absolute right-1/2 top-1/2 h-px -translate-y-1/2 origin-right bg-primary transition-[width] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                drawn ? "" : "w-0",
              ].join(" ")}
              style={{ width: drawn ? `${rootWidth / 2}%` : "0%" }}
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-11 items-center justify-center rounded-full border border-primary/25 bg-bg text-primary shadow-[var(--shadow-border)]">
                <Sprout className="size-5" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5 text-center">
            {stageChanged ? (
              <p className="font-display text-2xl leading-tight sm:text-3xl">
                {growth.before.stage.label} <span className="text-primary">→</span> {growth.after.stage.label}
              </p>
            ) : (
              <p className="font-display text-2xl leading-tight sm:text-3xl">
                La racine s'étend de <span className="text-primary">{Math.max(0, progressDelta)}%</span>.
              </p>
            )}
            <p className="mt-2 text-sm leading-6 text-muted">
              {growth.evaluation.outcome === "advance"
                ? "Le prochain passage peut porter un peu plus loin."
                : growth.evaluation.outcome === "stabilise"
                  ? "Le geste tient. Maintenant, on le rend plus disponible."
                  : "On garde la même cible et on la rend plus facile."}
            </p>
          </div>
        </div>

        {released ? (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" onClick={onHome} className="w-full sm:w-auto">
              Retour à l'accueil
              <ArrowRight className="size-4" />
            </Button>
            {canStretch ? (
              <button
                type="button"
                onClick={onReplay}
                className="min-h-11 rounded-xl px-4 text-xs font-semibold text-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Rejouer en extension
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-subtle" aria-live="polite">
            <span className="size-1.5 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
            Laisser la croissance apparaître
          </div>
        )}

        <p className="mt-6 text-center text-[11px] leading-5 text-subtle">
          {growth.after.stage.label} · {growth.after.points} points · progression du stade {Math.round(growth.after.progress * 100)}%
        </p>
      </div>
    </div>
  );
}

export function MissionTheatreExperience({ missionId }: { missionId?: string }) {
  const navigate = useNavigate();
  const log = useBlossom((state) => state.activityLog);
  const attempts = useBlossom((state) => state.pronlabAttempts);
  const plan = useBlossom((state) => state.plan);
  const learner = useBlossom((state) => state.learner);
  const sessions = useBlossom((state) => state.missionSessions);
  const startMissionRun = useBlossom((state) => state.startMissionRun);
  const recordMissionAttempt = useBlossom((state) => state.recordMissionAttempt);
  const recordMissionSupport = useBlossom((state) => state.recordMissionSupport);
  const saveMissionReflection = useBlossom((state) => state.saveMissionReflection);
  const completeMissionSession = useBlossom((state) => state.completeMissionSession);
  const reopenMissionSession = useBlossom((state) => state.reopenMissionSession);

  const todayMission = missionForId(missionId, learner.level);
  const session = sessions[todayMission.id];
  const run = activeMissionRun(session);
  const completedRuns = session?.runs.filter((item) => item.completedAt) ?? [];
  const previousRun = completedRuns.at(-1) ?? null;
  const previousEvaluation = previousRun?.reflection
    ? evaluateMission(previousRun.reflection)
    : null;
  const history = summariseMissionHistory(session?.runs ?? []);
  const recommendedChallenge = nextMissionChallenge(previousEvaluation?.outcome);
  const already = hasSource(log, todayMission.id);
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState<MissionStep>(() => missionStepFromRun(run));
  const [mode, setMode] = useState<MissionMode>(run?.mode ?? "real-world");
  const [challenge, setChallenge] = useState<MissionChallenge>(
    run?.challenge ?? recommendedChallenge,
  );
  const [saved, setSaved] = useState(Boolean(run?.reflection));
  const [reflection, setReflection] = useState<MissionReflection>(
    run?.reflection ?? DEFAULT_REFLECTION,
  );
  const [modeOpen, setModeOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [growth, setGrowth] = useState<GrowthSnapshot | null>(null);

  useEffect(() => {
    if (run?.mode) setMode(run.mode);
    if (run?.challenge) setChallenge(run.challenge);
    if (run?.supportUsed) {
      setReflection((current) =>
        current.supportUsed ? current : { ...current, supportUsed: true },
      );
    }
    if (run?.reflection) {
      setReflection(run.reflection);
      setSaved(true);
    }
  }, [run?.id, run?.mode, run?.challenge, run?.supportUsed, run?.reflection]);

  const memoryEnabled = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const objective = missionObjective(
    todayMission,
    memory,
    memoryEnabled,
    previousEvaluation?.outcome,
  );
  const personalised = personaliseMission(todayMission, memory, memoryEnabled);

  function startSession() {
    const id = startMissionRun(todayMission.id, mode, challenge);
    if (!id) return;
    setStep("prepare");
    setSaved(false);
    setReflection(DEFAULT_REFLECTION);
    setModeOpen(false);
    setChallengeOpen(false);
    track("mission_session_started", { mode, challenge });
  }

  function finishAttempt(seconds: number) {
    const ok = recordMissionAttempt(
      todayMission.id,
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
      todayMission.id,
      "mission",
      "manual",
      0,
    );
    if (!ok) return;
    setSaved(false);
    setStep("reflect");
  }

  function saveReflection(nextReflection: MissionReflection = reflection) {
    const ok = saveMissionReflection(todayMission.id, nextReflection);
    if (!ok) {
      toast("Faites d'abord le geste de la mission.");
      return;
    }
    setSaved(true);
  }

  function useSupport() {
    const persisted = recordMissionSupport(todayMission.id);
    if (!persisted && reflection.supportUsed) return;
    setReflection((current) => ({ ...current, supportUsed: true }));
  }

  function finishSession() {
    const before = journeySnapshot(useBlossom.getState().activityLog);
    const result = completeMissionSession(todayMission.id);
    if (result.reason === "already") {
      navigate({ to: "/" });
      return;
    }
    if (!result.ok) {
      toast("Le bilan doit être enregistré avant de terminer.");
      return;
    }

    const after = journeySnapshot(useBlossom.getState().activityLog);
    const evaluation = result.evaluation ?? evaluateMission(reflection);
    setGrowth({ before, after, evaluation });
    setStep("brief");
    setGrowthVisible();
    track("gesture_commit", { missionId: todayMission.id, outcome: evaluation.outcome });
    track("growth_played", { missionId: todayMission.id, stage: after.stage.id });
  }

  function setGrowthVisible() {
    setGrowthVisibility(true);
  }

  const [growthVisible, setGrowthVisibility] = useState(false);

  function returnHome() {
    setGrowthVisibility(false);
    setGrowth(null);
    navigate({ to: "/" });
  }

  function replayStretch() {
    setGrowthVisibility(false);
    setGrowth(null);
    const id = startMissionRun(todayMission.id, "real-world", "stretch");
    if (!id) return;
    setChallenge("stretch");
    setMode("real-world");
    setReflection(DEFAULT_REFLECTION);
    setSaved(false);
    setStep("prepare");
  }

  if (growthVisible && growth) {
    return (
      <GrowthCeremony
        growth={growth}
        reducedMotion={reducedMotion}
        canStretch={growth.evaluation.outcome === "advance"}
        onHome={returnHome}
        onReplay={replayStretch}
      />
    );
  }

  if (step === "brief") {
    return (
      <div className="min-h-[100svh]">
        <CinematicTop step={step} language={todayMission.language} />
        <SceneReel
          mission={todayMission}
          personalised={personalised}
          mode={mode}
          challenge={challenge}
          modeOpen={modeOpen}
          onModeOpen={setModeOpen}
          onMode={setMode}
          challengeOpen={challengeOpen}
          onChallengeOpen={setChallengeOpen}
          onChallenge={setChallenge}
          onStart={startSession}
        />

        <Page className="max-w-[1240px] bg-bg pb-20 lg:pb-28">
          <section className="border-t border-border py-12 sm:py-16">
            <div className="max-w-3xl">
              <Eyebrow>Banque de terrains</Eyebrow>
              <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                Ne pas répéter toujours la même scène.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                Choisissez une intention différente. La progression vient aussi
                du changement de personne, de pression et de contexte.
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {missionsForLevel(learner.level).map((mission) => {
                const selected = mission.id === todayMission.id;
                const completed = hasSource(log, mission.id);
                return (
                  <Link
                    key={mission.id}
                    to="/mission"
                    search={{ missionId: mission.id }}
                    className={[
                      "rounded-2xl border p-4 shadow-[var(--shadow-border)] transition",
                      selected
                        ? "border-primary/35 bg-primary/7"
                        : "border-border bg-surface hover:-translate-y-0.5 hover:border-primary/20",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                          {mission.level} · {mission.durationMin} min
                        </p>
                        <p className="mt-2 font-display text-xl leading-tight">
                          {mission.title}
                        </p>
                      </div>
                      {completed ? (
                        <Badge className="border-primary/20 bg-primary/10 text-primary">
                          Ancrée
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {mission.prompt}
                    </p>
                    <p className="mt-4 text-xs text-subtle">
                      {mission.place}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        </Page>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-bg">
      <CinematicTop step={step} language={todayMission.language} />
      <Page className="max-w-[1120px] pb-24 lg:pb-12">
        <ProgressRail step={step} completed={already && Boolean(session?.runs.some((item) => item.completedAt))} />

        {step === "prepare" ? (
          <div className="mt-10 space-y-8">
            <header className="max-w-3xl">
              <Eyebrow>02 · Préparer</Eyebrow>
              <h1 className="mt-3 font-display text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.9] tracking-[-0.055em]">
                Rendez le premier mot facile.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Intention. Kit. Secours. Trois couches suffisent, puis vous entrez dans la scène.
              </p>
            </header>

            <PrepareStage
              objective={objective}
              run={run}
              onWarmup={(seconds) => {
                recordMissionAttempt(
                  todayMission.id,
                  "warmup",
                  "microphone",
                  seconds,
                );
              }}
              onContinue={() => setStep("execute")}
            />
          </div>
        ) : null}

        {step === "execute" ? (
          <div className="mt-5">
            <ExecuteStage
              mode={run?.mode ?? mode}
              challenge={run?.challenge ?? challenge}
              objective={objective}
              attemptCount={missionAttemptCount(run, "mission")}
              durationMin={todayMission.durationMin}
              supportUsed={Boolean(reflection.supportUsed || run?.supportUsed)}
              onSupportUsed={useSupport}
              onFinished={finishAttempt}
              onManualDone={finishRealWorld}
            />
          </div>
        ) : null}

        {step === "reflect" ? (
          <div className="mt-10 space-y-8">
            <header className="max-w-3xl">
              <Eyebrow>04 · Ancrer</Eyebrow>
              <h1 className="mt-3 font-display text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.9] tracking-[-0.055em]">
                Gardez le geste. Laissez tomber le reste.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Trois repères honnêtes. Puis BLOSSOM choisit la prochaine petite pression.
              </p>
            </header>

            <ReflectionStage
              draft={reflection}
              saved={saved}
              run={run}
              history={history}
              onChange={(next) => {
                setReflection(next);
                setSaved(false);
              }}
              onSave={saveReflection}
              onRedo={() => {
                const reopened = reopenMissionSession(todayMission.id);
                if (!reopened) {
                  toast("Cette session ne peut plus être reprise.");
                  return;
                }
                setSaved(false);
                setReflection(DEFAULT_REFLECTION);
                setStep("execute");
              }}
              onFinish={finishSession}
            />

            {saved ? (
              <details className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-border)]">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-surface-2 text-primary">
                    <Check className="size-3.5" />
                  </span>
                  <span className="flex-1 text-sm font-semibold">Voir le journal de cette mission</span>
                  <ChevronDown className="size-4 text-subtle" />
                </summary>
                <div className="border-t border-border p-4">
                  <MissionHistory history={history} runs={session?.runs ?? []} />
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
      </Page>
    </div>
  );
}
