import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Leaf,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BlossomPlant } from "@/components/app/plant";
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
  missionStepFromRun,
  nextMissionChallenge,
  personaliseMission,
  resolveMemory,
  journeySnapshot,
  hasSource,
} from "@/lib/blossom/engine";
import {
  type MissionChallenge,
  type MissionMode,
  type MissionReflection,
  type MissionStep,
} from "@/lib/blossom/mission";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import { ProgressRail, ReserveDetails, SettingsDetails, MissionHistory } from "./mission-theatre-panels";
import { PrepareStage, ExecuteStage, ReflectionStage } from "./mission-theatre-flow";
import { CHALLENGES, DEFAULT_REFLECTION, MODES } from "./mission-theatre-shared";

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

