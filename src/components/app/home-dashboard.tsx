import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LEARNER_MEMORY,
  missionForLevel,
  planAllows,
  PLANT_IMAGE,
} from "@/lib/blossom/data";
import {
  hasSource,
  nextStage,
  personaliseMission,
  resolveMemory,
} from "@/lib/blossom/engine";
import {
  courageDaysFromLog,
  courageRibbon,
  organismStatusLine,
} from "@/lib/blossom/organism";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { todayLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Home is not a dashboard.
 * One living stage. One gesture. Atmosphere, not widgets.
 */
export function HomeDashboard() {
  const learner = useBlossom((s) => s.learner);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const plan = useBlossom((s) => s.plan);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const journey = useJourney();

  const todayMission = missionForLevel(learner.level);
  const missionDone = hasSource(log, todayMission.id);
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const mission = personaliseMission(todayMission, memory, memoryOn);
  const upcoming = nextStage(journey.stage.id);
  const leoLine = organismStatusLine(minerals);
  const ribbon = courageRibbon(courageDaysFromLog(log));
  const spoken = ribbon.filter(Boolean).length;
  const plantSrc = PLANT_IMAGE[journey.stage.id];
  const initials = learner.firstName
    ? learner.firstName.slice(0, 1).toUpperCase()
    : "K";
  const progress = Math.max(4, Math.round(journey.progress * 100));

  return (
    <div className="kosez-home relative min-h-[calc(100dvh-5.5rem)] lg:min-h-dvh">
      {/* —— Living stage (full-bleed plant) —— */}
      <div className="relative isolate min-h-[72dvh] overflow-hidden lg:min-h-dvh">
        <img
          src={plantSrc}
          alt=""
          className="plant-sway absolute inset-0 h-full w-full object-cover object-center scale-[1.02]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"
          aria-hidden
        />

        {/* Top chrome */}
        <header className="relative z-10 flex items-start justify-between gap-4 px-5 pt-7 lg:px-12 lg:pt-11">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {todayLabel()}
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-white sm:text-4xl">
              {learner.firstName}
            </h1>
          </div>
          <Link
            to="/moi"
            aria-label="Ouvrir MOI"
            className="shrink-0 overflow-hidden rounded-full p-0.5 ring-1 ring-white/20 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {learner.avatar ? (
              <img
                src={learner.avatar}
                alt=""
                className="size-10 rounded-full object-cover sm:size-11"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/20 font-display text-sm text-white sm:size-11">
                {initials}
              </span>
            )}
          </Link>
        </header>

        {/* Centre: one sentence from the organism + stage */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-5 pt-[12vh] text-center lg:pt-[18vh]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
            {journey.stage.label}
          </p>
          <p className="mt-4 font-display text-3xl leading-snug tracking-tight text-white sm:text-5xl sm:leading-tight">
            {leoLine}
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
            Un geste utile vaut mieux qu'une longue séance.
          </p>
        </div>

        {/* Bottom of stage: courage atmosphere + primary CTA */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8 lg:px-12 lg:pb-12">
          {/* Courage as atmosphere — not a card */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <ul
              className="flex flex-wrap justify-center gap-1"
              aria-label={`${spoken} jours de parole sur 28`}
            >
              {ribbon.map((on, i) => (
                <li
                  key={i}
                  title={on ? "Geste ce jour-là" : "Terre en jachère"}
                  className={cn(
                    "size-1.5 rounded-full sm:size-2",
                    on ? "bg-primary shadow-[0_0_8px_rgba(217,255,105,0.55)]" : "bg-white/15",
                  )}
                />
              ))}
            </ul>
            <p className="text-[10px] tabular-nums tracking-wide text-white/40">
              {spoken} / 28 · sans flamme
            </p>
          </div>

          {/* The only real action */}
          <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              <Leaf className="size-3 text-primary" />
              <span>Geste du jour</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                {todayMission.durationMin} min
              </span>
            </div>
            <h2 className="mt-3 font-display text-2xl tracking-tight text-white sm:text-3xl">
              {mission.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/65">{mission.prompt}</p>
            {memoryOn ? (
              <p className="mt-3 text-xs leading-5 text-white/40">
                Léo retient : {memory.hesitation}
              </p>
            ) : null}

            <Button
              asChild
              size="lg"
              className="mt-5 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              <Link to="/mission">
                {missionDone ? "Revenir au geste" : "Faire le geste"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            {missionDone ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-primary/90">
                <Check className="size-3.5" />
                Noté. La terre s'en souvient.
              </p>
            ) : null}
          </div>

          {/* Stage progress — whisper, not a panel */}
          <div className="mx-auto mt-5 max-w-lg">
            <div className="flex items-center justify-between gap-3 text-[11px] text-white/40">
              <span className="font-display text-sm text-white/70">
                {journey.points}
                <span className="ml-1 font-sans text-[10px] uppercase tracking-wider text-white/35">
                  pts
                </span>
              </span>
              <span>
                {upcoming
                  ? `${journey.remaining} avant ${upcoming.label.toLowerCase()}`
                  : "Stade ultime"}
              </span>
            </div>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression BLOSSOM"
            >
              <div
                className="h-full rounded-full bg-primary/90 transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* —— Secondary doors: text, not cards —— */}
      <nav
        className="border-t border-border/60 bg-bg px-5 py-6 lg:px-12"
        aria-label="Portes secondaires"
      >
        <ul className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          <li>
            <Link
              to="/osez"
              className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-primary"
            >
              Osez
              <span className="text-subtle">· parler maintenant</span>
            </Link>
          </li>
          <li className="hidden text-border sm:inline" aria-hidden>
            ·
          </li>
          <li>
            <Link
              to="/pronlab"
              className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-primary"
            >
              Pron'Lab
              <span className="text-subtle">· un son</span>
            </Link>
          </li>
          <li className="hidden text-border sm:inline" aria-hidden>
            ·
          </li>
          <li>
            <Link
              to="/plant"
              className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-primary"
            >
              Végétal
              <span className="text-subtle">· le parcours</span>
            </Link>
          </li>
          <li className="hidden text-border sm:inline" aria-hidden>
            ·
          </li>
          <li>
            <Link
              to="/moi"
              className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-primary"
            >
              MOI
              <span className="text-subtle">· Léo & preuves</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
