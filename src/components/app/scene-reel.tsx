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

function sourceWhisper(sourceId: string | undefined): string | null {
  if (!sourceId) return null;
  const id = sourceId.toLowerCase();
  if (id.includes("speak") || id.startsWith("speak-")) return "Parole";
  if (id.includes("mission") || id.startsWith("mission-")) return "Mission";
  if (id.includes("pron") || id.includes("mastery")) return "Prononciation";
  if (id.includes("tandem")) return "Tandem";
  if (id.includes("library") || id.startsWith("lib-")) return "Lecture";
  if (id.includes("event")) return "Rencontre";
  if (id.includes("homework")) return "Travail";
  return null;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
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
  limit = 10,
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
          "relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)]",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-2xl"
          aria-hidden
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Bande de gestes
        </p>
        <p className="mt-3 font-display text-xl tracking-tight text-fg">
          Le film n&apos;a pas encore commencé.
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          Un seul geste réel — une mission, une prise de parole, une lecture —
          s&apos;inscrit ici comme une image. La terre se souvient ensuite.
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
      aria-label="Bande de gestes récents"
    >
      <div className="flex items-baseline justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            Bande de gestes
          </p>
          <p className="mt-1 text-xs text-muted">Ce que la plante a déjà reçu</p>
        </div>
        <p className="text-[11px] tabular-nums text-muted">
          {slice.length} image{slice.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-3 flex gap-1 overflow-hidden px-0.5" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-2 shrink-0 rounded-[1px] bg-border/80"
          />
        ))}
      </div>

      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slice.map((e, i) => {
          const whisper = sourceWhisper(e.sourceId);
          return (
            <li
              key={e.id}
              className={cn(
                "relative w-[156px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-surface-2/50",
                "transition-transform duration-300 hover:-translate-y-0.5",
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="aspect-[4/5] p-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full shadow-[0_0_8px_currentColor]",
                      KIND_DOT[e.kind],
                    )}
                    aria-hidden
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                    {KIND_LABEL[e.kind]}
                  </span>
                </div>
                <p className="mt-3 font-display text-lg leading-snug tracking-tight text-fg">
                  {e.label}
                </p>
                {whisper ? (
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-primary/80">
                    {whisper}
                  </p>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <div
                    className="mb-2 h-1 overflow-hidden rounded-full bg-border/60"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-primary/80 transition-[width] duration-500"
                      style={{
                        width: `${Math.round(Math.min(1, Math.max(0.08, e.intensity)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] tabular-nums text-muted">
                    {formatWhen(e.at)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
