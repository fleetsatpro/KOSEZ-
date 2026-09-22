import type { ActivityEvent, ActivityType, PronlabAttempt } from "./engine";
import type { MissionSession } from "./mission";
import { PRONLAB_SETS, TODAY_MISSION, type PronlabItem } from "./data";
import { summarisePronlabItem } from "./engine";

export type LearningDomainId =
  | "speaking"
  | "interaction"
  | "listening"
  | "reading"
  | "writing"
  | "pronunciation"
  | "vocabulary"
  | "grammar"
  | "mediation";

export type LearningDomain = {
  id: LearningDomainId;
  label: string;
  shortLabel: string;
  description: string;
};

export const LEARNING_DOMAINS: LearningDomain[] = [
  { id: "speaking", label: "Production orale", shortLabel: "Parler", description: "Produire un message compréhensible et tenir un propos bref." },
  { id: "interaction", label: "Interaction", shortLabel: "Échanger", description: "Ouvrir, relancer, clarifier et réparer un échange." },
  { id: "listening", label: "Compréhension orale", shortLabel: "Écouter", description: "Comprendre l'essentiel puis les détails utiles en situation." },
  { id: "reading", label: "Compréhension écrite", shortLabel: "Lire", description: "Comprendre des textes courts et repérer l'information utile." },
  { id: "writing", label: "Production écrite", shortLabel: "Écrire", description: "Écrire des messages et textes adaptés au contexte." },
  { id: "pronunciation", label: "Phonologie", shortLabel: "Prononcer", description: "Articuler clairement les sons et construire un rythme intelligible." },
  { id: "vocabulary", label: "Lexique", shortLabel: "Mots", description: "Rappeler et réutiliser le vocabulaire dans plusieurs contextes." },
  { id: "grammar", label: "Grammaire", shortLabel: "Construire", description: "Contrôler les structures nécessaires à l'intention communicative." },
  { id: "mediation", label: "Médiation", shortLabel: "Transmettre", description: "Faire comprendre une information à quelqu'un qui n'a pas le même accès à la langue." },
];

export type CanDoObjective = {
  id: string;
  level: "A1" | "A2" | "B1";
  domain: LearningDomainId;
  title: string;
  evidence: string;
};

export const CAN_DO_OBJECTIVES: CanDoObjective[] = [
  { id: "a2-interact-ask", level: "A2", domain: "interaction", title: "Demander une recommandation", evidence: "Une interaction réelle ou simulée où la demande ouvre effectivement l'échange." },
  { id: "a2-interact-repair", level: "A2", domain: "interaction", title: "Demander de répéter", evidence: "Utiliser une formule de réparation sans quitter la langue cible." },
  { id: "a2-speak-routine", level: "A2", domain: "speaking", title: "Décrire une routine", evidence: "Produire plusieurs phrases reliées sur une journée ou une activité familière." },
  { id: "a2-speak-preference", level: "A2", domain: "speaking", title: "Exprimer une préférence", evidence: "Donner un choix simple avec une raison compréhensible." },
  { id: "a2-listen-key", level: "A2", domain: "listening", title: "Repérer une information clé", evidence: "Identifier correctement une heure, un lieu, un prix ou une option dans un échange." },
  { id: "a2-read-short", level: "A2", domain: "reading", title: "Comprendre un texte court", evidence: "Retrouver l'idée centrale et au moins deux informations utiles." },
  { id: "a2-write-message", level: "A2", domain: "writing", title: "Écrire un message pratique", evidence: "Transmettre une information claire avec une formule adaptée au destinataire." },
  { id: "a2-pron-th", level: "A2", domain: "pronunciation", title: "Stabiliser un contraste phonologique", evidence: "Produire et reconnaître un contraste ciblé dans plusieurs contextes." },
  { id: "a2-vocab-reuse", level: "A2", domain: "vocabulary", title: "Réutiliser du vocabulaire", evidence: "Rappeler un mot appris et le remettre dans une phrase nouvelle." },
  { id: "a2-grammar-question", level: "A2", domain: "grammar", title: "Construire une question utile", evidence: "Former une question compréhensible sans reconstruire toute la phrase en français." },
  { id: "a2-mediate-simple", level: "A2", domain: "mediation", title: "Transmettre une information simple", evidence: "Expliquer à quelqu'un l'essentiel d'un message ou d'une consigne." },
];

export type LessonKind = "mission" | "speak" | "pronlab" | "library" | "review" | "grammar" | "listening" | "writing";

