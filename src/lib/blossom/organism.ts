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

export const MINERAL_WINDOW_DAYS = 14;

export type MineralDoor = {
  key: MineralKey;
  label: string;
  shortLabel: string;
  door: string;
  action: string;
  plain: string;
  proof: string;
  fallbackDoor?: string;
  fallbackLabel?: string;
};

export const MINERAL_ORDER: readonly MineralKey[] = [
  "mission",
  "parole",
  "social",
  "atelier",
  "pron",
];

export const MINERAL_DOORS: Record<MineralKey, MineralDoor> = {
  mission: { key: "mission", label: "Mission", shortLabel: "Terrain", door: "/mission", action: "Faire une mission", plain: "agir dans une scène réelle", proof: "mission clôturée ou bonus terrain" },
  parole: { key: "parole", label: "Parole", shortLabel: "Parler", door: "/osez", action: "Prendre la parole", plain: "dire quelque chose malgré l’hésitation", proof: "session OSEZ clôturée" },
  pron: { key: "pron", label: "Pron’Lab", shortLabel: "Son", door: "/pronlab", action: "Travailler un son", plain: "répéter jusqu’à plus de tenue", proof: "tentative ou maîtrise Pron’Lab" },
  social: { key: "social", label: "Social", shortLabel: "Lien", door: "/tandem", action: "Rencontrer en tandem", plain: "pratiquer avec d’autres personnes", proof: "tandem, classe, événement ou immersion", fallbackDoor: "/explore", fallbackLabel: "Voir EXPLORE" },
  atelier: { key: "atelier", label: "Atelier", shortLabel: "Apprendre", door: "/learn/labs", action: "Ouvrir les Labs", plain: "transformer l’étude en trace", proof: "grammaire, écoute, écriture, révision, lecture ou devoir" },
};

