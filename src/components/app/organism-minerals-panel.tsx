import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { causalNextGesture, type GrowthEvent, type MineralKey, type MineralSnapshot } from "@/lib/blossom/organism";

const ROWS: { key: MineralKey; label: string; door: string }[] = [
  { key: "mission", label: "Mission", door: "/mission" },
  { key: "parole", label: "Parole", door: "/osez" },
  { key: "pron", label: "Pron", door: "/pronlab" },
  { key: "social", label: "Social", door: "/tandem" },
  { key: "atelier", label: "Atelier", door: "/learn/labs" },
];

export function OrganismMineralsPanel({
  minerals,
  growthEvents = [],
}: {
  minerals: MineralSnapshot;
  growthEvents?: GrowthEvent[];
}) {
  const nextGesture = causalNextGesture(minerals);
  const recent = [...growthEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <section
      className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 magnetic-surface"
      aria-label="Cinq minéraux de l'organisme BLOSSOM"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Organisme · minéraux
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-fg/90">
            Chaque geste nourrit un minéral précis. Le plus bas ouvre la prochaine porte — sans score à protéger.
          </p>
        </div>
        <Link
          to={nextGesture.door as "/osez" | "/pronlab" | "/mission" | "/tandem" | "/learn/labs"}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary"
        >
          {nextGesture.mineral} · ouvrir
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <ul className="mt-5 space-y-3">
        {ROWS.map((row) => {
          const value = minerals[row.key];
          return (
            <li key={row.key}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <Link
                  to={row.door as "/mission" | "/osez" | "/pronlab" | "/tandem" | "/learn/labs"}
                  className="font-medium text-fg hover:text-primary"
                >
                  {row.label}
                </Link>
                <span className="tabular-nums text-muted">{value}/100</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary/80 transition-[width] duration-500 plant-breathe"
                  style={{ width: `${Math.max(2, value)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {recent.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2 border-t border-primary/15 pt-4" aria-label="Gestes récents">
          {recent.map((g) => (
            <li
              key={g.id}
              className="rounded-full border border-border/70 bg-surface px-3 py-1 text-[11px] text-muted"
            >
              {g.label}
              {g.mineral ? <span className="ml-1 text-primary/80">· {g.mineral}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[11px] text-subtle">
          Aucun geste encore — le premier écrira le premier minéral.
        </p>
      )}
    </section>
  );
}