export type CurriculumLesson = {
  id: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  objectiveIds: string[];
  description: string;
};

export type CurriculumUnit = {
  id: string;
  number: number;
  title: string;
  blurb: string;
  level: "A1" | "A2" | "B1";
  domainIds: LearningDomainId[];
  objectives: string[];
  lessons: CurriculumLesson[];
};

export const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: "a2-real-life-basics",
    number: 1,
    title: "Les gestes qui ouvrent",
    blurb: "Entrer dans une interaction, demander, choisir et ne pas abandonner quand une phrase résiste.",
    level: "A2",
    domainIds: ["interaction", "speaking", "pronunciation", "vocabulary"],
    objectives: ["a2-interact-ask", "a2-interact-repair", "a2-pron-th"],
    lessons: [
      { id: "u1-l1", title: "Demander une recommandation", kind: "mission", minutes: 4, objectiveIds: ["a2-interact-ask"], description: "Une demande courte qui crée immédiatement une réponse." },
      { id: "u1-l2", title: "Réparer sans basculer", kind: "speak", minutes: 6, objectiveIds: ["a2-interact-repair"], description: "Faire répéter, gagner une seconde et reprendre le fil." },
      { id: "u1-l3", title: "Les TH dans la vraie vie", kind: "pronlab", minutes: 8, objectiveIds: ["a2-pron-th"], description: "Du son isolé à une phrase réellement utile." },
    ],
  },
  {
    id: "a2-food-and-service",
    number: 2,
    title: "Commander sans traduire",
    blurb: "Du menu au choix : préférences, quantités, politesse et petites reprises.",
    level: "A2",
    domainIds: ["interaction", "speaking", "vocabulary", "grammar"],
    objectives: ["a2-interact-ask", "a2-speak-preference", "a2-grammar-question"],
    lessons: [
      { id: "u2-l1", title: "What do you recommend?", kind: "speak", minutes: 6, objectiveIds: ["a2-interact-ask"], description: "Ouvrir puis garder deux tours de conversation." },
      { id: "u2-l2", title: "I'll have…", kind: "pronlab", minutes: 5, objectiveIds: ["a2-vocab-reuse"], description: "Transformer une structure apprise en réflexe utilisable." },
      { id: "u2-l3", title: "At the covered market", kind: "library", minutes: 4, objectiveIds: ["a2-vocab-reuse", "a2-read-short"], description: "Lire, écouter et récupérer les mots qui reviennent." },
      { id: "u2-l4", title: "Questions qui servent", kind: "grammar", minutes: 5, objectiveIds: ["a2-grammar-question"], description: "Construire une question courte qui déclenche une information utile." },
    ],
  },
  {
    id: "a2-workplace",
    number: 3,
    title: "Parler au travail",
    blurb: "Se présenter, demander une information, confirmer et faire une relance courte.",
    level: "A2",
    domainIds: ["speaking", "interaction", "listening", "grammar"],
    objectives: ["a2-speak-routine", "a2-listen-key", "a2-grammar-question"],
    lessons: [
      { id: "u3-l1", title: "Une réunion de deux minutes", kind: "speak", minutes: 7, objectiveIds: ["a2-speak-routine"], description: "Entrer dans une conversation professionnelle sans script long." },
      { id: "u3-l2", title: "Attraper le détail", kind: "review", minutes: 4, objectiveIds: ["a2-listen-key"], description: "Revoir heures, lieux, nombres et options dans des phrases courtes." },
      { id: "u3-l3", title: "Is it far from here?", kind: "mission", minutes: 4, objectiveIds: ["a2-grammar-question"], description: "Produire une question simple qui demande une information exploitable." },
      { id: "u3-l4", title: "Attraper le détail", kind: "listening", minutes: 5, objectiveIds: ["a2-listen-key"], description: "Écouter une information concrète puis la restituer sans perdre le détail." },
    ],
  },
  {
    id: "a2-everyday-story",
    number: 4,
    title: "Raconter une journée",
    blurb: "Passer de mots isolés à une petite histoire compréhensible.",
    level: "A2",
    domainIds: ["speaking", "writing", "vocabulary", "grammar"],
    objectives: ["a2-speak-routine", "a2-vocab-reuse", "a2-write-message"],
    lessons: [
      { id: "u4-l1", title: "Yesterday en 60 secondes", kind: "speak", minutes: 6, objectiveIds: ["a2-speak-routine"], description: "Trois faits reliés, sans traduire phrase par phrase." },
      { id: "u4-l2", title: "Les mots qui reviennent", kind: "review", minutes: 5, objectiveIds: ["a2-vocab-reuse"], description: "Rappeler puis réutiliser des mots déjà rencontrés." },
      { id: "u4-l3", title: "Un message après le cours", kind: "library", minutes: 5, objectiveIds: ["a2-write-message"], description: "Observer comment une information pratique se formule à l'écrit." },
      { id: "u4-l4", title: "Écrire pour agir", kind: "writing", minutes: 7, objectiveIds: ["a2-write-message"], description: "Écrire un message bref, clair et adapté à une situation réelle." },
    ],
  },
  {
    id: "a2-travel",
    number: 5,
    title: "Voyager avec moins de friction",
    blurb: "Aéroport, hôtel, transport : comprendre vite et demander ce qui manque.",
    level: "A2",
    domainIds: ["listening", "interaction", "speaking", "mediation"],
    objectives: ["a2-listen-key", "a2-interact-repair", "a2-mediate-simple"],
    lessons: [
      { id: "u5-l1", title: "Check-in", kind: "speak", minutes: 6, objectiveIds: ["a2-listen-key"], description: "Comprendre destination, bagage et porte d'embarquement." },
      { id: "u5-l2", title: "Réparer une information", kind: "mission", minutes: 4, objectiveIds: ["a2-interact-repair"], description: "Demander une répétition et reformuler ce que vous avez compris." },
      { id: "u5-l3", title: "Expliquer l'itinéraire", kind: "speak", minutes: 7, objectiveIds: ["a2-mediate-simple"], description: "Transmettre l'essentiel à quelqu'un qui n'a pas vu le message initial." },
    ],
  },
  {
    id: "a2-independent",
    number: 6,
    title: "Tenir l'échange",
    blurb: "Moins de kit, plus d'autonomie : relancer, clarifier et continuer malgré l'imprévu.",
    level: "A2",
    domainIds: ["interaction", "speaking", "listening", "pronunciation"],
    objectives: ["a2-interact-repair", "a2-speak-preference", "a2-pron-th"],
    lessons: [
      { id: "u6-l1", title: "Room libre", kind: "speak", minutes: 8, objectiveIds: ["a2-interact-repair"], description: "Une conversation semi-ouverte avec moins de soutien visible." },
      { id: "u6-l2", title: "Révision ciblée", kind: "review", minutes: 5, objectiveIds: ["a2-pron-th", "a2-vocab-reuse"], description: "Le rappel revient là où votre historique montre une vraie friction." },
      { id: "u6-l3", title: "Mission terrain", kind: "mission", minutes: 5, objectiveIds: ["a2-speak-preference"], description: "Choisir, justifier et relancer dans une situation quotidienne." },
    ],
  },
];

