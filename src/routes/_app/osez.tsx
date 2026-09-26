import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
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
import { AmbientParticles } from "@/components/app/ambient-particles";
import { OrganismMineralsPanel } from "@/components/app/organism-minerals-panel";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNER_MEMORY, planAllows, PRONLAB_SETS, setsForLanguage } from "@/lib/blossom/data";
import { influenceFromState } from "@/lib/blossom/influence";
import { hasSource } from "@/lib/blossom/engine";
import {
  courageDaysFromLog,
  courageRibbon,
  causalNextGesture,
  computeMinerals,
  todaysPulseDare,
} from "@/lib/blossom/organism";
import { generateRoomCatalog } from "@/lib/blossom/speak-engine";
import { useBlossom, useJourney } from "@/lib/blossom/store";
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
  "Décrire mon quartier à Saint-Denis",
  "Réserver une table pour deux",
  "Demander un conseil à un commerçant",
  "Parler de la météo cyclonique",
];

function OsezPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/+$/, "") || "/",
  });

  return pathname === "/osez" ? <OsezHub /> : <Outlet />;
}

function OsezHub() {
  const navigate = useNavigate();
  const log = useBlossom((s) => s.activityLog);
  const plan = useBlossom((s) => s.plan);
  const learner = useBlossom((s) => s.learner);
  const languageId = useBlossom((s) => s.languageId);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const missionSessions = useBlossom((s) => s.missionSessions);
  const journey = useJourney();
  const memoryOn = planAllows(plan, "memory");
  const baseDare = todaysPulseDare();
  const influence = influenceFromState({
    activityLog: log,
    pronlabAttempts: attempts,
    growthEvents,
    phonemeLeaves,
    missionSessions,
    allItems: setsForLanguage(languageId).flatMap((s) => s.items),
    memory: LEARNER_MEMORY,
    memoryOn,
    languageId,
  });
  const dare = influence.pulse.dareOverride ?? baseDare;
  const pulseOverridden = Boolean(influence.pulse.dareOverride);
  const courageDays = courageDaysFromLog(log);
  const cells = courageRibbon(courageDays);
  const spoken = cells.filter(Boolean).length;
  const minerals = useMemo(() => computeMinerals(log), [log]);
  const nextGesture = causalNextGesture(minerals);
  const recentGrowth = [...growthEvents]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 3);
  const particleIntensity = Math.min(1, 0.35 + minerals.parole / 100);

  const [topic, setTopic] = useState("");
  const [building, setBuilding] = useState(false);

  const rooms = useMemo(
    () =>
      generateRoomCatalog({
        level: learner.level,
        firstName: learner.firstName,
        friction: influence.speak.friction ?? (memoryOn ? LEARNER_MEMORY.hesitation : null),
        interests: learner.interests,
        entropy: "hub-daily",
        pressureHint: influence.speak.pressureHint,
        kitBoost: influence.speak.kitBoost,
        influenceReasons: influence.speak.reasons
          .filter((r) => r.code !== "balanced")
          .map((r) => r.line),
      }),
    [learner.level, learner.firstName, learner.interests, memoryOn, influence.speak],
  );

  const roomsDone = rooms.filter((r) => hasSource(log, `speak-${r.id}`)).length;

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
    <Page className="kosez-feature-page relative max-w-4xl overflow-hidden">
      <AmbientParticles
        stageId={journey.stage.id}
        intensity={particleIntensity}
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
      />

      <div className="relative z-10">
        <header className="max-w-2xl">
          <Eyebrow>OSEZ · minéral parole</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            Parler maintenant
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
            Rooms vivantes — recomposées à chaque entrée. Sujet libre, lieu,
            pression, monde réel. Chaque prise de parole écrite une tige sur votre BLOSSOM
            et nourrit le minéral <span className="font-semibold text-primary">parole</span>.
            {memoryOn ? (
              <>
                {" "}
                Léo garde « {LEARNER_MEMORY.avoided} » sans vous brusquer.
              </>
            ) : null}
          </p>
          {recentGrowth.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Gestes récents">
              {recentGrowth.map((g) => (
                <li
                  key={g.id}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] text-primary"
                >
                  {g.label}
                  {g.mineral ? <span className="ml-1 text-primary/70">· {g.mineral}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[11px] text-subtle">
              Aucune tige encore — la première room en écrira une.
            </p>
          )}
        </header>

        <section
          className="mt-8 rounded-2xl border border-border/70 bg-surface/80 p-4 sm:p-5 magnetic-surface"
          aria-label="Ruban de courage — 28 jours, sans flamme"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Ruban de courage
            </p>
            <p className="text-xs tabular-nums text-muted">
              {spoken} / 28 · sans flamme, sans anxiété
            </p>
          </div>
          <ul className="mt-3 flex flex-wrap gap-1" aria-label="28 derniers jours">
            {cells.map((on, i) => (
              <li
                key={i}
                title={on ? "Geste ce jour-là" : "Terre en jachère"}
                className={cn(
                  "size-2 rounded-full sm:size-2.5 transition-shadow duration-300",
                  on
                    ? "bg-primary shadow-[0_0_6px_rgba(217,255,105,0.4)]"
                    : "bg-surface-2 ring-1 ring-border/70",
                )}
              />
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-5 text-subtle">
            Un point allumé = un jour où vous avez parlé. Rien d'autre. Pas de série à briser.
          </p>
        </section>

        <section
          className="mt-8 rounded-2xl border border-primary/25 bg-primary/8 p-5 shadow-[var(--shadow-border)] sm:p-6 magnetic-surface"
          aria-label="Prochain geste causal"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            Prochain geste · minéral {nextGesture.mineral}
          </p>
          <p className="mt-2 font-display text-xl tracking-tight text-fg sm:text-2xl">
            {nextGesture.line}
          </p>
          <p className="mt-2 text-[11px] text-muted">
            Cette porte est proposée parce que le minéral « {nextGesture.mineral} » est le plus bas cette semaine.
          </p>
          <Link
            to={nextGesture.door as "/osez" | "/pronlab" | "/mission" | "/tandem" | "/learn/labs"}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
          >
            Ouvrir la porte
            <ArrowRight className="size-3.5" />
          </Link>
        </section>

        <OrganismMineralsPanel minerals={minerals} growthEvents={growthEvents} />

        <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/8 p-5 sm:p-6 magnetic-surface">
          <div className="flex flex-wrap items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            <Eyebrow className="text-primary">Sujet libre</Eyebrow>
          </div>
          <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
            N'importe quel sujet
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Écrivez ce que vous voulez travailler. Une room unique se compose
            autour de votre sujet — interlocuteur, lieu, pression. La prise compte comme SPEAK
            et nourrit <span className="text-primary">parole</span>.
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
          <button
            type="button"
            onClick={() => launchTopic(dare.line)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/25 bg-primary/8 p-5 text-left shadow-[var(--shadow-border)] magnetic-surface sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="size-4" strokeWidth={1.7} />
              </span>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {pulseOverridden ? "Organisme" : "Aujourd'hui"}
              </span>
            </div>
            <h2 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">
              Pulse
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted">{dare.line}</p>
            {pulseOverridden ? (
              <p className="mt-2 text-[11px] leading-5 text-primary/80">
                {influence.pulse.reasons.find((r) => r.code !== "balanced")?.line
                  ?? "Recalibré par l'organisme — pas le Pulse du calendrier."}
              </p>
            ) : null}
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-primary/15 pt-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Clock className="size-3.5" />
                {dare.seconds}s · un acte{pulseOverridden ? " · organismique" : ""}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Lancer en room
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>

          <div className="flex flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)] magnetic-surface sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
              <MapPin className="size-4" strokeWidth={1.7} />
            </span>
            <h2 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">
              Street
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Le monde réel. Vous parlez, puis vous notez. Écrit une racine terrain · minéral mission.
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
            className="group flex flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)] magnetic-surface sm:p-6"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
              <Mic className="size-4" strokeWidth={1.7} />
            </span>
            <h2 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">
              Tandem
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted">
              Une constellation de présences — pas un feed. Nourrit le minéral social.
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
              Catalogue du jour — lieu, pression, événement réel. Chaque room ancrée écrit une tige · minéral parole.
              {influence.speak.kitBoost.length > 0
                ? " Kit enrichi par l'organisme."
                : ""}
            </p>
          </div>
          <p className="text-xs tabular-nums text-subtle">
            {roomsDone} / {rooms.length} ancrées
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border/60 bg-surface/80 p-8 text-center magnetic-surface">
            <p className="font-display text-2xl tracking-tight">
              Le catalogue se compose
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              En attendant, lancez un Pulse ou un sujet libre — une room unique se
              construit autour de votre geste.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => launchTopic(dare.line)}>Pulse du jour</Button>
              <Button variant="secondary" onClick={() => launchTopic("Présentez-vous")}>
                Room libre
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Link
              to="/osez/$id"
              params={{ id: "live" }}
              className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/8 p-5 magnetic-surface"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <RefreshCw className="size-4" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="font-display text-xl tracking-tight">Room libre</p>
                  <p className="mt-1 text-sm text-muted">
                    Une room composée pour aujourd'hui — lieu, pression, ancrage.
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
                    className="group overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-[var(--shadow-border)] magnetic-surface"
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
          </>
        )}
      </div>
    </Page>
  );
}
