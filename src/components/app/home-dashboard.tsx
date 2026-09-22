import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Leaf,
  Mic2,
  Sprout,
  Target,
  type LucideIcon,
} from "lucide-react";
import { BlossomPlant } from "@/components/app/plant";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LEARNER_MEMORY,
  TODAY_MISSION,
  WEEK_SPEAKING,
  planAllows,
  PRONLAB_SETS,
} from "@/lib/blossom/data";
import {
  hasSource,
  nextStage,
  personaliseMission,
  resolveMemory,
} from "@/lib/blossom/engine";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { OrganismStatus } from "@/components/app/organism-status";
import { CourageRibbon } from "@/components/app/courage-ribbon";
import { SceneReel } from "@/components/app/scene-reel";
import {
  courageDaysFromLog,
  strugglingFocus,
} from "@/lib/blossom/organism";
import { todayLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { to: "/osez", label: "Osez", detail: "Parler maintenant", icon: Mic2 },
  { to: "/pronlab", label: "Pron'Lab", detail: "Affiner un son", icon: Target },
  { to: "/learn", label: "Parcours", detail: "Reprendre l'atelier", icon: BookOpen },
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
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const struggle = strugglingFocus(
    attempts,
    PRONLAB_SETS.flatMap((s) => s.items),
  );

  return (
    <div className="stagger-in kosez-home">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
            {todayLabel()}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Bonjour, {learner.firstName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
            Un geste utile vaut mieux qu'une longue séance.
          </p>
        </div>

        <Link
          to="/moi"
          aria-label="Ouvrir votre profil"
          className="shrink-0 rounded-full p-0.5 ring-1 ring-border transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <img
            src={learner.avatar}
            alt=""
            className="size-11 rounded-full object-cover sm:size-12"
          />
        </Link>
      </header>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <article className="kosez-hero-mission relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-[var(--shadow-border)] sm:p-8">
          <div className="absolute right-5 top-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/55">
            <Sprout className="size-3.5" />
            Focus du jour
          </div>

          <div className="relative flex min-h-full flex-col pt-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-primary-foreground/80">
                  {TODAY_MISSION.durationMin} min
                </span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-primary-foreground/65">
                  {TODAY_MISSION.level}
                </span>
              </div>

              <h2 className="mt-6 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                {mission.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/76 sm:text-base">
                {mission.prompt}
              </p>
            </div>

            <div className="mt-8 border-t border-primary-foreground/12 pt-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
                  <Leaf className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/55">
                    Aujourd'hui, une seule chose
                  </p>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-primary-foreground/75">
                    {mission.context}
                  </p>
                </div>
              </div>

              {memoryOn && (
                <p className="mt-4 max-w-lg text-xs leading-5 text-primary-foreground/58">
                  Léo garde votre point de friction en arrière-plan : {memory.hesitation}.
                </p>
              )}

              <Button
                asChild
                variant="secondary"
                size="lg"
                className="mt-6 w-full bg-primary-foreground text-fg hover:bg-primary-foreground/90 sm:w-auto"
              >
                <Link to="/mission">
                  {missionDone ? "Revenir à la mission" : "Faire le geste"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              {missionDone && (
                <p className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/75">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/10">
                    <Check className="size-3.5" />
                  </span>
                  Mission terminée. Elle compte dans votre croissance.
                </p>
              )}
            </div>
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

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="kosez-data-panel rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Votre croissance
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
                {journey.stage.verb}, sans forcer.
              </h2>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl leading-none tabular-nums">{journey.points}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-subtle">
                points
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="text-sm leading-6 text-muted">
              {upcoming
                ? `${journey.remaining} point${journey.remaining > 1 ? "s" : ""} avant ${upcoming.label.toLowerCase()}.`
                : "Vous avez atteint le dernier stade."}
            </p>
            <p className="font-display text-xl tabular-nums">{stageProgress}%</p>
          </div>
          <Progress className="mt-3 h-2" value={stageProgress} />

          <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-xl bg-surface-2/55">
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

          <Link
            to="/plant"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary hover:underline"
          >
            Voir le parcours du végétal
            <ArrowRight className="size-3.5" />
          </Link>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Parole
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Votre rythme
              </h2>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              7 jours
            </span>
          </div>

          <div
            className="mt-6 flex items-end gap-2"
            aria-label={`${totalSpeaking} minutes de parole cette semaine`}
          >
            {WEEK_SPEAKING.map((day, index) => {
              const height = Math.max(10, (day.minutes / maxSpeaking) * 96);
              const isStrongest = day.minutes === maxSpeaking;
              return (
                <div key={day.day + "-" + index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-8 rounded-t-md",
                        isStrongest ? "bg-clay" : "bg-primary/65",
                        day.minutes === 0 && "bg-surface-2",
                      )}
                      style={{ height: height + "px" }}
                      aria-hidden
                    />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <p className="font-display text-3xl leading-none tabular-nums">
              {totalSpeaking} min
            </p>
            <p className="mt-2 text-xs text-muted">
              {activeSpeakingDays} jour{activeSpeakingDays > 1 ? "s" : ""} où vous avez parlé.
            </p>
            <Link
              to="/osez"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary hover:underline"
            >
              Parler maintenant
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <OrganismStatus minerals={minerals} />
        <div className="rounded-xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-border)]">
          <CourageRibbon days={courageDaysFromLog(log)} />
          {struggle ? (
            <p className="mt-3 text-xs leading-5 text-muted">
              Son de la semaine :{" "}
              <Link to="/pronlab" className="font-semibold text-primary underline">
                {struggle.focus || struggle.phrase}
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <SceneReel events={growthEvents} className="mt-5" />

      <section className="kosez-quick-actions mt-5 border-t border-border pt-5" aria-label="Accès rapides">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Ensuite
            </p>
            <p className="mt-1 text-sm text-muted">
              Trois portes discrètes. Votre mission reste le centre.
            </p>
          </div>

          <div className="grid gap-1 sm:grid-cols-3 sm:gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="kosez-quick-action group inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-left text-sm transition-[background-color,color] duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <Icon className="size-4 text-primary" strokeWidth={1.7} />
                  <span>
                    <span className="font-medium">{action.label}</span>
                    <span className="ml-1 text-muted">· {action.detail}</span>
                  </span>
                  <ChevronRight className="ml-auto size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 sm:ml-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <p className="mx-auto mt-7 max-w-lg pb-3 text-center text-xs leading-5 text-subtle">
        {upcoming
          ? `Chaque geste nourrit votre BLOSSOM. Prochaine étape : ${upcoming.label.toLowerCase()}.`
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
