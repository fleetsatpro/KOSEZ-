export type StageId =
  | "seed"
  | "growing"
  | "flourishing"
  | "blossoming"
  | "independent";

export type ActivityType =
  | "MISSION_COMPLETED"
  | "SPEAK_COMPLETED"
  | "PRONLAB_COMPLETED"
  | "PRONLAB_MASTERY"
  | "CLASS_ATTENDED"
  | "EVENT_ATTENDED"
  | "REAL_WORLD_BONUS"
  | "TANDEM_COMPLETED"
  | "HOMEWORK_COMPLETED"
  | "IMMERSION_ATTENDED"
  | "REVIEW_COMPLETED"
  | "GRAMMAR_COMPLETED"
  | "LISTENING_COMPLETED"
  | "WRITING_COMPLETED"
  | "DIAGNOSTIC_COMPLETED"
  | "LESSON_COMPLETED"
  | "CURRICULUM_EVIDENCE_RECORDED";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  createdAt: string;
  sourceId?: string;
  note?: string;
};

export const POINTS: Record<ActivityType, number> = {
  MISSION_COMPLETED: 4,
  SPEAK_COMPLETED: 10,
  PRONLAB_COMPLETED: 8,
  PRONLAB_MASTERY: 6,
  CLASS_ATTENDED: 12,
  EVENT_ATTENDED: 6,
  REAL_WORLD_BONUS: 4,
  TANDEM_COMPLETED: 10,
  HOMEWORK_COMPLETED: 4,
  IMMERSION_ATTENDED: 12,
  REVIEW_COMPLETED: 3,
  GRAMMAR_COMPLETED: 4,
  LISTENING_COMPLETED: 4,
  WRITING_COMPLETED: 4,
  DIAGNOSTIC_COMPLETED: 0,
  // Curriculum acknowledgement is intentionally lightweight: it records
  // practice without pretending that self-report is performance assessment.
  LESSON_COMPLETED: 0,
  CURRICULUM_EVIDENCE_RECORDED: 0,
};

export const STAGES: ReadonlyArray<{
  id: StageId;
  label: string;
  minPoints: number;
  nextAt: number | null;
  verb: string;
}> = [
  { id: "seed", label: "Graine", minPoints: 0, nextAt: 16, verb: "Germer" },
  {
    id: "growing",
    label: "En croissance",
    minPoints: 16,
    nextAt: 60,
    verb: "Grandir",
  },
  {
    id: "flourishing",
    label: "Épanoui",
    minPoints: 60,
    nextAt: 100,
    verb: "S'épanouir",
  },
  {
    id: "blossoming",
    label: "En fleurs",
    minPoints: 100,
    nextAt: 150,
    verb: "Fleurir",
  },
  {
    id: "independent",
    label: "Indépendant",
    minPoints: 150,
    nextAt: null,
    verb: "Rayonner",
  },
];

export const STAGE_REQUIREMENTS: Record<
  StageId,
  { missions: number; speak: number; pronlab: number }
> = {
  seed: { missions: 2, speak: 0, pronlab: 0 },
  growing: { missions: 8, speak: 2, pronlab: 1 },
  flourishing: { missions: 16, speak: 4, pronlab: 3 },
  blossoming: { missions: 24, speak: 8, pronlab: 6 },
  independent: { missions: 24, speak: 8, pronlab: 6 },
};

export function pointsFromLog(log: ActivityEvent[]): number {
  return log.reduce((sum, event) => sum + POINTS[event.type], 0);
}

export function stageFromPoints(points: number) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (points >= stage.minPoints) current = stage;
  }
  return current;
}

export function countByType(log: ActivityEvent[], type: ActivityType): number {
  return log.filter((event) => event.type === type).length;
}

export function hasSource(log: ActivityEvent[], sourceId: string): boolean {
  return log.some((event) => event.sourceId === sourceId);
}

export function journeySnapshot(log: ActivityEvent[]) {
  const points = pointsFromLog(log);
  const stage = stageFromPoints(points);
  const missions = countByType(log, "MISSION_COMPLETED");
  const speak = countByType(log, "SPEAK_COMPLETED");
  const pronlab = countByType(log, "PRONLAB_COMPLETED");
  const required = STAGE_REQUIREMENTS[stage.id];
  const remaining = stage.nextAt === null ? 0 : Math.max(0, stage.nextAt - points);
  const span =
    stage.nextAt === null ? 1 : Math.max(1, stage.nextAt - stage.minPoints);
  const intoStage = Math.min(span, Math.max(0, points - stage.minPoints));

  return {
    points,
    stage,
    remaining,
    progress: intoStage / span,
    missions: { current: missions, required: required.missions },
    speak: { current: speak, required: required.speak },
    pronlab: { current: pronlab, required: required.pronlab },
  };
}

