import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
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
import { MODES, deriveSceneBeats, formatDuration, speakModel } from "./mission-theatre-shared";

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
  const warmupDone = missionAttemptCount(run, "warmup") > 0;
  const [kitOpen, setKitOpen] = useState(false);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const rescue = objective.scene?.rescuePhrases.slice(0, 2) ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-border)]">
        <div className="grid gap-0 lg:grid-cols-3">
          <div className="p-6 sm:p-8">
            <Eyebrow>01 · Intention</Eyebrow>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Un geste. Pas une performance.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">{objective.situation}</p>
            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Phrase de départ</p>
              <p className="mt-2 font-display text-2xl leading-tight">“{objective.supportPhrase}”</p>
              <button
                type="button"
                onClick={() => speakModel(objective.supportPhrase)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-semibold text-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Volume2 className="size-3.5 text-primary" />
                Écouter une fois
              </button>
            </div>

            {!warmupDone ? (
              <details
                className="group mt-5 rounded-2xl border border-border bg-surface-2/35"
                open={warmupOpen}
                onToggle={(event) => setWarmupOpen(event.currentTarget.open)}
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <Mic2 className="size-4 text-primary" />
                  <span className="flex-1">Échauffement facultatif</span>
                  <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border p-4">
                  <p className="text-xs leading-5 text-muted">
                    Une minute maximum. Cela compte comme pratique, jamais comme preuve de réussite.
                  </p>
                  {!warmupOpen ? null : (
                    <div className="mt-4">
                      <RecordControl
                        cta="Maintenir pour parler"
                        onFinished={(seconds) => {
                          onWarmup(seconds ?? 0);
                          setWarmupOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </details>
            ) : (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Préparation faite</p>
                  <p className="mt-0.5 text-xs text-muted">Il n'est plus utile de répéter.</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-6 sm:p-8 lg:border-l lg:border-t-0">
            <Eyebrow>02 · Kit</Eyebrow>
            <button
              type="button"
              onClick={() => setKitOpen((value) => !value)}
              aria-expanded={kitOpen}
              className="mt-3 flex min-h-12 w-full items-center gap-3 text-left"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Headphones className="size-4" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-2xl">Trois appuis, pas plus.</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {kitOpen ? "Le kit est ouvert." : "Ouvrez-le seulement si votre esprit en a besoin."}
                </span>
              </span>
              <ChevronDown className={kitOpen ? "size-4 rotate-180 text-subtle transition-transform" : "size-4 text-subtle transition-transform"} />
            </button>

            {kitOpen ? (
              <div className="mt-5 space-y-2">
                {(objective.scene?.languageKit.slice(0, 3) ?? [{ phrase: objective.supportPhrase, meaning: "", use: "Commencer." }]).map(
                  (item, index) => (
                    <button
                      type="button"
                      key={item.phrase}
                      onClick={() => speakModel(item.phrase)}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-surface-2/35 p-3.5 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 text-[10px] font-semibold tabular-nums text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg leading-tight">{item.phrase}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-muted">{item.use}</span>
                      </span>
                      <Volume2 className="size-4 shrink-0 text-subtle" />
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-6 sm:p-8 lg:border-l lg:border-t-0">
            <Eyebrow>03 · Secours</Eyebrow>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-primary">
                <CircleHelp className="size-4" />
              </div>
              <div>
                <p className="font-display text-2xl">Deux filets. Pas de filet de pêche.</p>
                <p className="mt-1 text-xs leading-5 text-muted">Ils restent fermés jusqu'à l'exécution.</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {rescue.length ? (
                rescue.map((item, index) => (
                  <div key={item.phrase} className="rounded-xl border border-border bg-surface-2/25 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                        Secours {String(index + 1).padStart(2, "0")}
                      </span>
                      <ShieldCheck className="size-3.5 text-subtle" />
                    </div>
                    <p className="mt-2 text-sm text-muted">Disponible dans la scène si nécessaire.</p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-surface-2/35 p-4 text-xs leading-5 text-muted">
                  Une phrase de récupération simple sera disponible pendant l'action.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 size-4 text-primary" />
            <p className="text-sm leading-6 text-muted">
              {run?.challenge === "stretch"
                ? "Votre scène reste la même. La relance n'arrive que si le premier geste tient."
                : "Votre scène reste simple : ouvrir, choisir, puis laisser respirer l'échange."}
            </p>
          </div>
          <Button size="lg" onClick={onContinue} className="w-full sm:w-auto">
            Passer à l'action
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function BeatNode({
  label,
  active,
  index,
  onClick,
}: {
  label: string;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-[border-color,background-color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-border-hover)]"
          : "border-border bg-surface-2/70 text-muted hover:-translate-y-0.5 hover:border-primary/20 hover:text-fg",
      ].join(" ")}
    >
      <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
      {label}
    </button>
  );
}

function BeatNavigator({
  beats,
  selectedIndex,
  onSelect,
  selectedPhrase,
}: {
  beats: ReturnType<typeof deriveSceneBeats>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  selectedPhrase: string;
}) {
  const desktopPositions = [
    "left-1/2 top-0 -translate-x-1/2",
    "right-0 top-1/2 -translate-y-1/2",
    "bottom-0 left-1/2 -translate-x-1/2",
    "left-0 top-1/2 -translate-y-1/2",
  ];

  return (
    <div className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-border)]">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Eyebrow>Intelligence de scène</Eyebrow>
            <p className="mt-1 text-sm text-muted">Choisissez le prochain beat seulement quand vous en avez besoin.</p>
          </div>
          <Target className="size-4 text-primary" />
        </div>
      </div>

      <div className="lg:hidden">
        <div className="flex snap-x gap-2 overflow-x-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {beats.map((beat, index) => (
            <div key={beat.id} className="shrink-0 snap-start">
              <BeatNode label={beat.label} active={selectedIndex === index} index={index} onClick={() => onSelect(index)} />
            </div>
          ))}
        </div>
        <div className="border-t border-border p-5">
          <p className="font-display text-2xl leading-tight">“{selectedPhrase}”</p>
        </div>
      </div>

      <div className="hidden p-8 lg:block">
        <div className="relative mx-auto aspect-square max-w-lg">
          <div className="absolute inset-[18%] rounded-full border border-border bg-surface-2/20" aria-hidden />
          <div className="absolute inset-[34%] rounded-full border border-primary/10 bg-primary/[0.025]" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center px-12 text-center">
            <div>
              <Eyebrow>Beat actif</Eyebrow>
              <p className="mt-3 font-display text-3xl leading-tight">“{selectedPhrase}”</p>
            </div>
          </div>
          {beats.map((beat, index) => (
            <div key={beat.id} className={`absolute ${desktopPositions[index] ?? desktopPositions[0]}`}>
              <BeatNode label={beat.label} active={selectedIndex === index} index={index} onClick={() => onSelect(index)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LifelineCard({
  phrase,
  meaning,
  used,
  onUse,
}: {
  phrase: string;
  meaning: string;
  used: boolean;
  onUse: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={used ? "Secours déjà utilisé" : "Voir et utiliser le secours"}
      onClick={() => {
        setFlipped((value) => !value);
        if (!used) onUse();
      }}
      className="min-h-28 w-full rounded-2xl border border-border bg-surface-2/35 p-4 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-70"
      disabled={used}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          {used ? "Appui utilisé" : flipped ? "Sens" : "Secours"}
        </span>
        <Headphones className="size-3.5 text-subtle" />
      </div>
      <p className="mt-3 font-display text-xl leading-tight">
        {flipped ? meaning : `“${phrase}”`}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-muted">
        {used ? "Avec appui — ça compte encore." : flipped ? "Touchez pour revenir à la phrase." : "Touchez pour révéler le sens et activer ce secours."}
      </p>
    </button>
  );
}

export function ExecuteStage({
  mode,
  challenge,
  objective,
  attemptCount,
  durationMin,
  supportUsed,
  onSupportUsed,
  onFinished,
  onManualDone,
}: {
  mode: MissionMode;
  challenge: MissionChallenge;
  objective: ReturnType<typeof missionObjective>;
  attemptCount: number;
  durationMin: number;
  supportUsed: boolean;
  onSupportUsed: () => void;
  onFinished: (seconds: number) => void;
  onManualDone: () => void;
}) {
  const beats = deriveSceneBeats(objective);
  const visibleBeats = challenge === "stretch" ? beats : beats.slice(0, 2);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedBeat = visibleBeats[Math.min(selectedIndex, visibleBeats.length - 1)]!;
  const lifelines = objective.scene?.rescuePhrases.slice(0, 2) ?? [];
  const attemptsLeft = Math.max(0, 2 - attemptCount);

  return (
    <div className="min-h-[calc(100svh-7.5rem)]">
      <div className="mx-auto flex min-h-[calc(100svh-7.5rem)] max-w-6xl flex-col rounded-[32px] border border-primary/15 bg-surface-2/45 px-5 py-5 shadow-[var(--shadow-border)] sm:px-8 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MapPin className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">{MODES[mode].title}</p>
              <p className="mt-1 text-sm font-semibold">La scène est maintenant à vous.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Passages</p>
            <p className="mt-1 font-display text-2xl tabular-nums">{attemptsLeft}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-4xl text-center">
            {objective.scene ? (
              <div className="mx-auto mb-7 grid max-w-5xl gap-px overflow-hidden rounded-2xl border border-border bg-border/70 text-left sm:grid-cols-3">
                <div className="bg-surface/90 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">Moment</p>
                  <p className="mt-1 text-sm font-semibold">{objective.scene.time}</p>
                </div>
                <div className="bg-surface/90 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">Autour de vous</p>
                  <p className="mt-1 text-sm leading-5 text-muted">{objective.scene.sensoryCue}</p>
                </div>
                <div className="bg-surface/90 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">Pression utile</p>
                  <p className="mt-1 text-sm leading-5 text-muted">{objective.scene.pressure}</p>
                </div>
              </div>
              </div>
            ) : null}
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-subtle">Votre geste maintenant</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.92] tracking-tight sm:text-7xl">
              {selectedBeat.label}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight text-fg sm:text-5xl">
              “{selectedBeat.phrase}”
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">{selectedBeat.detail}</p>

            <div className="mx-auto mt-7 max-w-xl lg:hidden">
              <BeatNavigator
                beats={visibleBeats}
                selectedIndex={Math.min(selectedIndex, visibleBeats.length - 1)}
                onSelect={setSelectedIndex}
                selectedPhrase={selectedBeat.phrase}
              />
            </div>

            <div className="mx-auto mt-8 hidden max-w-xl lg:block">
              <BeatNavigator
                beats={visibleBeats}
                selectedIndex={Math.min(selectedIndex, visibleBeats.length - 1)}
                onSelect={setSelectedIndex}
                selectedPhrase={selectedBeat.phrase}
              />
            </div>

            <div className="mx-auto mt-8 max-w-xl rounded-[28px] border border-border bg-surface p-5 sm:p-7">
              {mode === "practice" ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Studio · durée uniquement</p>
                  <div className="mt-5">
                    <RecordControl
                      cta="Maintenir pour parler"
                      onFinished={(seconds) => onFinished(seconds ?? 0)}
                    />
                  </div>
                  <p className="mx-auto mt-4 max-w-md text-xs leading-5 text-muted">
                    Le micro mesure le temps. Pas un diagnostic clinique.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Terrain · hors ligne accepté</p>
                  <div className="mx-auto mt-5 flex size-16 items-center justify-center rounded-full bg-surface-2 text-primary">
                    <MapPin className="size-7" />
                  </div>
                  <p className="mt-4 font-display text-2xl">Parlez à un humain.</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                    Faites la scène, puis revenez ici. Aucun réseau n'est requis pour consigner le geste.
                  </p>
                  <Button size="lg" onClick={onManualDone} className="mt-6 w-full">
                    <Check className="size-4" />
                    J'ai parlé à un humain
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CircleHelp className="size-4 text-primary" />
                <p className="text-sm font-semibold">Lifelines</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {lifelines.map((item) => (
                  <LifelineCard
                    key={item.phrase}
                    phrase={item.phrase}
                    meaning={item.meaning}
                    used={supportUsed}
                    onUse={onSupportUsed}
                  />
                ))}
              </div>
            </div>
            <div className="lg:w-72">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                <span>Fenêtre de mission</span>
                <span className="tabular-nums">{durationMin} min</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full w-full rounded-full bg-primary/70" />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Une seule exigence : faire le geste. Tout le reste est secondaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        "min-h-12 rounded-xl border p-3.5 text-left transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/[0.06]"
          : "border-border bg-surface-2/25 hover:-translate-y-0.5 hover:bg-surface-2/45",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className={selected ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border"}>
          {selected ? <Check className="size-3" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{label}</span>
          {detail ? <span className="mt-1 block text-xs leading-5 text-muted">{detail}</span> : null}
        </span>
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
  onSave: (next?: MissionReflection) => void;
  onRedo: () => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const evaluation = saved ? evaluateMission(draft) : null;
  const spoken = run?.attempts
    .filter((attempt) => attempt.kind === "mission")
    .reduce((sum, attempt) => sum + attempt.seconds, 0) ?? 0;

  const prompts = [
    { id: "objective", label: "Objectif", question: "Le geste a-t-il réellement eu lieu ?" },
    { id: "language", label: "Langue cible", question: "Comment la langue cible a-t-elle tenu ?" },
    { id: "confidence", label: "Confiance", question: "À quel point le geste était-il disponible ?" },
  ] as const;

  function chooseObjective(value: boolean) {
    onChange({ ...draft, objectiveAchieved: value });
    if (index < 2) setIndex(1);
  }

  function chooseLanguage(value: MissionReflection["stayedInTargetLanguage"]) {
    onChange({ ...draft, stayedInTargetLanguage: value });
    if (index < 2) setIndex(2);
  }

  function chooseConfidence(value: MissionReflection["confidence"]) {
    const next = { ...draft, confidence: value };
    onChange(next);
    queueMicrotask(() => onSave(next));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-border)]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow>Trois repères</Eyebrow>
              <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                Ancre seulement ce que vous savez.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Trois gestes suffisent. Chaque réponse passe immédiatement au repère suivant.
              </p>
            </div>
            {spoken ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted">
                <span className="size-1.5 rounded-full bg-primary" />
                {formatDuration(spoken)} parlées
              </span>
            ) : null}
          </div>

          {!saved ? (
            <>
              <div className="mt-8 flex gap-2" aria-label="Progression du bilan">
                {prompts.map((prompt, promptIndex) => (
                  <span
                    key={prompt.id}
                    className={promptIndex <= index ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-surface-2"}
                  />
                ))}
              </div>

              <div
                className="mt-8 rounded-[24px] border border-border bg-surface-2/25 p-5 sm:p-7"
                aria-live="polite"
              >
                <Eyebrow>
                  {String(index + 1).padStart(2, "0")} · {prompts[index]!.label}
                </Eyebrow>
                <h3 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
                  {prompts[index]!.question}
                </h3>

                <div className="mt-7">
                  {index === 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ReflectionChoice
                        label="Oui"
                        detail="La scène a réellement été tentée."
                        selected={draft.objectiveAchieved}
                        onClick={() => chooseObjective(true)}
                      />
                      <ReflectionChoice
                        label="Pas encore"
                        detail="Pas de faux crédit : on reprend plus petit."
                        selected={!draft.objectiveAchieved}
                        onClick={() => chooseObjective(false)}
                      />
                    </div>
                  ) : null}

                  {index === 1 ? (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ReflectionChoice
                        label="Du début à la fin"
                        selected={draft.stayedInTargetLanguage === "yes"}
                        onClick={() => chooseLanguage("yes")}
                      />
                      <ReflectionChoice
                        label="Par moments"
                        selected={draft.stayedInTargetLanguage === "partly"}
                        onClick={() => chooseLanguage("partly")}
                      />
                      <ReflectionChoice
                        label="J'ai basculé"
                        selected={draft.stayedInTargetLanguage === "no"}
                        onClick={() => chooseLanguage("no")}
                      />
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
                            onClick={() => chooseConfidence(score)}
                            className={[
                              "flex min-h-14 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                              draft.confidence === score
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface hover:bg-surface-2",
                            ].join(" ")}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between text-[11px] text-subtle">
                        <span>Bloqué</span>
                        <span>Naturel</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIndex((value) => Math.max(0, value - 1))}
                    className="mt-6 min-h-11 rounded-lg px-2 text-xs font-semibold text-muted underline decoration-border underline-offset-4 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    Revenir au repère précédent
                  </button>
                ) : null}
              </div>

              <details className="group mt-4 rounded-2xl border border-border bg-surface-2/20">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
                  <span className="flex-1 text-sm font-semibold">Détails avancés</span>
                  {draft.supportUsed ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Avec appui
                    </span>
                  ) : null}
                </summary>
                <div className="border-t border-border p-4 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <Eyebrow>Friction dominante</Eyebrow>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    <div>
                      <Eyebrow>Note libre</Eyebrow>
                      <textarea
                        value={draft.note ?? ""}
                        onChange={(event) =>
                          onChange({ ...draft, note: event.target.value.slice(0, 140) })
                        }
                        placeholder="Une phrase sur ce qui a réellement compté…"
                        aria-label="Note libre sur la mission"
                        className="mt-3 min-h-28 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                      <p className="mt-2 text-right text-[10px] tabular-nums text-subtle">
                        {(draft.note ?? "").length}/140
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </>
          ) : null}
        </div>
      </section>

      {evaluation ? (
        <section className="overflow-hidden rounded-[28px] border border-primary/15 bg-primary text-primary-foreground shadow-[var(--shadow-border)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <Eyebrow className="text-primary-foreground/55">Ce que BLOSSOM a entendu</Eyebrow>
              <h3 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                {evaluation.outcome === "advance"
                  ? "Le geste peut changer de scène."
                  : evaluation.outcome === "stabilise"
                    ? "Le geste est là. On le stabilise."
                    : "On garde la même cible."}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/70">
                {evaluation.summary}
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5">
                  {evaluation.evidenceCount}/3 signaux
                </span>
                {draft.supportUsed ? (
                  <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5">
                    Avec appui — ça compte encore.
                  </span>
                ) : null}
              </div>
            </div>
            <div className="border-t border-primary-foreground/10 bg-primary-foreground/[0.045] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <Eyebrow className="text-primary-foreground/55">Suite</Eyebrow>
              <p className="mt-3 font-display text-2xl leading-snug">{evaluation.nextAction}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={onRedo}
                  disabled={!missionExecutionReady(run)}
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <RotateCcw className="size-4" />
                  Refaire le geste
                </Button>
                <Button
                  onClick={onFinish}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Ancrer et voir la croissance
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
