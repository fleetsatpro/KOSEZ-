import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Mic2,
  RotateCcw,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RecordControl } from "@/components/app/record-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import {
  LEARNER_MEMORY,
  MISSION_FEEDBACK,
  TODAY_MISSION,
  planAllows,
} from "@/lib/blossom/data";
import { hasSource, journeySnapshot, personaliseMission, resolveMemory } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";

type Step = "brief" | "record" | "feedback";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "brief", label: "Brief" },
  { id: "record", label: "Parler" },
  { id: "feedback", label: "Débrief" },
];

function MissionHeader({ step, completed }: { step: Step; completed: boolean }) {
  const activeIndex = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="mt-6 flex items-center justify-between gap-4 border-y border-border/70 py-4">
      <div className="flex min-w-0 items-center gap-2">
        {STEPS.map((item, index) => {
          const done = index < activeIndex || (completed && item.id === "feedback");
          const active = index === activeIndex;
          return (
            <div key={item.id} className="flex items-center gap-2">
              <div
                aria-current={active ? "step" : undefined}
                className={[
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-surface text-primary"
                      : "border-border bg-transparent text-subtle",
                ].join(" ")}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span
                className={
                  active
                    ? "text-xs font-semibold text-fg"
                    : "hidden text-xs text-subtle sm:inline"
                }
              >
                {item.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="mx-1 h-px w-5 bg-border sm:w-10" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-subtle">
        {activeIndex + 1} / {STEPS.length}
      </span>
    </div>
  );
}

function MissionMeta() {
  return (
    <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface/60">
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-subtle">
          <Clock3 className="size-3.5" />
          <span className="text-[10px] uppercase tracking-[0.14em]">Temps</span>
        </div>
        <p className="mt-1 text-sm font-semibold">{TODAY_MISSION.durationMin} min</p>
      </div>
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-subtle">
          <Target className="size-3.5" />
          <span className="text-[10px] uppercase tracking-[0.14em]">Niveau</span>
        </div>
        <p className="mt-1 text-sm font-semibold">{TODAY_MISSION.level}</p>
      </div>
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-subtle">
          <MapPin className="size-3.5" />
          <span className="text-[10px] uppercase tracking-[0.14em]">Lieu</span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold">Saint-Pierre</p>
      </div>
    </div>
  );
}

function MissionRail({
  stageLabel,
  points,
  progress,
  remaining,
}: {
  stageLabel: string;
  points: number;
  progress: number;
  remaining: number;
}) {
  return (
    <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="bg-primary px-5 py-5 text-primary-foreground">
          <Eyebrow className="text-primary-foreground/65">Cap du jour</Eyebrow>
          <p className="mt-2 font-display text-2xl">Parler avant de corriger.</p>
          <p className="mt-2 text-xs leading-relaxed text-primary-foreground/75">
            La mission est courte. Le geste réel compte plus qu'une réponse parfaite.
          </p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted">Voyage BLOSSOM</span>
            <span className="font-display text-lg text-primary">{points} pts</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: String(Math.round(progress * 100)) + "%" }}
            />
          </div>
          <p className="text-[11px] text-subtle">
            {remaining > 0
              ? String(remaining) + " pts avant la prochaine étape."
              : "Étape actuelle stabilisée."}
          </p>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted">Étape</span>
            <Badge variant="outline">{stageLabel}</Badge>
          </div>
        </div>
      </Surface>

      <Surface className="hidden p-5 sm:block">
        <Eyebrow>Repère Léo</Eyebrow>
        <p className="mt-2 text-sm leading-relaxed text-muted">{LEARNER_MEMORY.leoNote}</p>
      </Surface>
    </aside>
  );
}

function BriefStep({
  mission,
  memoryEnabled,
  onStart,
}: {
  mission: ReturnType<typeof personaliseMission>;
  memoryEnabled: boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="relative isolate overflow-hidden bg-surface-2 px-6 py-7 sm:px-8 sm:py-9">
          <div className="absolute -right-16 -top-20 size-48 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <div className="absolute -bottom-24 left-12 size-52 rounded-full bg-clay/10 blur-3xl" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <Badge className="bg-surface text-primary shadow-none">
                {TODAY_MISSION.language} · {TODAY_MISSION.level}
              </Badge>
              {memoryEnabled ? (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  Léo ajuste la mission
                </span>
              ) : null}
            </div>
            <h2 className="mt-7 max-w-3xl font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">
              {mission.title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {mission.prompt}
            </p>
            <div className="mt-6">
              <MissionMeta />
            </div>
          </div>
        </div>
        <div className="grid gap-0 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className="p-5 sm:p-6">
            <Eyebrow>Situation</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-muted">{mission.context}</p>
          </div>
          <div className="p-5 sm:p-6">
            <Eyebrow>À réussir</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Ouvrir la conversation. Demander. Répondre. Ne pas chercher une phrase parfaite.
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <Eyebrow>Phrase d'appui</Eyebrow>
            <p className="mt-2 font-display text-xl leading-snug">“What do you recommend?”</p>
            <p className="mt-2 text-xs text-subtle">Un appui, pas un script.</p>
          </div>
        </div>
      </Surface>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded-lg border border-border bg-surface/55 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <MapPin className="size-3.5 text-primary" />
            {TODAY_MISSION.place}
          </div>
          <p className="mt-1 pl-5 text-xs leading-relaxed text-muted">
            Faites-le pour de vrai, ou utilisez l'enregistrement lorsque personne n'est disponible.
          </p>
        </div>
        <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
          Commencer la mission
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function RecordStep({ onFinished }: { onFinished: (seconds?: number) => void }) {
  return (
    <Surface className="overflow-hidden border border-primary/15 bg-primary p-0 text-primary-foreground">
      <div className="px-6 pb-7 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Eyebrow className="text-primary-foreground/60">Parlez maintenant</Eyebrow>
            <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
              Une réponse naturelle.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/75">
              Tenez le bouton pendant votre réponse. Rien n'est sauvegardé ici : le contrôle mesure uniquement la durée de votre prise de parole.
            </p>
          </div>
          <div className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-primary-foreground/75">
            {TODAY_MISSION.durationMin} min conseillées
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.055] px-5 py-7 sm:px-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/55">Situation</p>
              <p className="mt-1 text-sm font-medium">Au déjeuner · Saint-Pierre</p>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Volume2 className="size-4" />
              <span className="text-xs">Voix libre</span>
            </div>
          </div>
          <div className="rounded-xl bg-primary-foreground/[0.055] px-4 py-5 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/50">Votre impulsion</p>
            <p className="mx-auto mt-3 max-w-xl font-display text-2xl leading-snug sm:text-3xl">
              What do you recommend?
            </p>
            <p className="mt-2 text-xs text-primary-foreground/55">Puis laissez la conversation venir.</p>
          </div>
          <div className="mt-8">
            <RecordControl onFinished={onFinished} inverted />
          </div>
        </div>
      </div>
    </Surface>
  );
}

function FeedbackStep({
  already,
  seconds,
  onClose,
  onRestart,
}: {
  already: boolean;
  seconds: number | null;
  onClose: () => void;
  onRestart: () => void;
}) {
  const [showMethod, setShowMethod] = useState(false);

  return (
    <div className="space-y-4">
      <Surface className="overflow-hidden border border-border/70 p-0">
        <div className="bg-surface-2 px-6 py-7 sm:px-8 sm:py-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Mission terminée</Eyebrow>
              <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Le geste est fait.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {already
                  ? "Cette mission était déjà validée. Vous pouvez relire le débrief sans générer une seconde récompense."
                  : "Voici le débrief guidé de la mission. Il porte sur l'objectif travaillé, pas sur une prétendue analyse automatique de votre audio."}
              </p>
            </div>
            <div className="hidden rounded-full bg-primary p-3 text-primary-foreground sm:flex">
              <Check className="size-5" />
            </div>
          </div>
          {seconds !== null ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
              <Clock3 className="size-3.5 text-primary" />
              {seconds > 0 ? String(seconds) + "s parlées" : "Mode sans micro"}
            </div>
          ) : null}
        </div>

        <div className="grid gap-0 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className="p-6">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <Eyebrow className="text-primary">Ce qui compte</Eyebrow>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{MISSION_FEEDBACK.strength}</p>
          </div>
          <div className="p-6">
            <Eyebrow>À ajuster</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-muted">{MISSION_FEEDBACK.improvement}</p>
          </div>
          <div className="p-6">
            <Eyebrow>Phrase à emporter</Eyebrow>
            <p className="mt-3 font-display text-2xl leading-snug">{MISSION_FEEDBACK.model}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{MISSION_FEEDBACK.note}</p>
          </div>
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 text-left"
          onClick={() => setShowMethod((value) => !value)}
          aria-expanded={showMethod}
        >
          <div>
            <Eyebrow>Transparence</Eyebrow>
            <p className="mt-1 text-sm font-semibold">Comment ce débrief est construit</p>
          </div>
          <ArrowRight className={showMethod ? "size-4 rotate-90 text-primary transition-transform" : "size-4 text-subtle transition-transform"} />
        </button>
        {showMethod ? (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 text-xs leading-relaxed text-muted sm:grid-cols-2">
            <p>
              La durée de parole peut être mesurée par le navigateur. Aucun score de prononciation n'est inventé à partir de l'enregistrement.
            </p>
            <p>
              Pour une analyse phonétique réelle, le module Pron'Lab reste la surface spécialisée de BLOSSOM.
            </p>
          </div>
        ) : null}
      </Surface>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="size-4" />
          Refaire
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/pronlab">
            Continuer avec Pron'Lab
            <Mic2 className="size-4" />
          </Link>
        </Button>
        <Button onClick={onClose}>
          Retour au voyage
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function MissionDashboard() {
  const navigate = useNavigate();
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const plan = useBlossom((s) => s.plan);
  const complete = useBlossom((s) => s.completeActivity);
  const already = hasSource(log, TODAY_MISSION.id);
  const [step, setStep] = useState<Step>(already ? "feedback" : "brief");
  const [seconds, setSeconds] = useState<number | null>(null);

  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const mission = personaliseMission(TODAY_MISSION, memory, memoryOn);
  const journey = journeySnapshot(log);

  function finish(secondsValue?: number) {
    setSeconds(secondsValue ?? 0);
    setStep("feedback");
    track("mission_record_finished", {
      seconds: secondsValue ?? 0,
      mode: (secondsValue ?? 0) > 0 ? "microphone" : "no-mic",
    });
  }

  function closeMission() {
    const result = complete(
      "MISSION_COMPLETED",
      TODAY_MISSION.id,
      seconds === null ? undefined : "Session de " + String(seconds) + "s",
    );
    if (result.ok) {
      track("mission_debrief_closed", { seconds: seconds ?? 0 });
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
        <span className="text-[11px] uppercase tracking-[0.18em] text-subtle">Mission active</span>
      </div>

      <MissionHeader step={step} completed={already} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <main className="min-w-0">
          {step === "brief" ? (
            <>
              <Eyebrow>Mission du jour · {TODAY_MISSION.language}</Eyebrow>
              <h1 className="mt-2 max-w-4xl font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl">
                Osez la conversation avant de chercher la perfection.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Une séquence courte, située dans votre vraie vie, avec un seul geste à réussir.
              </p>
              <div className="mt-8">
                <BriefStep mission={mission} memoryEnabled={memoryOn} onStart={() => {
                  track("mission_started");
                  setStep("record");
                }} />
              </div>
            </>
          ) : null}

          {step === "record" ? (
            <>
              <Eyebrow>Mission du jour · en direct</Eyebrow>
              <h1 className="mt-2 max-w-4xl font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl">
                Faites-le comme dans la vraie scène.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Pas de script. Un appui, puis votre propre parole.
              </p>
              <div className="mt-8">
                <RecordStep onFinished={finish} />
              </div>
            </>
          ) : null}

          {step === "feedback" ? (
            <>
              <Eyebrow>Mission du jour · débrief</Eyebrow>
              <h1 className="mt-2 max-w-4xl font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl">
                Transformez l'effort en réflexe.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Un rappel précis, une phrase à emporter, puis retour au parcours.
              </p>
              <div className="mt-8">
                <FeedbackStep
                  already={already}
                  seconds={seconds}
                  onRestart={() => {
                    setSeconds(null);
                    setStep("record");
                  }}
                  onClose={closeMission}
                />
              </div>
            </>
          ) : null}
        </main>

        <MissionRail
          stageLabel={journey.stage.label}
          points={journey.points}
          progress={journey.progress}
          remaining={journey.remaining}
        />
      </div>
    </Page>
  );
}
