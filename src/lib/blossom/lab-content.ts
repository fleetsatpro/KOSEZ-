export type LabLevel = "A2" | "B1";

export type GrammarTask = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  target: string;
  level: LabLevel;
};

export const GRAMMAR_TASKS: GrammarTask[] = [
  { id: "grammar-question-1", prompt: "Quelle phrase demande naturellement une recommandation ?", choices: ["What you recommend?", "What do you recommend?", "What are you recommend?"], answer: "What do you recommend?", explanation: "Au présent simple, do porte la structure interrogative.", target: "Question au présent simple", level: "A2" },
  { id: "grammar-question-2", prompt: "Complétez : “I ___ the fish.”", choices: ["will have", "am have", "have to"], answer: "will have", explanation: "I'll have sert à annoncer une commande ou un choix au moment de décider.", target: "I'll have…", level: "A2" },
  { id: "grammar-question-3", prompt: "Quelle formule demande poliment de répéter ?", choices: ["Could you repeat that?", "Could you to repeat that?", "Could repeat you that?"], answer: "Could you repeat that?", explanation: "Après could, on garde la base verbale.", target: "Modal + base verbale", level: "A2" },
  { id: "grammar-question-4", prompt: "Quel passé simple est correct ?", choices: ["Yesterday I walk to the market.", "Yesterday I walked to the market.", "Yesterday I walking to the market."], answer: "Yesterday I walked to the market.", explanation: "Walk est régulier : walked.", target: "Past simple régulier", level: "A2" },
  { id: "grammar-question-5", prompt: "Quelle relance rend le tour de parole à l'autre personne ?", choices: ["What about you?", "What about your?", "What you about?"], answer: "What about you?", explanation: "What about you? est une relance courte et complète.", target: "Relance interactionnelle", level: "A2" },
  { id: "grammar-b1-1", prompt: "Quel connecteur exprime le contraste ? “I enjoyed the course, ___ it was quite intensive.”", choices: ["because", "although", "so"], answer: "although", explanation: "Although introduit ici une idée contrastée avec le fait d'avoir apprécié le cours.", target: "Connecteurs · contraste", level: "B1" },
  { id: "grammar-b1-2", prompt: "Quelle phrase relie correctement une cause et une conséquence ?", choices: ["The bus was delayed, so I arrived late.", "The bus was delayed, because I arrived late.", "The bus was delayed, although I arrived late."], answer: "The bus was delayed, so I arrived late.", explanation: "So introduit la conséquence de la première proposition.", target: "Connecteurs · conséquence", level: "B1" },
  { id: "grammar-b1-3", prompt: "Choisissez la formulation la plus naturelle pour une expérience passée encore pertinente :", choices: ["I have visited Réunion three times.", "I visit Réunion three times.", "I have visit Réunion three times."], answer: "I have visited Réunion three times.", explanation: "Le present perfect relie une expérience passée à la situation présente sans donner de date précise.", target: "Present perfect · expérience", level: "B1" },
  { id: "grammar-b1-4", prompt: "Quelle phrase exprime une possibilité prudente ?", choices: ["This could be the reason.", "This must be the reason.", "This is definitely the reason."], answer: "This could be the reason.", explanation: "Could marque une possibilité plutôt qu'une certitude.", target: "Modalisation · possibilité", level: "B1" },
  { id: "grammar-b1-5", prompt: "Quel relatif convient ? “The place ___ we met was near the harbour.”", choices: ["where", "who", "which people"], answer: "where", explanation: "Where relie un lieu à la proposition qui le décrit.", target: "Proposition relative · lieu", level: "B1" },
  { id: "grammar-b1-6", prompt: "Quelle formulation nuance une opinion ?", choices: ["It is always the best option.", "It can be a useful option in some situations.", "It is the only option."], answer: "It can be a useful option in some situations.", explanation: "Can + in some situations évite une affirmation absolue et rend l'énoncé plus précis.", target: "Nuancer une opinion", level: "B1" },
];

