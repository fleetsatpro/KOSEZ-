import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  MapPin,
  Mic2,
  RotateCcw,
  ShieldCheck,
  Target,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { RecordControl } from "@/components/app/record-control";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/app/primitives";
import {
} from "@/lib/blossom/data";
import {
  evaluateMission,
  missionAttemptCount,
  missionExecutionReady,
  missionObjective,
  type MissionChallenge,
  type MissionMode,
  type MissionReflection,
  type MissionRun,
  summariseMissionHistory,
} from "@/lib/blossom/mission";
import {
  MODES,
  formatDuration,
  speakModel,
} from "./mission-theatre-shared";

export function PrepareStage({
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

export function ExecuteStage({
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

export function ReflectionChoice({
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

export function ReflectionStage({
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


