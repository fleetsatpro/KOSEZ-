/**
 * Cross-surface influence engine.
 *
 * This is the depth layer: every door (Mission, OSEZ, Pulse, Home, Tandem) reads the same
 * organism state and adapts behavior — not copy, not particles.
 *
 * Inputs: pronlab attempts, activity log, minerals, growth, mission sessions.
 * Outputs: concrete adaptations with an explicit causal reason (zero ambiguity).
 */

import type { PronlabItem } from "./data";
import type { LearnLanguageId } from "@/lib/i18n/locales";
import type {
  ActivityEvent,
  LearnerMemory,
  PronlabAttempt,
} from "./engine";
import { summarisePronlabItem } from "./engine";
import type { MissionOutcome, MissionSession } from "./mission";
import { evaluateMission, summariseMissionHistory } from "./mission";
import {
  computeMinerals,
  strugglingFocus,
  type GrowthEvent,
  type MineralKey,
  type MineralSnapshot,
  type PhonemeLeaf,
} from "./organism";

export type InfluenceReason = {
  /** Machine key for analytics / tests */
  code:
    | "pron-struggle"
    | "phoneme-mastery"
    | "mineral-low"
    | "mission-friction"
    | "mission-outcome"
    | "courage-gap"
    | "recent-growth"
    | "balanced";
  /** Human-readable, French, no jargon */
  line: string;
  /** Which mineral this reason primarily touches */
  mineral?: MineralKey;
};

export type MissionInfluence = {
  emphasis?: string;
  kitFront?: { phrase: string; use: string };
  stretchOverride?: string;
  adaptationDetail: string;
  reasons: InfluenceReason[];
};

export type SpeakInfluence = {
  friction: string | null;
  kitBoost: { phrase: string; use: string }[];
  pressureHint: "soft" | "steady" | "firm";
  reasons: InfluenceReason[];
};

export type PulseInfluence = {
  dareOverride: { id: string; line: string; seconds: number } | null;
  reasons: InfluenceReason[];
};

export type HomeInfluence = {
  statusLine: string;
  annotation: string | null;
  doors: { door: string; mineral: MineralKey; line: string; priority: number }[];
  reasons: InfluenceReason[];
};

export type TandemInfluence = {
  /** Opening prompt when a son resists or social mineral is low */
  openPrompt: string | null;
  /** Partner ranking bias */
  partnerBias: "social-recover" | "pron-focus" | "balanced";
  reasons: InfluenceReason[];
};

export type OrganismInfluence = {
  at: string;
  minerals: MineralSnapshot;
  struggle: PronlabItem | null;
  leaves: PhonemeLeaf[];
  mission: MissionInfluence;
  speak: SpeakInfluence;
  pulse: PulseInfluence;
  home: HomeInfluence;
  tandem: TandemInfluence;
};

function lowestMineral(m: MineralSnapshot): { key: MineralKey; value: number } {
  const entries: [MineralKey, number][] = [
    ["pron", m.pron],
    ["parole", m.parole],
    ["mission", m.mission],
    ["social", m.social],
    ["atelier", m.atelier],
  ];
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const [key, value] = sorted[0]!;
  return { key, value };
}

function dominantFriction(
  sessions: Record<string, MissionSession>,
): { friction: string; count: number } | null {
  const allRuns = Object.values(sessions).flatMap((s) => s.runs);
  const history = summariseMissionHistory(allRuns);
  const entries = Object.entries(history.friction).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  if (!top || top[1] === 0 || top[0] === "none") return null;
  return { friction: top[0], count: top[1] };
}

function latestOutcome(
  sessions: Record<string, MissionSession>,
): MissionOutcome | null {
  const completed = Object.values(sessions)
    .flatMap((s) => s.runs)
    .filter((r) => r.completedAt && r.reflection)
    .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""));
  const last = completed.at(-1);
  return last?.reflection ? evaluateMission(last.reflection).outcome : null;
}

