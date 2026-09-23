import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Sprout } from "lucide-react";
import { BlossomPlant } from "@/components/app/plant";
import { SceneReel } from "@/components/app/scene-reel";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STAGES, nextStage } from "@/lib/blossom/engine";
import { organismStatusLine } from "@/lib/blossom/organism";
import { useBlossom, useJourney } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/plant")({
  component: PlantPage,
});

function PlantPage() {
  const journey = useJourney();
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const upcoming = nextStage(journey.stage.id);
  const leoLine = organismStatusLine(minerals);
  const reqs = [
    {
      label: "Missions",
      detail: "Gestes ancrés, y compris terrain",
      current: journey.missions.current,
      required: journey.missions.required,
    },
    {
      label: "Parole",
      detail: "Speak rooms, Pulse, tandem",
      current: journey.speak.current,
      required: journey.speak.required,
    },
    {
      label: "Pron'Lab",
      detail: "Sons répétés jusqu'à tenue",
      current: journey.pronlab.current,
      required: journey.pronlab.required,
    },
  ];
  const stageProgress = Math.round(journey.progress * 100);
  const mineralRows = [
    { key: "mission", label: "Mission", value: minerals.mission },
    { key: "parole", label: "Parole", value: minerals.parole },
    { key: "pron", label: "Pron", value: minerals.pron },
    { key: "social", label: "Lien", value: minerals.social },
  ] as const;

  const lowest = mineralRows.reduce((a, b) => (a.value <= b.value ? a : b));

  return (
    <Page className="kosez-feature-page max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Retour
        </Link>
      </Button>

      <header className="mt-5 max-w-2xl">
        <Eyebrow>Votre BLOSSOM</Eyebrow>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          {journey.stage.verb}, sans forcer.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Heard → grown. Chaque geste utile — une lecture, une prise de parole,
          une mission — nourrit la plante. Pas de course : une croissance
          visible, mesurable, ancrée dans ce que vous osez vraiment dire.
        </p>
        <p className="mt-4 rounded-xl border border-border/60 bg-surface-2/40 px-4 py-3 text-sm leading-6 text-fg">
          {leoLine}
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <BlossomPlant
          stageId={journey.stage.id}
          stageLabel={journey.stage.label}
          points={journey.points}
          nextAt={journey.stage.nextAt}
          remaining={journey.remaining}
          linked={false}
        />

        <Surface className="flex h-full min-h-0 flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Stade actuel</Eyebrow>
              <p className="mt-2 font-display text-3xl tracking-tight">
                {journey.stage.label}
              </p>
            </div>
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              aria-hidden
            >
              <Sprout className="size-5" strokeWidth={1.7} />
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">
            {journey.points} / {journey.stage.nextAt ?? journey.points} points.
            {upcoming
              ? ` Il reste ${journey.remaining} point${journey.remaining > 1 ? "s" : ""} avant ${upcoming.label.toLowerCase()}.`
              : " Vous tenez le stade ultime."}
          </p>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
              Progression du stade
            </p>
            <p className="font-display text-xl tabular-nums">{stageProgress}%</p>
          </div>
          <Progress
            className="mt-2 h-2"
            value={stageProgress}
            aria-label={`Progression du stade ${journey.stage.label}`}
          />

          <ul className="mt-6 space-y-2" aria-label="Conditions du stade">
            {reqs.map((item) => {
              const met = item.current >= item.required;
              return (
                <li
                  key={item.label}
                  className="rounded-xl border border-border/70 bg-surface-2/50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "flex items-center gap-2 text-sm tabular-nums",
                        met ? "text-primary" : "text-muted",
                      )}
                    >
                      <span>
                        {Math.min(item.current, item.required)} / {item.required}
                      </span>
                      {met && (
                        <Check className="size-4" aria-label="Objectif atteint" />
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-subtle">{item.detail}</p>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-6">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/mission">
                Nourrir la plante
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <p className="mt-3 text-xs leading-5 text-subtle">
              {upcoming
                ? "La prochaine mission compte déjà pour le stade suivant."
                : "Votre régularité porte ses fruits."}
            </p>
          </div>
        </Surface>
      </div>

      {/* Minerals — soil of the organism */}
      <Surface className="mt-8">
        <Eyebrow>Minéraux · 14 jours</Eyebrow>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Quatre nutriments. Le plus bas oriente le prochain geste utile — sans
          culpabiliser. Aujourd&apos;hui, le sol demande un peu plus de{" "}
          <span className="font-medium text-fg">{lowest.label.toLowerCase()}</span>.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mineralRows.map((m) => (
            <div
              key={m.key}
              className={cn(
                "rounded-xl border px-3 py-4 text-center",
                m.key === lowest.key
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-surface-2/40",
              )}
            >
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                {m.label}
              </dt>
              <dd className="mt-1 font-display text-2xl tabular-nums text-primary">
                {m.value}
              </dd>
              <div className="mx-auto mt-2 h-1 max-w-[4rem] overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${Math.max(4, m.value)}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      </Surface>

      <SceneReel events={growthEvents} className="mt-6" limit={10} />

      <Surface className="mt-8">
        <Eyebrow>Les cinq stades</Eyebrow>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Graine → croissance → épanouissement → fleurs → indépendance. Chaque
          seuil demande des gestes, pas seulement des points.
        </p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-5">
          {STAGES.map((stage, index) => {
            const current = stage.id === journey.stage.id;
            const reached = journey.points >= stage.minPoints;
            return (
              <li
                key={stage.id}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "relative rounded-xl px-3 py-4 text-center transition-colors",
                  current
                    ? "bg-primary text-primary-foreground ring-1 ring-primary/40"
                    : reached
                      ? "border border-primary/25 bg-primary/5"
                      : "bg-surface-2/80",
                )}
              >
                <p className="text-[10px] font-semibold tabular-nums opacity-60">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 font-display text-base leading-tight sm:text-lg">
                  {stage.label}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-[11px] tabular-nums",
                    current ? "text-primary-foreground/70" : "text-subtle",
                  )}
                >
                  {current
                    ? "Maintenant"
                    : reached
                      ? "Atteint"
                      : `dès ${stage.minPoints} pts`}
                </p>
              </li>
            );
          })}
        </ol>
      </Surface>
    </Page>
  );
}