export type ListeningTask = {
  id: string;
  audioText: string;
  question: string;
  choices: string[];
  answer: string;
  detail: string;
  level: LabLevel;
};

export const LISTENING_TASKS: ListeningTask[] = [
  { id: "listen-1", audioText: "Boarding starts at seven forty at gate twelve.", question: "À quelle porte commence l'embarquement ?", choices: ["Gate 10", "Gate 12", "Gate 20"], answer: "Gate 12", detail: "Le numéro utile arrive en fin de phrase.", level: "A2" },
  { id: "listen-2", audioText: "The restaurant opens at seven, but the kitchen closes at nine.", question: "Quelle information est vraie ?", choices: ["The kitchen opens at nine.", "The restaurant opens at seven.", "The restaurant closes at seven."], answer: "The restaurant opens at seven.", detail: "Le premier repère temporel décrit l'ouverture.", level: "A2" },
  { id: "listen-3", audioText: "These pods are four euros for three.", question: "Combien coûtent trois gousses ?", choices: ["3 euros", "4 euros", "13 euros"], answer: "4 euros", detail: "Le prix indiqué correspond au lot de trois.", level: "A2" },
  { id: "listen-4", audioText: "It's on the second floor, left of the library.", question: "Où se trouve le lieu ?", choices: ["On the ground floor", "On the second floor, left of the library", "Behind the café"], answer: "On the second floor, left of the library", detail: "L'étage et le repère spatial arrivent dans la même phrase.", level: "A2" },
  { id: "listen-b1-1", audioText: "I was going to take the earlier train, but the platform changed, so I waited for the next one.", question: "Pourquoi la personne a-t-elle attendu le train suivant ?", choices: ["The earlier train was cancelled.", "The platform changed.", "The train was too expensive."], answer: "The platform changed.", detail: "L'information importante n'est pas donnée dans la première idée : la décision change après the platform changed.", level: "B1" },
  { id: "listen-b1-2", audioText: "The café is usually quiet in the morning, although it gets crowded around lunchtime.", question: "Quelle nuance décrit le mieux le café ?", choices: ["It is always crowded.", "It is generally quiet but busier at lunchtime.", "It is closed in the morning."], answer: "It is generally quiet but busier at lunchtime.", detail: "Usually et although obligent à combiner deux informations plutôt qu'à retenir un seul mot.", level: "B1" },
  { id: "listen-b1-3", audioText: "We could meet outside the station at six, unless your flight is delayed. In that case, send me a message.", question: "Que doit faire la personne si le vol est retardé ?", choices: ["Wait outside at six.", "Go straight to the hotel.", "Send a message."], answer: "Send a message.", detail: "La condition modifie le plan initial ; l'écoute doit suivre la relation entre unless et in that case.", level: "B1" },
  { id: "listen-b1-4", audioText: "The manager said the workshop was useful, but she felt the final exercise needed more time.", question: "Quelle opinion correspond au message ?", choices: ["The whole workshop was useless.", "The workshop was useful, with a reservation about the final exercise.", "The final exercise was the best part."], answer: "The workshop was useful, with a reservation about the final exercise.", detail: "Le but est d'entendre à la fois l'évaluation positive et la réserve introduite par but.", level: "B1" },
  { id: "listen-b1-5", audioText: "If we leave before eight, we should have enough time to stop for coffee before the museum opens.", question: "Pourquoi partir avant huit heures ?", choices: ["To arrive after the museum closes.", "To have time for a coffee stop before opening.", "Because the museum opens at eight."], answer: "To have time for a coffee stop before opening.", detail: "La réponse exige de relier condition, temps disponible et objectif.", level: "B1" },
  { id: "listen-b1-6", audioText: "I thought the meeting was on Thursday, but I've just checked the calendar and it is actually on Friday afternoon.", question: "Qu'est-ce qui a changé pour la personne ?", choices: ["The meeting was cancelled.", "The meeting date was corrected from Thursday to Friday afternoon.", "The meeting moved from Friday to Thursday."], answer: "The meeting date was corrected from Thursday to Friday afternoon.", detail: "La compréhension repose sur le contraste entre thought et actually.", level: "B1" },
];

