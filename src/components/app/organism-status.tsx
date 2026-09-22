import type { MineralSnapshot } from "@/lib/blossom/organism";
import { organismStatusLine } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

export function OrganismStatus({
  minerals,
  className,
}: {
  minerals: MineralSnapshot;
  className?: string;
}) {
  const line = organismStatusLine(minerals);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-surface-2/40 px-4 py-3",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
        Organisme
      </p>
      <p className="mt-1.5 text-sm leading-6 text-fg">{line}</p>
      <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
        {(
          [
            ["Mission", minerals.mission],
            ["Parole", minerals.parole],
            ["Pron", minerals.pron],
            ["Lien", minerals.social],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-subtle">
              {label}
            </dt>
            <dd className="mt-0.5 font-display text-lg tabular-nums text-primary">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
