import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mic, MapPin, Sparkles, Clock, Check } from "lucide-react";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { SCENARIOS, LEARNER_MEMORY, planAllows } from "@/lib/blossom/data";
import { hasSource } from "@/lib/blossom/engine";
import {
  courageDaysFromLog,
  courageRibbon,
  todaysPulseDare,
} from "@/lib/blossom/organism";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/osez")({
  component: OsezPage,
});

const STREET_PROTOCOL = [
  "Choisissez un lieu réel — café, marché, comptoir.",
  "Une phrase claire, sans traduire à voix haute.",
  "Revenez ici ou via la mission Terrain pour noter le geste.",
] as const;

function OsezPage() {
  const log = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const memoryOn = planAllows(plan, "memory");
  const dare = todaysPulseDare();
  const courageDays = courageDaysFromLog(log);
  const cells = courageRibbon(courageDays);
  const spoken = cells.filter(Boolean).length;
  const roomsDone = SCENARIOS.filter((s) => hasSource(log, `speak-${s.id}`)).length;

  return (
    <Page className="kosez-feature-page max-w-4xl">
      <header className="max-w-2xl">
        <Eyebrow>OSEZ</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Parler maintenant
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Trois portes. Une seule suffit aujourd'hui. Le bilan vient après
          — jamais pendant.
          {memoryOn ? (
            <>
              {" "}
              Léo garde en tête « {LEARNER_MEMORY.avoided} » sans vous brusquer.
            </>
          ) : null}
        </p>
      </header>

      {/* Courage atmosphere strip */}
      <section
        className="mt-8 rounded-2xl border border-border/70 bg-surface/80 p-4 sm:p-5"
        aria-label="Ruban de courage"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            Ruban de courage
          </p>
          <p className="text-xs tabular-nums text-muted">
            {spoken} / 28 · sans flamme
          </p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1" aria-label="28 derniers jours">
          {cells.map((on, i) => (
            <li
              key={i}
              title={on ? "Geste ce jour-là" : "Terre en jachère"}
              className={cn(
                "size-2 rounded-full sm:size-2.5",
                on
                  ? "bg-primary shadow-[0_0_6px_rgba(217,255,105,0.4)]"
                  : "bg-surface-2 ring-1 ring-border/70",
              )}
            />
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-5 text-subtle">
          Les trous ne sont pas un échec — terre en jachère. Un seul jour de
          parole rallume le fil.
        </p>
      </section>

      {/* Three doors — denser */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Link
          to="/osez/pulse"
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/25 bg-primary/8 p-5 shadow-[var(--shadow-border)] transition-transform hover:-translate-y-0.5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Sparkles className="size-4" strokeWidth={1.7} />
            </span>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Aujourd'hui
            </span>
          </div>
          <h2 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">
            Pulse
          </h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted">{dare.line}</p>
          <div className="mt-5 flex items-center justify-between gap-2 border-t border-primary/15 pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Clock className="size-3.5" />
              {dare.seconds}s · un acte
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Entrer
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        <div className="flex flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
          <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
            <MapPin className="size-4" strokeWidth={1.7} />
          </span>
          <h2 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">
            Street
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Le monde réel. Vous parlez, puis vous notez. Aucun micro dans
            l'app — la preuve, c'est le geste.
          </p>
          <ol className="mt-4 space-y-2 border-t border-border/60 pt-4">
            {STREET_PROTOCOL.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-xs leading-5 text-muted">
                <span className="font-display text-sm tabular-nums text-primary/80">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <Link
            to="/mission"
            className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
          >
            Mission Terrain
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <Link
          to="/tandem"
          className="group flex flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)] transition-transform hover:-translate-y-0.5 sm:p-6"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
            <Mic className="size-4" strokeWidth={1.7} />
          </span>
          <h2 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">
            Tandem
          </h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted">
            Une constellation de présences — pas un feed. Vous choisissez qui
            vous entend, et pour quoi.
          </p>
          <p className="mt-5 inline-flex items-center gap-1 border-t border-border/60 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Ouvrir la constellation
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      </div>

      {/* Speak rooms — denser cards */}
      <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            Speak Rooms
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Conversations guidées. Vous parlez. Le bilan arrive après — pas
            pendant.
          </p>
        </div>
        <p className="text-xs tabular-nums text-subtle">
          {roomsDone} / {SCENARIOS.length} faites
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SCENARIOS.map((scene) => {
          const done = hasSource(log, `speak-${scene.id}`);
          return (
            <Link
              key={scene.id}
              to="/osez/$id"
              params={{ id: scene.id }}
              className="group overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={scene.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                  <h3 className="font-display text-2xl text-white">{scene.title}</h3>
                  <Badge
                    variant={done ? "default" : "outline"}
                    className={cn(
                      done && "bg-primary text-primary-foreground",
                      !done && "border-white/30 bg-black/30 text-white",
                    )}
                  >
                    {done ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="size-3" /> Faite
                      </span>
                    ) : (
                      `${scene.durationMin} min`
                    )}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm leading-6 text-muted">{scene.setting}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Entrer dans la room
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
