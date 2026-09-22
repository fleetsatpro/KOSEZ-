export type DiagnosticLevel = "A1" | "A2" | "A2+" | "B1";

export type DiagnosticQuestion = {
  id: string;
  domain: "interaction" | "speaking" | "listening" | "writing" | "grammar";
  prompt: string;
  options: Array<{ label: string; points: 0 | 1 | 2 }>;
};

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "interaction",
    domain: "interaction",
    prompt: "Someone asks: “What do you recommend?” Which answer keeps the exchange moving?",
    options: [
      { label: "I don't know.", points: 0 },
      { label: "I recommend the chicken. What about you?", points: 2 },
      { label: "Translate please.", points: 0 },
    ],
  },
  {
    id: "speaking",
    domain: "speaking",
    prompt: "You need to explain your morning in one minute. What is the useful move?",
    options: [
      { label: "Three short connected sentences.", points: 2 },
      { label: "Wait until every sentence is perfect.", points: 0 },
      { label: "Translate each sentence before saying it.", points: 0 },
    ],
  },
  {
    id: "listening",
    domain: "listening",
    prompt: "You hear: “Boarding starts at 19:40 at gate 12.” What matters?",
    options: [
      { label: "Only “boarding”.", points: 0 },
      { label: "19:40 and gate 12.", points: 2 },
      { label: "The person speaking is tired.", points: 0 },
    ],
  },
  {
    id: "writing",
    domain: "writing",
    prompt: "You need to tell a colleague you will be late. Which message is usable?",
    options: [
      { label: "Late.", points: 0 },
      { label: "Hi, I'm running ten minutes late. See you soon.", points: 2 },
      { label: "I will come after ten minute because traffic.", points: 1 },
    ],
  },
  {
    id: "grammar",
    domain: "grammar",
    prompt: "Which question is correctly formed?",
    options: [
      { label: "Where is the seminar room?", points: 2 },
      { label: "Where the seminar room is?", points: 1 },
      { label: "Where seminar room?", points: 0 },
    ],
  },
];

export function diagnosticLevel(score: number): DiagnosticLevel {
  if (score <= 3) return "A1";
  if (score <= 6) return "A2";
  if (score <= 8) return "A2+";
  return "B1";
}

export function diagnosticSummary(score: number): string {
  switch (diagnosticLevel(score)) {
    case "A1":
      return "Reprendre les automatismes essentiels avant d'augmenter la complexité.";
    case "A2":
      return "Une base fonctionnelle est visible ; le travail doit surtout créer de l'aisance en situation.";
    case "A2+":
      return "Les réflexes A2 sont bien présents ; les prochaines preuves peuvent commencer à tirer vers B1.";
    case "B1":
      return "Plusieurs compétences semblent prêtes pour des tâches plus ouvertes. Ce repère reste indicatif.";
  }
}

export function diagnosticScore(
  answers: Record<string, string>,
): number {
  return DIAGNOSTIC_QUESTIONS.reduce((total, question) => {
    const selected = answers[question.id];
    return total + (question.options.find((option) => option.label === selected)?.points ?? 0);
  }, 0);
}
