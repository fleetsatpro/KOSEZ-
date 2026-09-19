import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { IMMERSION } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";

export const Route = createFileRoute("/_app/immersion")({
  component: ImmersionPage,
});

function ImmersionPage() {
  const phase = useBlossom((s) => s.immersionPhase);
  const setPhase = useBlossom((s) => s.setImmersionPhase);
  const done = useBlossom((s) => s.immersionDone);
  const completeChallenge = useBlossom((s) => s.completeChallenge);
  const complete = useBlossom((s) => s.completeActivity);

  return (
    <Page className="max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          LEARN
        </Link>
      </Button>
      <div className="mt-6 overflow-hidden rounded-2xl">
        <div className="relative aspect-video">
          <img
            src="/images/reunion-coast.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-fg/70 to-fg/10" />
          <div className="absolute bottom-0 p-5 text-primary-foreground">
            <Eyebrow className="text-primary-foreground/70">Companion</Eyebrow>
            <h1 className="mt-1 font-display text-3xl">{IMMERSION.title}</h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {IMMERSION.dates} · {IMMERSION.place}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {(["pre", "during", "post"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setPhase(id)}
            className={`h-11 rounded-md px-4 text-sm ${
              phase === id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted shadow-[var(--shadow-border)]"
            }`}
          >
            {id === "pre" ? "Avant" : id === "during" ? "Pendant" : "Après"}
          </button>
        ))}
      </div>

      {phase === "pre" && (
        <div className="mt-6 space-y-4">
          <Surface>
            <Eyebrow>Itinéraire</Eyebrow>
            <ul className="mt-4 space-y-3 text-sm">
              {IMMERSION.itinerary.map((row) => (
                <li key={row.when} className="flex justify-between gap-4">
                  <span className="text-muted">{row.when}</span>
                  <span className="text-right">{row.what}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <Eyebrow>À emporter</Eyebrow>
            <ul className="mt-4 space-y-2 text-sm">
              {IMMERSION.packing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <Eyebrow>Le groupe</Eyebrow>
            <p className="mt-3 text-sm">{IMMERSION.participants.join(" · ")}</p>
          </Surface>
        </div>
      )}

      {phase === "during" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted">
            Trois gestes, pas un jeu. Cochez quand c'est fait, dehors.
          </p>
          {IMMERSION.challenges.map((challenge, i) => {
            const id = `ch-${i}`;
            const ok = done.includes(id);
            return (
              <Surface key={id} className="flex items-start justify-between gap-4">
                <p className="text-sm leading-relaxed">{challenge}</p>
                <Button
                  size="sm"
                  variant={ok ? "secondary" : "default"}
                  onClick={() => completeChallenge(id)}
                  disabled={ok}
                >
                  {ok ? <Check className="size-4" /> : "Fait"}
                </Button>
              </Surface>
            );
          })}
        </div>
      )}

      {phase === "post" && (
        <Surface className="mt-6">
          <Eyebrow>Votre histoire</Eyebrow>
          <p className="mt-4 font-display text-2xl leading-snug">
            {IMMERSION.story}
          </p>
          <p className="mt-4 text-sm text-muted">
            {done.length} défi{done.length > 1 ? "s" : ""} tenu
            {done.length > 1 ? "s" : ""} pendant le weekend.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              const result = complete("IMMERSION_ATTENDED", IMMERSION.id);
              toast(
                result.ok
                  ? "L'immersion entre dans le voyage."
                  : "Déjà enregistrée.",
              );
            }}
          >
            Inscrire au BLOSSOM
          </Button>
        </Surface>
      )}
    </Page>
  );
}
