import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw, X } from "lucide-react";
import { AmbientParticles } from "@/components/app/ambient-particles";
import { LearningSurfaceGate } from "@/components/app/learning-surface-gate";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import { RecordControl, Waveform } from "@/components/app/record-control";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNER_MEMORY, planAllows, setsForLanguage } from "@/lib/blossom/data";
import { endSpeakSessionOnServer, recordSpeakTurnOnServer, startSpeakSessionOnServer } from "@/lib/blossom/domain.api";
import { influenceFromState } from "@/lib/blossom/influence";
import type { LivingRoom } from "@/lib/blossom/speak-engine";
import { generateRoomCatalog, reshuffleRoom } from "@/lib/blossom/speak-engine";
import { buildSpeakRoom } from "@/lib/blossom/speak-llm";
import {
  appendSpeechTurn,
  resolveSpeechEvidence,
  emptySpeechSummary,
  weaveSpeechIntoDebrief,
  type SessionSpeechSummary,
} from "@/lib/blossom/speech-stt";
import { useBlossom } from "@/lib/blossom/store";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  clearCurriculumLessonContext,
  readCurriculumLessonContext,
} from "@/lib/blossom/curriculum-context";

export const Route = createFileRoute("/_app/osez/$id")({
  component: () => (
    <LearningSurfaceGate surface="osez">
      <SpeakRoom />
    </LearningSurfaceGate>
  ),
});

