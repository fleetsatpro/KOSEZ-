import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, CircleHelp } from "lucide-react";
import {
  causalNextGesture,
  MINERAL_DEFINITIONS,
  MINERAL_WINDOW_DAYS,
  type GrowthEvent,
  type MineralKey,
  type MineralSnapshot,
} from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

const ORDER: MineralKey[] = ["mission", "parole", "pron", "social", "atelier"];

export function OrganismMineralsPanel({
  minerals,
  growthEvents = [],
  title = "Les cinq minéraux",
  focusedMineral,
}: {
  minerals: MineralSnapshot;
  growthEvents?: GrowthEvent[];
  title?: string;
  focusedMineral?: MineralKey;
}) {
  const next = causalNextGesture(minerals);
  const recent = [...growthEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  return (
    <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 magnetic-surface" aria-label="Les cinq minéraux de l’organisme BLOSSOM">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Organisme · 5 minéraux</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg/90">Chaque chiffre reflète l’activité récente sur les <span className="font-medium">{MINERAL_WINDOW_DAYS} derniers jours</span>. <span className="font-medium">100 n’est pas un niveau ni un objectif à atteindre :</span> c’est le plafond visuel de cette échelle d’activité. Le chiffre sert seulement à choisir une porte.</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-primary/25 bg-surface px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Prochaine porte</p>
          <p className="mt-1 font-medium text-fg">{MINERAL_DEFINITIONS[next.mineral].label} · {next.value}/100</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted">{MINERAL_DEFINITIONS[next.mineral].scoreMeaning} · {next.basis}</p>
          <p className="mt-2 max-w-xs text-xs leading-5 text-muted">{next.line}</p>
          <Link to={next.door as never} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ouvrir {MINERAL_DEFINITIONS[next.mineral].doorLabel}<ArrowRight className="size-3.5" /></Link>
        </div>
      </div>
      {next.tiedWith.length > 1 ? <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface/70 px-3.5 py-3 text-xs leading-5 text-muted"><CircleHelp className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><span className="font-medium text-fg">Égalité.</span> {next.tiedWith.map((key) => MINERAL_DEFINITIONS[key].label).join(" · ")} sont à {next.value}/100. La première porte est seulement un repère : vous pouvez choisir l’autre.</span></div> : null}
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {ORDER.map((key) => {
          const def = MINERAL_DEFINITIONS[key];
          const value = minerals[key];
          const active = focusedMineral === key || next.tiedWith.includes(key);
          return <Link key={key} to={def.door as never} className={cn("group rounded-2xl border p-4 transition-[transform,border-color,background-color] hover:-translate-y-0.5", active ? "border-primary/40 bg-surface" : "border-border/70 bg-surface/45 hover:border-primary/20")} aria-label={`${def.label}, ${value} sur 100, ${def.purpose}, ouvrir ${def.doorLabel}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">{def.label}</span>{value === next.value ? <Check className="size-3.5 text-primary" /> : null}</div><p className="mt-2 font-display text-2xl tabular-nums text-primary">{value}<span className="ml-0.5 text-xs text-muted">/100</span></p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary/80 transition-[width] duration-500" style={{ width: `${Math.max(2, value)}%` }} /></div><p className="mt-3 text-xs leading-5 text-muted">{def.purpose}</p><p className="mt-3 text-[10px] leading-4 text-subtle">Écrit par · {def.writtenByLabel}</p><p className="mt-2 text-[10px] leading-4 text-subtle">{def.scoreMeaning}</p><p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Porte · {def.doorLabel}<ArrowRight className="size-3" /></p></Link>;
        })}
      </div>
      <div className="mt-5 border-t border-primary/15 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Traçabilité récente</p>
        {recent.length > 0 ? <ul className="mt-3 flex flex-wrap gap-2" aria-label="Gestes récents qui ont nourri l’organisme">{recent.map((g) => <li key={g.id}><Link to={g.mineral ? (MINERAL_DEFINITIONS[g.mineral].door as never) : ("/moi" as never)} className="inline-flex rounded-full border border-border/70 bg-surface px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-primary/25 hover:text-fg">{g.label}{g.mineral ? <span className="ml-1 text-primary/80">· {MINERAL_DEFINITIONS[g.mineral].label}</span> : null}</Link></li>)}</ul> : <p className="mt-2 text-[11px] text-subtle">Aucune trace encore. Le premier geste écrira la première trace, puis son minéral sera lisible ici.</p>}
      </div>
    </section>
  );
}