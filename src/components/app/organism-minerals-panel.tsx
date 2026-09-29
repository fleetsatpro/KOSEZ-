import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  causalNextGesture,
  MINERAL_DEFINITIONS,
  MINERAL_ORDER,
  type GrowthEvent,
  type MineralSnapshot,
} from "@/lib/blossom/organism";

type RouteUnion =
  | "/osez"
  | "/pronlab"
  | "/mission"
  | "/tandem"
  | "/learn/labs";

export function OrganismMineralsPanel({
  minerals,
  growthEvents = [],
}: {
  minerals: MineralSnapshot;
  growthEvents?: GrowthEvent[];
}) {
  const nextGesture = causalNextGesture(minerals);
  const recent = [...growthEvents]
    .filter((event) => event.mineral)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return (
    <section
      className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 magnetic-surface"
      aria-label="Cinq minéraux de l'organisme BLOSSOM"
    >
      <div className="flex flex-col gap-4 border-b border-primary/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Organisme · cinq minéraux
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg/90">
            Chaque minéral est une échelle d’activité récente sur 14 jours. Ce
            n’est ni une note, ni un niveau CEFR. La plus basse ouvre la porte
            causale suivante.
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-surface/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Prochaine porte
          </p>
          <Link
            to={nextGesture.door as RouteUnion}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            {MINERAL_DEFINITIONS[nextGesture.mineral].doorLabel} · {nextGesture.value}/100
            <ArrowRight className="size-3.5" />
          </Link>
          <p className="mt-1 max-w-xs text-[11px] leading-5 text-muted">
            {nextGesture.basis}
          </p>
        </div>
      </div>

      {nextGesture.tiedWith.length > 1 ? (
        <p className="mt-4 rounded-xl border border-primary/15 bg-surface/50 px-4 py-3 text-xs leading-5 text-muted">
          Égalité à {nextGesture.value}/100 :{" "}
          {nextGesture.tiedWith.map((key) => MINERAL_DEFINITIONS[key].label).join(" · ")}.
          Le choix reste déterministe ; l’autre porte reste disponible.
        </p>
      ) : null}

      <ul className="mt-5 grid gap-3 lg:grid-cols-5">
        {MINERAL_ORDER.map((key) => {
          const definition = MINERAL_DEFINITIONS[key];
          const value = minerals[key];
          return (
            <li
              key={key}
              className="rounded-xl border border-border/70 bg-surface/70 p-4"
            >
              <Link
                to={definition.door as typeof routeUnion}
                className="font-medium text-fg hover:text-primary"
              >
                {definition.label}
              </Link>
              <p className="mt-1 font-display text-2xl tabular-nums">{value}/100</p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-primary/80 transition-[width] duration-500 plant-breathe"
                  style={{ width: `${Math.max(2, value)}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">{definition.purpose}</p>
              <p className="mt-2 text-[11px] leading-5 text-subtle">
                Écrit par : {definition.writtenByLabel}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-subtle">
                {definition.scoreMeaning}
              </p>
            </li>
          );
        })}
      </ul>

      {recent.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2 border-t border-primary/15 pt-4" aria-label="Gestes récents">
          {recent.map((event) => (
            <li
              key={event.id}
              className="rounded-full border border-border/70 bg-surface px-3 py-1 text-[11px] text-muted"
            >
              {event.label} · {MINERAL_DEFINITIONS[event.mineral!].label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[11px] text-subtle">
          Aucun geste causal confirmé dans la fenêtre. Le premier geste écrira
          le premier minéral.
        </p>
      )}
    </section>
  );
}
