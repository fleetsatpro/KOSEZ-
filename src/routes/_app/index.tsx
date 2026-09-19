import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { BlossomPlant } from "@/components/app/plant";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  NEXT_CLASS,
  TODAY_MISSION,
  WEEK_SPEAKING,
  LEARNER_MEMORY,
  TANDEM_PARTNERS,
  planAllows,
} from "@/lib/blossom/data";
import { hasSource, nextStage, personaliseMission, resolveMemory } from "@/lib/blossom/engine";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { formatLongDate, todayLabel } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: BlossomHome,
});

function BlossomHome() {
  const learner = useBlossom((s) => s.learner);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const plan = useBlossom((s) => s.plan);
  const tandemStatus = useBlossom((s) => s.tandemStatus);
  const journey = useJourney();
  const upcoming = nextStage(journey.stage.id);
  const missionDone = hasSource(log, TODAY_MISSION.id);
  const maxMin = Math.max(...WEEK_SPEAKING.map((d) => d.minutes), 1);
  const memoryOn = planAllows(plan, "memory");
  const memory = resolveMemory(attempts, LEARNER_MEMORY);
  const mission = personaliseMission(TODAY_MISSION, memory, memoryOn);
  const tandemReady = Object.entries(tandemStatus).find(
    ([, status]) => status === "accepted",
  );
  const tandemPartner = tandemReady
    ? TANDEM_PARTNERS.find((p) => p.id === tandemReady[0])
    : null;

  return (
    <Page>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-3xl tracking-tight">
            Bonjour, {learner.firstName}
          </p>
          <p className="mt-1 text-sm capitalize text-muted">{todayLabel()}</p>
        </div>
        <Link to="/moi" className="size-11 overflow-hidden rounded-full">
          <img
            src={learner.avatar}
            alt=""
            className="h-full w-full object-cover"
          />
        </Link>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <BlossomPlant
          stageId={journey.stage.id}
          stageLabel={journey.stage.label}
          points={journey.points}
          nextAt={journey.stage.nextAt}
          remaining={journey.remaining}
        />

        <div className="stagger-in flex flex-col gap-4">
          <Surface>
            <Eyebrow>Mission du jour</Eyebrow>
            <h2 className="mt-3 font-display text-2xl tracking-tight">
              {mission.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {mission.prompt}
            </p>
            <p className="mt-3 text-xs text-subtle">
              {TODAY_MISSION.durationMin} min · {TODAY_MISSION.place}
            </p>
            {mission.leo ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Léo — {mission.leo}
              </p>
            ) : (
              <p className="mt-3 text-xs text-subtle">
                Mémoire Léo : Premium ou le centre. Digital reste la séance.
              </p>
            )}
            {missionDone ? (
              <p className="mt-5 flex items-center gap-2 text-sm text-primary">
                <Check className="size-4" />
                Mission close. Vous progressez.
              </p>
            ) : (
              <Button asChild className="mt-5 w-full">
                <Link to="/mission">
                  Commencer la mission
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </Surface>

          {tandemPartner && (
            <Surface>
              <Eyebrow>Tandem</Eyebrow>
              <p className="mt-3 font-display text-xl">
                Session avec {tandemPartner.name.split(" ")[0]}
              </p>
              <p className="mt-1 text-sm text-muted">
                Trente et trente. Débrief privé. Léo ne compare pas.
              </p>
              <Button asChild className="mt-4 w-full" variant="secondary">
                <Link to="/tandem/$id" params={{ id: tandemPartner.id }}>
                  Ouvrir la session
                </Link>
              </Button>
            </Surface>
          )}

          <Surface>
            <Eyebrow>Prochain rendez-vous</Eyebrow>
            <div className="mt-3 flex items-center gap-3">
              <img
                src={NEXT_CLASS.instructorAvatar}
                alt=""
                className="size-12 rounded-md object-cover"
              />
              <div>
                <p className="font-medium">{NEXT_CLASS.title}</p>
                <p className="text-sm text-muted">
                  {formatLongDate(NEXT_CLASS.date)} · {NEXT_CLASS.time}
                </p>
                <p className="text-xs text-subtle">
                  {NEXT_CLASS.instructor} · {NEXT_CLASS.place}
                </p>
              </div>
            </div>
          </Surface>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Parole cette semaine"
          value={`${WEEK_SPEAKING.reduce((a, b) => a + b.minutes, 0)} min`}
        />
        <Stat
          label="Missions"
          value={`${Math.min(journey.missions.current, journey.missions.required)} / ${journey.missions.required}`}
          done={journey.missions.current >= journey.missions.required}
        />
        <Stat
          label="Pron'Lab"
          value={`${journey.pronlab.current} / ${journey.pronlab.required}`}
          done={journey.pronlab.current >= journey.pronlab.required}
        />
      </section>

      <Surface className="mt-4">
        <div className="flex items-end justify-between">
          <Eyebrow>Parole · 7 jours</Eyebrow>
          <p className="text-xs text-subtle">
            Sessions {journey.speak.current} / {journey.speak.required}
          </p>
        </div>
        <div className="mt-5 flex h-20 items-end gap-2">
          {WEEK_SPEAKING.map((d, i) => (
            <div key={`${d.day}-${i}`} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-sm bg-primary/80"
                style={{ height: `${Math.max(8, (d.minutes / maxMin) * 64)}px` }}
              />
              <span className="text-[10px] uppercase tracking-wider text-subtle">
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </Surface>

      <p className="mt-8 text-center text-sm text-muted">
        {upcoming
          ? `Vous êtes proche de ${upcoming.label.toLowerCase()}. Encore une étape.`
          : "Votre régularité porte ses fruits."}
      </p>
      <Progress className="mx-auto mt-3 max-w-xs" value={journey.progress * 100} />
      <p className="mx-auto mt-6 max-w-md text-center text-sm leading-relaxed text-muted">
        Léo — {LEARNER_MEMORY.leoNote}
      </p>
    </Page>
  );
}

function Stat({
  label,
  value,
  done,
}: {
  label: string;
  value: string;
  done?: boolean;
}) {
  return (
    <Surface>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 flex items-center gap-2 font-display text-2xl tabular-nums">
        {value}
        {done ? <Check className="size-5 text-primary" /> : null}
      </p>
    </Surface>
  );
}
