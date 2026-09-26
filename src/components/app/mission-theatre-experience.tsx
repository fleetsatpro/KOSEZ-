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
import { AmbientParticles } from "@/components/app/ambient-particles";
import { BlossomPlant } from "@/components/app/plant";
import { Eyebrow, Wordmark } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { LEARNER_MEMORY, planAllows, PRONLAB_SETS } from "@/lib/blossom/data";
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
import { todayMissionForLevel } from "@/lib/blossom/mission-today";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import {
  clearCurriculumLessonContext,
  readCurriculumLessonContext,
} from "@/lib/blossom/curriculum-context";
import { influenceFromState } from "@/lib/blossom/influence";
import { causalNextGesture } from "@/lib/blossom/organism";
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

function CinematicTop({ step, language }: { step: MissionStep; language: string }) {
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

export function MissionTheatreExperience() {
  const navigate = useNavigate();
  const learner = useBlossom((s) => s.learner);
  const log = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const sessions = useBlossom((s) => s.missionSessions);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const startMissionRun = useBlossom((s) => s.startMissionRun);
  const recordMissionAttempt = useBlossom((s) => s.recordMissionAttempt);
  const recordMissionSupport = useBlossom((s) => s.recordMissionSupport);
  const saveMissionReflection = useBlossom((s) => s.saveMissionReflection);
  const completeMissionSession = useBlossom((s) => s.completeMissionSession);
  const reopenMissionSession = useBlossom((s) => s.reopenMissionSession);
  const [curriculumLessonId] = useState<string | null>(() => readCurriculumLessonContext());
  useEffect(() => {
    if (curriculumLessonId) clearCurriculumLessonContext();
  }, [curriculumLessonId]);

  const todayMission = todayMissionForLevel(learner.level);
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
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const personalised = personaliseMission(todayMission, memory, memoryOn);
  const influence = influenceFromState({
    activityLog: log,
    pronlabAttempts: attempts,
    growthEvents,
    phonemeLeaves,
    missionSessions: sessions,
    allItems: PRONLAB_SETS.flatMap((s) => s.items),
    memory,
    memoryOn,
  });
  const objective = missionObjective(
    todayMission,
    memory,
    memoryOn,
    previousEvaluation?.outcome,
    influence.mission,
  );

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
  const [supportUsed, setSupportUsed] = useState(Boolean(run?.supportUsed));

  function start() {
    const started = startMissionRun(todayMission.id, mode, challenge);
    if (!started) {
      toast("Impossible de démarrer cette mission.");
      return;
    }
    track("mission_started", { missionId: todayMission.id, mode, challenge });
    setStep("prepare");
  }

  function finishAttempt(seconds: number) {
    recordMissionAttempt(todayMission.id, "mission", "microphone", seconds);
    setStep("reflect");
  }

  function finishRealWorld() {
    recordMissionAttempt(
      todayMission.id,
      "mission",
      "manual",
      Math.max(60, todayMission.durationMin * 60),
    );
    setStep("reflect");
  }

  function useSupport() {
    recordMissionSupport(todayMission.id);
    setSupportUsed(true);
  }

  function saveReflection(next: MissionReflection = reflection) {
    if (next !== reflection) setReflection(next);
    const ok = saveMissionReflection(todayMission.id, next);
    if (!ok) {
      toast("Réflexion non enregistrée.");
      return;
    }
    setSaved(true);
  }

  function finishSession() {
    const before = journeySnapshot(log);
    const result = completeMissionSession(todayMission.id);
    if (!result.ok) {
      toast("Session non close.");
      return;
    }
    const after = journeySnapshot(useBlossom.getState().activityLog);
    const evaluation = evaluateMission(reflection);
    setGrowth({ before, after, evaluation });
    track("mission_completed", { missionId: todayMission.id, mode, challenge });
  }

  if (growth) {
    const pointDelta = growth.after.points - growth.before.points;
    const stageChanged = growth.after.stage.id !== growth.before.stage.id;
    const progressDelta = Math.round((growth.after.progress - growth.before.progress) * 100);
    const latestGrowth = growthEvents[0] ?? null;
    const nextDoor = causalNextGesture(minerals);
    const intensity = Math.min(1, 0.4 + Math.max(0, progressDelta) / 100);

    return (
      <div className="relative min-h-[100svh] overflow-hidden bg-bg px-5 py-8 sm:px-8 lg:px-12">
        <AmbientParticles
          stageId={growth.after.stage.id}
          intensity={intensity}
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
        />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl flex-col justify-center">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              Post-crédit · BLOSSOM
            </p>
            <h1 className="mt-4 font-display text-[clamp(3rem,8vw,6rem)] leading-[0.88] tracking-[-0.06em]">
              Un geste. Une racine.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">
              Votre action vient d'être enregistrée. Voici la conséquence exacte — sans score à jouer, sans flamme à protéger.
            </p>
            {latestGrowth ? (
              <p className="mx-auto mt-3 max-w-md rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                {latestGrowth.label}
              </p>
            ) : null}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[26px] border border-border bg-surface p-4">
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
                showCausal={false}
              />
            </div>
            <div className="rounded-[26px] border border-primary/15 bg-surface p-4 magnetic-surface">
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
                growthEvents={growthEvents}
                showCausal
              />
            </div>
          </div>
          <div className="mt-7 rounded-[26px] border border-border bg-surface-2/40 p-5 text-center sm:p-7">
            {stageChanged ? (
              <p className="font-display text-2xl sm:text-3xl">
                {growth.before.stage.label} <span className="text-primary">→</span> {growth.after.stage.label}
              </p>
            ) : (
              <p className="font-display text-2xl sm:text-3xl">
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
            <p className="mt-4 text-[11px] leading-5 text-subtle">
              Minéral le plus bas maintenant : <span className="text-primary">{nextDoor.mineral}</span> — {nextDoor.line}
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate({ to: "/" })} className="w-full sm:w-auto">
              Retour à l'accueil
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate({ to: nextDoor.door as "/" })}
              className="w-full sm:w-auto"
            >
              Ouvrir la porte suivante
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "brief") {
    const activeReasons = influence.mission.reasons.filter((r) => r.code !== "balanced");
    return (
      <div className="min-h-dvh bg-bg">
        <CinematicTop step={step} language={todayMission.language} />
        <section className="relative min-h-[calc(100svh-73px)] overflow-hidden">
          <img
            src={todayMission.sceneImage ?? "/images/atelier.jpg"}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" aria-hidden />
          <div className="relative mx-auto flex min-h-[calc(100svh-73px)] max-w-[1240px] flex-col justify-end px-5 pb-10 lg:px-8">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 text-white/65">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{todayMission.level}</span>
                <span className="size-1 rounded-full bg-white/35" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{todayMission.durationMin} min</span>
                <span className="size-1 rounded-full bg-white/35" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{todayMission.place}</span>
              </div>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Focus du jour</p>
              <h1 className="mt-3 max-w-4xl font-display text-[clamp(3rem,8vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.065em] text-white">
                {personalised.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{personalised.prompt}</p>
              {activeReasons.length > 0 ? (
                <ul className="mt-4 max-w-2xl space-y-1.5" aria-label="Pourquoi cette scène s'adapte">
                  {activeReasons.map((r) => (
                    <li key={r.code + r.line.slice(0, 24)} className="text-xs leading-5 text-primary/85">
                      <span className="font-semibold uppercase tracking-[0.12em] text-primary/60">
                        {r.code.replace(/-/g, " ")} ·{" "}
                      </span>
                      {r.line}
                    </li>
                  ))}
                </ul>
              ) : null}
              {objective.adaptationDetail ? (
                <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-white/50">
                  Adaptation · {objective.adaptationDetail}
                </p>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/65">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-3.5 text-primary" />
                  {todayMission.place}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sprout className="size-3.5 text-primary" />
                  {CHALLENGES[challenge].title}
                </span>
                {already ? (
                  <span className="inline-flex items-center gap-1.5 text-primary">
                    <Check className="size-3.5" /> Déjà ancré aujourd'hui
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-9 flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-4">
                <div>
                  <button
                    type="button"
                    aria-expanded={modeOpen}
                    onClick={() => setModeOpen(!modeOpen)}
                    className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white/75 underline decoration-white/20 underline-offset-4"
                  >
                    Mode · {MODES[mode].title}
                    <ChevronDown className={modeOpen ? "size-3.5 rotate-180" : "size-3.5"} />
                  </button>
                  {modeOpen ? (
                    <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-xl sm:grid-cols-2">
                      {(["real-world", "practice"] as const).map((item) => {
                        const Icon = MODES[item].icon;
                        return (
                          <button
                            type="button"
                            key={item}
                            aria-pressed={item === mode}
                            onClick={() => {
                              setMode(item);
                              setModeOpen(false);
                            }}
                            className={[
                              "flex min-h-14 items-center gap-3 rounded-xl px-3 text-left",
                              item === mode ? "bg-primary text-primary-foreground" : "text-white/75 hover:bg-white/10",
                            ].join(" ")}
                          >
                            <Icon className="size-4" />
                            <span>
                              <span className="block text-xs font-semibold">{MODES[item].title}</span>
                              <span className="mt-0.5 block text-[10px] opacity-70">{MODES[item].kicker}</span>
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
                    onClick={() => setChallengeOpen(!challengeOpen)}
                    className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white/75 underline decoration-white/20 underline-offset-4"
                  >
                    Pression · {CHALLENGES[challenge].title}
                    <ChevronDown className={challengeOpen ? "size-3.5 rotate-180" : "size-3.5"} />
                  </button>
                  {challengeOpen ? (
                    <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-xl sm:grid-cols-2">
                      {(["core", "stretch"] as const).map((item) => (
                        <button
                          type="button"
                          key={item}
                          aria-pressed={item === challenge}
                          onClick={() => {
                            setChallenge(item);
                            setChallengeOpen(false);
                          }}
                          className={[
                            "min-h-14 rounded-xl px-3 py-3 text-left",
                            item === challenge ? "bg-primary text-primary-foreground" : "text-white/75 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <span className="block text-xs font-semibold">{CHALLENGES[item].title}</span>
                          <span className="mt-0.5 block text-[10px] opacity-70">{CHALLENGES[item].kicker}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <Button size="lg" onClick={start} className="min-h-12 w-full rounded-xl px-6 sm:w-auto">
                Entrer dans la scène
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <CinematicTop step={step} language={todayMission.language} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-4 lg:px-8">
        <ProgressRail step={step} completed={saved} />
        {step === "prepare" ? (
          <div className="mt-8">
            <PrepareStage
              objective={objective}
              run={run}
              onWarmup={(seconds) =>
                recordMissionAttempt(todayMission.id, "warmup", "microphone", seconds)
              }
              onContinue={() => setStep("execute")}
            />
          </div>
        ) : null}
        {step === "execute" ? (
          <div className="mt-8">
            <ExecuteStage
              mode={mode}
              challenge={challenge}
              objective={objective}
              attemptCount={missionAttemptCount(run, "mission")}
              durationMin={todayMission.durationMin}
              supportUsed={supportUsed}
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
                Trois repères honnêtes. Puis BLOSSOM choisit la prochaine petite pression — et écrit la racine.
              </p>
            </header>
            <ReflectionStage
              draft={reflection}
              run={run}
              onChange={setReflection}
              saved={saved}
              onSave={saveReflection}
              onFinish={finishSession}
              onRedo={() => {
                reopenMissionSession(todayMission.id);
                setStep("execute");
                setSaved(false);
              }}
              history={history}
            />
            <MissionHistory history={history} runs={session?.runs ?? []} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
