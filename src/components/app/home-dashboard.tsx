import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Leaf,
  Mic2,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { BlossomPlant } from "@/components/app/plant";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CATALOGUE,
  LEARNER_MEMORY,
  TODAY_MISSION,
  UPCOMING_MISSIONS,
  WEEK_SPEAKING,
  planAllows,
} from "@/lib/blossom/data";
import {
  hasSource,
  nextStage,
  personaliseMission,
  resolveMemory,
} from "@/lib/blossom/engine";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { todayLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    to: "/osez",
    label: "Osez",
    detail: "Parler maintenant",
    icon: Mic2,
  },
  {
    to: "/pronlab",
    label: "Pron'Lab",
    detail: "Affiner un son",
    icon: Target,
  },
  {
    to: "/learn",
    label: "Learn",
    detail: "Reprendre le parcours",
    icon: BookOpen,
  },
] as const;

export function HomeDashboard() {
  const learner = useBlossom((s) => s.learner);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const plan = useBlossom((s) => s.plan);
  const journey = useJourney();

  const missionDone = hasSource(log, TODAY_MISSION.id);
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const mission = personaliseMission(TODAY_MISSION, memory, memoryOn);
  const upcoming = nextStage(journey.stage.id);

  const totalSpeaking = WEEK_SPEAKING.reduce((sum, day) => sum + day.minutes, 0);
  const activeSpeakingDays = WEEK_SPEAKING.filter((day) => day.minutes > 0).length;
  const maxSpeaking = Math.max(...WEEK_SPEAKING.map((day) => day.minutes), 1);
  const stageProgress = Math.round(journey.progress * 100);

  const nextMission = UPCOMING_MISSIONS[0];
  const weekendImmersion = CATALOGUE.find((item) => item.id === "cat-immersion");

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_70%_0%,rgba(47,93,80,0.12),transparent_58%)]" />

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            Aujourd'hui
          </p>
          <div className="mt-2 flex items-end gap-3">
            <h1 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.04em]">
              Bonjour, {learner.firstName}
            </h1>
            <span className="mb-1 hidden rounded-full border border-border bg-surface/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted sm:inline-flex">
              {learner.level} · {learner.targetLanguage}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">
            {todayLabel()} · Un geste utile vaut mieux qu'une longue séance.
          </p>
        </div>

        <Link
          to="/moi"
          aria-label="Ouvrir votre profil"
          className="group mt-1 shrink-0 rounded-full p-0.5 ring-1 ring-border transition-[box-shadow,transform] hover:-translate-y-0.5 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <img
            src={learner.avatar}
            alt=""
            className="size-12 rounded-full object-cover sm:size-14"
          />
        </Link>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-[0_24px_70px_-30px_rgba(28,43,38,0.45)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full border border-primary-foreground/10" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full border border-primary-foreground/10" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
                <Sparkles className="size-3.5" />
                Focus du jour
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg">
                <Clock3 className="size-3.5" />
                {TODAY_MISSION.durationMin} min
              </span>
            </div>

            <p className="mt-7 max-w-2xl font-display text-[clamp(2rem,4vw,3.35rem)] leading-[1.02] tracking-[-0.025em]">
              {mission.title}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/78 sm:text-base">
              {mission.prompt}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/55">
                  Le principe
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/78">
                  {mission.context}
                </p>
              </div>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="w-full bg-primary-foreground text-fg hover:bg-primary-foreground/90 sm:w-auto"
              >
                <Link to="/mission">
                  {missionDone ? "Revoir la mission" : "Commencer"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {missionDone && (
              <p className="mt-6 flex items-center gap-2 text-sm text-primary-foreground/80">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Check className="size-3.5" />
                </span>
                Mission terminée. Elle compte déjà dans votre progression.
              </p>
            )}
          </div>
        </article>

        <BlossomPlant
          stageId={journey.stage.id}
          stageLabel={journey.stage.label}
          points={journey.points}
          nextAt={journey.stage.nextAt}
          remaining={journey.remaining}
        />
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Actions rapides">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Icon className="size-4.5" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {action.label}
                </span>
                <span className="mt-1 block text-sm">{action.detail}</span>
              </span>
              <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Votre mouvement
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
                {journey.stage.verb}, sans forcer.
              </h2>
            </div>
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-2">
              <div className="text-center">
                <p className="font-display text-xl leading-none tabular-nums">{journey.points}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-muted">
                  points
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-xl">{journey.stage.label}</p>
              <p className="mt-1 text-sm text-muted">
                {upcoming
                  ? journey.remaining + " points avant " + upcoming.label.toLowerCase() + "."
                  : "Vous avez atteint le dernier stade."}
              </p>
            </div>
            <p className="text-2xl font-medium tabular-nums">{stageProgress}%</p>
          </div>
          <Progress className="mt-3 h-2" value={stageProgress} />

          <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-xl bg-surface-2/60">
            <Checkpoint
              icon={Leaf}
              label="Missions"
              current={journey.missions.current}
              required={journey.missions.required}
            />
            <Checkpoint
              icon={Mic2}
              label="Parole"
              current={journey.speak.current}
              required={journey.speak.required}
            />
            <Checkpoint
              icon={Target}
              label="Pron'Lab"
              current={journey.pronlab.current}
              required={journey.pronlab.required}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-[linear-gradient(145deg,rgba(250,247,240,0.98),rgba(232,224,210,0.7))] p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Parole
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Votre rythme
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Mic2 className="size-3" />
              7 jours
            </span>
          </div>

          <div
            className="mt-6 flex items-end gap-1.5"
            aria-label={totalSpeaking + " minutes de parole cette semaine"}
          >
            {WEEK_SPEAKING.map((day, index) => {
              const height = Math.max(8, (day.minutes / maxSpeaking) * 96);
              const isStrongest = day.minutes === maxSpeaking;
              return (
                <div key={day.day + "-" + index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-9 rounded-t-md transition-[height] duration-500",
                        isStrongest ? "bg-clay" : "bg-primary/75",
                        day.minutes === 0 && "bg-surface-2",
                      )}
                      style={{ height: height + "px" }}
                      title={day.minutes + " min"}
                    />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-subtle">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
            <div>
              <p className="font-display text-3xl leading-none tabular-nums">{totalSpeaking} min</p>
              <p className="mt-2 text-xs text-muted">{activeSpeakingDays} jours où vous avez parlé.</p>
            </div>
            <Link
              to="/osez"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
            >
              Parler
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Prochain petit pas
              </p>
              <h2 className="mt-2 font-display text-xl">{nextMission.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{nextMission.prompt}</p>
              <Link
                to="/mission"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
              >
                Voir la suite
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-2xl bg-fg p-5 text-primary-foreground shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
              <Trophy className="size-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/55">
                Dans votre parcours
              </p>
              <h2 className="mt-2 font-display text-xl">
                {weekendImmersion?.title ?? "Immersion"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-primary-foreground/70">
                {weekendImmersion?.description ?? "Une prochaine expérience réelle vous attend."}
              </p>
              <Link
                to="/immersion"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground"
              >
                Explorer
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </article>
      </section>

      {memoryOn && (
        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-border)]">
          <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-surface-2/70 p-5 sm:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Léo · mémoire active
              </p>
              <p className="mt-3 max-w-sm font-display text-2xl tracking-tight">
                {memory.confidence}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                On renforce ce qui vient juste avant le déclic, sans vous faire refaire ce que vous maîtrisez déjà.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Votre repère
              </p>
              <p className="mt-3 font-display text-xl">{memory.hesitation}</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{memory.leoNote}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-muted">
                  À ancrer · {memory.hesitation}
                </span>
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-muted">
                  À laisser reculer · {memory.avoided}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-5 text-subtle">
        {upcoming
          ? "Chaque pratique ajoute une petite couche. Prochaine étape : " + upcoming.label.toLowerCase() + "."
          : "Votre régularité porte ses fruits."}
      </p>
    </div>
  );
}

function Checkpoint({
  icon: Icon,
  label,
  current,
  required,
}: {
  icon: LucideIcon;
  label: string;
  current: number;
  required: number;
}) {
  const met = current >= required;
  const capped = Math.min(current, required);

  return (
    <div className="min-w-0 p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <Icon className={cn("size-3.5", met ? "text-primary" : "text-muted")} strokeWidth={1.8} />
        {met && <Check className="size-3.5 text-primary" />}
      </div>
      <p className="mt-3 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm tabular-nums">
        {capped} / {required}
      </p>
    </div>
  );
}