export type WritingPrompt = {
  id: string;
  title: string;
  situation: string;
  task: string;
  model: string;
  checks: Array<{ id: string; label: string }>;
  level: LabLevel;
};

export const WRITING_PROMPTS: WritingPrompt[] = [
  { id: "write-after-class", title: "Un message après le cours", situation: "Vous écrivez à un collègue anglophone pour confirmer l'heure du déjeuner.", task: "Écrivez 2 à 4 phrases en anglais. Confirmez l'heure, proposez un lieu et terminez poliment.", model: "Hi Noah, lunch at 12:30 at the café? See you there!", checks: [{ id: "check-info", label: "J'ai donné une information claire." }, { id: "check-place", label: "J'ai proposé ou confirmé un lieu." }, { id: "check-close", label: "J'ai terminé avec une formule naturelle." }], level: "A2" },
  { id: "write-recommendation", title: "Une recommandation simple", situation: "Un ami vous demande quoi manger à Saint-Pierre.", task: "Écrivez une recommandation courte avec un plat et une raison.", model: "I'd recommend the catch of the day. It's fresh and simple.", checks: [{ id: "check-choice", label: "J'ai recommandé quelque chose de précis." }, { id: "check-reason", label: "J'ai donné une raison compréhensible." }, { id: "check-natural", label: "Ma phrase reste courte et naturelle." }], level: "A2" },
  { id: "write-b1-1", title: "Recommander entre deux options", situation: "Deux amis hésitent entre deux activités pour le week-end.", task: "Écrivez 5 à 7 phrases en expliquant laquelle vous recommandez, selon quel critère, et reconnaissez au moins une limite de votre choix.", model: "I'd recommend the coastal walk because it is more flexible for a short afternoon. The market is livelier, but it takes longer to reach, so the walk seems more practical today.", checks: [{ id: "b1-choice", label: "J'ai comparé au moins deux options." }, { id: "b1-reason", label: "J'ai donné un critère et une raison." }, { id: "b1-counterpoint", label: "J'ai reconnu une limite ou un avantage de l'autre option." }, { id: "b1-connector", label: "J'ai relié mes idées avec un connecteur." }], level: "B1" },
  { id: "write-b1-2", title: "Signaler un problème avec une solution", situation: "Vous écrivez à un hébergement : la chambre est correcte mais un équipement ne fonctionne pas.", task: "Écrivez un message de 6 à 8 phrases : décrivez le problème, expliquez son impact et proposez une solution réaliste.", model: "The room is comfortable, but the shower is not working properly. It is difficult to get ready in the morning. Could someone check it today? If that is not possible, another room would be helpful.", checks: [{ id: "b1-problem", label: "J'ai décrit le problème avec précision." }, { id: "b1-impact", label: "J'ai expliqué la conséquence." }, { id: "b1-solution", label: "J'ai proposé une solution." }, { id: "b1-tone", label: "Le ton reste clair et coopératif." }], level: "B1" },
  { id: "write-b1-3", title: "Prendre position sans tout simplifier", situation: "Une association demande votre avis sur l'ouverture plus tardive d'un lieu culturel.", task: "Écrivez 6 à 9 phrases avec votre position, deux raisons, une réserve et une proposition.", model: "I think opening later would help people who work during the day. It could also make the centre more useful in the evening. However, extra staff would cost more, so I would suggest starting with two late evenings a week.", checks: [{ id: "b1-position", label: "J'ai formulé une position claire." }, { id: "b1-reasons", label: "J'ai donné au moins deux raisons." }, { id: "b1-nuance", label: "J'ai reconnu une contrainte ou une réserve." }, { id: "b1-proposal", label: "J'ai terminé par une proposition." }], level: "B1" },
  { id: "write-b1-4", title: "Reformuler pour un tiers", situation: "Un collègue n'a pas lu un message important sur un changement d'horaire.", task: "Écrivez 5 à 7 phrases en transmettant l'essentiel sans recopier le message d'origine.", model: "The meeting has moved to Friday afternoon. The room is the same, but we should arrive ten minutes earlier because the building closes at six.", checks: [{ id: "b1-essential", label: "J'ai gardé les informations essentielles." }, { id: "b1-rephrase", label: "J'ai reformulé plutôt que copié." }, { id: "b1-detail", label: "J'ai gardé les détails utiles." }], level: "B1" },
];