export type SkillEvidence = {
  domain: LearningDomain;
  coverage: number;
  evidenceCount: number;
  status: "à découvrir" | "émergent" | "régulier" | "bien documenté";
  signal: string;
};

const cap = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function buildSkillProfile(
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string }>,
): SkillEvidence[] {
  const count = (type: ActivityType) => log.filter((event) => event.type === type).length;
  const missions = count("MISSION_COMPLETED");
  const speak = count("SPEAK_COMPLETED");
  const tandem = count("TANDEM_COMPLETED");
  const reviews = count("REVIEW_COMPLETED");
  const grammar = count("GRAMMAR_COMPLETED");
  const listening = count("LISTENING_COMPLETED");
  const writing = count("WRITING_COMPLETED");
  const masteredPron = PRONLAB_SETS.flatMap((set) => set.items)
    .filter((item) => summarisePronlabItem(item.id, attempts).mastered)
    .length;

  const raw: Record<LearningDomainId, { coverage: number; evidence: number; signal: string }> = {
    speaking: { coverage: missions * 10 + speak * 9 + tandem * 8, evidence: missions + speak + tandem, signal: missions ? "Les missions apportent une preuve située." : "Une première prise de parole donnera un signal utile." },
    interaction: { coverage: missions * 12 + tandem * 10 + speak * 7, evidence: missions + tandem + speak, signal: missions ? "Les gestes réels montrent déjà comment vous entrez dans l'échange." : "Le système attend encore une situation d'interaction." },
    listening: { coverage: speak * 4 + tandem * 5 + reviews * 5 + listening * 18, evidence: speak + tandem + reviews + listening, signal: listening ? "Le lab d'écoute commence à documenter la compréhension de détails concrets." : "Pas assez de données d'écoute pour conclure." },
    reading: { coverage: vocabulary.length * 3, evidence: vocabulary.length, signal: vocabulary.length ? "Le vocabulaire sauvé indique une première exposition écrite." : "La bibliothèque peut commencer cette branche." },
    writing: { coverage: writing * 22, evidence: writing, signal: writing ? "Une production écrite est maintenant enregistrée comme trace de travail." : "Aucune production écrite enregistrée pour l'instant." },
    pronunciation: { coverage: masteredPron * 16 + attempts.length * 2, evidence: attempts.length, signal: attempts.length ? "Pron'Lab apporte une trace directe des sons travaillés." : "Un passage Pron'Lab donnera une première mesure." },
    vocabulary: { coverage: vocabulary.length * 8 + reviews * 6, evidence: vocabulary.length + reviews, signal: vocabulary.length ? "Les mots sauvés peuvent maintenant entrer dans le rappel espacé." : "Le vocabulaire n'est pas encore enregistré comme mémoire active." },
    grammar: { coverage: missions * 2 + speak * 2 + reviews * 3 + grammar * 18, evidence: missions + speak + reviews + grammar, signal: grammar ? "Le lab de grammaire apporte désormais une trace directe sur les structures ciblées." : "La grammaire est encore évaluée indirectement ; les prochains exercices doivent isoler les structures." },
    mediation: { coverage: tandem * 3, evidence: tandem, signal: "La médiation sera mieux documentée par des tâches de transmission dédiées." },
  };

  return LEARNING_DOMAINS.map((domain) => {
    const item = raw[domain.id];
    const coverage = cap(item.coverage);
    const status =
      coverage >= 70 ? "bien documenté" :
      coverage >= 35 ? "régulier" :
      coverage > 0 ? "émergent" : "à découvrir";
    return { domain, coverage, evidenceCount: item.evidence, status, signal: item.signal };
  });
}

