import type { ActivityEvent, ActivityType, PronlabAttempt } from "./engine.ts";
import type { MissionSession } from "./mission.ts";
import { PRONLAB_SETS, TODAY_MISSION, type PronlabItem } from "./data.ts";
import { summarisePronlabItem } from "./engine.ts";

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
  { id: "b1-speak-describe", level: "B1", domain: "speaking", title: "Décrire une expérience", evidence: "Organiser une description compréhensible avec contexte, détail pertinent et impression personnelle." },
  { id: "b1-speak-compare", level: "B1", domain: "speaking", title: "Comparer des options", evidence: "Comparer au moins deux options et justifier une préférence selon un critère." },
  { id: "b1-write-explain", level: "B1", domain: "writing", title: "Expliquer un choix", evidence: "Rédiger une recommandation brève avec critères, raisons et formulation adaptée." },
  { id: "b1-grammar-connectors", level: "B1", domain: "grammar", title: "Relier les idées", evidence: "Utiliser des connecteurs pour exprimer cause, contraste, conséquence ou progression." },
  { id: "b1-listen-detail", level: "B1", domain: "listening", title: "Repérer un détail implicite", evidence: "Identifier une information utile et une intention dans un échange plus dense." },
  { id: "b1-read-infer", level: "B1", domain: "reading", title: "Inférer une intention", evidence: "Déduire une opinion ou une implication à partir d'indices textuels." },
  { id: "b1-mediate", level: "B1", domain: "mediation", title: "Reformuler pour un tiers", evidence: "Transmettre l'essentiel avec ses propres mots et adapter le niveau de détail au destinataire." },
  { id: "b1-interact-clarify", level: "B1", domain: "interaction", title: "Lever une ambiguïté", evidence: "Demander une précision, vérifier son interprétation et reprendre l'échange." },
  { id: "b1-argue-opinion", level: "B1", domain: "speaking", title: "Défendre un avis", evidence: "Exprimer une position, la soutenir par une raison et un exemple." },
  { id: "b1-write-position", level: "B1", domain: "writing", title: "Prendre position à l'écrit", evidence: "Construire un texte bref avec position, arguments et conclusion ou ouverture." },
  { id: "b1-acknowledge-counterpoint", level: "B1", domain: "interaction", title: "Reconnaître un contre-argument", evidence: "Reformuler un autre point de vue avant de préciser le sien." },
  { id: "b1-grammar-nuance", level: "B1", domain: "grammar", title: "Nuancer une affirmation", evidence: "Employer des modalisateurs et connecteurs pour éviter les formulations trop absolues." },
  { id: "b1-solve-problem", level: "B1", domain: "interaction", title: "Résoudre un imprévu", evidence: "Décrire un problème, proposer une solution et vérifier l'accord de l'interlocuteur." },
  { id: "b1-negotiate", level: "B1", domain: "interaction", title: "Négocier une alternative", evidence: "Faire une contre-proposition et maintenir une coopération visible dans l'échange." },
  { id: "b1-listen-constraints", level: "B1", domain: "listening", title: "Identifier des contraintes", evidence: "Repérer priorités, contraintes et options dans une conversation plus rapide." },
  { id: "b1-mediate-solution", level: "B1", domain: "mediation", title: "Expliquer une solution à un tiers", evidence: "Raconter brièvement ce qui s'est passé et transmettre la solution retenue." },
];

export type LessonKind = "mission" | "speak" | "pronlab" | "library" | "review" | "grammar" | "listening" | "writing";

