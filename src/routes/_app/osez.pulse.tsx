import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Eyebrow, Page } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { todaysPulseDare } from "@/lib/blossom/organism";
import { useBlossom } from "@/lib/blossom/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/osez/pulse")({
  component: PulsePage,
});

function PulsePage() {
  const dare = todaysPulseDare();
  const completePulse = useBlossom((s) => s.completePulse);
  const [secondsLeft, setSecondsLeft] = useState(dare.seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

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
    setRunning(true);
    track("pulse_started", { dareId: dare.id });
  }

  function finish(offline: boolean) {
    setDone(true);
    setRunning(false);
    completePulse(dare.id, dare.seconds - Math.max(0, secondsLeft), offline);
    track("pulse_complete", { dareId: dare.id, offline });
  }

  const progress = ((dare.seconds - secondsLeft) / dare.seconds) * 100;

  return (
    <Page className="kosez-feature-page max-w-lg">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/osez">
          <ArrowLeft className="size-4" />
          Osez
        </Link>
      </Button>

      <Eyebrow className="mt-5">Pulse · 90 secondes</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Un seul acte.</h1>
      <p className="mt-3 text-sm leading-7 text-muted">{dare.line}</p>

      <div className="mt-10 flex flex-col items-center">
        <div
          className={cn(
            "relative flex size-44 items-center justify-center rounded-full border-2",
            running
              ? "border-primary shadow-[0_0_40px_-8px_rgba(217,255,105,0.45)]"
              : "border-border",
          )}
          aria-live="polite"
          aria-label={`${secondsLeft} secondes restantes`}
        >
          <span className="font-display text-5xl tabular-nums">{secondsLeft}</span>
          <div
            className="pointer-events-none absolute inset-1 rounded-full opacity-30"
            style={{
              background: `conic-gradient(var(--color-primary) ${progress}%, transparent 0)`,
            }}
          />
        </div>

        {!done ? (
          <div className="mt-8 flex w-full flex-col gap-3">
            {!running ? (
              <Button className="h-12 w-full" onClick={start}>
                Démarrer le pulse
              </Button>
            ) : (
              <>
                <Button className="h-12 w-full" onClick={() => finish(false)}>
                  J&apos;ai parlé
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => finish(true)}
                >
                  Je l&apos;ai fait hors ligne
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8 w-full rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
            <Check className="mx-auto size-6 text-primary" />
            <p className="mt-3 font-display text-2xl">C&apos;est noté.</p>
            <p className="mt-2 text-sm text-muted">
              La terre s&apos;en souvient. La tige s&apos;épaissit.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Retour à BLOSSOM</Link>
            </Button>
          </div>
        )}
      </div>
    </Page>
  );
}