export type ReviewItem = {
  id: string;
  kind: "pronunciation" | "vocabulary" | "mission";
  title: string;
  prompt: string;
  answer: string;
  reason: string;
  priority: "haute" | "normale" | "nouvelle";
  link: "pronlab" | "mission" | "library";
};

export function buildReviewQueue(
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string }>,
): ReviewItem[] {
  const items: ReviewItem[] = [];
  const pronItems = PRONLAB_SETS.flatMap((set) => set.items);
  const struggling = pronItems.filter((item) => summarisePronlabItem(item.id, attempts).struggling);

  for (const item of struggling.slice(0, 4)) {
    items.push({
      id: `review-pron-${item.id}`,
      kind: "pronunciation",
      title: item.phrase,
      prompt: `Quel son ou segment vous voulez stabiliser dans « ${item.phrase} » ?`,
      answer: item.problemSegment || item.focus,
      reason: "Votre historique Pron'Lab montre une difficulté persistante.",
      priority: "haute",
      link: "pronlab",
    });
  }

  for (const word of vocabulary.slice().reverse().slice(0, 6)) {
    items.push({
      id: `review-word-${word.word}`,
      kind: "vocabulary",
      title: word.word,
      prompt: "Rappelez le sens puis utilisez le mot dans une phrase nouvelle.",
      answer: word.gloss,
      reason: "Ce mot est déjà dans votre vocabulaire vivant.",
      priority: "normale",
      link: "library",
    });
  }

  if (items.length < 6) {
    for (const kit of TODAY_MISSION.scene?.languageKit ?? []) {
      items.push({
        id: `review-kit-${kit.phrase}`,
        kind: "mission",
        title: kit.phrase,
        prompt: kit.meaning,
        answer: kit.meaning,
        reason: "Phrase utile liée à votre prochaine scène réelle.",
        priority: "nouvelle",
        link: "mission",
      });
      if (items.length >= 6) break;
    }
  }

  return items.slice(0, 8);
}

export function nextLearningAction(
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string }>,
): { eyebrow: string; title: string; body: string; kind: ReviewItem["link"] } {
  const profile = buildSkillProfile(log, attempts, vocabulary);
  const weak = [...profile].sort((a, b) => a.coverage - b.coverage)[0]!;
  const queue = buildReviewQueue(attempts, vocabulary);

  if (queue[0]?.priority === "haute") {
    return {
      eyebrow: "PRIORITÉ · PRON'LAB",
      title: queue[0].title,
      body: queue[0].reason,
      kind: "pronlab",
    };
  }

  if (weak.coverage === 0 && weak.domain.id === "writing") {
    return {
      eyebrow: "À AJOUTER · ÉCRIT",
      title: "Une première trace écrite",
      body: "Votre profil contient encore un angle mort en production écrite. Une courte tâche suffit pour créer une première preuve.",
      kind: "library",
    };
  }

  return {
    eyebrow: "PROCHAINE ACTION",
    title: "Revenir au geste du jour",
    body: "Le meilleur prochain pas reste celui qui relie une compétence à une situation réelle.",
    kind: "mission",
  };
}

