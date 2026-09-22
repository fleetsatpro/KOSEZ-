import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { todaysPulseDare } from "@/lib/blossom/organism";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/osez/pulse")({
  component: PulsePage,
});

const PREP = [
  "Respirez une fois. Pas de script parfait.",
  "Une phrase claire. Le reste peut suivre.",
  "Si ça bloque — souriez, reformulez, c'est déjà un geste.",
] as const;

function PulsePage() {
  const dare = todaysPulseDare();
  const completePulse = useBlossom((s) => s.completePulse);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const learner = useBlossom((s) => s.learner);
  const mineralsBefore = useRef(minerals);
  const [secondsLeft, setSecondsLeft] = useState<number>(dare.seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [offlineUsed, setOfflineUsed] = useState(false);

  useEffect(() => {
    if (!running || done) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [running, secondsLeft, done]);

  function start() {
    mineralsBefore.current = useBlossom.getState().mineralSnapshot;
    setRunning(true);
    track("pulse_started", { dareId: dare.id });
  }

  function finish(offline: boolean) {
    setDone(true);
    setRunning(false);
    setOfflineUsed(offline);
    completePulse(dare.id, dare.seconds - Math.max(0, secondsLeft), offline);
    track("pulse_complete", { dareId: dare.id, offline });
    setCeremonyOpen(true);
  }

  const progress = ((dare.seconds - secondsLeft) / dare.seconds) * 100;
  const latestEvent = growthEvents[0] ?? null;
  const elapsed = dare.seconds - Math.max(0, secondsLeft);

  return (
    <Page className="kosez-feature-page max-w-lg">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/osez">
          <ArrowLeft className="size-4" />
          Osez
        </Link>
      </Button>

      <Eyebrow className="mt-5">Pulse · {dare.seconds} secondes</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Un seul acte.
      </h1>
      <p className="mt-3 text-base leading-7 text-fg">{dare.line}</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        {learner.firstName}, ce n'est pas un examen. C'est un geste
        que la terre retient.
      </p>

      {!running && !done ? (
        <ul className="mt-8 space-y-3 rounded-2xl border border-border/70 bg-surface p-5">
          {PREP.map((line, i) => (
            <li key={line} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="font-display text-lg tabular-nums text-primary/70">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-10 flex flex-col items-center">
        <div
          className={cn(
            "relative flex size-48 items-center justify-center rounded-full border-2 transition-[border-color,box-shadow] duration-500 sm:size-52",
            running
              ? "border-primary shadow-[0_0_48px_-6px_rgba(217,255,105,0.5)]"
              : done
                ? "border-primary/40"
                : "border-border",
          )}
          aria-live="polite"
          aria-label={`${secondsLeft} secondes restantes`}
        >
          <span className="font-display text-5xl tabular-nums sm:text-6xl">
            {secondsLeft}
          </span>
          <div
            className="pointer-events-none absolute inset-1 rounded-full opacity-35"
            style={{
              background: `conic-gradient(var(--color-primary) ${progress}%, transparent 0)`,
            }}
          />
        </div>

        {running ? (
          <p className="mt-5 max-w-xs text-center text-sm leading-6 text-muted">
            Allez-y. Quand c'est dit — même imparfait — validez.
          </p>
        ) : null}

        {!done ? (
          <div className="mt-8 flex w-full flex-col gap-3">
            {!running ? (
              <Button className="h-12 w-full" onClick={start}>
                Démarrer le pulse
              </Button>
            ) : (
              <>
                <Button className="h-12 w-full" onClick={() => finish(false)}>
                  J'ai parlé
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => finish(true)}
                >
                  <MapPin className="size-4" />
                  Je l'ai fait hors ligne
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8 w-full rounded-2xl border border-primary/25 bg-primary/5 p-6 text-center">
            <Check className="mx-auto size-7 text-primary" />
            <p className="mt-3 font-display text-2xl sm:text-3xl">C'est noté.</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {offlineUsed
                ? "Geste terrain. La tige s'épaissit hors des murs."
                : `Environ ${elapsed}s de courage. La terre s'en souvient.`}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link to="/">Retour à BLOSSOM</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/osez">Autres portes</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <GrowthCeremony
        open={ceremonyOpen}
        event={latestEvent}
        minerals={minerals}
        previousMinerals={mineralsBefore.current}
        onDismiss={() => setCeremonyOpen(false)}
      />
    </Page>
  );
}
