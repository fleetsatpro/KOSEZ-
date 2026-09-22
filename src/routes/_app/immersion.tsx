import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MapPin, Backpack, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { IMMERSION, type CatalogueItem } from "@/lib/blossom/data";
import { getPublishedContentOnServer } from "@/lib/blossom/content.api";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/immersion")({
  component: ImmersionPage,
});

const PHASES = [
  { id: "pre" as const, label: "Avant", hint: "Préparer le terrain" },
  { id: "during" as const, label: "Pendant", hint: "Gestes dehors" },
  { id: "post" as const, label: "Après", hint: "Votre histoire" },
] as const;

/**
 * Immersion is a weekend companion — not a checklist app.
 * Three phases · real place · story that enters BLOSSOM.
 */
function ImmersionPage() {
  const [published, setPublished] = useState<CatalogueItem | null>(null);
  const phase = useBlossom((s) => s.immersionPhase);
  const setPhase = useBlossom((s) => s.setImmersionPhase);
  const done = useBlossom((s) => s.immersionDone);
  const completeChallenge = useBlossom((s) => s.completeChallenge);
  const complete = useBlossom((s) => s.completeActivity);
  const doneCount = done.length;
  const total = IMMERSION.challenges.length;
  useEffect(() => {
    let disposed = false;
    void getPublishedContentOnServer()
      .then((content) => {
        if (!disposed) {
          setPublished(content.catalogue.find((item) => item.id === IMMERSION.id) ?? null);
        }
      })
      .catch(() => {
        // The authored Companion remains usable when the registry is unavailable.
      });
    return () => {
      disposed = true;
    };
  }, []);


  return (
    <Page className="kosez-feature-page max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/learn">
          <ArrowLeft className="size-4" />
          LEARN
        </Link>
      </Button>

      {/* Hero */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-border/50">
        <div className="relative aspect-[16/10] sm:aspect-video">
          <img
            src="/images/reunion-coast.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
            <Eyebrow className="text-white/55">Companion · Immersion</Eyebrow>
            <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
              {published?.title ?? IMMERSION.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {published?.location ?? IMMERSION.place}
              </span>
              <span aria-hidden>·</span>
              <span>{published?.schedule ?? IMMERSION.dates}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Phases">
        {PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={phase === p.id}
            onClick={() => setPhase(p.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-3 text-center transition-colors",
              phase === p.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface text-muted shadow-[var(--shadow-border)] hover:text-fg",
            )}
          >
            <span className="block text-sm font-medium">{p.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-[10px]",
                phase === p.id
                  ? "text-primary-foreground/70"
                  : "text-subtle",
              )}
            >
              {p.hint}
            </span>
          </button>
        ))}
      </div>

      {phase === "pre" && (
        <div className="mt-6 space-y-4">
          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>Itinéraire</Eyebrow>
            </div>
            <ul className="mt-5 space-y-0">
              {IMMERSION.itinerary.map((row, i) => (
                <li
                  key={row.when}
                  className={cn(
                    "flex justify-between gap-4 py-3 text-sm",
                    i < IMMERSION.itinerary.length - 1 &&
                      "border-b border-border/50",
                  )}
                >
                  <span className="shrink-0 tabular-nums text-muted">
                    {row.when}
                  </span>
                  <span className="text-right leading-6">{row.what}</span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <Backpack className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>À emporter</Eyebrow>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {IMMERSION.packing.map((item) => (
                <li
                  key={item}
                  className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm leading-5"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Surface>

          <Surface className="!p-5 sm:!p-6">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" strokeWidth={1.7} />
              <Eyebrow>Le groupe</Eyebrow>
            </div>
            <p className="mt-3 text-sm leading-7">
              Le cercle est privé. Les noms et participants confirmés ne sont
              affichés qu’à partir des inscriptions réellement enregistrées.
            </p>
            <p className="mt-3 text-xs leading-5 text-subtle">
              Pas un feed social — un cercle fermé pour le weekend.
            </p>
          </Surface>
        </div>
      )}

      {phase === "during" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="max-w-md text-sm leading-6 text-muted">
              Trois gestes, pas un jeu. Cochez quand c'est fait — dehors, dans
              le réel.
            </p>
            <p className="text-xs tabular-nums text-subtle">
              {doneCount} / {total}
            </p>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary/90 transition-[width] duration-500"
              style={{
                width: `${total ? (doneCount / total) * 100 : 0}%`,
              }}
            />
          </div>

          {IMMERSION.challenges.map((challenge, i) => {
            const id = `ch-${i}`;
            const ok = done.includes(id);
            return (
              <Surface
                key={id}
                className={cn(
                  "flex items-start justify-between gap-4 !p-5",
                  ok && "border border-primary/20 bg-primary/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
                    Geste {i + 1}
                  </p>
                  <p className="mt-2 text-sm leading-7">{challenge}</p>
                </div>
                <Button
                  size="sm"
                  variant={ok ? "secondary" : "default"}
                  onClick={() => completeChallenge(id)}
                  disabled={ok}
                  className="shrink-0"
                >
                  {ok ? <Check className="size-4" /> : "Fait"}
                </Button>
              </Surface>
            );
          })}
        </div>
      )}

      {phase === "post" && (
        <Surface className="mt-6 !p-5 sm:!p-7">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" strokeWidth={1.7} />
            <Eyebrow>Votre histoire</Eyebrow>
          </div>
          <p className="mt-5 font-display text-2xl leading-snug tracking-tight sm:text-3xl">
            {IMMERSION.story}
          </p>
          <p className="mt-5 text-sm leading-6 text-muted">
            {doneCount} défi{doneCount > 1 ? "s" : ""} tenu
            {doneCount > 1 ? "s" : ""} pendant le weekend.
            {doneCount === 0
              ? " Les gestes restent ouverts tant que vous êtes sur place."
              : " Ils nourrissent le voyage."}
          </p>
          <Button
            className="mt-8 w-full"
            size="lg"
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
