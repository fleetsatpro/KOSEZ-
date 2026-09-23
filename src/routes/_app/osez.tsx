import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Mic,
  MapPin,
  Sparkles,
  Clock,
  Check,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNER_MEMORY, planAllows } from "@/lib/blossom/data";
import { hasSource } from "@/lib/blossom/engine";
import {
  courageDaysFromLog,
  courageRibbon,
  todaysPulseDare,
} from "@/lib/blossom/organism";
import { generateRoomCatalog } from "@/lib/blossom/speak-engine";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/osez")({
  component: OsezPage,
});

const STREET_PROTOCOL = [
  "Choisissez un lieu réel — café, marché, comptoir.",
  "Une phrase claire, sans traduire à voix haute.",
  "Revenez ici ou via la mission Terrain pour noter le geste.",
] as const;

const TOPIC_SUGGESTIONS = [
  "Commander un café à la vanille",
  "Demander mon chemin au marché",
  "Parler de mon weekend sur la côte",
  "Check-in à l'aéroport Roland Garros",
  "Présenter mon parcours en entretien",
  "Négocier le prix des gousses",
  "Expliquer un retard de vol",
  "Inviter quelqu'un à marcher au front de mer",
];

function OsezPage() {
  const navigate = useNavigate();
  const log = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const learner = useBlossom((s) => s.learner);
  const memoryOn = planAllows(plan, "memory");
  const dare = todaysPulseDare();
  const courageDays = courageDaysFromLog(log);
  const cells = courageRibbon(courageDays);
  const spoken = cells.filter(Boolean).length;

  const [topic, setTopic] = useState("");
  const [building, setBuilding] = useState(false);

  const rooms = useMemo(
    () =>
      generateRoomCatalog({
        level: learner.level,
        firstName: learner.firstName,
        friction: memoryOn ? LEARNER_MEMORY.hesitation : null,
        interests: learner.interests,
        entropy: "hub-daily",
      }),
    [learner.level, learner.firstName, learner.interests, memoryOn],
  );

  const roomsDone = rooms.filter((room) =>
    log.some(
      (event) =>
        event.type === "SPEAK_COMPLETED" &&
        event.sourceId?.includes(`speak-${room.place.archetype}-${room.id}`),
    ),
  ).length;

  function launchTopic(raw?: string) {
    const t = (raw ?? topic).trim();
    if (!t) {
      toast("Écrivez un sujet — n'importe lequel.");
      return;
    }
    setBuilding(true);
    try {
      sessionStorage.setItem("kosez-speak-topic", t.slice(0, 120));
    } catch {
      /* ignore */
    }
    navigate({ to: "/osez/$id", params: { id: "topic" } });
    setBuilding(false);
  }

  return (
    <Page className="kosez-feature-page max-w-4xl">
      <header className="max-w-2xl">
        <Eyebrow>OSEZ</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Parler maintenant
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Rooms vivantes — recomposées à chaque entrée. Sujet libre, lieu,
          pression, monde réel. Le bilan vient après, jamais pendant.
          {memoryOn ? (
            <>
              {" "}
              Léo garde « {LEARNER_MEMORY.avoided} » sans vous brusquer.
            </>
          ) : null}
        </p>
      </header>

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
      </section>

      <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Wand2 className="size-4 text-primary" />
          <Eyebrow className="text-primary">Sujet libre</Eyebrow>
        </div>
        <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
          N&apos;importe quel sujet
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Écrivez ce que vous voulez travailler. Une room unique se compose
          autour de votre sujet — interlocuteur, lieu, pression.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") launchTopic();
            }}
            placeholder="Ex. : expliquer un retard, commander des litchis…"
            className="h-12 flex-1 rounded-xl border border-border/70 bg-bg px-4 text-sm text-fg outline-none ring-primary/40 placeholder:text-subtle focus:ring-2"
            maxLength={120}
            aria-label="Sujet libre"
          />
          <Button
            className="h-12 shrink-0"
            disabled={building}
            onClick={() => launchTopic()}
          >
            {building ? "Composition…" : "Composer la room"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TOPIC_SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  setTopic(s);
                  launchTopic(s);
                }}
                className="rounded-full border border-border/60 bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/40 hover:text-primary"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </section>

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
              Aujourd&apos;hui
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
            Le monde réel. Vous parlez, puis vous notez.
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
            search={{ missionId: undefined }}
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
            Une constellation de présences — pas un feed.
          </p>
          <p className="mt-5 inline-flex items-center gap-1 border-t border-border/60 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Ouvrir
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            Speak Rooms
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Catalogue du jour — lieu, pression, événement réel.
          </p>
        </div>
        <p className="text-xs tabular-nums text-subtle">
          {roomsDone} / {rooms.length} ancrées
        </p>
      </div>

      <Link
        to="/osez/$id"
        params={{ id: "live" }}
        className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/8 p-5 transition-transform hover:-translate-y-0.5"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <RefreshCw className="size-4" strokeWidth={1.7} />
          </span>
          <div>
            <p className="font-display text-xl tracking-tight">Room libre</p>
            <p className="mt-1 text-sm text-muted">
              Une room composée pour aujourd&apos;hui — lieu, pression, ancrage.
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-primary" />
      </Link>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rooms.map((scene) => {
          const done = hasSource(log, `speak-${scene.id}`);
          return (
            <Link
              key={scene.id}
              to="/osez/$id"
              params={{ id: scene.place.archetype }}
              className="group overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
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
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl text-white">
                      {scene.titleFr}
                    </h3>
                    {scene.event ? (
                      <p className="mt-0.5 truncate text-[11px] text-primary/90">
                        {scene.event.title}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    variant={done ? "default" : "outline"}
                    className={cn(
                      done && "bg-primary text-primary-foreground",
                      !done && "border-white/30 bg-black/30 text-white",
                    )}
                  >
                    {done ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="size-3" /> Ancrée
                      </span>
                    ) : (
                      `${scene.durationMin} min`
                    )}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm leading-6 text-muted">{scene.setting}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
                  <span>{scene.cast.name}</span>
                  <span aria-hidden>·</span>
                  <span>{scene.pressure.label}</span>
                  <span aria-hidden>·</span>
                  <span>{scene.turns.length} tours</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
