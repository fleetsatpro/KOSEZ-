import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { BlossomPlant } from "@/components/app/plant";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STAGES, nextStage } from "@/lib/blossom/engine";
import { useJourney } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/plant")({
  component: PlantPage,
});

function PlantPage() {
  const journey = useJourney();
  const upcoming = nextStage(journey.stage.id);
  const reqs = [
    {
      label: "Missions",
      current: journey.missions.current,
      required: journey.missions.required,
    },
    {
      label: "Sessions Speak",
      current: journey.speak.current,
      required: journey.speak.required,
    },
    {
      label: "Pron'Lab",
      current: journey.pronlab.current,
      required: journey.pronlab.required,
    },
  ];

  return (
    <Page className="max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Retour
        </Link>
      </Button>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <BlossomPlant
          stageId={journey.stage.id}
          stageLabel={journey.stage.label}
          points={journey.points}
          nextAt={journey.stage.nextAt}
          remaining={journey.remaining}
          linked={false}
        />

        <div>
          <Eyebrow>Stade actuel</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            {journey.stage.label}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {journey.points} / {journey.stage.nextAt ?? journey.points} points.
            {upcoming
              ? ` Il vous reste ${journey.remaining} points pour ${upcoming.label.toLowerCase()}.`
              : " Vous tenez le stade ultime."}
          </p>
          <Progress className="mt-5" value={journey.progress * 100} />

          <ul className="mt-6 space-y-3">
            {reqs.map((item) => {
              const met = item.current >= item.required;
              return (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-md bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <span className="text-sm">{item.label}</span>
                  <span
                    className={cn(
                      "flex items-center gap-2 text-sm tabular-nums",
                      met ? "text-primary" : "text-muted",
                    )}
                  >
                    {Math.min(item.current, item.required)} / {item.required}
                    {met && <Check className="size-4" />}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-sm text-muted">
            {upcoming
              ? "Continuez — vous êtes proche du prochain stade."
              : "Votre régularité porte ses fruits."}
          </p>
        </div>
      </div>

      <Surface className="mt-10">
        <Eyebrow>Les cinq stades</Eyebrow>
        <ol className="mt-5 grid gap-3 sm:grid-cols-5">
          {STAGES.map((stage) => {
            const current = stage.id === journey.stage.id;
            const reached = journey.points >= stage.minPoints;
            return (
              <li
                key={stage.id}
                className={cn(
                  "rounded-md px-3 py-4 text-center",
                  current ? "bg-primary text-primary-foreground" : "bg-surface-2",
                )}
              >
                <p className="font-display text-lg">{stage.label}</p>
                <p
                  className={cn(
                    "mt-1 text-[11px] tabular-nums",
                    current ? "text-primary-foreground/70" : "text-subtle",
                  )}
                >
                  {reached ? "Atteint" : `dès ${stage.minPoints} pts`}
                </p>
              </li>
            );
          })}
        </ol>
      </Surface>
    </Page>
  );
}
