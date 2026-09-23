/**
 * Mission bank helpers — Réunion-anchored practice missions.
 * Core TODAY/B1 missions stay in data.ts; extras live here.
 */
import type { Mission } from "./data.ts";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayKeyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function bandOf(level: string): "A1" | "A2" | "B1" | "B2" {
  const l = level.toUpperCase();
  if (l.startsWith("A1")) return "A1";
  if (l.startsWith("B2") || l.startsWith("C")) return "B2";
  if (l.startsWith("B1")) return "B1";
  return "A2";
}

/** Additional missions (merged with TODAY / B1 / UPCOMING in data.ts). */
export const EXTRA_MISSIONS: Mission[] = [
  {
    id: "mission-market-price",
    title: "How much is this?",
    prompt:
      "Au marché, demandez le prix de deux produits en anglais — sans passer par le français.",
    context:
      "Saint-Pierre, marché du samedi. Une question claire vaut mieux qu'une phrase longue.",
    durationMin: 3,
    level: "A1",
    language: "English",
    place: "Marché de Saint-Pierre",
    supportPhrase: "How much is this, please?",
    successSignals: [
      "Vous posez la question à voix audible.",
      "Vous utilisez « please » ou un équivalent poli.",
      "Vous restez en anglais pour le prix entendu.",
    ],
    realWorldInstruction:
      "Choisissez deux étals. Demandez le prix, écoutez, dites thank you.",
  },
  {
    id: "mission-bus-time",
    title: "What time does it leave?",
    prompt: "Demandez l'heure de départ d'un bus ou d'un car, en anglais.",
    context: "Gare routière ou arrêt. Une information, un geste.",
    durationMin: 2,
    level: "A1",
    language: "English",
    place: "Gare routière, Saint-Pierre",
    supportPhrase: "What time does it leave?",
    successSignals: [
      "Vous obtenez une heure (même approximative).",
      "Vous reformulez ou confirmez une fois.",
    ],
    realWorldInstruction: "Approchez, demandez, confirmez : « So, at three? »",
  },
  {
    id: "mission-coffee-order",
    title: "I'd like a coffee",
    prompt: "Commandez une boisson en anglais au comptoir, sans basculer.",
    context: "Café du centre. Le serveur peut répondre en français — vous tenez l'anglais.",
    durationMin: 3,
    level: "A2",
    language: "English",
    place: "Café, Saint-Pierre",
    supportPhrase: "I'd like a coffee, please.",
    successSignals: [
      "Vous formulez la commande en anglais.",
      "Vous acceptez ou précisez (sugar / no sugar).",
    ],
    realWorldInstruction: "Une commande réelle. Payez, remerciez en anglais.",
  },
  {
    id: "mission-weekend-plans",
    title: "Any plans this weekend?",
    prompt: "Demandez à quelqu'un ses projets de week-end, en anglais.",
    context: "Collègue ou connaissance. Curiosité simple, pas un interrogatoire.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Au travail ou en ville",
    supportPhrase: "Any plans this weekend?",
    successSignals: [
      "Vous posez la question.",
      "Vous réagissez à la réponse (Nice! / Oh, cool.).",
    ],
    realWorldInstruction: "Un échange de 60–90 secondes suffit.",
  },
  {
    id: "mission-directions-beach",
    title: "Is the beach this way?",
    prompt: "Demandez si vous êtes sur le bon chemin vers la plage, en anglais.",
    context: "Bord de mer, touristes et locaux se croisent.",
    durationMin: 2,
    level: "A2",
    language: "English",
    place: "Vers Terre-Sainte / plage",
    supportPhrase: "Is the beach this way?",
    successSignals: [
      "Vous pointez ou montrez le sens.",
      "Vous remerciez après la réponse.",
    ],
  },
  {
    id: "mission-pharmacy",
    title: "Something for a headache",
    prompt: "À la pharmacie, expliquez un besoin simple en anglais.",
    context: "Besoin concret, langage prudent. Pas de diagnostic inventé.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Pharmacie, Saint-Pierre",
    supportPhrase: "I need something for a headache.",
    successSignals: [
      "Vous nommez le symptôme simplement.",
      "Vous comprenez une instruction de base (how often).",
    ],
  },
  {
    id: "mission-late-message",
    title: "I'm running late",
    prompt: "Prévenez quelqu'un que vous êtes en retard — message vocal ou face à face, en anglais.",
    context: "Trafic, pluie, enfant… La clarté compte plus que l'excuse parfaite.",
    durationMin: 2,
    level: "A2",
    language: "English",
    place: "Téléphone ou sur place",
    supportPhrase: "I'm running late — sorry!",
    successSignals: [
      "Vous annoncez le retard.",
      "Vous donnez une estimation (ten minutes).",
    ],
  },
  {
    id: "mission-opinion-food",
    title: "What did you think of it?",
    prompt: "Demandez l'avis de quelqu'un sur un plat ou un restaurant, en anglais.",
    context: "Après un repas partagé ou une reco.",
    durationMin: 4,
    level: "B1",
    language: "English",
    place: "Restaurant ou table d'amis",
    supportPhrase: "What did you think of it?",
    successSignals: [
      "Vous posez une question ouverte.",
      "Vous ajoutez un avis personnel court.",
    ],
  },
  {
    id: "mission-meeting-slot",
    title: "Can we move the meeting?",
    prompt: "Proposez de décaler un créneau (appel, rendez-vous) en anglais.",
    context: "Travail ou démarches. Poli, direct, une alternative.",
    durationMin: 4,
    level: "B1",
    language: "English",
    place: "Bureau ou message",
    supportPhrase: "Could we move it to tomorrow afternoon?",
    successSignals: [
      "Vous proposez un nouveau créneau.",
      "Vous confirmez l'accord.",
    ],
  },
  {
    id: "mission-weather-smalltalk",
    title: "Crazy weather today",
    prompt: "Lancez un échange court sur la météo (cyclone, pluie, chaleur), en anglais.",
    context: "Réunion : la météo est un vrai sujet de conversation.",
    durationMin: 3,
    level: "A2",
    language: "English",
    place: "File d'attente ou bureau",
    supportPhrase: "Crazy weather today, right?",
    successSignals: [
      "Vous ouvrez avec une observation.",
      "Vous écoutez la réponse sans traduire à voix haute.",
    ],
  },
  {
    id: "mission-help-stranger",
    title: "Do you need a hand?",
    prompt: "Proposez de l'aide à quelqu'un (carte, bagage, orientation) en anglais.",
    context: "Geste social. Accepter un non poliment.",
    durationMin: 3,
    level: "A2",
    language: "English",
    place: "Rue ou gare",
    supportPhrase: "Do you need a hand?",
    successSignals: [
      "Vous proposez clairement.",
      "Vous réagissez à yes/no sans gêne.",
    ],
  },
  {
    id: "mission-phone-signal",
    title: "Is there Wi‑Fi here?",
    prompt: "Demandez le Wi‑Fi ou le code, en anglais, dans un lieu public.",
    context: "Café, bibliothèque, salle d'attente.",
    durationMin: 2,
    level: "A1",
    language: "English",
    place: "Lieu public, Saint-Pierre",
    supportPhrase: "Is there Wi‑Fi here?",
    successSignals: [
      "Vous posez la question.",
      "Vous notez ou répétez le mot de passe si donné.",
    ],
  },
  {
    id: "mission-story-minute",
    title: "One story, one minute",
    prompt: "Racontez un moment de votre semaine en anglais pendant environ une minute.",
    context: "Seul (enregistrement) ou avec un partenaire. Structure : when / where / what happened.",
    durationMin: 5,
    level: "B1",
    language: "English",
    place: "Chez vous ou tandem",
    supportPhrase: "So, yesterday I…",
    successSignals: [
      "Vous tenez ~45–60 secondes.",
      "Vous utilisez au moins un connecteur (then, after that).",
    ],
  },
  {
    id: "mission-disagree-soft",
    title: "I see it differently",
    prompt: "Exprimez un désaccord poli sur un sujet léger, en anglais.",
    context: "Film, sport, nourriture — pas de sujet sensible.",
    durationMin: 4,
    level: "B1",
    language: "English",
    place: "Conversation informelle",
    supportPhrase: "I see it a bit differently…",
    successSignals: [
      "Vous désaccordz sans attaquer.",
      "Vous donnez une raison courte.",
    ],
  },
  {
    id: "mission-book-appointment",
    title: "I'd like to book…",
    prompt: "Prenez un rendez-vous simple (coiffeur, médecin, admin) en anglais.",
    context: "Téléphone ou guichet. Jour + heure.",
    durationMin: 5,
    level: "B1",
    language: "English",
    place: "Téléphone ou accueil",
    supportPhrase: "I'd like to book an appointment for Friday.",
    successSignals: [
      "Vous demandez un créneau.",
      "Vous confirmez date et heure.",
    ],
  },
  {
    id: "mission-describe-place",
    title: "My favourite place here",
    prompt: "Décrivez un lieu de Saint-Pierre ou de l'île en anglais (2–3 phrases).",
    context: "Pour un visiteur imaginaire ou un tandem.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Où vous voulez",
    supportPhrase: "My favourite place is…",
    successSignals: [
      "Vous nommez le lieu.",
      "Vous donnez une raison (quiet, view, food).",
    ],
  },
  {
    id: "mission-clarify",
    title: "Sorry, could you repeat?",
    prompt: "Dans un échange réel, faites répéter ou clarifier une information en anglais.",
    context: "Bruit, accent, numéro de téléphone — la clarification est une compétence.",
    durationMin: 3,
    level: "A2",
    language: "English",
    place: "Situation réelle du jour",
    supportPhrase: "Sorry, could you repeat that?",
    successSignals: [
      "Vous interrompez poliment.",
      "Vous obtenez l'info reformulée.",
    ],
  },
  {
    id: "mission-invite",
    title: "Would you like to join?",
    prompt: "Invitez quelqu'un à un café, une marche ou un événement, en anglais.",
    context: "Invitation simple, réponse libre.",
    durationMin: 3,
    level: "A2",
    language: "English",
    place: "Travail ou amis",
    supportPhrase: "Would you like to join us for a coffee?",
    successSignals: [
      "Vous formulez l'invitation.",
      "Vous acceptez un refus sans insister.",
    ],
  },
  {
    id: "mission-feedback-work",
    title: "Can I get your feedback?",
    prompt: "Demandez un retour court sur un travail ou une idée, en anglais.",
    context: "Collègue ou mentor. Une question, une écoute.",
    durationMin: 5,
    level: "B2",
    language: "English",
    place: "Contexte pro",
    supportPhrase: "Could I get your feedback on this?",
    successSignals: [
      "Vous cadrez l'objet du feedback.",
      "Vous reformulez un point entendu.",
    ],
  },
];

export function missionsForBand(level: string, bank: Mission[]): Mission[] {
  const band = bandOf(level);
  const order = ["A1", "A2", "B1", "B2"] as const;
  const idx = order.indexOf(band);
  return bank.filter((m) => {
    const mb = bandOf(m.level);
    const mi = order.indexOf(mb);
    return mi <= idx && mi >= Math.max(0, idx - 1);
  });
}

export function selectMissionForLevel(
  level: string,
  bank: Mission[],
  fallback: Mission,
  options?: { dayKey?: string; rotate?: boolean },
): Mission {
  if (!options?.rotate) return fallback;
  const pool = missionsForBand(level, bank);
  if (pool.length === 0) return fallback;
  const band = bandOf(level);
  const key = `${options.dayKey ?? dayKeyUTC()}|${band}`;
  const index = hashSeed(key) % pool.length;
  return pool[index]!;
}

export function missionBankStats(bank: Mission[]) {
  const byLevel: Record<string, number> = {};
  for (const m of bank) {
    byLevel[m.level] = (byLevel[m.level] ?? 0) + 1;
  }
  return { total: bank.length, byLevel };
}