export function curriculumUnitProgress(
  unit: CurriculumUnit,
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  vocabulary: Array<{ word: string; gloss: string }>,
): number {
  const objectives = new Set(unit.objectives);
  const profile = buildSkillProfile(log, attempts, vocabulary);
  const relevant = profile.filter((entry) => unit.domainIds.includes(entry.domain.id));
  if (!relevant.length) return 0;
  const objectiveCoverage = CAN_DO_OBJECTIVES
    .filter((objective) => objectives.has(objective.id))
    .map((objective) => profile.find((entry) => entry.domain.id === objective.domain)?.coverage ?? 0);
  return cap(objectiveCoverage.reduce((sum, value) => sum + value, 0) / Math.max(1, objectiveCoverage.length));
}

export function lessonDone(
  lesson: CurriculumLesson,
  log: ActivityEvent[],
): boolean {
  const sourceByKind: Record<LessonKind, ActivityType | null> = {
    mission: "MISSION_COMPLETED",
    speak: "SPEAK_COMPLETED",
    pronlab: "PRONLAB_COMPLETED",
    library: null,
    review: "REVIEW_COMPLETED",
    grammar: "GRAMMAR_COMPLETED",
    listening: "LISTENING_COMPLETED",
    writing: "WRITING_COMPLETED",
  };
  const activityType = sourceByKind[lesson.kind];
  if (!activityType) return false;
  return log.some((event) => event.type === activityType && event.sourceId === lesson.id);
}

export function unitDoneCount(
  unit: CurriculumUnit,
  log: ActivityEvent[],
): number {
  return unit.lessons.filter((lesson) => lessonDone(lesson, log)).length;
}

export function historyRows(
  log: ActivityEvent[],
  attempts: PronlabAttempt[],
  missionSessions: Record<string, MissionSession>,
) {
  const events = log.map((event) => ({
    id: event.id,
    at: event.createdAt,
    kind: "activité" as const,
    title: activityLabel(event.type),
    detail: event.note ?? event.sourceId ?? "—",
    tone: event.type.includes("PRON") ? "pronunciation" : event.type.includes("MISSION") ? "mission" : "default",
  }));

  const pron = attempts.map((attempt) => ({
    id: attempt.id,
    at: attempt.createdAt,
    kind: "preuve" as const,
    title: `Pron'Lab · ${attempt.itemId}`,
    detail: `${attempt.score}/100 · ${attempt.seconds}s`,
    tone: "pronunciation",
  }));

  const missions = Object.entries(missionSessions).flatMap(([missionId, record]) => {
    const runs = Array.isArray(record.runs) ? record.runs : [];
    return runs.filter((run) => run.completedAt).map((run) => ({
      id: run.id,
      at: run.completedAt ?? run.lastUpdatedAt,
      kind: "session" as const,
      title: `Mission · ${missionId}`,
      detail: run.reflection
        ? `Confiance ${run.reflection.confidence}/5 · ${run.challenge === "stretch" ? "Extension" : "Foundation"}`
        : "Session terminée",
      tone: "mission",
    }));
  });

  return [...events, ...pron, ...missions].sort((a, b) => b.at.localeCompare(a.at));
}

export function activityLabel(type: ActivityType): string {
  const labels: Partial<Record<ActivityType, string>> = {
    MISSION_COMPLETED: "Mission terminée",
    SPEAK_COMPLETED: "Speak terminé",
    PRONLAB_COMPLETED: "Set Pron'Lab terminé",
    PRONLAB_MASTERY: "Maîtrise Pron'Lab",
    CLASS_ATTENDED: "Cours suivi",
    EVENT_ATTENDED: "Événement suivi",
    REAL_WORLD_BONUS: "Geste terrain",
    TANDEM_COMPLETED: "Tandem terminé",
    HOMEWORK_COMPLETED: "Devoir terminé",
    IMMERSION_ATTENDED: "Immersion suivie",
    REVIEW_COMPLETED: "Révision terminée",
    DIAGNOSTIC_COMPLETED: "Repère indicatif enregistré",
  };
  return labels[type] ?? "Activité";
}