function SpeakRoom() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const complete = useBlossom((s) => s.completeActivity);
  const plan = useBlossom((s) => s.plan);
  const minerals = useBlossom((s) => s.mineralSnapshot);
  const growthEvents = useBlossom((s) => s.growthEvents);
  const learner = useBlossom((s) => s.learner);
  const languageId = useBlossom((s) => s.languageId);
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const phonemeLeaves = useBlossom((s) => s.phonemeLeaves);
  const missionSessions = useBlossom((s) => s.missionSessions);
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
  const friction = influence.speak.friction ?? (memoryOn ? LEARNER_MEMORY.hesitation : null);
  const kitBoost = influence.speak.kitBoost;
  const pressureHint = influence.speak.pressureHint;
  const influenceReasons = influence.speak.reasons
    .filter((r) => r.code !== "balanced")
    .map((r) => r.line);

  const [room, setRoom] = useState<LivingRoom | null>(null);
  const [source, setSource] = useState<"llm" | "swarm">("swarm");
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [speakSessionId, setSpeakSessionId] = useState<string | null>(null);
  const [turn, setTurn] = useState(0);
  const [waitingYou, setWaitingYou] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [pendingRewardSourceId, setPendingRewardSourceId] = useState<string | null>(null);
  const [yourTurns, setYourTurns] = useState(0);
  const [showRescue, setShowRescue] = useState(false);
  const [speechSummary, setSpeechSummary] = useState<SessionSpeechSummary>(() => emptySpeechSummary());
  const mineralsBefore = useRef(minerals);
  const [curriculumLessonId] = useState<string | null>(() => readCurriculumLessonContext());
  useEffect(() => {
    if (curriculumLessonId) clearCurriculumLessonContext();
  }, [curriculumLessonId]);

  useEffect(() => {
    let cancelled = false;
    async function compose() {
      setLoading(true);
      setStarted(false);
      setStartingSession(false);
      setSpeakSessionId(null);
      setTurn(0);
      setDone(false);
      setElapsed(0);
      setYourTurns(0);
      setShowRescue(false);
      setSpeechSummary(emptySpeechSummary());

      let topic: string | undefined;
      if (id === "topic") {
        try {
          topic = sessionStorage.getItem("kosez-speak-topic") ?? undefined;
        } catch {
          topic = undefined;
        }
      }

      const catalogRoom = id.startsWith("room-")
        ? generateRoomCatalog({
            level: learner.level,
            firstName: learner.firstName,
            friction: friction ?? undefined,
            interests: learner.interests,
            entropy: "hub-daily",
            pressureHint,
            kitBoost,
            influenceReasons,
          }).find((candidate) => candidate.id === id)
        : null;

      if (catalogRoom) {
        if (cancelled) return;
        setRoom(catalogRoom);
        setSource("swarm");
        setLoading(false);
        return;
      }

      const archetype = id === "live" || id === "topic" ? undefined : id;
      const result = await buildSpeakRoom({
        topic: topic ?? "",
        archetype,
        level: learner.level,
        firstName: learner.firstName,
        friction,
        interests: learner.interests,
        entropy: sessionEntropy(id + (topic ?? "")),
        pressureHint,
        kitBoost,
        influenceReasons,
      });

      if (cancelled) return;
      setRoom(result.room);
      setSource(result.source);
      setLoading(false);
    }
    void compose();
    return () => {
      cancelled = true;
    };
  }, [id, learner.level, learner.firstName, learner.interests, friction, pressureHint, kitBoost, influenceReasons]);

  useEffect(() => {
    if (!started || !speakSessionId || done) return;
    return () => {
      void endSpeakSessionOnServer({
        data: { sessionId: speakSessionId, status: "cancelled" },
      }).catch(() => undefined);
    };
  }, [started, speakSessionId, done]);

  useEffect(() => {
    if (!started || done) return;
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [started, done]);

  useEffect(() => {
    if (!started || done || !room) return;
    const current = room.turns[turn];
    if (!current) {
      setDone(true);
      return;
    }
    if (current.speaker === "ai") {
      setWaitingYou(false);
      const t = window.setTimeout(() => setTurn((n) => n + 1), 2200);
      return () => window.clearTimeout(t);
    }
    setWaitingYou(true);
  }, [started, turn, done, room]);

  async function reshuffle() {
    if (!room) return;
    setLoading(true);
    let topic: string | undefined;
    try {
      topic = sessionStorage.getItem("kosez-speak-topic") ?? undefined;
    } catch {
      /* ignore */
    }
    if (id === "topic" && topic) {
      const result = await buildSpeakRoom({
        topic,
        level: learner.level,
        firstName: learner.firstName,
        friction,
        interests: learner.interests,
        entropy: `reshuffle-${Date.now()}`,
        pressureHint,
        kitBoost,
        influenceReasons,
      });
      setRoom(result.room);
      setSource(result.source);
    } else {
      const next = reshuffleRoom(room, {
        level: learner.level,
        firstName: learner.firstName,
        friction,
        interests: learner.interests,
        pressureHint,
        kitBoost,
        influenceReasons,
      });
      setRoom(next);
      setSource("swarm");
    }
    setStarted(false);
    setTurn(0);
    setDone(false);
    setElapsed(0);
    setYourTurns(0);
    setLoading(false);
    toast("Nouvelle composition.");
  }

  async function finish() {
    if (!room || !speakSessionId) {
      navigate({ to: "/osez" });
      return;
    }
    const hasSpeechEvidence =
      speechSummary.spokenSeconds > 0 || speechSummary.transcriptCount > 0;
    if (!hasSpeechEvidence) {
      await endSpeakSessionOnServer({
        data: { sessionId: speakSessionId, status: "cancelled" },
      }).catch(() => undefined);
      navigate({ to: "/osez" });
      return;
    }
    try {
      const ended = await endSpeakSessionOnServer({
        data: { sessionId: speakSessionId, status: "completed" },
      });
      if (ended.evidenceSeconds < 1 || ended.turnCount < 1 || ended.durationSeconds < 1) {
        toast("La séance n’a pas produit de preuve vocale confirmée.");
        return;
      }
      mineralsBefore.current = useBlossom.getState().mineralSnapshot;
      const speakingMinutes = Math.max(1, Math.floor(ended.evidenceSeconds / 60));
      const sourceId = `speak-session-${ended.id}`;
      const result = complete(
        "SPEAK_COMPLETED",
        sourceId,
        undefined,
        {
          minutes: speakingMinutes,
          spokenSeconds: ended.evidenceSeconds,
          durationSeconds: ended.durationSeconds,
          transcriptCount: speechSummary.transcriptCount,
          captureOnlyCount: speechSummary.captureOnlyCount,
        },
      );
      if (!result.ok) {
        toast("La clôture n’a pas été confirmée. La séance reste sans croissance tant que la preuve n’est pas validée.");
        return;
      }
      if (curriculumLessonId) {
        const linked = useBlossom.getState().activityLog.some(
          (event) =>
            event.type === "CURRICULUM_EVIDENCE_RECORDED" &&
            event.sourceId === curriculumLessonId,
        );
        if (!linked) {
          useBlossom.getState().completeActivity(
            "CURRICULUM_EVIDENCE_RECORDED",
            curriculumLessonId,
            `Preuve curriculum · Speak · ${ended.id}`,
            { supportId: sourceId },
          );
        }
      }
      setDone(true);
      if (result.pending) {
        setPendingRewardSourceId(sourceId);
        toast("Session clôturée. La croissance apparaîtra après confirmation serveur.");
      } else {
        const confirmedGrowth = useBlossom.getState().growthEvents.find(
          (growth) => growth.sourceId === sourceId,
        );
        if (confirmedGrowth) setCeremonyOpen(true);
      }
    } catch {
      toast("La séance n’a pas pu être confirmée. Vérifiez votre connexion puis réessayez.");
    }
  }

  useEffect(() => {
    if (!pendingRewardSourceId) return;
    const confirmed = log.some(
      (event) =>
        event.type === "SPEAK_COMPLETED" &&
        event.sourceId === pendingRewardSourceId,
    );
    if (!confirmed) return;
    setPendingRewardSourceId(null);
    const confirmedGrowth = growthEvents.find(
      (growth) => growth.sourceId === pendingRewardSourceId,
    );
    if (confirmedGrowth) setCeremonyOpen(true);
  }, [growthEvents, log, pendingRewardSourceId]);

  if (loading || !room) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-fg px-6 text-primary-foreground">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        <p className="text-sm text-white/60">Composition de la room…</p>
      </div>
    );
  }

  const current = room.turns[turn];
  const totalTurns = room.turns.length;
  const progressPct = Math.min(100, Math.round((turn / Math.max(1, totalTurns)) * 100));
  const debrief = weaveSpeechIntoDebrief(room.debrief, speechSummary);

  if (!started) {
    return (
      <div className="relative min-h-dvh overflow-hidden bg-fg text-primary-foreground">
        <img src={room.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <AmbientParticles
          stageId="growing"
          intensity={0.55}
          className="pointer-events-none absolute inset-0 z-[1] opacity-70"
        />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/80 to-black/45" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-12 pt-10">
          <div className="flex items-center justify-between">
            <Link to="/osez" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
              <ArrowLeft className="size-4" />
              Osez
            </Link>
            <button
              type="button"
              onClick={() => void reshuffle()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm hover:text-white"
            >
              <RefreshCw className="size-3" />
              Recomposer
            </button>
          </div>

          <div className="mt-auto">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow className="text-primary/90">Speak Room · minéral parole</Eyebrow>
              {room.event ? (
                <Badge className="border-primary/30 bg-primary/15 text-primary">{room.event.title}</Badge>
              ) : null}
            </div>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">{room.title}</h1>
            <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">{room.setting}</p>

            <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Interlocuteur</p>
                <p className="mt-1 font-display text-xl text-white">{room.cast.name}</p>
                <p className="mt-0.5 text-xs text-white/55">{room.cast.role} · {room.cast.stance}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Pression</p>
                <p className="mt-1 font-display text-xl text-white">{room.pressure.label}</p>
                <p className="mt-0.5 text-xs text-white/55">{room.pressure.description}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/55">{room.place.sensory}</p>
            {room.event ? (
              <p className="mt-2 text-sm leading-6 text-primary/80">{room.event.atmosphere}</p>
            ) : null}

            <ul className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/65">
              {room.protocol.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/80" />
                  {line}
                </li>
              ))}
              <li className="flex gap-2 text-white/45">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-white/30" />
                ~{room.durationMin} min · {totalTurns} tours · {room.level}
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Kit</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {room.kit.map((k) => (
                  <li
                    key={k.phrase}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
                    title={k.use}
                  >
                    {k.phrase}
                  </li>
                ))}
              </ul>
            </div>

            {room.memoryWhisper ? (
              <p className="mt-4 text-xs leading-5 text-white/40">{room.memoryWhisper}</p>
            ) : null}

            {room.influenceNotes && room.influenceNotes.length > 0 ? (
              <ul
                className="mt-4 space-y-1.5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left"
                aria-label="Pourquoi cette room est composée ainsi"
              >
                <li className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                  Organisme · composition
                </li>
                {room.influenceNotes.map((note) => (
                  <li key={note} className="text-xs leading-5 text-white/70">
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}

            <Button
              className="mt-8 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={startingSession}
              onClick={async () => {
                setStartingSession(true);
                try {
                  const session = await startSpeakSessionOnServer({ data: { roomId: room.id } });
                  setSpeakSessionId(session.id);
                  setStarted(true);
                  track("speak_started", { roomId: room.id, seed: room.seed, source, sessionId: session.id });
                } catch {
                  toast("La séance n’a pas pu être ouverte. Une connexion est nécessaire pour confirmer la preuve vocale.");
                } finally {
                  setStartingSession(false);
                }
              }}
            >
              {startingSession ? "Ouverture de la séance…" : "Entrer dans la room"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-bg px-5 py-10 text-fg">
        <div className="mx-auto max-w-lg">
          <Eyebrow>Bilan privé</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{room.title}</h1>
          <p className="mt-2 text-sm text-muted">
            Scène générée pour votre niveau · Avec {room.cast.name} ·{" "}
            <span className="tabular-nums">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </span>{" "}
            · {yourTurns} réponse{yourTurns > 1 ? "s" : ""} enregistrée{yourTurns > 1 ? "s" : ""}
          </p>

          <div className="mt-8 space-y-3">
            <Surface className="border border-primary/15 bg-primary/5">
              <Eyebrow>Repère de la scène</Eyebrow>
              <p className="mt-2 text-sm leading-7">{debrief.strength}</p>
            </Surface>
            <Surface>
              <Eyebrow>À essayer ensuite</Eyebrow>
              <p className="mt-2 text-sm leading-7">{debrief.improvement}</p>
            </Surface>
            <Surface>
              <Eyebrow>Phrase modèle</Eyebrow>
              <p className="mt-2 font-display text-xl leading-snug tracking-tight">{debrief.model}</p>
            </Surface>
            <Surface className="border border-primary/15 bg-primary/5">
              <Eyebrow>Votre parole</Eyebrow>
              <p className="mt-2 text-sm leading-7">{debrief.speechNote}</p>
            </Surface>
            <Surface>
              <Eyebrow>Contexte</Eyebrow>
              <p className="mt-2 text-sm leading-7 text-muted">{room.culturalNote}</p>
            </Surface>
          </div>

          <p className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-fg">
            {pendingRewardSourceId
              ? "La séance est clôturée. La tige et le minéral parole seront affichés après confirmation serveur."
              : "La clôture confirmée écrit une tige sur BLOSSOM et nourrit le minéral parole."}
          </p>
          <Button
            className="mt-4 h-12 w-full"
            onClick={finish}
            disabled={Boolean(pendingRewardSourceId)}
            {pendingRewardSourceId
              ? "Synchronisation…"
              : speechSummary.spokenSeconds > 0 || speechSummary.transcriptCount > 0
                ? "Clore la session"
                : "Fermer sans croissance"}
          </Button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void reshuffle()}>
              <RefreshCw className="size-3.5" />
              Recomposer
            </Button>
            <Button asChild variant="ghost">
              <Link to="/osez">Autres rooms</Link>
            </Button>
          </div>
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
          <p className="truncate font-display text-lg">{room.cast.name}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/50">
            {room.pressure.label} · tour {Math.min(turn + 1, totalTurns)} / {totalTurns}
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
            waitingYou ? "text-primary-foreground" : "text-primary-foreground/55",
          )}
        >
          {waitingYou ? "À vous" : `${room.cast.name} parle`}
        </p>
        <div className="mt-6">
          <Waveform active={!waitingYou} />
        </div>

        {!waitingYou && current?.line ? (
          <p className="mt-8 max-w-md font-display text-2xl leading-snug tracking-tight sm:text-3xl">
            {current.line}
          </p>
        ) : null}

        {waitingYou && current ? (
          <div className="mt-8 max-w-sm">
            <p className="text-sm leading-7 text-primary-foreground/90">{current.hint}</p>
            {current.stretch ? (
              <p className="mt-2 text-xs leading-5 text-primary-foreground/50">Stretch · {current.stretch}</p>
            ) : null}
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-primary-foreground/40">
              {current.goal}
            </p>
          </div>
        ) : null}

        {showRescue && current?.recovery?.length ? (
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {current.recovery.map((r) => (
              <li
                key={r}
                className="rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/80"
              >
                {r}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="px-6 pb-12">
        {waitingYou ? (
          <div className="space-y-3">
            <RecordControl
              inverted
              cta="Maintenir pour répondre"
              onFinished={async ({ seconds, blob, mimeType }) => {
                const evidence = await resolveSpeechEvidence(
                  { seconds, blob, mimeType },
                  { fileName: `kosez-${room.id}.webm` },
                );
                if (evidence.assessment === "skipped" || evidence.seconds <= 0 || !speakSessionId) {
                  track("speak_turn_skipped", { roomId: room.id });
                  toast("Aucune prise valide. Réessayez cette réponse.");
                  return;
                }
                try {
                  await recordSpeakTurnOnServer({
                    data: { sessionId: speakSessionId, seconds: evidence.seconds },
                  });
                } catch {
                  toast("La prise n’a pas été confirmée. Réessayez pour continuer.");
                  return;
                }
                setSpeechSummary((summary) => appendSpeechTurn(summary, evidence));
                track("speak_turn_evidence", {
                  roomId: room.id,
                  assessment: evidence.assessment,
                  seconds: evidence.seconds,
                  hasTranscript: Boolean(evidence.transcript),
                });
                setYourTurns((n) => n + 1);
                setShowRescue(false);
                setTurn((n) => n + 1);
              }}
            />
            <button
              type="button"
              onClick={() => setShowRescue((v) => !v)}
              className="mx-auto block text-[11px] uppercase tracking-[0.16em] text-primary-foreground/50 hover:text-primary-foreground/80"
            >
              {showRescue ? "Masquer les secours" : "Phrases de secours"}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-primary-foreground/50">Écoutez…</p>
        )}
      </div>
    </div>
  );
}

function sessionEntropy(seed: string) {
  try {
    const k = `kosez-entropy-${seed}`;
    let v = sessionStorage.getItem(k);
    if (!v) {
      v = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(k, v);
    }
    return v;
  } catch {
    return `${Date.now()}`;
  }
}