function frictionStretch(friction: string): string {
  switch (friction) {
    case "hesitation":
      return "Ouvrez avec la phrase d'appui sans pause — le silence n'est pas un échec, mais aujourd'hui on le raccourcit.";
    case "vocabulary":
      return "Gardez le kit à trois phrases. N'inventez pas de mots : reformulez avec ce que vous avez.";
    case "switching":
      return "Si le français revient, une seule phrase de secours puis retour. Pas de traduction à voix haute.";
    case "confidence":
      return "Le geste reste le même. La pression baisse : une phrase claire suffit, sans relance.";
    default:
      return "Même geste, même pression. La régularité compte plus que l'intensité.";
  }
}

function struggleKit(item: PronlabItem): { phrase: string; use: string } {
  const focus = item.focus || item.problemSegment || item.ipa;
  return {
    phrase: item.phrase,
    use: `Son qui résiste : ${focus}. Dites-la une fois dans la scène — pas comme exercice, comme geste utile.`,
  };
}

function leafKit(leaf: PhonemeLeaf): { phrase: string; use: string } {
  return {
    phrase: leaf.label,
    use: `Phonème maîtrisé (${leaf.phoneme}) — disponible comme outil, pas comme test.`,
  };
}

export function computeInfluence(input: {
  log: ActivityEvent[];
  attempts: PronlabAttempt[];
  allItems: PronlabItem[];
  growthEvents: GrowthEvent[];
  phonemeLeaves: PhonemeLeaf[];
  missionSessions: Record<string, MissionSession>;
  memory: LearnerMemory;
  memoryOn: boolean;
  languageId: LearnLanguageId;
}): OrganismInfluence {
  const at = new Date().toISOString();
  const minerals = computeMinerals(input.log);
  const struggle = strugglingFocus(input.attempts, input.allItems);
  const leaves = input.phonemeLeaves;
  const recentGrowth = [...input.growthEvents]
    .filter((event) => {
      const delta = Date.now() - Date.parse(event.at);
      return Number.isFinite(delta) && delta >= 0 && delta <= 7 * 86_400_000;
    })
    .sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
  const low = lowestMineral(minerals);
  const friction = dominantFriction(input.missionSessions);
  const outcome = latestOutcome(input.missionSessions);

  // ── Mission influence ──────────────────────────────────────────────
  const missionReasons: InfluenceReason[] = [];
  let emphasis: string | undefined;
  let kitFront: MissionInfluence["kitFront"];
  let stretchOverride: string | undefined;
  let adaptationDetail = "Fondation — le geste du jour, sans surcharge.";

  if (recentGrowth && !friction && outcome !== "repeat") {
    stretchOverride =
      recentGrowth.kind === "flower"
        ? "Transférez le geste vers une nouvelle personne ou un nouveau contexte — sans ajouter de vocabulaire."
        : recentGrowth.kind === "leaf"
          ? "Réutilisez l'acquis récent une fois dans la scène, puis revenez à l'objectif principal."
          : "Laissez l'acquis récent soutenir le geste principal ; aucune difficulté supplémentaire n'est requise.";
    missionReasons.push({
      code: "recent-growth",
      line: `Une croissance récente (${recentGrowth.label}) devient une consigne de transfert explicite — elle ne reste pas décorative.`,
      mineral: recentGrowth.mineral,
    });
    adaptationDetail = `Transfert après croissance · ${recentGrowth.kind}`;
  }

  if (struggle) {
    const focus = struggle.focus || struggle.problemSegment || struggle.ipa;
    emphasis = struggle.phrase;
    kitFront = struggleKit(struggle);
    missionReasons.push({
      code: "pron-struggle",
      line: `Pron'Lab signale « ${focus} » — la phrase d'appui intègre ce son sans en faire un exercice isolé.`,
      mineral: "pron",
    });
    adaptationDetail = `Friction sonore active · ${focus}`;
  }

  if (friction) {
    stretchOverride = frictionStretch(friction.friction);
    missionReasons.push({
      code: "mission-friction",
      line: `Vos dernières missions ont buté sur « ${friction.friction} » (${friction.count}×). La pression de scène s'adapte.`,
      mineral: "mission",
    });
    if (!struggle) {
      adaptationDetail = `Friction mission · ${friction.friction}`;
    }
  }

  if (outcome === "repeat") {
    missionReasons.push({
      code: "mission-outcome",
      line: "Le dernier passage n'a pas tenu l'objectif — même geste, zéro complexité ajoutée.",
      mineral: "mission",
    });
    adaptationDetail = "Sécuriser · même cible";
  } else if (outcome === "advance") {
    missionReasons.push({
      code: "mission-outcome",
      line: "Le dernier passage a tenu — une relance courte est disponible si le premier geste sort.",
      mineral: "mission",
    });
  }

  if (missionReasons.length === 0) {
    missionReasons.push({
      code: "balanced",
      line: "Aucune friction dominante — le geste du jour reste simple.",
    });
  }

  // ── Speak influence ────────────────────────────────────────────────
  const speakReasons: InfluenceReason[] = [];
  let frictionLine: string | null = null;
  const kitBoost: SpeakInfluence["kitBoost"] = [];
  let pressureHint: SpeakInfluence["pressureHint"] = "steady";

  if (struggle && input.memoryOn) {
    const focus = struggle.focus || struggle.problemSegment || struggle.ipa;
    frictionLine = `Son qui résiste : ${focus}. Une occurrence dans la room suffit — pas de forçage.`;
    kitBoost.push(struggleKit(struggle));
    speakReasons.push({
      code: "pron-struggle",
      line: `La room reçoit le son « ${focus} » comme frottement discret, pas comme leçon.`,
      mineral: "pron",
    });
    pressureHint = "soft";
  }

  const recentLeaves = [...leaves]
    .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
    .slice(0, 2);
  for (const leaf of recentLeaves) {
    kitBoost.push(leafKit(leaf));
  }
  if (recentLeaves.length > 0) {
    speakReasons.push({
      code: "phoneme-mastery",
      line: `${recentLeaves.length} phonème${recentLeaves.length > 1 ? "s" : ""} maîtrisé${recentLeaves.length > 1 ? "s" : ""} entre${recentLeaves.length > 1 ? "nt" : ""} dans le kit comme outil${recentLeaves.length > 1 ? "s" : ""}.`,
      mineral: "pron",
    });
  }

  if (low.key === "parole" && low.value < 35) {
    pressureHint = "soft";
    speakReasons.push({
      code: "mineral-low",
      line: "Le minéral parole est bas — pression de room adoucie pour que le geste sorte.",
      mineral: "parole",
    });
  } else if (low.key === "parole" && low.value >= 70 && outcome === "advance") {
    pressureHint = "firm";
    speakReasons.push({
      code: "mineral-low",
      line: "Parole solide et dernière mission en avance — pression un cran plus ferme.",
      mineral: "parole",
    });
  }

  if (speakReasons.length === 0) {
    speakReasons.push({
      code: "balanced",
      line: "Composition standard — le catalogue du jour suffit.",
    });
  }

  // ── Pulse influence ────────────────────────────────────────────────
  const pulseReasons: InfluenceReason[] = [];
  let dareOverride: PulseInfluence["dareOverride"] = null;

  if (struggle) {
    const focus = struggle.focus || struggle.problemSegment || "ce son";
    const dareByLanguage: Partial<Record<LearnLanguageId, string>> = {
      en: "Say one useful sentence containing « " + focus + " » — once, in a real or simulated situation.",
      fr: "Dites une phrase utile contenant « " + focus + " » — une seule fois, en situation réelle ou simulée.",
      es: "Di una frase útil que contenga « " + focus + " » — una sola vez, en una situación real o simulada.",
      pt: "Diga uma frase útil que contenha « " + focus + " » — uma vez, numa situação real ou simulada.",
      de: "Sage einen nützlichen Satz mit « " + focus + " » — einmal, in einer echten oder simulierten Situation.",
      it: "Di una frase utile che contenga « " + focus + " » — una sola volta, in una situazione reale o simulata.",
      cr: "Diz enn fraz itil ek « " + focus + " » — enn sel fwa, dan enn sitiasion reel ousa simile.",
      lsf: "Montre un signe utile pour « " + focus + " » — une seule fois, en situation réelle ou simulée.",
    };
    dareOverride = {
      id: `pulse-struggle-${struggle.id}`,
      line: dareByLanguage[input.languageId] ?? dareByLanguage.en!,
      seconds: 90,
    };
    pulseReasons.push({
      code: "pron-struggle",
      line: `Pulse du jour recalibré sur le son qui résiste : ${focus}.`,
      mineral: "pron",
    });
  } else if (low.key === "mission" && low.value < 30) {
    dareOverride = {
      id: "pulse-terrain",
      line: "Un geste terrain minimal : une phrase claire à un inconnu, puis notez-la ici.",
      seconds: 120,
    };
    pulseReasons.push({
      code: "mineral-low",
      line: "Minéral mission bas — Pulse pousse vers un micro-geste réel.",
      mineral: "mission",
    });
  } else if (low.key === "social" && low.value < 30) {
    dareOverride = {
      id: "pulse-social",
      line: "Échangez deux phrases avec quelqu'un — tandem, comptoir, ou voisin de table.",
      seconds: 120,
    };
    pulseReasons.push({
      code: "mineral-low",
      line: "Minéral social bas — Pulse oriente vers une présence partagée.",
      mineral: "social",
    });
  }

  if (pulseReasons.length === 0) {
    pulseReasons.push({
      code: "balanced",
      line: "Pulse du calendrier — aucune surcharge organismique.",
    });
  }

  // ── Home influence ─────────────────────────────────────────────────
  const homeReasons: InfluenceReason[] = [];
  const doors: HomeInfluence["doors"] = [];

  if (struggle) {
    const focus = struggle.focus || struggle.problemSegment || struggle.phrase;
    doors.push({
      door: "/pronlab",
      mineral: "pron",
      line: `Son qui résiste · ${focus}`,
      priority: 100,
    });
    homeReasons.push({
      code: "pron-struggle",
      line: `Annotation vivante : « ${focus} » traverse encore Pron'Lab, Mission et OSEZ.`,
      mineral: "pron",
    });
  }

  if (low.value < 40) {
    const doorMap: Record<MineralKey, string> = {
      pron: "/pronlab",
      parole: "/osez",
      mission: "/mission",
      social: "/tandem",
      atelier: "/learn/labs",
    };
    const lineMap: Record<MineralKey, string> = {
      pron: "Un son répété jusqu'à tenue nourrit la canopée.",
      parole: "Une prise de parole ancrée épaissit la tige.",
      mission: "Un geste terrain enfonce une racine.",
      social: "Une présence partagée fait fleurir le sol.",
      atelier: "Une preuve d'apprentissage nourrit la canopée.",
    };
    doors.push({
      door: doorMap[low.key],
      mineral: low.key,
      line: lineMap[low.key],
      priority: 80 - low.value,
    });
    homeReasons.push({
      code: "mineral-low",
      line: `Minéral ${low.key} à ${low.value}/100 — porte prioritaire.`,
      mineral: low.key,
    });
  }

  if (outcome === "repeat") {
    doors.push({
      door: "/mission",
      mineral: "mission",
      line: "Même mission — le geste n'a pas encore tenu.",
      priority: 90,
    });
    homeReasons.push({
      code: "mission-outcome",
      line: "Dernière mission en « repeat » — la porte Mission reste ouverte sur la même cible.",
      mineral: "mission",
    });
  }

  const doorMapDedup = new Map<string, HomeInfluence["doors"][number]>();
  for (const d of doors.sort((a, b) => b.priority - a.priority)) {
    if (!doorMapDedup.has(d.door)) doorMapDedup.set(d.door, d);
  }
  const orderedDoors = [...doorMapDedup.values()].sort((a, b) => b.priority - a.priority);

  let statusLine: string;
  let annotation: string | null = null;

  if (struggle) {
    const focus = struggle.focus || struggle.problemSegment || struggle.phrase;
    statusLine = `Un son résiste encore — « ${focus} » — et il traverse vos portes.`;
    annotation =
      "Pron'Lab, Mission et OSEZ reçoivent ce frottement. Un passage suffit ; rien à forcer.";
  } else if (outcome === "repeat") {
    statusLine = "Le dernier geste n'a pas tenu — même cible, pression plus basse.";
    annotation = "La mission du jour reprend l'objectif sans ajouter de complexité.";
  } else if (low.value < 30) {
    statusLine = `Le sol demande du ${low.key} — un geste ciblé, pas une longue séance.`;
    annotation = orderedDoors[0]?.line ?? null;
  } else if (leaves.length >= 3 && minerals.parole >= 50) {
    statusLine = "Plusieurs sons tiennent ; la tige peut s'élancer vers une scène réelle.";
    annotation = `${leaves.length} feuilles de phonème débloquées — le kit s'enrichit.`;
    homeReasons.push({
      code: "phoneme-mastery",
      line: `${leaves.length} phonèmes maîtrisés nourrissent le kit OSEZ et la confiance de scène.`,
      mineral: "pron",
    });
  } else {
    statusLine = "La terre est stable. Un geste utile suffit encore.";
    annotation = null;
  }

  if (homeReasons.length === 0) {
    homeReasons.push({
      code: "balanced",
      line: "Organisme équilibré — le geste du jour reste le centre.",
    });
  }

  // ── Tandem influence ───────────────────────────────────────────────
  const tandemReasons: InfluenceReason[] = [];
  let openPrompt: string | null = null;
  let partnerBias: TandemInfluence["partnerBias"] = "balanced";

  if (struggle) {
    const focus = struggle.focus || struggle.problemSegment || struggle.phrase;
    const promptByLanguage: Partial<Record<LearnLanguageId, string>> = {
      en: "Could you help me with « " + focus + " »? I want to hear it once, then try.",
      fr: "Tu peux m'aider avec « " + focus + " » ? J'écoute une fois, puis j'essaie.",
      es: "¿Puedes ayudarme con « " + focus + " »? Lo escucho una vez y luego lo intento.",
      pt: "Podes ajudar-me com « " + focus + " »? Ouço uma vez e depois tento.",
      de: "Kannst du mir bei « " + focus + " » helfen? Ich höre es einmal und versuche es dann.",
      it: "Puoi aiutarmi con « " + focus + " »? Lo ascolto una volta e poi provo.",
      cr: "Ou peux a m'aider ek « " + focus + " » ? J'écoute enn fwa, apré j'essaie.",
      lsf: "Montre-moi le signe pour « " + focus + " », puis j'essaie.",
    };
    openPrompt = promptByLanguage[input.languageId] ?? promptByLanguage.en!;
    partnerBias = "pron-focus";
    tandemReasons.push({
      code: "pron-struggle",
      line: `Le tandem ouvre sur « ${focus} » — un échange court, pas un cours.`,
      mineral: "pron",
    });
  } else if (low.key === "social" && low.value < 40) {
    openPrompt = "How has your week been? One real answer is enough.";
    partnerBias = "social-recover";
    tandemReasons.push({
      code: "mineral-low",
      line: `Minéral social à ${low.value}/100 — le tandem priorise un échange simple, sans performance.`,
      mineral: "social",
    });
  }

  if (tandemReasons.length === 0) {
    tandemReasons.push({
      code: "balanced",
      line: "Tandem libre — aucune friction dominante à injecter.",
    });
  }

  return {
    at,
    minerals,
    struggle,
    leaves,
    mission: {
      emphasis,
      kitFront,
      stretchOverride,
      adaptationDetail,
      reasons: missionReasons,
    },
    speak: {
      friction: frictionLine,
      kitBoost,
      pressureHint,
      reasons: speakReasons,
    },
    pulse: {
      dareOverride,
      reasons: pulseReasons,
    },
    home: {
      statusLine,
      annotation,
      doors: orderedDoors,
      reasons: homeReasons,
    },
    tandem: {
      openPrompt,
      partnerBias,
      reasons: tandemReasons,
    },
  };
}

/** Hook-friendly selector: pull influence from blossom store slices. */
export function influenceFromState(state: {
  activityLog: ActivityEvent[];
  pronlabAttempts: PronlabAttempt[];
  growthEvents: GrowthEvent[];
  phonemeLeaves: PhonemeLeaf[];
  missionSessions: Record<string, MissionSession>;
  allItems: PronlabItem[];
  memory: LearnerMemory;
  memoryOn: boolean;
  languageId: LearnLanguageId;
}): OrganismInfluence {
  return computeInfluence({
    log: state.activityLog,
    attempts: state.pronlabAttempts,
    allItems: state.allItems,
    growthEvents: state.growthEvents,
    phonemeLeaves: state.phonemeLeaves,
    missionSessions: state.missionSessions,
    memory: state.memory,
    memoryOn: state.memoryOn,
    languageId: state.languageId,
  });
}
