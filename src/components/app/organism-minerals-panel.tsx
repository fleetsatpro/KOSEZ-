import { Link } from "@tanstack/react-router";
import { ArrowRight, Leaf } from "lucide-react";
import {
  causalNextGesture,
  MINERAL_DOORS,
  MINERAL_ORDER,
  MINERAL_WINDOW_DAYS,
  type GrowthEvent,
  type MineralSnapshot,
} from "@/lib/blossom/organism";

const ROUTES = ["/mission", "/osez", "/pronlab", "/tandem", "/learn/labs", "/explore"] as const;

function dateLabel(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const now = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((n.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function OrganismMineralsPanel({
  minerals,
  growthEvents = [],
}: {
  minerals: MineralSnapshot;
  growthEvents?: GrowthEvent[];
}) {
  const next = causalNextGesture(minerals);
  const recent = [...growthEvents]
    .filter((event) => event.mineral)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return (
    <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 magnetic-surface" aria-label="Organisme BLOSSOM — cinq minéraux et leurs portes">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Leaf className="size-4" /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Organisme · 5 minéraux</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg/90">
            Voici où vos gestes ont nourri BLOSSOM sur les {MINERAL_WINDOW_DAYS} derniers jours. Ce repère n’est ni une note ni un niveau de langue.
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {MINERAL_ORDER.map((key) => {
          const meta = MINERAL_DOORS[key];
          const value = minerals[key];
          const isNext = key === next.mineral;
          return (
            <li key={key} className={isNext ? "rounded-2xl border border-primary/30 bg-primary/8 p-4" : "rounded-2xl border border-border/70 bg-surface/70 p-4"}>
              <div className="flex items-start justify-between gap-3">
                <Link to={meta.door as (typeof ROUTES)[number]} className="min-w-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <span className="block text-sm font-semibold text-fg hover:text-primary">{meta.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{meta.plain}</span>
                </Link>
                <span className="shrink-0 rounded-full border border-border/70 bg-surface-2 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-fg">{value}/100</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={meta.label + " · " + value + " sur 100"}>
                <div className="h-full rounded-full bg-primary/80 transition-[width] duration-500 plant-breathe" style={{ width: Math.max(2, value) + "%" }} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] leading-5 text-subtle">Nourri par : {meta.proof}.</p>
                {isNext ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Prochaine porte</span> : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 rounded-2xl border border-primary/25 bg-surface px-4 py-4 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">Pourquoi cette porte ?</p>
        <p className="mt-1.5 text-sm leading-6 text-fg">{next.line}</p>
        <p className="mt-2 text-xs leading-5 text-subtle">
          {next.tied.length > 1 ? "Il y a égalité : ce choix est montré au lieu d’être caché." : "La porte est reliée directement au minéral le moins nourri."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={next.door as (typeof ROUTES)[number]} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
            {next.action}<ArrowRight className="size-3.5" />
          </Link>
          {next.alternate ? <Link to={next.alternate.door as (typeof ROUTES)[number]} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 px-4 py-2 text-xs font-semibold text-muted hover:text-fg">Ou {next.alternate.action.toLowerCase()}</Link> : null}
          {MINERAL_DOORS[next.mineral].fallbackDoor ? <Link to={MINERAL_DOORS[next.mineral].fallbackDoor as (typeof ROUTES)[number]} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 px-4 py-2 text-xs font-semibold text-muted hover:text-fg">{MINERAL_DOORS[next.mineral].fallbackLabel}</Link> : null}
        </div>
      </div>

      {recent.length > 0 ? (
        <div className="mt-6 border-t border-primary/15 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Dernières traces · cliquer pour continuer</p>
          <ul className="mt-3 space-y-2">
            {recent.map((event) => {
              const meta = event.mineral ? MINERAL_DOORS[event.mineral] : null;
              if (!meta) return null;
              return <li key={event.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface px-3 py-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1"><p className="truncate text-xs text-fg">{event.label}</p><p className="mt-0.5 text-[10px] text-subtle">{dateLabel(event.at)} · {meta.label}</p></div>
                <Link to={meta.door as (typeof ROUTES)[number]} className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10" aria-label={"Continuer " + meta.action}>{meta.action}</Link>
              </li>;
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-5 border-t border-primary/15 pt-4">
          <p className="text-xs leading-5 text-subtle">Aucun geste enregistré pour l’instant. Commencez par la porte qui vous semble la plus simple.</p>
        </div>
      )}
    </section>
  );
}