export type CausalNextGesture = {
  mineral: MineralKey;
  door: string;
  line: string;
  label: string;
  action: string;
  proof: string;
  value: number;
  tied: MineralKey[];
  alternate?: { mineral: MineralKey; door: string; label: string; action: string };
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
const ROLLING_DAYS = MINERAL_WINDOW_DAYS;

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
      "CURRICULUM_EVIDENCE_RECORDED",
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
    ...MINERAL_ORDER.map((key) => [key, minerals[key]] as [MineralKey, number]),
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

/** One transparent causal rule shared by every organism surface. */
export function causalNextGesture(minerals: MineralSnapshot): CausalNextGesture {
  const entries = MINERAL_ORDER.map((key) => [key, minerals[key]] as const);
  const minValue = Math.min(...entries.map(([, value]) => value));
  const tied = entries.filter(([, value]) => value === minValue).map(([key]) => key);
  const selected = tied.length === entries.length ? "mission" : tied[0]!;
  const meta = MINERAL_DOORS[selected];
  const alternateKey = tied.find((key) => key !== selected);
  const alternate = alternateKey
    ? {
        mineral: alternateKey,
        door: MINERAL_DOORS[alternateKey].door,
        label: MINERAL_DOORS[alternateKey].label,
        action: MINERAL_DOORS[alternateKey].action,
      }
    : undefined;

  let line = meta.label + " est le moins nourri à " + minValue + "/100. " +
    meta.action + " : " + meta.plain + ".";
  if (tied.length === entries.length) {
    line = "Tout est encore à égalité. Je commence par une mission : une action concrète donne un premier repère à l’organisme.";
  } else if (tied.length > 1) {
    const others = tied.filter((key) => key !== selected).map((key) => MINERAL_DOORS[key].label).join(" et ");
    line = meta.label + " et " + others + " sont à égalité à " + minValue + "/100. Je vous propose " + meta.action.toLowerCase() + " maintenant.";
  }

  return {
    mineral: selected,
    door: meta.door,
    line,
    label: meta.label,
    action: meta.action,
    proof: meta.proof,
    value: minValue,
    tied,
    alternate,
  };
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
        id,
        at,
        kind: "root",
        sourceId,
        intensity: type === "REAL_WORLD_BONUS" ? 0.92 : 0.72,
        label: pickLabel(ROOT_LABELS, seed),
        mineral: "mission",
      };
    case "SPEAK_COMPLETED":
      return {
        id,
        at,
        kind: "stem",
        sourceId,
        intensity: 0.66,
        label: pickLabel(STEM_LABELS, seed),
        mineral: "parole",
      };
    case "TANDEM_COMPLETED":
      return {
        id,
        at,
        kind: "flower",
        sourceId,
        intensity: 0.84,
        label: "Une présence partagée fleurit.",
        mineral: "social",
      };
    case "PRONLAB_MASTERY":
      return {
        id,
        at,
        kind: "leaf",
        sourceId,
        intensity: 0.88,
        label: pickLabel(LEAF_LABELS, seed),
        mineral: "pron",
      };
    case "PRONLAB_COMPLETED":
      return {
        id,
        at,
        kind: "mineral",
        sourceId,
        intensity: 0.42,
        label: "Le sol retient un son.",
        mineral: "pron",
      };
    case "GRAMMAR_COMPLETED":
      return {
        id,
        at,
        kind: "leaf",
        sourceId,
        intensity: 0.58,
        label: "Une structure tient mieux.",
        mineral: "atelier",
      };
    case "LISTENING_COMPLETED":
      return {
        id,
        at,
        kind: "leaf",
        sourceId,
        intensity: 0.58,
        label: "Une oreille capte mieux l'essentiel.",
        mineral: "atelier",
      };
    case "WRITING_COMPLETED":
      return {
        id,
        at,
        kind: "leaf",
        sourceId,
        intensity: 0.62,
        label: "Une pensée devient une trace.",
        mineral: "atelier",
      };
    case "REVIEW_COMPLETED":
      return {
        id,
        at,
        kind: "leaf",
        sourceId,
        intensity: 0.5,
        label: "Une trace revient en circulation.",
        mineral: "atelier",
      };
    case "CURRICULUM_EVIDENCE_RECORDED":
      return {
        id,
        at,
        kind: "mineral",
        sourceId,
        intensity: 0.45,
        label: "Une preuve de parcours rejoint l’atelier.",
        mineral: "atelier",
      };
    case "LIBRARY_COMPLETED":
      return {
        id,
        at,
        kind: "flower",
        sourceId,
        intensity: 0.62,
        label: pickLabel(FLOWER_LABELS, seed),
        mineral: "atelier",
      };
    case "HOMEWORK_COMPLETED":
      return {
        id,
        at,
        kind: "leaf",
        sourceId,
        intensity: 0.5,
        label: "Une trace écrite rejoint l'atelier.",
        mineral: "atelier",
      };
    case "LESSON_COMPLETED":
      return {
        id,
        at,
        kind: "mineral",
        sourceId,
        intensity: 0.28,
        label: "Une pratique prend racine.",
        mineral: "atelier",
      };
    case "DIAGNOSTIC_COMPLETED":
      return {
        id,
        at,
        kind: "mineral",
        sourceId,
        intensity: 0.24,
        label: "Le repère affine le prochain terrain.",
        mineral: "atelier",
      };
    case "CLASS_ATTENDED":
    case "EVENT_ATTENDED":
    case "IMMERSION_ATTENDED":
      return {
        id,
        at,
        kind: "flower",
        sourceId,
        intensity: 0.74,
        label: pickLabel(FLOWER_LABELS, seed),
        mineral: "social",
      };
    default:
      return {
        id,
        at,
        kind: "mineral",
        sourceId,
        intensity: 0.35,
        label: "La terre s'en souvient.",
      };
  }
}

export function pushGrowthEvent(
  events: GrowthEvent[],
  next: GrowthEvent,
  cap = 30,
): GrowthEvent[] {
  const withoutDup = events.filter((e) => e.id !== next.id);
  return [next, ...withoutDup].slice(0, cap);
}

