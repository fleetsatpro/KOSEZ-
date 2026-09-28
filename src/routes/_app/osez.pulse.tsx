import { useMessages } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import { Button } from "@/components/ui/button";
import { Page, Surface } from "@/components/app/primitives";
import { useBlossom } from "@/lib/blossom/store";
import { influenceFromState, type InfluenceReason } from "@/lib/blossom/influence";
import { LEARNER_MEMORY, planAllows, setsForLanguage } from "@/lib/blossom/data";
import { LearningSurfaceAvailability } from "@/components/app/learning-surface-availability";
import { canUseLearningSurface } from "@/lib/i18n/locales";
import {
  endPulseSessionOnServer,
  startPulseSessionOnServer,
} from "@/lib/blossom/domain.api";

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
  const plan = useBlossom((s) => s.plan);
  if (!canUseLearningSurface(languageId, "pulse")) {
    return <LearningSurfaceAvailability languageId={languageId} surface="pulse" />;
  }
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const memoryOn = planAllows(plan, "memory");

  const influence = useMemo(
    () =>
      influenceFromState({
        activityLog: log,
        pronlabAttempts: attempts,
        growthEvents,
        phonemeLeaves,
        missionSessions,
        allItems: setsForLanguage(languageId).flatMap((s) => s.items),
        memory: LEARNER_MEMORY,
        memoryOn,
        languageId,
      }),
    [log, attempts, growthEvents, phonemeLeaves, missionSessions, languageId, memoryOn],
  );

  const dare = influence.pulse.dareOverride;
  const [phase, setPhase] = useState<"ready" | "recording" | "done">("ready");
  const [elapsed, setElapsed] = useState(0);
  const [offline, setOffline] = useState(false);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [serverSessionId, setServerSessionId] = useState<string | null>(null);
  const [serverTimerAvailable, setServerTimerAvailable] = useState(true);
  const timer = useRef<number | null>(null);
  const startedAt = useRef<number>(0);
  const mountedRef = useRef(true);
  const serverSessionRef = useRef<string | null>(null);
  const completedServerSessionRef = useRef(false);
  const mineralsBefore = useRef(minerals);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timer.current) window.clearInterval(timer.current);
      const sessionId = serverSessionRef.current;
      if (sessionId && !completedServerSessionRef.current) {
        void endPulseSessionOnServer({
          data: { sessionId, status: "cancelled" },
        }).catch(() => undefined);
      }
    };
  }, []);

  async function start() {
    if (closing) return;
    setCloseError(null);
    setClosing(true);
    let sessionId: string | null = null;
    try {
      const session = await startPulseSessionOnServer({
        data: { dareId: dare?.id ?? "pulse-local" },
      });
      sessionId = session.id;
      serverSessionRef.current = session.id;
      completedServerSessionRef.current = false;
      if (!mountedRef.current) {
        void endPulseSessionOnServer({
          data: { sessionId: session.id, status: "cancelled" },
        }).catch(() => undefined);
        return;
      }
      setServerSessionId(session.id);
      setServerTimerAvailable(true);
    } catch {
      setServerSessionId(null);
      setServerTimerAvailable(false);
    }
    mineralsBefore.current = minerals;
    setClosing(false);
    setPhase("recording");
    setElapsed(0);
    startedAt.current = Date.now();
    if (!sessionId) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      setOffline(isOffline);
    }
    // The local clock is display-only. It keeps the exercise usable during a
    // transient outage, but only a server session can produce reward-bearing time.
    timer.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
  }

  async function finish() {
    if (closing) return;
    setClosing(true);
    let authoritativeSeconds: number | null = null;
    if (serverSessionId) {
      try {
        const closure = await endPulseSessionOnServer({
          data: { sessionId: serverSessionId, status: "completed" },
        });
        authoritativeSeconds = closure.durationSeconds;
        completedServerSessionRef.current = true;
        serverSessionRef.current = null;
      } catch {
        setCloseError("La validation serveur a échoué. Votre session reste ouverte : réessayez la clôture.");
        setClosing(false);
        return;
      }
    }
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    setOffline(isOffline);
    const localSeconds = Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000));
    setElapsed(authoritativeSeconds ?? localSeconds);
    setPhase("done");
    if (authoritativeSeconds !== null) {
      completePulse(`pulse-session-${serverSessionId}`, authoritativeSeconds, false);
    }
    setClosing(false);
    setCeremonyOpen(true);
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
            {influence.pulse.reasons.map((r: InfluenceReason) => (
              <li key={r.code} className="text-xs text-muted">
                {r.line}
              </li>
            ))}
          </ul>
        ) : null}

        {phase === "ready" ? (
          <div className="mt-8">
            <Button className="w-full" disabled={closing} onClick={() => void start()}>
              {closing ? "Ouverture…" : "Commencer"}
            </Button>
          </div>
        ) : null}

        {phase === "recording" ? (
          <div className="mt-8 space-y-4">
            <p className="font-display text-4xl tabular-nums text-primary">{elapsed}s</p>
            <p className="text-xs text-muted">
              {serverTimerAvailable
                ? "Temps certifié par le serveur."
                : "Temps affiché localement ; aucune durée ne sera créditée sans validation serveur."}
            </p>
            {closeError ? <p className="text-xs leading-5 text-destructive">{closeError}</p> : null}
            <Button className="w-full" variant="secondary" disabled={closing} onClick={() => void finish()}>
              {closing ? "Clôture…" : closeError ? "Réessayer la clôture" : "Terminer"}
            </Button>
          </div>
        ) : null}

        {phase === "done" ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-5" />
              <span className="font-medium">
                {!serverTimerAvailable
                  ? "Pratique enregistrée sans durée certifiée. Aucun crédit de temps n’a été attribué."
                  : offline
                    ? "Session serveur terminée ; la connexion locale était indisponible après la mesure."
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
          </div>
        ) : null}
      </Surface>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-subtle">
        <MapPin className="size-3.5" />
        Un geste réel, même court, compte.
      </p>

      <GrowthCeremony
        open={ceremonyOpen}
        event={growthEvents[0] ?? null}
        minerals={minerals}
        previousMinerals={mineralsBefore.current}
        onDismiss={() => setCeremonyOpen(false)}
      />
    </Page>
  );
}
