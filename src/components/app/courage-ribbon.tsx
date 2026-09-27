import { courageRibbon } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

export function CourageRibbon({
  days,
  className,
}: {
  days: string[];
  className?: string;
}) {
  const cells = courageRibbon(days);
  const spoken = cells.filter(Boolean).length;

  return (
    <div className={cn("kosez-courage-ribbon", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Ruban de courage
        </p>
        <p className="text-xs tabular-nums text-muted">
          {spoken} / 28 · sans flamme
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1" aria-label="28 derniers jours de parole">
        {cells.map((on, i) => (
          <li
            key={i}
            title={on ? "Geste ce jour-là" : "Terre en jachère"}
            className={cn(
              "size-2 rounded-full sm:size-2.5",
              on ? "bg-primary" : "bg-surface-2 ring-1 ring-border/80",
            )}
          />
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-5 text-subtle">
        Les trous ne sont pas un échec — terre en jachère.
      </p>
    </div>
  );
}
