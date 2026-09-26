/**
 * BLOSSOM organism layer — minerals, growth events, courage ribbon, Léo letters.
 * Pure functions over activityLog / pronlabAttempts. Engine remains source of points.
 */

import type { ActivityEvent, ActivityType, PronlabAttempt } from "./engine.ts";
import { summarisePronlabItem } from "./engine.ts";
import type { PronlabItem } from "./data.ts";

export type GrowthKind = "root" | "stem" | "leaf" | "flower" | "mineral";

export type MineralKey = "mission" | "parole" | "pron" | "social" | "atelier";

export type GrowthEvent = {
  id: string;
  at: string;
  kind: GrowthKind;
  sourceId?: string;
  intensity: number;
  label: string;
  mineral?: MineralKey;
};

export type MineralSnapshot = {
  at: string;
  mission: number;
  parole: number;
  pron: number;
  social: number;
  atelier: number;
};

export type PhonemeLeaf = {
  itemId: string;
  phoneme: string;
  label: string;
  unlockedAt: string;
};

export type LeoLetter = {
  id: string;
  week: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const DAY_MS = 86_400_000;
const ROLLING_DAYS = 14;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function inRollingWindow(iso: string, days = ROLLING_DAYS): boolean {
  return iso >= daysAgoIso(days);
}

function countTypes(
  log: ActivityEvent[],
  types: ActivityType[],
  terrainBonus = false,
): number {
  return log.reduce((sum, e) => {
    if (!inRollingWindow(e.createdAt)) return sum;
    if (!types.includes(e.type)) return sum;
    let w = 1;
    if (terrainBonus && e.type === "REAL_WORLD_BONUS") w = 1.25;
    if (terrainBonus && e.type === "MISSION_COMPLETED" && e.note?.includes("terrain"))
      w = 1.15;
    return sum + w;
  }, 0);
}

function norm(raw: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((raw / cap) * 100));
}

export function computeMinerals(log: ActivityEvent[]): MineralSnapshot {
  const mission = norm(
    countTypes(log, ["MISSION_COMPLETED", "REAL_WORLD_BONUS"], true),
    8,
  );
  const parole = norm(
    countTypes(log, ["SPEAK_COMPLETED", "TANDEM_COMPLETED"]),
    6,
  );
  const pron = norm(
    countTypes(log, ["PRONLAB_COMPLETED", "PRONLAB_MASTERY"]),
    8,
  );
  const social = norm(
    countTypes(log, [
      "TANDEM_COMPLETED",
      "CLASS_ATTENDED",
      "EVENT_ATTENDED",
      "IMMERSION_ATTENDED",
    ]),
    5,
  );
  const atelier = norm(
    countTypes(log, [
      "GRAMMAR_COMPLETED",
      "LISTENING_COMPLETED",
      "WRITING_COMPLETED",
      "REVIEW_COMPLETED",
      "LIBRARY_COMPLETED",
      "DIAGNOSTIC_COMPLETED",
      "HOMEWORK_COMPLETED",
    ]),
    10,
  );
  return {
    at: new Date().toISOString(),
    mission,
    parole,
    pron,
    social,
    atelier,
  };
}

export function organismStatusLine(minerals: MineralSnapshot): string {
  const entries: [MineralKey, number][] = [
    ["pron", minerals.pron],
    ["parole", minerals.parole],
    ["mission", minerals.mission],
    ["social", minerals.social],
    ["atelier", minerals.atelier],
  ];
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  if (!lowest || lowest[1] >= 40) {
    if (minerals.mission >= 60 && minerals.parole >= 50) {
      return "Racines profondes cette semaine — la tige peut s'élancer.";
    }
    if (highest && highest[1] >= 70) {
      return `Le ${highest[0]} est fort. Un geste ailleurs équilibre le sol.`;
    }
    return "La terre est stable. Un geste suffit encore.";
  }
  switch (lowest[0]) {
    case "pron":
      return "La canopée attend un son — Pron'Lab, une minute.";
    case "parole":
      return "Soif de parole — une room ou un Pulse suffit.";
    case "mission":
      return "Les racines demandent une scène réelle aujourd'hui.";
    case "social":
      return "Une présence partagée (tandem, café, atelier) nourrirait le sol.";
    case "atelier":
      return "Une preuve d'apprentissage nourrirait encore la canopée.";
    default:
      return "Un geste utile vaut mieux qu'une longue séance.";
  }
}

/** Causal next-gesture hint for plant / home — lowest mineral maps to a door. */
export function causalNextGesture(minerals: MineralSnapshot): {
  mineral: MineralKey;
  door: string;
  line: string;
} {
  const entries: [MineralKey, number][] = [
    ["pron", minerals.pron],
    ["parole", minerals.parole],
    ["mission", minerals.mission],
    ["social", minerals.social],
    ["atelier", minerals.atelier],
  ];
  const lowest = [...entries].sort((a, b) => a[1] - b[1])[0]!;
  switch (lowest[0]) {
    case "pron":
      return {
        mineral: "pron",
        door: "/pronlab",
        line: "Un son répété jusqu'à tenue nourrit la canopée.",
      };
    case "parole":
      return {
        mineral: "parole",
        door: "/osez",
        line: "Une prise de parole ancrée épaissit la tige.",
      };
    case "mission":
      return {
        mineral: "mission",
        door: "/mission",
        line: "Un geste terrain enfonce une racine.",
      };
    case "social":
      return {
        mineral: "social",
        door: "/tandem",
        line: "Une présence partagée fait fleurir le sol.",
      };
    case "atelier":
      return {
        mineral: "atelier",
        door: "/learn/labs",
        line: "Une preuve d'apprentissage nourrit la canopée.",
      };
  }
}

