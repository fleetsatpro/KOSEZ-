import { useEffect, useMemo, useState } from "react";
import type { GrowthEvent, MineralSnapshot } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  GrowthEvent["kind"],
  { glyph: string; tone: string; title: string }
> = {
  root: {
    glyph: "◉",
    tone: "from-primary/25 via-primary/5 to-transparent",
    title: "Racine",
  },
  stem: {
    glyph: "│",
    tone: "from-emerald-400/20 via-emerald-400/5 to-transparent",
    title: "Tige",
  },
  leaf: {
    glyph: "❧",
    tone: "from-lime-300/25 via-lime-300/5 to-transparent",
    title: "Feuille",
  },
  flower: {
    glyph: "❀",
    tone: "from-fuchsia-300/20 via-fuchsia-300/5 to-transparent",
    title: "Fleur",
  },
  mineral: {
    glyph: "·",
    tone: "from-white/10 via-transparent to-transparent",
    title: "Minéral",
  },
};

export function GrowthCeremony({
  event,
  minerals,
  previousMinerals,
  open,
  onDismiss,
  className,
}: {
  event: GrowthEvent | null;
  minerals: MineralSnapshot;
  previousMinerals?: MineralSnapshot | null;
  open: boolean;
  onDismiss: () => void;
  className?: string;
}) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    if (!open || !event) return;
    setPhase("enter");
    const hold = window.setTimeout(() => setPhase("hold"), 420);
    const auto = window.setTimeout(() => {
      setPhase("exit");
      window.setTimeout(onDismiss, 380);
    }, 4200);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(auto);
    };
  }, [open, event?.id, onDismiss]);

  const meta = event ? KIND_META[event.kind] : null;

  const deltas = useMemo(() => {
    if (!previousMinerals) return null;
    const keys = ["mission", "parole", "pron", "social"] as const;
    return keys
      .map((k) => ({
        key: k,
        delta: minerals[k] - previousMinerals[k],
      }))
      .filter((d) => d.delta !== 0);
  }, [minerals, previousMinerals]);

  if (!open || !event || !meta) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cérémonie de croissance"
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Fermer"
        className={cn(
          "absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300",
          phase === "exit" ? "opacity-0" : "opacity-100",
        )}
        onClick={() => {
          setPhase("exit");
          window.setTimeout(onDismiss, 320);
        }}
      />

      <div
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]",
          "transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          phase === "enter" && "translate-y-6 scale-[0.97] opacity-0",
          phase === "hold" && "translate-y-0 scale-100 opacity-100",
          phase === "exit" && "translate-y-4 scale-[0.98] opacity-0",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-b",
            meta.tone,
          )}
          aria-hidden
        />

        <div className="relative px-6 pb-6 pt-8 text-center">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10",
              "font-display text-3xl text-primary",
              phase === "hold" && "animate-[pulse_2.4s_ease-in-out_infinite]",
            )}
            style={{
              animationDuration: `${Math.max(1.2, 2.8 - event.intensity)}s`,
            }}
          >
            <span aria-hidden>{meta.glyph}</span>
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle">
            {meta.title} · intensité {Math.round(event.intensity * 100)}%
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">
            {event.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            La terre s'en souvient. Rien à forcer.
          </p>

          {deltas && deltas.length > 0 ? (
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {deltas.map((d) => (
                <li
                  key={d.key}
                  className="rounded-full border border-border/70 bg-surface-2/80 px-3 py-1 text-[11px] tabular-nums text-fg"
                >
                  <span className="uppercase tracking-[0.12em] text-subtle">
                    {d.key}
                  </span>{" "}
                  <span className="ml-1 font-semibold text-primary">
                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setPhase("exit");
              window.setTimeout(onDismiss, 320);
            }}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
