import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { RecordControl, Waveform } from "@/components/app/record-control";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { SCENARIOS, SPEAK_FEEDBACK, planAllows } from "@/lib/blossom/data";
import { cafeMemoryHint } from "@/lib/blossom/engine";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/osez/$id")({
  component: SpeakRoom,
});

function SpeakRoom() {
  const { id } = Route.useParams();
  const scene = SCENARIOS.find((s) => s.id === id);
  const navigate = useNavigate();
  const complete = useBlossom((s) => s.completeActivity);
  const plan = useBlossom((s) => s.plan);
  const memoryOn = planAllows(plan, "memory") && id === "cafe";
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [waitingYou, setWaitingYou] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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

  function finish() {
    const result = complete("SPEAK_COMPLETED", `speak-${id}`);
    if (result.ok) toast("Session close. Vous progressez.");
    navigate({ to: "/osez" });
  }

  if (!started) {
    return (
      <div className="relative min-h-dvh bg-fg text-primary-foreground">
        <img
          src={scene.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-fg via-fg/70 to-fg/40" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col justify-end px-6 pb-12 pt-10">
          <Link
            to="/osez"
            className="absolute left-5 top-6 text-sm text-primary-foreground/70"
          >
            Fermer
          </Link>
          <Eyebrow className="text-primary-foreground/60">Speak Room</Eyebrow>
          <h1 className="mt-2 font-display text-4xl">{scene.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
            {scene.setting} Pas de traduction pendant l'échange. Parlez.
          </p>
          <Button
            className="mt-8 h-12 w-full bg-primary-foreground text-fg hover:bg-primary-foreground/92"
            onClick={() => {
              track("speak_started");
              setStarted(true);
            }}
          >
            Commencer
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
          <h1 className="mt-2 font-display text-3xl">{scene.title}</h1>
          <p className="mt-1 text-sm tabular-nums text-muted">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </p>
          <div className="mt-6 space-y-3">
            <Surface>
              <Eyebrow>Force</Eyebrow>
              <p className="mt-2 text-sm leading-relaxed">{feedback.strength}</p>
            </Surface>
            <Surface>
              <Eyebrow>À ajuster</Eyebrow>
              <p className="mt-2 text-sm leading-relaxed">{feedback.improvement}</p>
            </Surface>
            <Surface>
              <Eyebrow>Phrase modèle</Eyebrow>
              <p className="mt-2 font-display text-xl">{feedback.model}</p>
            </Surface>
          </div>
          <Button className="mt-6 w-full" onClick={finish}>
            Clore la session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      <header className="flex items-center justify-between px-5 py-4">
        <p className="text-sm tabular-nums text-primary-foreground/70">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </p>
        <p className="font-display text-lg">{scene.title}</p>
        <Link to="/osez" aria-label="Quitter" className="p-2">
          <X className="size-5" />
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/60">
          {waitingYou ? "À vous" : "Léo parle"}
        </p>
        <div className="mt-6">
          <Waveform active={!waitingYou} />
        </div>
        {waitingYou && current && (
          <p className="mt-8 max-w-sm text-sm text-primary-foreground/80">
            {cafeMemoryHint(current.hint, current.speaker, memoryOn)}
          </p>
        )}
      </div>

      <div className="px-6 pb-12">
        {waitingYou ? (
          <RecordControl
            inverted
            cta="Maintenir pour répondre"
            onFinished={() => setTurn((n) => n + 1)}
          />
        ) : (
          <p className="text-center text-sm text-primary-foreground/60">
            Écoutez, puis répondez.
          </p>
        )}
      </div>
    </div>
  );
}
