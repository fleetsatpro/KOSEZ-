import { useMessages } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import { Button } from "@/components/ui/button";
import { Page, Surface } from "@/components/app/primitives";
import { useBlossom } from "@/lib/blossom/store";
import { computeInfluenceFromState } from "@/lib/blossom/influence";

export const Route = createFileRoute("/_app/osez/pulse")({
  component: PulsePage,
});

function PulsePage() {
  const m = useMessages();
  const completePulse = useBlossom((s) => s.completePulse);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const missionSessions = useBlossom((s) => s.missionSessions);
  const languageId = useBlossom((s) => s.languageId);
  const influence = computeInfluenceFromState({
    log,
    attempts,
    growthEvents,
    phonemeLeaves,
    missionSessions,
    languageId,
  });
  const dare = influence.pulse.dareOverride;
  const [phase, setPhase] = useState<"ready" | "recording" | "done">("ready");
  const [elapsed, setElapsed] = useState(0);
  const [offline, setOffline] = useState(false);
  const timer = useRef<number | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  function start() {
    setPhase("recording");
    setElapsed(0);
    startedAt.current = Date.now();
    timer.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
  }

  function finish() {
    if (timer.current) window.clearInterval(timer.current);
    const seconds = Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000));
    setElapsed(seconds);
    setPhase("done");
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    setOffline(isOffline);
    completePulse(dare?.id ?? "pulse-local", seconds, isOffline);
  }

  return (
    <Page className="kosez-feature-page max-w-lg">
      <div className="mb-4">
        <Link to="/osez" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
          <ArrowLeft className="size-3.5" />
          OSEZ
        </Link>
      </div>

      <Surface className="!p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">Pulse</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          {dare?.line ?? "Une phrase, maintenant."}
        </h1>
        {influence.pulse.reasons?.length ? (
          <ul className="mt-3 space-y-1">
            {influence.pulse.reasons.map((r) => (
              <li key={r.code} className="text-xs text-muted">
                {r.line}
              </li>
            ))}
          </ul>
        ) : null}

        {phase === "ready" ? (
          <div className="mt-8">
            <Button className="w-full" onClick={start}>
              Commencer
            </Button>
          </div>
        ) : null}

        {phase === "recording" ? (
          <div className="mt-8 space-y-4">
            <p className="font-display text-4xl tabular-nums text-primary">{elapsed}s</p>
            <Button className="w-full" variant="secondary" onClick={finish}>
              Terminer
            </Button>
          </div>
        ) : null}

        {phase === "done" ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-5" />
              <span className="font-medium">
                {offline
                  ? "Enregistré hors connexion — sera synchronisé."
                  : `Environ ${elapsed}s de courage. La terre s'en souvient.`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="flex-1">
                <Link to="/">{m.errors.backToBlossom}</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/osez">OSEZ</Link>
              </Button>
            </div>
            <GrowthCeremony activity="PULSE_COMPLETED" />
          </div>
        ) : null}
      </Surface>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-subtle">
        <MapPin className="size-3.5" />
        Un geste réel, même court, compte.
      </p>
    </Page>
  );
}
