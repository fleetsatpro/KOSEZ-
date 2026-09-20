import type { Mission } from "./data";
import type { LearnerMemory } from "./engine";

export type MissionMode = "real-world" | "practice";
export type MissionAttemptKind = "warmup" | "mission";
export type MissionCapture = "microphone" | "manual";

export type MissionAttempt = {
  id: string;
  kind: MissionAttemptKind;
  capture: MissionCapture;
  startedAt: string;
  endedAt: string;
  seconds: number;
};

export type MissionReflection = {
  objectiveAchieved: boolean;
  stayedInTargetLanguage: "yes" | "partly" | "no";
  confidence: 1 | 2 | 3 | 4 | 5;
  friction: "hesitation" | "vocabulary" | "switching" | "confidence" | "none";
  note?: string;
};

export type MissionRun = {
  id: string;
  mode: MissionMode;
  startedAt: string;
  lastUpdatedAt: string;
  attempts: MissionAttempt[];
  reflection: MissionReflection | null;
  completedAt: string | null;
};

export type MissionSession = {
  missionId: string;
  runs: MissionRun[];
  activeRunId: string | null;
};

export type MissionOutcome =
  | "advance"
  | "stabilise"
  | "repeat";

export type MissionEvaluation = {
  outcome: MissionOutcome;
  evidenceCount: number;
  evidenceTotal: 3;
  summary: string;
  nextAction: string;
};

export function createMissionSession(missionId: string): MissionSession {
  return {
    missionId,
    runs: [],
    activeRunId: null,
  };
}

export function activeMissionRun(
  session: MissionSession | undefined,
): MissionRun | null {
  if (!session?.activeRunId) return null;
  return session.runs.find((run) => run.id === session.activeRunId) ?? null;
}

export function beginMissionRun(
  session: MissionSession,
  mode: MissionMode,
  now = new Date().toISOString(),
  runId = "run-" + Date.now(),
): MissionSession {
  const current = activeMissionRun(session);
  if (current && !current.completedAt) return session;

  const run: MissionRun = {
    id: runId,
    mode,
    startedAt: now,
    lastUpdatedAt: now,
    attempts: [],
    reflection: null,
    completedAt: null,
  };

  return {
    ...session,
    runs: [...session.runs, run],
    activeRunId: run.id,
  };
}

export function appendMissionAttempt(
  session: MissionSession,
  input: {
    kind: MissionAttemptKind;
    capture: MissionCapture;
    seconds: number;
  },
  now = new Date().toISOString(),
  attemptId = "attempt-" + Date.now(),
): MissionSession {
  const run = activeMissionRun(session);
  if (!run || run.completedAt) return session;
  if (input.kind === "mission" && missionAttemptCount(run, "mission") >= 2) return session;

  const endedAt = now;
  const startedAt = new Date(
    Math.max(
      0,
      new Date(endedAt).getTime() - Math.max(0, input.seconds) * 1000,
    ),
  ).toISOString();

  const safeSeconds = Number.isFinite(input.seconds)
    ? Math.max(0, Math.round(input.seconds))
    : 0;

  const attempt: MissionAttempt = {
    id: attemptId,
    kind: input.kind,
    capture: input.capture,
    startedAt,
    endedAt,
    seconds: safeSeconds,
  };

  return updateRun(session, run.id, (current) => ({
    ...current,
    attempts: [...current.attempts, attempt],
    lastUpdatedAt: now,
  }));
}

export function saveMissionReflection(
  session: MissionSession,
  reflection: MissionReflection,
  now = new Date().toISOString(),
): MissionSession {
  const run = activeMissionRun(session);
  if (!run || run.completedAt) return session;
  if (missionAttemptCount(run, "mission") < 1) return session;

  return updateRun(session, run.id, (current) => ({
    ...current,
    reflection,
    lastUpdatedAt: now,
  }));
}

export function finishMissionRun(
  session: MissionSession,
  now = new Date().toISOString(),
): MissionSession {
  const run = activeMissionRun(session);
  if (!run || run.completedAt || !run.reflection) return session;
  if (missionAttemptCount(run, "mission") < 1) return session;
  
  return updateRun(session, run.id, (current) => ({
    ...current,
    completedAt: now,
    lastUpdatedAt: now,
  }));
}

export function missionAttemptCount(
  run: MissionRun | null,
  kind: MissionAttemptKind,
): number {
  return run?.attempts.filter((attempt) => attempt.kind === kind).length ?? 0;
}

export function missionExecutionReady(run: MissionRun | null): boolean {
  if (!run || run.completedAt) return false;
  return missionAttemptCount(run, "mission") < 2;
}

export function evaluateMission(
  reflection: MissionReflection,
): MissionEvaluation {
  const objective = reflection.objectiveAchieved ? 1 : 0;
  const language = reflection.stayedInTargetLanguage === "yes" ? 1 : 0;
  const confidence = reflection.confidence >= 4 ? 1 : 0;
  const evidenceCount = objective + language + confidence;

  if (objective && language && confidence) {
    return {
      outcome: "advance",
      evidenceCount,
      evidenceTotal: 3,
      summary: "L'objectif est tenu et vous avez gardé la langue cible avec suffisamment d'aisance.",
      nextAction: "Passez à une variante légèrement plus exigeante la prochaine fois.",
    };
  }

  if (objective) {
    return {
      outcome: "stabilise",
      evidenceCount,
      evidenceTotal: 3,
      summary: "La mission est faite. Il reste surtout à rendre le geste plus stable.",
      nextAction: "Refaites le même geste une fois, dans une scène différente, sans ajouter de complexité.",
    };
  }

  return {
    outcome: "repeat",
    evidenceCount,
    evidenceTotal: 3,
    summary: "Le geste cible mérite encore un passage, sans changer d'objectif.",
    nextAction: "Gardez la même mission et réduisez l'effort : utilisez la phrase d'appui, puis recommencez.",
  };
}

export function missionObjective(
  mission: Mission,
  memory: LearnerMemory,
  memoryEnabled: boolean,
) {
  return {
    title: mission.title,
    prompt: mission.prompt,
    situation: mission.context,
    successSignals: [
      "Vous ouvrez réellement la conversation.",
      "Vous utilisez au moins une fois la phrase travaillée.",
      "Vous restez dans la langue cible pendant l'échange.",
    ],
    supportPhrase: "What do you recommend?",
    support: memoryEnabled
      ? "Léo garde votre point de friction en arrière-plan ; vous ne devez pas le résoudre aujourd'hui."
      : "Une phrase d'appui suffit. Le reste peut être imparfait.",
    stretch: memoryEnabled
      ? "Ajoutez une relance courte après la première réponse."
      : "Ajoutez une relance seulement si la première phrase sort naturellement.",
  };
}

function updateRun(
  session: MissionSession,
  runId: string,
  updater: (run: MissionRun) => MissionRun,
): MissionSession {
  return {
    ...session,
    runs: session.runs.map((run) => (run.id === runId ? updater(run) : run)),
  };
}