export type WritingEvaluation = {
  passed: string[];
  failed: string[];
  total: number;
  score: number;
  method: "deterministic-structure-v1";
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text: string): number {
  return text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length;
}

export function evaluateWritingStructure(
  prompt: WritingPrompt,
  draft: string,
): WritingEvaluation {
  const text = draft.trim();
  const lower = text.toLowerCase();
  const words = wordCount(text);
  const sentences = sentenceCount(text);
  const reasonSignals = (lower.match(/\bbecause\b|\bsince\b|\bso\b|\btherefore\b|\bwhich means\b|\bdue to\b/g) ?? []).length;
  const connectorSignals = includesAny(lower, [
    "because", "although", "however", "but", "so", "therefore",
    "while", "instead", "on the other hand", "as a result",
  ]);
  const rules: Record<string, boolean> = {
    "check-info": words >= 5,
    "check-place": includesAny(lower, ["cafe", "café", "restaurant", "market", "at ", "in ", "near ", "place"]),
    "check-close": includesAny(lower, ["see you", "thanks", "thank you", "best", "regards", "soon"]),
    "check-choice": includesAny(lower, ["recommend", "suggest", "choose", "prefer", "would"]),
    "check-reason": reasonSignals >= 1,
    "check-natural": words >= 6 && words <= 40,
    "b1-choice": includesAny(lower, [" or ", "both", "between", "first", "second", "option", "instead", "whereas", "but"]),
    "b1-reason": reasonSignals >= 1,
    "b1-counterpoint": includesAny(lower, ["but", "however", "although", "while", "even though", "on the other hand"]),
    "b1-connector": connectorSignals,
    "b1-problem": includesAny(lower, ["problem", "not working", "broken", "fault", "issue", "can't", "cannot", "doesn't", "not available"]),
    "b1-impact": includesAny(lower, ["difficult", "hard", "means", "impact", "unable", "can't", "cannot", "so", "therefore"]),
    "b1-solution": includesAny(lower, ["could", "can ", "would", "check", "fix", "replace", "another", "solution", "suggest", "if "]),
    "b1-tone": includesAny(lower, ["please", "could", "would", "thank", "thanks", "sorry", "hope"]),
    "b1-position": includesAny(lower, ["i think", "i believe", "in my view", "i would", "i prefer", "personally", "i'd "]),
    "b1-reasons": reasonSignals >= 2 || sentences >= 4,
    "b1-nuance": includesAny(lower, ["however", "but", "although", "might", "could", "may ", "perhaps", "some", "often", "usually"]),
    "b1-proposal": includesAny(lower, ["suggest", "propose", "recommend", "would", "could", "try", "start"]),
    "b1-essential": words >= 25 && sentences >= 3,
    "b1-rephrase": lower !== prompt.model.toLowerCase() && words >= 20,
    "b1-detail": words >= 25,
  };
  const passed = prompt.checks.filter((check) => rules[check.id] === true).map((check) => check.id);
  const failed = prompt.checks.filter((check) => !rules[check.id]).map((check) => check.id);
  return {
    passed,
    failed,
    total: prompt.checks.length,
    score: prompt.checks.length ? Math.round((passed.length / prompt.checks.length) * 100) : 0,
    method: "deterministic-structure-v1",
  };
}

export function speakSyntheticEnglish(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