export function courageDaysFromLog(log: ActivityEvent[]): string[] {
  const speakTypes: ActivityType[] = [
    "SPEAK_COMPLETED",
    "TANDEM_COMPLETED",
    "MISSION_COMPLETED",
  ];
  const set = new Set<string>();
  for (const e of log) {
    if (!speakTypes.includes(e.type)) continue;
    set.add(e.createdAt.slice(0, 10));
  }
  return [...set].sort();
}

export function courageRibbon(days: string[], now = new Date()): boolean[] {
  const set = new Set(days);
  const out: boolean[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(set.has(key));
  }
  return out;
}

export function buildPhonemeLeaves(
  attempts: PronlabAttempt[],
  items: PronlabItem[],
): PhonemeLeaf[] {
  const leaves: PhonemeLeaf[] = [];
  for (const item of items) {
    const summary = summarisePronlabItem(item.id, attempts);
    if (!summary.mastered) continue;
    const unlockedAt =
      attempts
        .filter((a) => a.itemId === item.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .at(-1)?.createdAt ?? new Date().toISOString();
    leaves.push({
      itemId: item.id,
      phoneme: item.focus || item.problemSegment || item.ipa.slice(0, 24),
      label: item.phrase,
      unlockedAt,
    });
  }
  return leaves;
}

export function strugglingFocus(
  attempts: PronlabAttempt[],
  items: PronlabItem[],
): PronlabItem | null {
  let best: { item: PronlabItem; score: number } | null = null;
  for (const item of items) {
    const s = summarisePronlabItem(item.id, attempts);
    if (!s.struggling) continue;
    if (!best || s.bestScore < best.score) {
      best = { item, score: s.bestScore };
    }
  }
  return best?.item ?? null;
}

export function weekKey(d = new Date()): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function composeLeoLetter(
  minerals: MineralSnapshot,
  growth: GrowthEvent[],
  firstName: string,
): LeoLetter {
  const week = weekKey();
  const roots = growth.filter((g) => g.kind === "root").length;
  const leaves = growth.filter((g) => g.kind === "leaf").length;
  const status = organismStatusLine(minerals);
  const body = [
    `${firstName || "Vous"},`,
    "",
    status,
    roots > 0
      ? `Cette semaine, ${roots} racine${roots > 1 ? "s" : ""} a/ont progressé grâce à des gestes ancrés.`
      : `Peu de racines nouvelles — un seul geste terrain suffirait à réveiller le sol.`,
    leaves > 0
      ? `${leaves} feuille${leaves > 1 ? "s" : ""} de son se sont ouvertes dans le Pron'Lab.`
      : `La canopée attend encore un son maîtrisé.`,
    ``,
    `Sans forcer. Un geste utile demain suffit.`,
    ``,
    `— Léo`,
  ]
    .join("\n")
    .replace("a/ont", roots > 1 ? "ont" : "a");

  return {
    id: `leo-${week}`,
    week,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export const PULSE_DARES = [
  {
    id: "pulse-bill",
    line: "Demandez l'addition en une phrase claire.",
    seconds: 90,
  },
  {
    id: "pulse-help",
    line: "Demandez de l'aide pour trouver un lieu.",
    seconds: 90,
  },
  {
    id: "pulse-thanks",
    line: "Remerciez quelqu'un avec une phrase complète.",
    seconds: 90,
  },
  {
    id: "pulse-order",
    line: "Commandez quelque chose sans basculer en français.",
    seconds: 90,
  },
  {
    id: "pulse-time",
    line: "Demandez l'heure ou l'horaire d'un bus, en anglais.",
    seconds: 90,
  },
  {
    id: "pulse-price",
    line: "Demandez le prix de deux produits au marché.",
    seconds: 90,
  },
  {
    id: "pulse-repeat",
    line: "Faites répéter poliment une information entendue.",
    seconds: 90,
  },
  {
    id: "pulse-intro",
    line: "Présentez-vous en trois phrases à quelqu'un de nouveau.",
    seconds: 120,
  },
] as const;

export function todaysPulseDare(now = new Date()) {
  const i = now.getDate() % PULSE_DARES.length;
  return PULSE_DARES[i]!;
}
