import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RefreshCw, X } from "lucide-react";
import { AmbientParticles } from "@/components/app/ambient-particles";
import { GrowthCeremony } from "@/components/app/growth-ceremony";
import { RecordControl, Waveform } from "@/components/app/record-control";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNER_MEMORY, planAllows, setsForLanguage } from "@/lib/blossom/data";
import { influenceFromState } from "@/lib/blossom/influence";
import type { LivingRoom } from "@/lib/blossom/speak-engine";
import { reshuffleRoom } from "@/lib/blossom/speak-engine";
import { buildSpeakRoom } from "@/lib/blossom/speak-llm";
import { transcribeSpeakTurn } from "@/lib/blossom/speech.api";
import {
  appendSpeechTurn,
  blobToBase64,
  captureOnlyEvidence,
  emptySpeechSummary,
  weaveSpeechIntoDebrief,
  type SessionSpeechSummary,
} from "@/lib/blossom/speech-stt";
import { useBlossom } from "@/lib/blossom/store";
import {
  endSpeakSessionOnServer,
  startSpeakSessionOnServer,
} from "@/lib/blossom/speak-session.api";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  clearCurriculumLessonContext,
  readCurriculumLessonContext,
} from "@/lib/blossom/curriculum-context";

export const Route = createFileRoute("/_app/osez/$id")({
  component: SpeakRoom,
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
  const influenceReasons = useMemo(
    () =>
      influence.speak.reasons
        .filter((r) => r.code !== "balanced")
        .map((r) => r.line),
    [influence.speak.reasons],
  );

  const [room, setRoom] = useState<LivingRoom | null>(null);
  const [source, setSource] = useState<"llm" | "swarm">("swarm");
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [waitingYou, setWaitingYou] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [yourTurns, setYourTurns] = useState(0);
  const [showRescue, setShowRescue] = useState(false);
  const [speechSummary, setSpeechSummary] = useState<SessionSpeechSummary>(() => emptySpeechSummary());
  const [serverSessionId, setServerSessionId] = useState<string | null>(null);
  const [serverAuthorityAvailable, setServerAuthorityAvailable] = useState(true);
  const [practiceOnly, setPracticeOnly] = useState(false);
  const [closing, setClosing] = useState(false);
  const mineralsBefore = useRef(minerals);
  const [curriculumLessonId] = useState<string | null>(() => readCurriculumLessonContext());
  useEffect(() => {
    if (curriculumLessonId) clearCurriculumLessonContext();
  }, [curriculumLessonId]);

  // NOTE: truncated for tool call size - full content will be restored via alternative
  // This is a temporary marker; real full file follows in next call
  return null;
}
