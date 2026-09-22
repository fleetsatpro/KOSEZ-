import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import { RecordControl, Waveform } from "@/components/app/record-control";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { SCENARIOS, SPEAK_FEEDBACK, planAllows } from "@/lib/blossom/data";
import { cafeMemoryHint } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/osez/$id")({
  component: SpeakRoom,
});

function SpeakRoom() {
  const { id } = Route.useParams();
  const scene = SCENARIOS.find((s) => s.id === id);
  const navigate = useNavigate();
  const complete = useBlossom((s) => s.completeActivity);
  const plan = useBlossom((s) => s.plan);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const learner = useBlossom((s) => s.learner);
  const memoryOn = planAllows(plan, "memory") && id === "cafe";
  const mineralsBefore = useRef(minerals);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [waitingYou, setWaitingYou] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [yourTurns, setYourTurns] = useState(0);

  useEffect(() => {
    if (!started || done) return;
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [started, done]);

  useEffect(() => {
    if (!started || done || !scene) return;
    const current = scene.turns[turn];
    if (!current) {
      setDone(true);
      return;
    }
    if (current.speaker === "ai") {
      setWaitingYou(false);
      const t = window.setTimeout(() => setTurn((n) => n + 1), 2400);
      return () => window.clearTimeout(t);
    }
    setWaitingYou(true);
  }, [started, turn, done, scene]);

  if (!scene) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-fg px-6 text-primary-foreground">
        <div className="text-center">
          <p className="font-display text-2xl">Scénario introuvable</p>
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/osez">Retour</Link>
          </Button>
        </div>
      </div>
    );
  }

  const feedback = SPEAK_FEEDBACK[scene.id] ?? SPEAK_FEEDBACK.cafe;
  const current = scene.turns[turn];
  const totalTurns = scene.turns.length;
  const progressPct = Math.min(100, Math.round((turn / Math.max(1, totalTurns)) * 100));

  function finish() {
    mineralsBefore.current = useBlossom.getState().mineralSnapshot;
    const result = complete("SPEAK_COMPLETED", `speak-${id}`);
    if (result.ok) {
      toast("Session close. La tige s'épaissit.");
      setCeremonyOpen(true);
    } else {
      navigate({ to: "/osez" });
    }
  }

  if (!started) {
    return (
      <div className="relative min-h-dvh bg-fg text-primary-foreground">
        <img
          src={scene.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/40" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col justify-end px-6 pb-12 pt-10">
          <Link
            to="/osez"
            className="absolute left-5 top-6 inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Osez
          </Link>
          <Eyebrow className="text-primary/90">Speak Room</Eyebrow>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            {scene.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
            {scene.setting}
          </p>
          <ul className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/65 backdrop-blur-sm">
            <li>Pas de traduction pendant l'échange.</li>
            <li>Maintenez pour répondre — Léo écoute, puis enchaîne.</li>
            <li>~{scene.durationMin} min · le bilan arrive après, pas pendant.</li>
          </ul>
          {memoryOn ? (
            <p className="mt-4 text-xs leading-5 text-white/45">
              {learner.firstName}, Léo garde votre point de friction en
              arrière-plan — sans vous interrompre.
            </p>
          ) : null}
          <Button
            className="mt-8 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              track("speak_started");
              setStarted(true);
            }}
          >
            Entrer dans la room
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-bg px-5 py-10 text-fg">
        <div className="mx-auto max-w-lg">
          <Eyebrow>Bilan</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {scene.title}
          </h1>
          <p className="mt-2 text-sm tabular-nums text-muted">
            {Math.floor(elapsed / 60)}:
            {String(elapsed % 60).padStart(2, "0")} · {yourTurns} prise
            {yourTurns > 1 ? "s" : ""} de parole
          </p>

          <div className="mt-8 space-y-3">
            <Surface className="border border-primary/15 bg-primary/5">
              <Eyebrow>Force</Eyebrow>
              <p className="mt-2 text-sm leading-7">{feedback.strength}</p>
            </Surface>
            <Surface>
              <Eyebrow>À ajuster</Eyebrow>
              <p className="mt-2 text-sm leading-7">{feedback.improvement}</p>
            </Surface>
            <Surface>
              <Eyebrow>Phrase modèle</Eyebrow>
              <p className="mt-2 font-display text-xl leading-snug tracking-tight">
                {feedback.model}
              </p>
            </Surface>
          </div>

          <Button className="mt-8 h-12 w-full" onClick={finish}>
            Clore la session
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/osez">Autres rooms</Link>
          </Button>
        </div>

        <GrowthCeremony
          open={ceremonyOpen}
          event={growthEvents[0] ?? null}
          minerals={minerals}
          previousMinerals={mineralsBefore.current}
          onDismiss={() => {
            setCeremonyOpen(false);
            navigate({ to: "/osez" });
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="min-w-[3.5rem] text-sm tabular-nums text-primary-foreground/70">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </p>
        <div className="min-w-0 text-center">
          <p className="truncate font-display text-lg">{scene.title}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/50">
            Tour {Math.min(turn + 1, totalTurns)} / {totalTurns}
          </p>
        </div>
        <Link to="/osez" aria-label="Quitter" className="p-2">
          <X className="size-5" />
        </Link>
      </header>

      <div className="px-5">
        <div className="h-0.5 overflow-hidden rounded-full bg-primary-foreground/15">
          <div
            className="h-full rounded-full bg-primary-foreground/80 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.22em]",
            waitingYou
              ? "text-primary-foreground"
              : "text-primary-foreground/55",
          )}
        >
          {waitingYou ? "À vous" : "Léo parle"}
        </p>
        <div className="mt-8">
          <Waveform active={!waitingYou} />
        </div>
        {waitingYou && current ? (
          <p className="mt-10 max-w-sm text-sm leading-7 text-primary-foreground/85">
            {cafeMemoryHint(current.hint, current.speaker, memoryOn)}
          </p>
        ) : (
          <p className="mt-10 max-w-xs text-sm leading-6 text-primary-foreground/55">
            Écoutez. Puis répondez sans traduire à voix haute.
          </p>
        )}
      </div>

      <div className="px-6 pb-12">
        {waitingYou ? (
          <RecordControl
            inverted
            cta="Maintenir pour répondre"
            onFinished={() => {
              setYourTurns((n) => n + 1);
              setTurn((n) => n + 1);
            }}
          />
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/50">
            <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground/60" />
            Léo enchaîne…
          </div>
        )}
      </div>
    </div>
  );
}
