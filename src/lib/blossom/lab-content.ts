export type GrammarTask = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  target: string;
};

export const GRAMMAR_TASKS: GrammarTask[] = [
  { id: "grammar-question-1", prompt: "Quelle phrase demande naturellement une recommandation ?", choices: ["What you recommend?", "What do you recommend?", "What are you recommend?"], answer: "What do you recommend?", explanation: "Au présent simple, do porte la structure interrogative.", target: "Question au présent simple" },
  { id: "grammar-question-2", prompt: "Complétez : “I ___ the fish.”", choices: ["will have", "am have", "have to"], answer: "will have", explanation: "I'll have sert à annoncer une commande ou un choix au moment de décider.", target: "I'll have…" },
  { id: "grammar-question-3", prompt: "Quelle formule demande poliment de répéter ?", choices: ["Could you repeat that?", "Could you to repeat that?", "Could repeat you that?"], answer: "Could you repeat that?", explanation: "Après could, on garde la base verbale.", target: "Modal + base verbale" },
  { id: "grammar-question-4", prompt: "Quel passé simple est correct ?", choices: ["Yesterday I walk to the market.", "Yesterday I walked to the market.", "Yesterday I walking to the market."], answer: "Yesterday I walked to the market.", explanation: "Walk est régulier : walked.", target: "Past simple régulier" },
  { id: "grammar-question-5", prompt: "Quelle relance rend le tour de parole à l'autre personne ?", choices: ["What about you?", "What about your?", "What you about?"], answer: "What about you?", explanation: "What about you? est une relance courte et complète.", target: "Relance interactionnelle" },
];

export type ListeningTask = {
  id: string;
  audioText: string;
  question: string;
  choices: string[];
  answer: string;
  detail: string;
  level: "A2";
};

export const LISTENING_TASKS: ListeningTask[] = [
  { id: "listen-1", audioText: "Boarding starts at seven forty at gate twelve.", question: "À quelle porte commence l'embarquement ?", choices: ["Gate 10", "Gate 12", "Gate 20"], answer: "Gate 12", detail: "Le numéro utile arrive en fin de phrase.", level: "A2" },
  { id: "listen-2", audioText: "The restaurant opens at seven, but the kitchen closes at nine.", question: "Quelle information est vraie ?", choices: ["The kitchen opens at nine.", "The restaurant opens at seven.", "The restaurant closes at seven."], answer: "The restaurant opens at seven.", detail: "Le premier repère temporel décrit l'ouverture.", level: "A2" },
  { id: "listen-3", audioText: "These pods are four euros for three.", question: "Combien coûtent trois gousses ?", choices: ["3 euros", "4 euros", "13 euros"], answer: "4 euros", detail: "Le prix indiqué correspond au lot de trois.", level: "A2" },
  { id: "listen-4", audioText: "It's on the second floor, left of the library.", question: "Où se trouve le lieu ?", choices: ["On the ground floor", "On the second floor, left of the library", "Behind the café"], answer: "On the second floor, left of the library", detail: "L'étage et le repère spatial arrivent dans la même phrase.", level: "A2" },
];

export type WritingPrompt = {
  id: string;
  title: string;
  situation: string;
  task: string;
  model: string;
  checks: Array<{ id: string; label: string }>;
};

export const WRITING_PROMPTS: WritingPrompt[] = [
  { id: "write-after-class", title: "Un message après le cours", situation: "Vous écrivez à un collègue anglophone pour confirmer l'heure du déjeuner.", task: "Écrivez 2 à 4 phrases en anglais. Confirmez l'heure, proposez un lieu et terminez poliment.", model: "Hi Noah, lunch at 12:30 at the café? See you there!", checks: [{ id: "check-info", label: "J'ai donné une information claire." }, { id: "check-place", label: "J'ai proposé ou confirmé un lieu." }, { id: "check-close", label: "J'ai terminé avec une formule naturelle." }] },
  { id: "write-recommendation", title: "Une recommandation simple", situation: "Un ami vous demande quoi manger à Saint-Pierre.", task: "Écrivez une recommandation courte avec un plat et une raison.", model: "I'd recommend the catch of the day. It's fresh and simple.", checks: [{ id: "check-choice", label: "J'ai recommandé quelque chose de précis." }, { id: "check-reason", label: "J'ai donné une raison compréhensible." }, { id: "check-natural", label: "Ma phrase reste courte et naturelle." }] },
];

export function speakSyntheticEnglish(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
