import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { GrowthEvent, MineralSnapshot } from "@/lib/blossom/organism";
import { causalNextGesture, MINERAL_DEFINITIONS, MINERAL_ORDER } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";


const KIND_META: Record<
  GrowthEvent["kind"],
  { glyph: string; tone: string; title: string; whisper: string }
> = {
  root: {
    glyph: "◉",
    tone: "from-primary/25 via-primary/5 to-transparent",
    title: "Racine",
    whisper: "Ce qui s'ancre sous la terre — invisible, nécessaire.",
  },
  stem: {
    glyph: "│",
    tone: "from-emerald-400/20 via-emerald-400/5 to-transparent",
    title: "Tige",
    whisper: "La tige s'épaissit quand la parole tient.",
  },
  leaf: {
    glyph: "❧",
    tone: "from-lime-300/25 via-lime-300/5 to-transparent",
    title: "Feuille",
    whisper: "Une feuille de plus — surface qui capte le réel.",
  },
  flower: {
    glyph: "❀",
    tone: "from-fuchsia-300/20 via-fuchsia-300/5 to-transparent",
    title: "Fleur",
    whisper: "Quelque chose s'ouvre. Pas de forçage.",
  },
  mineral: {
    glyph: "·",
    tone: "from-white/10 via-transparent to-transparent",
    title: "Minéral",
    whisper: "Le sol se souvient des nutriments.",
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
    const intensity = Math.min(1, Math.max(0.2, event.intensity));
    const holdMs = 380 + Math.round(intensity * 180);
    const totalMs = 3200 + Math.round(intensity * 1800);
    const hold = window.setTimeout(() => setPhase("hold"), holdMs);
    const auto = window.setTimeout(() => {
      setPhase("exit");
      window.setTimeout(onDismiss, 360);
    }, totalMs);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(auto);
    };
  }, [open, event?.id, event?.intensity, onDismiss]);

  const meta = event ? KIND_META[event.kind] : null;

  const deltas = useMemo(() => {
    if (!previousMinerals) return null;
    const keys = MINERAL_ORDER;
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
            {meta.title}
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">
            {event.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{meta.whisper}</p>
          <p className="mt-1 text-xs leading-5 text-subtle">
            La terre s'en souvient. Rien à forcer.
          </p>

          {event.mineral ? (
            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/6 px-4 py-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                Minéral nourri · {MINERAL_LABEL[event.mineral]}
              </p>
              <p className="mt-1 text-sm leading-5 text-fg">
                Ce geste écrit « {MINERAL_DEFINITIONS[event.mineral].label} » dans l’organisme. La porte suivante répond au minéral actuellement le plus en retrait.
              </p>
            </div>
          ) : null}

          {deltas && deltas.length > 0 ? (
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {deltas.map((d) => (
                <li
                  key={d.key}
                  className="rounded-full border border-border/70 bg-surface-2/80 px-3 py-1 text-[11px] tabular-nums text-fg"
                >
                  <span className="uppercase tracking-[0.12em] text-subtle">
                    {MINERAL_DEFINITIONS[d.key].label}
                  </span>{" "}
                  <span className="ml-1 font-semibold text-primary">
                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <CausalDoor minerals={minerals} onNavigate={onDismiss} />

          <button
            type="button"
            onClick={() => {
              setPhase("exit");
              window.setTimeout(onDismiss, 320);
            }}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-border/80 bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

function CausalDoor({
  minerals,
  onNavigate,
}: {
  minerals: MineralSnapshot;
  onNavigate: () => void;
}) {
  const next = causalNextGesture(minerals);
  return (
    <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
        Prochain geste · {MINERAL_DEFINITIONS[next.mineral].label} · {next.value}/100
      </p>
      <p className="mt-1 text-sm leading-5 text-fg/90">{next.line}</p>
      <p className="mt-1 text-[11px] leading-5 text-muted">{next.basis}</p>
      <Link
        to={next.door as never}
        onClick={onNavigate}
        className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        Ouvrir {MINERAL_DEFINITIONS[next.mineral].doorLabel} →
      </Link>
    </div>
  );
}