export type CurriculumLesson = {
  id: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  objectiveIds: string[];
  description: string;
  taskId?: string;
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
      { id: "u2-l4", title: "Questions qui servent", kind: "grammar", minutes: 5, taskId: "grammar-question-1", objectiveIds: ["a2-grammar-question"], description: "Construire une question courte qui déclenche une information utile." },
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
      { id: "u3-l4", title: "Attraper le détail", kind: "listening", minutes: 5, taskId: "listen-1", objectiveIds: ["a2-listen-key"], description: "Écouter une information concrète puis la restituer sans perdre le détail." },
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
      { id: "u4-l4", title: "Écrire pour agir", kind: "writing", minutes: 7, taskId: "write-after-class", objectiveIds: ["a2-write-message"], description: "Écrire un message bref, clair et adapté à une situation réelle." },
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
  {
    id: "b1-description-and-comparison",
    number: 7,
    title: "Décrire et comparer avec précision",
    blurb: "Passer du constat simple à une description nuancée, comparer des options et expliquer un choix.",
    level: "B1",
    domainIds: ["speaking", "reading", "writing", "grammar"],
    objectives: ["b1-speak-describe", "b1-speak-compare", "b1-write-explain", "b1-grammar-connectors"],
    lessons: [
      { id: "u7-l1", title: "Décrire une expérience", kind: "speak", minutes: 8, objectiveIds: ["b1-speak-describe"], description: "Organiser une description en donnant le contexte, le détail utile et une impression." },
      { id: "u7-l2", title: "Comparer deux options", kind: "grammar", minutes: 6, taskId: "grammar-b1-1", objectiveIds: ["b1-speak-compare", "b1-grammar-connectors"], description: "Relier comparaison, justification et conséquence dans une phrase naturelle." },
      { id: "u7-l3", title: "Une recommandation argumentée", kind: "writing", minutes: 8, taskId: "write-b1-1", objectiveIds: ["b1-write-explain", "b1-speak-compare"], description: "Écrire une recommandation courte qui donne un critère et une raison." },
      { id: "u7-l4", title: "Lire entre les lignes", kind: "library", minutes: 7, objectiveIds: ["b1-read-infer"], description: "Repérer le ton, les indices et les formulations qui portent une opinion." },
    ],
  },
  {
    id: "b1-understand-and-mediate",
    number: 8,
    title: "Comprendre et transmettre l'essentiel",
    blurb: "Écouter, sélectionner l'information importante et la reformuler pour quelqu'un d'autre.",
    level: "B1",
    domainIds: ["listening", "reading", "mediation", "interaction"],
    objectives: ["b1-listen-detail", "b1-read-infer", "b1-mediate", "b1-interact-clarify"],
    lessons: [
      { id: "u8-l1", title: "Attraper le détail caché", kind: "listening", minutes: 8, taskId: "listen-b1-1", objectiveIds: ["b1-listen-detail"], description: "Distinguer l'information centrale d'un détail secondaire dans un échange rapide." },
      { id: "u8-l2", title: "Comprendre une intention", kind: "library", minutes: 7, objectiveIds: ["b1-read-infer"], description: "Repérer une intention, une réserve ou une implication qui n'est pas formulée directement." },
      { id: "u8-l3", title: "Reformuler pour quelqu'un", kind: "mission", minutes: 7, objectiveIds: ["b1-mediate", "b1-interact-clarify"], description: "Transmettre l'essentiel sans recopier le message mot à mot." },
      { id: "u8-l4", title: "Clarifier une ambiguïté", kind: "speak", minutes: 6, objectiveIds: ["b1-interact-clarify"], description: "Demander une précision puis reformuler ce que vous avez compris." },
    ],
  },
  {
    id: "b1-argument-with-nuance",
    number: 9,
    title: "Argumenter sans simplifier",
    blurb: "Exprimer un avis, reconnaître un contre-argument et défendre une position sans réciter un texte.",
    level: "B1",
    domainIds: ["speaking", "writing", "interaction", "grammar"],
    objectives: ["b1-argue-opinion", "b1-write-position", "b1-acknowledge-counterpoint", "b1-grammar-nuance"],
    lessons: [
      { id: "u9-l1", title: "Donner son avis", kind: "speak", minutes: 8, objectiveIds: ["b1-argue-opinion"], description: "Prendre position avec une raison claire et un exemple concret." },
      { id: "u9-l2", title: "Nuancer une affirmation", kind: "grammar", minutes: 7, taskId: "grammar-b1-6", objectiveIds: ["b1-grammar-nuance"], description: "Utiliser des connecteurs et modalisateurs pour éviter le tout-ou-rien." },
      { id: "u9-l3", title: "Répondre à un contre-argument", kind: "mission", minutes: 8, objectiveIds: ["b1-acknowledge-counterpoint", "b1-argue-opinion"], description: "Reconnaître un autre point de vue avant de défendre le sien." },
      { id: "u9-l4", title: "Écrire une position", kind: "writing", minutes: 9, taskId: "write-b1-3", objectiveIds: ["b1-write-position", "b1-grammar-nuance"], description: "Construire un texte bref avec position, raison et ouverture." },
    ],
  },
  {
    id: "b1-solve-and-adapt",
    number: 10,
    title: "Résoudre et s'adapter",
    blurb: "Faire face à un imprévu, négocier une solution et réparer la conversation quand la situation dévie.",
    level: "B1",
    domainIds: ["interaction", "speaking", "listening", "mediation"],
    objectives: ["b1-solve-problem", "b1-negotiate", "b1-listen-constraints", "b1-mediate-solution"],
    lessons: [
      { id: "u10-l1", title: "Le plan change", kind: "mission", minutes: 8, objectiveIds: ["b1-solve-problem"], description: "Décrire le problème, proposer une solution et vérifier l'accord." },
      { id: "u10-l2", title: "Négocier une alternative", kind: "speak", minutes: 8, objectiveIds: ["b1-negotiate"], description: "Faire une contre-proposition sans fermer l'échange." },
      { id: "u10-l3", title: "Écouter les contraintes", kind: "listening", minutes: 7, taskId: "listen-b1-3", objectiveIds: ["b1-listen-constraints"], description: "Identifier une contrainte, une priorité et une option dans une conversation." },
      { id: "u10-l4", title: "Transmettre une solution", kind: "speak", minutes: 7, objectiveIds: ["b1-mediate-solution"], description: "Expliquer à un tiers ce qui s'est passé et quelle solution a été retenue." },
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
  const lessonIds = new Set(
    log
      .filter((event) => (event.type === "LESSON_COMPLETED" || event.type === "CURRICULUM_EVIDENCE_RECORDED") && event.sourceId)
      .map((event) => event.sourceId as string),
  );
  const lessonDomains = CURRICULUM_UNITS.flatMap((unit) =>
    unit.lessons
      .filter((lesson) => lessonIds.has(lesson.id))
      .flatMap((lesson) =>
        lesson.objectiveIds
          .map((id) => CAN_DO_OBJECTIVES.find((objective) => objective.id === id)?.domain)
          .filter((id): id is LearningDomainId => Boolean(id)),
      ),
  );
  const lessonEvidence = (domain: LearningDomainId) =>
    lessonDomains.filter((id) => id === domain).length;
  const masteredPron = PRONLAB_SETS.flatMap((set) => set.items)
    .filter((item) => summarisePronlabItem(item.id, attempts).mastered)
    .length;

  const raw: Record<LearningDomainId, { coverage: number; evidence: number; signal: string }> = {
    speaking: { coverage: missions * 10 + speak * 9 + tandem * 8, evidence: missions + speak + tandem, signal: missions ? "Les missions apportent une preuve située." : "Une première prise de parole donnera un signal utile." },
    interaction: { coverage: missions * 12 + tandem * 10 + speak * 7, evidence: missions + tandem + speak, signal: missions ? "Les gestes réels montrent déjà comment vous entrez dans l'échange." : "Le système attend encore une situation d'interaction." },
    listening: { coverage: speak * 4 + tandem * 5 + reviews * 5 + listening * 18, evidence: speak + tandem + reviews + listening, signal: listening ? "Le lab d'écoute commence à documenter la compréhension de détails concrets." : "Pas assez de données d'écoute pour conclure." },
    reading: { coverage: vocabulary.length * 3 + lessonEvidence("reading") * 3, evidence: vocabulary.length + lessonEvidence("reading"), signal: vocabulary.length ? "Le vocabulaire sauvé indique une première exposition écrite." : lessonEvidence("reading") ? "Le parcours contient des pratiques de lecture déclarées ; une trace de compréhension directe renforcera cette branche." : "La bibliothèque peut commencer cette branche." },
    writing: { coverage: writing * 22 + lessonEvidence("writing") * 3, evidence: writing + lessonEvidence("writing"), signal: writing ? "Une production écrite est maintenant enregistrée comme trace de travail." : lessonEvidence("writing") ? "Le parcours contient des pratiques écrites déclarées ; une production reste à créer pour renforcer la preuve." : "Aucune production écrite enregistrée pour l'instant." },
    pronunciation: { coverage: masteredPron * 16 + attempts.length * 2, evidence: attempts.length, signal: attempts.length ? "Pron'Lab apporte une trace directe des sons travaillés." : "Un passage Pron'Lab donnera une première mesure." },
    vocabulary: { coverage: vocabulary.length * 8 + reviews * 6, evidence: vocabulary.length + reviews, signal: vocabulary.length ? "Les mots sauvés peuvent maintenant entrer dans le rappel espacé." : "Le vocabulaire n'est pas encore enregistré comme mémoire active." },
    grammar: { coverage: missions * 2 + speak * 2 + reviews * 3 + grammar * 18, evidence: missions + speak + reviews + grammar, signal: grammar ? "Le lab de grammaire apporte désormais une trace directe sur les structures ciblées." : "La grammaire est encore évaluée indirectement ; les prochains exercices doivent isoler les structures." },
    mediation: { coverage: tandem * 3 + lessonEvidence("mediation") * 3, evidence: tandem + lessonEvidence("mediation"), signal: tandem || lessonEvidence("mediation") ? "Des traces de transmission existent ; les tâches dédiées permettront de mieux distinguer pratique déclarée et performance observée." : "La médiation sera mieux documentée par des tâches de transmission dédiées." },
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
  const lessonCoverage = unit.lessons.length
    ? (unit.lessons.filter((lesson) => lessonDone(lesson, log)).length / unit.lessons.length) * 100
    : 0;

  // Unit progress is execution progress, not a global competence score.
  // Evidence from another unit may improve the learner profile, but it cannot
  // complete this unit.
  return cap(lessonCoverage);
}

export function lessonDone(
  lesson: CurriculumLesson,
  log: ActivityEvent[],
): boolean {
  // Curriculum completion is now attributed only after the learner completes
  // the activity through a linked execution context. Self-report no longer
  // counts, and generic activity in another part of the product cannot
  // silently complete this lesson.
  return log.some(
    (event) =>
      event.type === "CURRICULUM_EVIDENCE_RECORDED" &&
      event.sourceId === lesson.id,
  );
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
    LESSON_COMPLETED: "Ancienne confirmation de parcours",
    CURRICULUM_EVIDENCE_RECORDED: "Preuve reliée au parcours",
  };
  return labels[type] ?? "Activité";
}
