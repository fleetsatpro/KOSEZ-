import type { MineralSnapshot } from "@/lib/blossom/organism";
import { MINERAL_DOORS, MINERAL_ORDER, MINERAL_WINDOW_DAYS, organismStatusLine } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

export function OrganismStatus({ minerals, className }: { minerals: MineralSnapshot; className?: string }) {
  const line = organismStatusLine(minerals);
  return (
    <div className={cn("rounded-xl border border-border/70 bg-surface-2/40 px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">Organisme</p>
        <span className="text-[10px] tabular-nums text-subtle">{MINERAL_WINDOW_DAYS} derniers jours</span>
      </div>
      <p className="mt-1.5 text-sm leading-6 text-fg">{line}</p>
      <dl className="mt-3 grid grid-cols-5 gap-1.5 text-center">
        {MINERAL_ORDER.map((key) => (
          <div key={key} className="min-w-0">
            <dt className="truncate text-[8px] font-semibold uppercase tracking-[0.1em] text-subtle">{MINERAL_DOORS[key].shortLabel}</dt>
            <dd className="mt-0.5 font-display text-base tabular-nums text-primary sm:text-lg">{minerals[key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}