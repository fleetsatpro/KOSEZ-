import type { GrowthEvent } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<GrowthEvent["kind"], string> = {
  root: "Racine",
  stem: "Tige",
  leaf: "Feuille",
  flower: "Fleur",
  mineral: "Minéral",
};

const KIND_DOT: Record<GrowthEvent["kind"], string> = {
  root: "bg-primary",
  stem: "bg-emerald-400",
  leaf: "bg-lime-300",
  flower: "bg-fuchsia-300",
  mineral: "bg-white/40",
};

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function SceneReel({
  events,
  className,
  limit = 8,
}: {
  events: GrowthEvent[];
  className?: string;
  limit?: number;
}) {
  const slice = events.slice(0, limit);

  if (slice.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)]",
          className,
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          SceneReel
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Les gestes apparaissent ici comme une bande de cinéma — racine, tige,
          feuille. Un seul suffit pour commencer.
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
        className,
      )}
      aria-label="Bande de croissance récente"
    >
      <div className="flex items-baseline justify-between gap-3 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          SceneReel
        </p>
        <p className="text-[11px] tabular-nums text-muted">
          {slice.length} geste{slice.length > 1 ? "s" : ""}
        </p>
      </div>

      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slice.map((e, i) => (
          <li
            key={e.id}
            className={cn(
              "relative w-[148px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-surface-2/50",
              "transition-transform duration-300 hover:-translate-y-0.5",
            )}
            style={{
              animationDelay: `${i * 40}ms`,
            }}
          >
            <div className="aspect-[4/5] p-3.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn("size-2 rounded-full", KIND_DOT[e.kind])}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  {KIND_LABEL[e.kind]}
                </span>
              </div>
              <p className="mt-3 font-display text-lg leading-snug tracking-tight text-fg">
                {e.label}
              </p>
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <div
                  className="mb-2 h-1 overflow-hidden rounded-full bg-border/60"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.round(e.intensity * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] tabular-nums text-muted">
                  {formatWhen(e.at)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
