/**
 * Extra library readings — Réunion light, short enough to read aloud.
 * Merged into LIBRARY in data.ts.
 */
export type LibraryDocExtra = {
  id: string;
  title: string;
  blurb: string;
  language: string;
  level: string;
  minutes: number;
  image: string;
  body: string;
};

export const EXTRA_LIBRARY: LibraryDocExtra[] = [
  {
    id: "lib-cyclone-talk",
    title: "Talking about the weather without panic",
    blurb: "Rain, wind, a closed road — useful small talk on the island.",
    language: "English",
    level: "A2",
    minutes: 4,
    image: "/images/reunion-coast.jpg",
    body: "The sky turned dark before noon. People at the bus stop talked about the wind, not the news. Is the road still open? Not this morning. You answer with one clear sentence and ask one question back. Weather talk here is practical: where is safe, when to leave, whether the market will open.",
  },
  {
    id: "lib-pharmacy-simple",
    title: "At the pharmacy counter",
    blurb: "Name the problem. Ask for advice. Stay polite.",
    language: "English",
    level: "A2",
    minutes: 3,
    image: "/images/cafe.jpg",
    body: "You need something for a headache. You say so simply. The pharmacist asks how long it has lasted. You answer, listen to the dose, and repeat it once to be sure. No long story is required. Clarity is kindness here.",
  },
  {
    id: "lib-vanilla-story",
    title: "Three sentences about vanilla",
    blurb: "A local product, told without a brochure.",
    language: "English",
    level: "A2+",
    minutes: 4,
    image: "/images/vanilla.jpg",
    body: "Vanilla grows on the east coast, where the air is wet and green. The pods take months to cure. When you smell them at the market, the scent is deep, not sweet like candy. If a visitor asks what makes this island special, this is one honest answer.",
  },
  {
    id: "lib-neighbour",
    title: "Borrowing a tool from a neighbour",
    blurb: "Ask, promise to return it, thank them twice.",
    language: "English",
    level: "A2",
    minutes: 3,
    image: "/images/atelier.jpg",
    body: "You need a ladder for ten minutes. You knock, explain why, and promise to bring it back before evening. Your neighbour agrees. The language is ordinary on purpose: please, thank you, I'll bring it back. That is enough to keep the relationship easy.",
  },
  {
    id: "lib-taxi-fair",
    title: "Checking the fare before you sit",
    blurb: "One question that protects both sides.",
    language: "English",
    level: "A2",
    minutes: 3,
    image: "/images/airport.jpg",
    body: "Before you get in, you ask how much it costs to the centre. The driver gives a number. You confirm the place and the price, then sit down. If something is unclear, you ask again. A short confirmation is better than a long argument later.",
  },
  {
    id: "lib-school-gate",
    title: "At the school gate",
    blurb: "Parents, time, a simple arrangement.",
    language: "English",
    level: "A2+",
    minutes: 4,
    image: "/images/atelier.jpg",
    body: "School ends at half past three. Another parent asks if you can wait five minutes. You say yes, then check the time on your phone. When the children come out, you use their names and keep the goodbye short. The language of care is often shorter than the language of worry.",
  },
  {
    id: "lib-email-soft",
    title: "A short email that moves a date",
    blurb: "Polite, direct, one alternative time.",
    language: "English",
    level: "B1",
    minutes: 4,
    image: "/images/atelier.jpg",
    body: "You need to move a meeting. You write three lines: the change, the reason in one clause, and a new time. You ask whether that works. You do not apologise three times. Clarity is respect in writing as much as in speech.",
  },
  {
    id: "lib-creole-bridge",
    title: "When French and English share a table",
    blurb: "Stay in English without pretending the room is monolingual.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/cafe.jpg",
    body: "Someone answers you in French. You smile and continue in English with a slower pace. If a word is missing, you describe it instead of switching. The goal is not purity. The goal is to keep the channel open long enough for meaning to arrive.",
  },
];

export const EXTRA_LIBRARY_GLOSS: Record<string, string> = {
  headache: "mal de tête",
  dose: "dose",
  pharmacist: "pharmacien·ne",
  cure: "sécher, préparer (vanille)",
  scent: "parfum, odeur",
  ladder: "échelle",
  neighbour: "voisin·e",
  fare: "tarif",
  driver: "chauffeur",
  confirm: "confirmer",
  arrangement: "arrangement",
  clause: "proposition, membre de phrase",
  monolingual: "monolingue",
  channel: "canal (de communication)",
  pace: "rythme",
};
