import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Leaf, Target } from "lucide-react";
import { useMemo } from "react";
import { AmbientParticles } from "@/components/app/ambient-particles";
import { Button } from "@/components/ui/button";
import {
  LEARNER_MEMORY,
  planAllows,
  PLANT_IMAGE,
  PRONLAB_SETS,
} from "@/lib/blossom/data";
import {
  hasSource,
  nextStage,
  personaliseMission,
  resolveMemory,
} from "@/lib/blossom/engine";
import { influenceFromState } from "@/lib/blossom/influence";
import {
  courageDaysFromLog,
  courageRibbon,
} from "@/lib/blossom/organism";
import { todayMissionForLevel } from "@/lib/blossom/mission-today";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { todayLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Home is the organism's status surface.
 * Status line, doors, and annotations come from the influence engine —
 * Pron'Lab struggle, mission friction, minerals, and phoneme mastery
 * actually decide what you see and why.
 */
export function HomeDashboard() {
  const learner = useBlossom((s) => s.learner);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const plan = useBlossom((s) => s.plan);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const missionSessions = useBlossom((s) => s.missionSessions);
  const journey = useJourney();

  const todayMission = todayMissionForLevel(learner.level);
  const missionDone = hasSource(log, todayMission.id);
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const mission = personaliseMission(todayMission, memory, memoryOn);
  const upcoming = nextStage(journey.stage.id);
  const ribbon = courageRibbon(courageDaysFromLog(log));
  const spoken = ribbon.filter(Boolean).length;
  const plantSrc = PLANT_IMAGE[journey.stage.id];
  const initials = learner.firstName
    ? learner.firstName.slice(0, 1).toUpperCase()
    : "K";
  const progress = Math.max(4, Math.round(journey.progress * 100));
  const particleIntensity = Math.min(1, 0.35 + journey.progress * 0.55);

  const influence = useMemo(
    () =>
      influenceFromState({
        activityLog: log,
        pronlabAttempts: attempts,
        growthEvents,
        phonemeLeaves,
        missionSessions,
        allItems: PRONLAB_SETS.flatMap((s) => s.items),
        memory,
        memoryOn,
      }),
    [log, attempts, growthEvents, phonemeLeaves, missionSessions, memory, memoryOn],
  );

  const recentGrowth = [...growthEvents]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 3);

  const primaryDoor = influence.home.doors[0];
  const struggle = influence.struggle;

  return (
    <div data-smoke="blossom-home" className="kosez-home relative min-h-[calc(100dvh-5.5rem)] lg:min-h-dvh">
      <div className="relative isolate min-h-[72dvh] overflow-hidden lg:min-h-dvh">
        <img
          src={plantSrc}
          alt=""
          className="plant-sway absolute inset-0 h-full w-full object-cover object-center scale-[1.02]"
        />
        <AmbientParticles
          stageId={journey.stage.id}
          intensity={particleIntensity}
          className="pointer-events-none absolute inset-0 z-[1] opacity-80"
        />
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/55 to-black/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-r from-black/50 via-transparent to-transparent"
          aria-hidden
        />

        <header className="relative z-10 flex items-start justify-between gap-4 px-5 pt-7 lg:px-12 lg:pt-11">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {todayLabel()}
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-white sm:text-4xl">
              {learner.firstName || "Votre espace"}
            </h1>
          </div>
          <Link
            to="/moi"
            aria-label="Ouvrir MOI — identité, plan et preuves"
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

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-5 pt-[10vh] text-center lg:pt-[15vh]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
            {journey.stage.label}
          </p>
          <p className="mt-4 font-display text-3xl leading-snug tracking-tight text-white sm:text-5xl sm:leading-tight">
            {influence.home.statusLine}
          </p>
          {influence.home.annotation ? (
            <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
              {influence.home.annotation}
            </p>
          ) : (
            <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
              Un geste utile vaut mieux qu'une longue séance. La plante grandit uniquement parce que vous avez agi.
            </p>
          )}

          {influence.home.reasons.filter((r) => r.code !== "balanced").length > 0 ? (
            <ul
              className="mt-4 max-w-md space-y-1 text-left"
              aria-label="Signaux de l'organisme"
            >
              {influence.home.reasons
                .filter((r) => r.code !== "balanced")
                .slice(0, 3)
                .map((r) => (
                  <li
                    key={r.code + r.line.slice(0, 20)}
                    className="text-[11px] leading-5 text-white/50"
                  >
                    <span className="font-semibold text-primary/70">
                      {r.code.replace(/-/g, " ")} ·{" "}
                    </span>
                    {r.line}
                  </li>
                ))}
            </ul>
          ) : null}

          {recentGrowth.length > 0 ? (
            <ul
              className="mt-5 flex flex-wrap justify-center gap-2"
              aria-label="Gestes récents qui ont nourri la plante"
            >
              {recentGrowth.map((g) => (
                <li
                  key={g.id}
                  className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/75 backdrop-blur-sm"
                >
                  {g.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-[11px] text-white/40">
              Aucun geste encore — le premier fera germer la graine.
            </p>
          )}

          {struggle ? (
            <Link
              to="/pronlab"
              className="mt-4 inline-flex max-w-md items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-left text-[12px] text-primary backdrop-blur-sm transition-colors hover:bg-primary/15"
              aria-label={`Son qui résiste : ${struggle.focus || struggle.phrase}. Ouvrir Pron'Lab.`}
            >
              <Target className="size-3.5 shrink-0" />
              <span>
                <span className="font-semibold">Son qui résiste · </span>
                {struggle.focus || struggle.phrase}
                <span className="mt-0.5 block text-[10px] text-primary/70">
                  Traverse Mission, OSEZ et Pulse — pas seulement Pron'Lab
                </span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 opacity-70" />
            </Link>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8 lg:px-12 lg:pb-12">
          <div className="mb-6 flex flex-col items-center gap-2">
            <ul
              className="flex flex-wrap justify-center gap-1"
              aria-label={`${spoken} jours de parole sur 28 — sans flamme, sans anxiété`}
            >
              {ribbon.map((on, i) => (
                <li
                  key={i}
                  title={on ? "Geste ce jour-là" : "Terre en jachère"}
                  className={cn(
                    "size-1.5 rounded-full sm:size-2 transition-shadow duration-300",
                    on
                      ? "bg-primary shadow-[0_0_8px_rgba(217,255,105,0.55)]"
                      : "bg-white/15",
                  )}
                />
              ))}
            </ul>
            <p className="text-[10px] tabular-nums tracking-wide text-white/40">
              {spoken} / 28 · sans flamme
            </p>
          </div>

          <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-6 magnetic-surface">
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
            {memoryOn && memory.hesitation ? (
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
                Noté. La terre s'en souvient — la plante a déjà bougé.
              </p>
            ) : (
              <p className="mt-3 text-xs text-white/35">
                Ce geste écrira une racine visible sur votre BLOSSOM.
              </p>
            )}
          </div>

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
                  : "Stade ultime — rayonnez"}
              </span>
            </div>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression BLOSSOM — points gagnés uniquement par des gestes réels"
            >
              <div
                className="h-full rounded-full bg-primary/90 transition-[width] duration-500 plant-breathe"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <nav
        className="border-t border-border/60 bg-bg px-5 py-6 lg:px-12"
        aria-label="Portes causales — prioritaires selon l'organisme"
      >
        {primaryDoor ? (
          <div className="mx-auto mb-4 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center sm:text-left magnetic-surface">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              Prochain geste causal · {primaryDoor.mineral}
            </p>
            <p className="mt-1 text-sm text-fg/90">{primaryDoor.line}</p>
            <p className="mt-1 text-[11px] text-subtle">
              Priorité {primaryDoor.priority} — calculée depuis Pron'Lab, missions et minéraux, pas un classement arbitraire.
            </p>
            <Link
              to={primaryDoor.door as "/osez" | "/pronlab" | "/mission" | "/tandem" | "/learn/labs"}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Ouvrir cette porte
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : null}

        {influence.home.doors.length > 1 ? (
          <ul className="mx-auto mb-4 flex max-w-2xl flex-wrap justify-center gap-2">
            {influence.home.doors.slice(1, 4).map((d) => (
              <li key={d.door}>
                <Link
                  to={d.door as "/osez" | "/pronlab" | "/mission" | "/tandem" | "/learn/labs"}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-[11px] text-muted hover:border-primary/30 hover:text-primary"
                >
                  {d.mineral}
                  <span className="text-subtle">·</span>
                  {d.line.slice(0, 42)}
                  {d.line.length > 42 ? "…" : ""}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

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
              <span className="text-subtle">· le parcours causal</span>
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
