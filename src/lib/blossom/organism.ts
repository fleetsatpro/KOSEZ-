/**
 * BLOSSOM organism layer — minerals, growth events, courage ribbon, Léo letters.
 * Pure functions over activityLog / pronlabAttempts. Engine remains source of points.
 */

import type { ActivityEvent, ActivityType, PronlabAttempt } from "./engine.ts";
import { summarisePronlabItem } from "./engine.ts";
import type { PronlabItem } from "./data.ts";

export type GrowthKind = "root" | "stem" | "leaf" | "flower" | "mineral";
export type MineralKey = "mission" | "parole" | "pron" | "social" | "atelier";

export const MINERAL_WINDOW_DAYS = 14;

export type MineralDefinition = {
  label: string;
  door: string;
  doorLabel: string;
  writtenBy: readonly ActivityType[];
  purpose: string;
  gesture: string;
  windowLabel: string;
  writtenByLabel: string;
  scoreMeaning: string;
};

export const MINERAL_DEFINITIONS: Record<MineralKey, MineralDefinition> = {
  mission: { label: "Mission", door: "/mission", doorLabel: "Mission", writtenBy: ["MISSION_COMPLETED", "REAL_WORLD_BONUS"], purpose: "Agir dans une situation réelle.", gesture: "Un geste terrain réellement clôturé.", windowLabel: "14 jours", writtenByLabel: "Mission clôturée · bonus terrain", scoreMeaning: "Activité mission récente, plafonnée à l’échelle 100." },
  parole: { label: "Parole", door: "/osez", doorLabel: "OSEZ", writtenBy: ["SPEAK_COMPLETED"], purpose: "Prendre la parole, ici et maintenant.", gesture: "Une prise de parole réellement clôturée.", windowLabel: "14 jours", writtenByLabel: "OSEZ clôturé", scoreMeaning: "Activité de prise de parole récente, plafonnée à l’échelle 100." },
  pron: { label: "Pron", door: "/pronlab", doorLabel: "Pron’Lab", writtenBy: ["PRONLAB_COMPLETED", "PRONLAB_MASTERY"], purpose: "Rendre un son plus disponible.", gesture: "Une pratique Pron’Lab ou une maîtrise observée.", windowLabel: "14 jours", writtenByLabel: "Pron’Lab · maîtrise observée", scoreMeaning: "Pratique récente de Pron’Lab, plafonnée à l’échelle 100." },
  social: { label: "Social", door: "/tandem", doorLabel: "Tandem", writtenBy: ["TANDEM_COMPLETED", "CLASS_ATTENDED", "EVENT_ATTENDED", "IMMERSION_ATTENDED"], purpose: "Créer du lien dans un cadre réel.", gesture: "Un tandem clôturé, une présence ou une immersion réellement enregistrée.", windowLabel: "14 jours", writtenByLabel: "Tandem · classe · événement · immersion", scoreMeaning: "Présences sociales récentes, plafonnées à l’échelle 100." },
  atelier: { label: "Atelier", door: "/learn/labs", doorLabel: "LEARN · Labs", writtenBy: ["GRAMMAR_COMPLETED", "LISTENING_COMPLETED", "WRITING_COMPLETED", "REVIEW_COMPLETED", "LIBRARY_COMPLETED", "HOMEWORK_COMPLETED"], purpose: "Consolider ce que vous apprenez.", gesture: "Une trace d’atelier terminée.", windowLabel: "14 jours", writtenByLabel: "Grammaire · écoute · écrit · révision · bibliothèque · devoir", scoreMeaning: "Pratique d’atelier récente, plafonnée à l’échelle 100." },
};

export function mineralForActivity(type: ActivityType): MineralKey | null {
  const keys = Object.keys(MINERAL_DEFINITIONS) as MineralKey[];
  return keys.find((key) => MINERAL_DEFINITIONS[key].writtenBy.includes(type)) ?? null;
}

export function mineralLabel(key: MineralKey): string {
  return MINERAL_DEFINITIONS[key].label;
}

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
    countTypes(log, ["SPEAK_COMPLETED"]),
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
  const order: MineralKey[] = ["mission", "parole", "pron", "social", "atelier"];
  const lowest = Math.min(...order.map((key) => minerals[key]));
  const needs = order.filter((key) => minerals[key] === lowest);
  if (lowest >= 40) return "Les cinq minéraux restent en mouvement. Aucun n’est en retrait marqué.";
  if (needs.length > 1) {
    return `Deux besoins sont à égalité : ${needs.map(mineralLabel).join(" · ")}. Un geste utile sur l’un des deux suffit.`;
  }
  switch (needs[0]) {
    case "pron": return "Pron’Lab peut remettre un son précis en circulation — une pratique courte suffit.";
    case "parole": return "OSEZ peut remettre la parole en mouvement — une room courte suffit.";
    case "mission": return "Une Mission peut remettre le réel au centre — un seul geste suffit.";
    case "social": return "Tandem, classe, événement ou immersion peuvent recréer du lien réel.";
    case "atelier": return "LEARN · Labs peut consolider une trace d’apprentissage sans vous faire changer de parcours.";
    default: return "Un geste utile vaut mieux qu’une longue séance.";
  }
}
/** Causal next-gesture hint for plant / home — lowest mineral maps to a door. */
export function causalNextGesture(minerals: MineralSnapshot): {
  mineral: MineralKey;
  door: string;
  line: string;
  value: number;
  tiedWith: MineralKey[];
  basis: string;
} {
  const order: MineralKey[] = ["mission", "parole", "pron", "social", "atelier"];
  const value = Math.min(...order.map((key) => minerals[key]));
  const tiedWith = order.filter((key) => minerals[key] === value);
  const mineral = tiedWith[0]!;
  const definition = MINERAL_DEFINITIONS[mineral];
  const tieText = tiedWith.length > 1 ? ` Également à ${value}/100 : ${tiedWith.slice(1).map(mineralLabel).join(" · ")}.` : "";
  return {
    mineral,
    door: definition.door,
    value,
    tiedWith,
    line: `${definition.purpose} ${definition.gesture}${tieText}`,
    basis: `${definition.label} · ${value}/100 · fenêtre glissante de ${definition.windowLabel}.`,
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
      return null;
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
        label: "Une pratique produit une trace de curriculum.",
      };
    case "DIAGNOSTIC_COMPLETED":
      return {
        id,
        at,
        kind: "mineral",
        sourceId,
        intensity: 0.24,
        label: "Le repère affine le prochain terrain.",
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
