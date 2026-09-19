import { Link } from "@tanstack/react-router";
import { PLANT_IMAGE } from "@/lib/blossom/data";
import type { StageId } from "@/lib/blossom/engine";
import { nextStage } from "@/lib/blossom/engine";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./primitives";

export function BlossomPlant({
  stageId,
  stageLabel,
  points,
  nextAt,
  remaining,
  compact = false,
  linked = true,
}: {
  stageId: StageId;
  stageLabel: string;
  points: number;
  nextAt: number | null;
  remaining: number;
  compact?: boolean;
  linked?: boolean;
}) {
  const upcoming = nextStage(stageId);
  const src = PLANT_IMAGE[stageId];
  const className = cn(
    "group relative block overflow-hidden rounded-2xl bg-surface-2 shadow-[var(--shadow-border)]",
    compact ? "aspect-square" : "aspect-hero lg:aspect-plant",
  );

  const inner = (
    <>
      <img
        src={src}
        alt=""
        className="plant-sway h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-fg/55 via-fg/0 to-fg/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
        <Eyebrow className="text-primary-foreground/70">Votre BLOSSOM</Eyebrow>
        <p className="mt-1 font-display text-3xl tracking-tight">{stageLabel}</p>
        <p className="mt-1 text-sm text-primary-foreground/85">
          {nextAt
            ? `${points} / ${nextAt} · ${remaining} point${remaining > 1 ? "s" : ""} vers ${upcoming?.label ?? "la suite"}`
            : `${points} points · stade ultime`}
        </p>
      </div>
    </>
  );

  if (!linked) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <Link
      to="/plant"
      className={className}
      aria-label={`Votre BLOSSOM, stade ${stageLabel}`}
    >
      {inner}
    </Link>
  );
}
