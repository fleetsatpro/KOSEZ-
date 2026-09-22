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
  | "WRITING_COMPLETED";

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
  const scores = mine.map((a) => a.score);
  const lastThree = scores.slice(-3);
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const lastScore = scores.length ? scores[scores.length - 1]! : 0;
  const mastered =
    bestScore >= 90 ||
    (lastThree.length >= 3 && lastThree.every((s) => s >= 75));
  const struggling = mine.length >= 2 && bestScore < 60;
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

const SCORE_CURVE = [48, 57, 66, 74, 81, 87, 91, 94];

export function scoreAttempt(
  itemId: string,
  priorCount: number,
  seconds: number,
): number {
  const i = Math.min(priorCount, SCORE_CURVE.length - 1);
  const base = SCORE_CURVE[i] ?? 48;
  const duration = seconds >= 1 ? 3 : -4;
  const jitter = (itemId.charCodeAt(itemId.length - 1) % 5) - 2;
  return Math.max(32, Math.min(97, base + duration + jitter));
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

const TH_ITEMS = ["th-1", "th-2", "th-3", "th-4"];

export function resolveMemory(
  attempts: PronlabAttempt[],
  base: LearnerMemory,
): LearnerMemory {
  const mastered = TH_ITEMS.filter(
    (id) => summarisePronlabItem(id, attempts).mastered,
  ).length;
  if (mastered >= 3) {
    return {
      hesitation: "I'll have — en cours d'ancrage",
      avoided: "I want (en recul)",
      confidence: "Commander, TH en voie de maîtrise",
      leoNote:
        "Les TH tiennent mieux. Au café, « I'll have » peut devenir le réflexe. On confirme, on n'insiste plus.",
    };
  }
  return base;
}

export function personaliseMission(
  base: { title: string; prompt: string; context: string },
  memory: LearnerMemory,
  enabled: boolean,
): { title: string; prompt: string; context: string; leo: string | null } {
  if (!enabled) {
    return { ...base, leo: null };
  }
  return {
    title: "I'll have what you recommend",
    prompt:
      "Au déjeuner, ouvrez par « What do you recommend? » puis commandez avec « I'll have… » — pas « I want ». Aujourd'hui, contournez les TH : Pron'Lab s'en charge.",
    context: `Vous hésitez encore sur ${memory.hesitation}. Cette mission ancre la structure évitée, là où vous êtes déjà à l'aise : ${memory.confidence}.`,
    leo: memory.leoNote,
  };
}

export function cafeMemoryHint(
  turnHint: string,
  speaker: "ai" | "you",
  enabled: boolean,
): string {
  if (!enabled || speaker !== "you") return turnHint;
  if (turnHint.toLowerCase().includes("commande")) {
    return "Commandez avec « I'll have », pas « I want ».";
  }
  return turnHint;
}