export function nextStage(stageId: StageId) {
  const index = STAGES.findIndex((stage) => stage.id === stageId);
  return STAGES[index + 1] ?? null;
}

export type PronlabAttempt = {
  id: string;
  itemId: string;
  score: number;
  tip: string;
  createdAt: string;
  seconds: number;
  metadata?: Record<string, unknown>;
};

export type PronlabSummary = {
  itemId: string;
  attemptCount: number;
  bestScore: number;
  lastScore: number;
  scores: number[];
  mastered: boolean;
  struggling: boolean;
};

export function summarisePronlabItem(
  itemId: string,
  attempts: PronlabAttempt[],
): PronlabSummary {
  const mine = attempts.filter((a) => a.itemId === itemId);
  const scored = mine.filter((attempt) => attempt.metadata?.assessment !== "capture-only");
  const scores = scored.map((a) => a.score);
  const lastThree = scores.slice(-3);
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const lastScore = scores.length ? scores[scores.length - 1]! : 0;
  const mastered =
    bestScore >= 90 ||
    (lastThree.length >= 3 && lastThree.every((s) => s >= 75));
  const struggling = scored.length >= 2 && bestScore < 60;
  return {
    itemId,
    attemptCount: mine.length,
    bestScore,
    lastScore,
    scores,
    mastered,
    struggling,
  };
}

export function pronlabFlags(attempts: PronlabAttempt[], itemIds: string[]) {
  return itemIds
    .map((id) => summarisePronlabItem(id, attempts))
    .filter((s) => s.struggling)
    .sort((a, b) => a.bestScore - b.bestScore);
}

export type TandemPartner = {
  id: string;
  name: string;
  city: string;
  speaks: string;
  speaksLevel: string;
  wants: string;
  wantsLevel: string;
  interests: string[];
  window: string;
  goal: string;
  initials: string;
  avatar: string | null;
};

export function tandemMatchScore(
  me: {
    speaks: string;
    wants: string;
    level: string;
    interests: string[];
    window: string;
  },
  partner: TandemPartner,
): number {
  let score = 0;
  const langFit =
    partner.speaks.toLowerCase().startsWith(me.wants.toLowerCase().slice(0, 3)) &&
    partner.wants.toLowerCase().startsWith(me.speaks.toLowerCase().slice(0, 3));
  if (langFit) score += 40;
  const bands = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const myBand = bands.indexOf(me.level);
  const theirBand = bands.indexOf(partner.wantsLevel);
  const delta = Math.abs(myBand - theirBand);
  if (delta <= 1) score += 25;
  else if (delta === 2) score += 10;
  const shared = me.interests.filter((i) =>
    partner.interests.some((p) => p.toLowerCase() === i.toLowerCase()),
  ).length;
  score += Math.min(25, shared * 10);
  if (partner.window.includes(me.window.slice(0, 2))) score += 10;
  return score;
}

export type LearnerMemory = {
  hesitation: string;
  avoided: string;
  confidence: string;
  leoNote: string;
};

export function resolveMemory(
  attempts: PronlabAttempt[],
  base: LearnerMemory,
): LearnerMemory {
  const scored = attempts.filter(
    (attempt) => attempt.metadata?.assessment === "phonetic-provider",
  );
  if (!scored.length) return base;

  const bestByItem = new Map<string, number>();
  for (const attempt of scored) {
    bestByItem.set(
      attempt.itemId,
      Math.max(bestByItem.get(attempt.itemId) ?? 0, attempt.score),
    );
  }

  const weakest = [...bestByItem.entries()].sort((a, b) => a[1] - b[1])[0];
  const strongest = [...bestByItem.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!weakest || !strongest) return base;

  return {
    hesitation: `Le point « ${weakest[0]} »`,
    avoided: weakest[1] < 60 ? "à reprendre à voix haute" : "encore en consolidation",
    confidence: `Le point « ${strongest[0]} »` ,
    leoNote: weakest[1] < 75
      ? `Votre dernière observation sur « ${weakest[0]} » montre encore un point à consolider. Léo propose une reprise courte.`
      : `Les observations récentes sont plutôt solides ; continuez par une situation réelle.`,
  };
}
export function personaliseMission(
  base: { title: string; prompt: string; context: string },
  memory: LearnerMemory,
  enabled: boolean,
): { title: string; prompt: string; context: string; leo: string | null } {
  if (!enabled) return { ...base, leo: null };

  const hasConcreteMemory = !memory.hesitation.startsWith("Aucun");
  return {
    ...base,
    context: hasConcreteMemory
      ? `${base.context} Repère actuel : ${memory.hesitation}.`
      : base.context,
    leo: memory.leoNote,
  };
}
export function cafeMemoryHint(
  turnHint: string,
  _speaker: "ai" | "you",
  _enabled: boolean,
): string {
  return turnHint;
}
