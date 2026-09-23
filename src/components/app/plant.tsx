import { Link } from "@tanstack/react-router";
import { PLANT_IMAGE } from "@/lib/blossom/data";
import { STAGES, nextStage, type StageId } from "@/lib/blossom/engine";
import type { MineralSnapshot } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

function stageProgressPercent(
  stageId: StageId,
  points: number,
  nextAt: number | null,
): number {
  if (nextAt === null) return 100;
  const stage = STAGES.find((s) => s.id === stageId) ?? STAGES[0];
  const span = Math.max(1, nextAt - stage.minPoints);
  const intoStage = Math.min(span, Math.max(0, points - stage.minPoints));
  return Math.min(100, Math.max(4, Math.round((intoStage / span) * 100)));
}

export function BlossomPlant({
  stageId,
  stageLabel,
  points,
  nextAt,
  remaining,
  compact = false,
  linked = true,
  minerals,
  pulse = false,
}: {
  stageId: StageId;
  stageLabel: string;
  points: number;
  nextAt: number | null;
  remaining: number;
  compact?: boolean;
  linked?: boolean;
  minerals?: MineralSnapshot | null;
  pulse?: boolean;
}) {
  const upcoming = nextStage(stageId);
  const src = PLANT_IMAGE[stageId];
  const progress = stageProgressPercent(stageId, points, nextAt);
  const statusText = nextAt
    ? `${points} / ${nextAt} · ${remaining} point${remaining > 1 ? "s" : ""} vers ${upcoming?.label ?? "la suite"}`
    : `${points} points · stade ultime`;

  const vitality = minerals
    ? Math.round(
        (minerals.mission + minerals.parole + minerals.pron + minerals.social) / 4,
      )
    : null;

  const className = cn(
    "kosez-plant group relative block overflow-hidden rounded-2xl border border-border/80 bg-surface-2 shadow-[var(--shadow-border)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    compact ? "aspect-square" : "aspect-hero lg:aspect-plant",
    pulse && "plant-pulse",
  );

  const inner = (
    <>
      <img
        src={src}
        alt=""
        className="plant-sway h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15"
        aria-hidden
      />

      {vitality !== null ? (
        <div
          className="pointer-events-none absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border border-primary/35 bg-black/40 backdrop-blur-sm"
          title="Vitalité minérale (14 j)"
          aria-hidden
        >
          <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--color-primary, #d9ff69)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(vitality / 100) * 88} 88`}
              className="transition-[stroke-dasharray] duration-700"
            />
          </svg>
          <span className="absolute text-[9px] font-semibold tabular-nums text-primary">
            {vitality}
          </span>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
          Votre BLOSSOM
        </p>
        <p className="mt-1.5 font-display text-3xl tracking-tight text-white">
          {stageLabel}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-white/75">{statusText}</p>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Progression du stade ${stageLabel}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        {minerals ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Minéraux récents">
            {(
              [
                ["M", minerals.mission],
                ["P", minerals.parole],
                ["R", minerals.pron],
                ["S", minerals.social],
              ] as const
            ).map(([label, value]) => (
              <li
                key={label}
                className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tabular-nums text-white/75"
              >
                {label} {value}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );

  if (!linked) {
    return (
      <div className={className} aria-label={`Votre BLOSSOM, stade ${stageLabel}`}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      to="/plant"
      className={className}
      aria-label={`Votre BLOSSOM, stade ${stageLabel}. ${statusText}`}
    >
      {inner}
    </Link>
  );
}