/** Causal labels — each activity writes a specific mark on the organism. */
const ROOT_LABELS = [
  "Un geste. Une racine.",
  "Le sol s'ouvre sous vos pieds.",
  "Une scène réelle s'ancre.",
] as const;
const STEM_LABELS = [
  "La tige s'épaissit.",
  "La parole tient un peu plus longtemps.",
  "Un échange laisse une marque.",
] as const;
const LEAF_LABELS = [
  "Une feuille s'ouvre.",
  "Un son se détache du bruit.",
  "La canopée gagne une nervure.",
] as const;
const FLOWER_LABELS = [
  "Une présence partagée fleurit.",
  "Quelque chose s'ouvre — sans forçage.",
  "Le sol accueille une rencontre.",
  "Une lecture s'épanouit en geste.",
] as const;
const MINERAL_LABELS = [
  "Le sol se souvient.",
  "Un nutriment entre dans la terre.",
  "La terre retient le geste.",
] as const;

function pickLabel(pool: readonly string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length]!;
}

export function growthEventForActivity(
  type: ActivityType,
  sourceId: string | undefined,
  at: string,
): GrowthEvent | null {
  const id = `ge-${type}-${sourceId ?? "x"}-${at}`;
  const seed = `${type}|${sourceId ?? ""}|${at.slice(0, 13)}`;
  switch (type) {
    case "MISSION_COMPLETED":
    case "REAL_WORLD_BONUS":
      return {
        id, at, kind: "root", sourceId,
        intensity: type === "REAL_WORLD_BONUS" ? 0.92 : 0.72,
        label: pickLabel(ROOT_LABELS, seed),
        mineral: "mission",
      };
    case "SPEAK_COMPLETED":
      return {
        id, at, kind: "stem", sourceId, intensity: 0.66,
        label: pickLabel(STEM_LABELS, seed), mineral: "parole",
      };
    case "TANDEM_COMPLETED":
      return {
        id, at, kind: "flower", sourceId, intensity: 0.84,
        label: "Une présence partagée fleurit.", mineral: "social",
      };
    case "PRONLAB_MASTERY":
      return {
        id, at, kind: "leaf", sourceId, intensity: 0.88,
        label: pickLabel(LEAF_LABELS, seed), mineral: "pron",
      };
    case "PRONLAB_COMPLETED":
      return {
        id, at, kind: "mineral", sourceId, intensity: 0.42,
        label: "Le sol retient un son.", mineral: "pron",
      };
    case "GRAMMAR_COMPLETED":
      return {
        id, at, kind: "leaf", sourceId, intensity: 0.58,
        label: "Une structure tient mieux.", mineral: "atelier",
      };
    case "LISTENING_COMPLETED":
      return {
        id, at, kind: "leaf", sourceId, intensity: 0.58,
        label: "Une oreille capte mieux l'essentiel.", mineral: "atelier",
      };
    case "WRITING_COMPLETED":
      return {
        id, at, kind: "leaf", sourceId, intensity: 0.62,
        label: "Une pensée devient une trace.", mineral: "atelier",
      };
    case "REVIEW_COMPLETED":
      return {
        id, at, kind: "leaf", sourceId, intensity: 0.5,
        label: "Une trace revient en circulation.", mineral: "atelier",
      };
    case "CURRICULUM_EVIDENCE_RECORDED":
      // Curriculum evidence links the learning act to an objective; it is not
      // a second learner gesture and therefore must not create duplicate growth.
      return null;
    case "LIBRARY_COMPLETED":
      return {
        id, at, kind: "flower", sourceId, intensity: 0.62,
        label: pickLabel(FLOWER_LABELS, seed), mineral: "atelier",
      };
    case "HOMEWORK_COMPLETED":
      return {
        id, at, kind: "leaf", sourceId, intensity: 0.5,
        label: "Une trace écrite rejoint l'atelier.", mineral: "atelier",
      };
    case "LESSON_COMPLETED":
      return {
        id, at, kind: "mineral", sourceId, intensity: 0.28,
        label: "Une pratique prend racine.", mineral: "atelier",
      };
    case "DIAGNOSTIC_COMPLETED":
      return {
        id, at, kind: "mineral", sourceId, intensity: 0.24,
        label: "Le repère affine le prochain terrain.", mineral: "atelier",
      };
    case "CLASS_ATTENDED":
    case "EVENT_ATTENDED":
    case "IMMERSION_ATTENDED":
      return {
        id, at, kind: "flower", sourceId, intensity: 0.74,
        label: pickLabel(FLOWER_LABELS, seed), mineral: "social",
      };
    default:
      return {
        id, at, kind: "mineral", sourceId, intensity: 0.35,
        label: "La terre s'en souvient.",
      };
  }
}

