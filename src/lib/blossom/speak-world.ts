/**
 * Speak World — living substrate for Speak Rooms.
 * Places, people, pressures, cultural notes, and real-world event anchors
 * for Réunion / Indian Ocean / global English contexts.
 * Designed so composition never repeats the same room twice.
 */

export type PlaceArchetype =
  | "cafe"
  | "market"
  | "airport"
  | "hotel"
  | "office"
  | "campus"
  | "coast"
  | "clinic"
  | "shop"
  | "social"
  | "transit"
  | "home";

export type EventAnchor = {
  id: string;
  title: string;
  kind: "seasonal" | "local" | "global" | "cultural" | "weather" | "news";
  window: { monthStart: number; monthEnd: number } | "always";
  placeBias: PlaceArchetype[];
  atmosphere: string;
  talkHooks: string[];
  vocabulary: string[];
};

export type PlaceNode = {
  id: string;
  archetype: PlaceArchetype;
  titleFr: string;
  titleEn: string;
  setting: string;
  image: string;
  sensory: string[];
  localColour: string[];
  roles: Array<{ role: string; namePool: string[]; stance: string }>;
};

export type PressurePattern = {
  id: string;
  label: string;
  description: string;
  timePressure: "low" | "medium" | "high";
  socialRisk: "low" | "medium" | "high";
};

export type DialogueBeat = {
  id: string;
  goal: string;
  youHint: string;
  aiOpeners: string[];
  recovery: string[];
  stretch?: string;
};

/** Indian Ocean / Réunion-grounded places */
export const PLACES: PlaceNode[] = [
  {
    id: "comptoir-sp",
    archetype: "cafe",
    titleFr: "Le Comptoir",
    titleEn: "The Comptoir café",
    setting: "Terrasse ombragée, Saint-Pierre — fin d'après-midi, machines à café, tables qui se remplissent.",
    image: "/images/cafe.jpg",
    sensory: [
      "Une machine à espresso souffle derrière le comptoir.",
      "L'ombre des bananiers bouge sur les tables.",
      "On entend le bruit de la route et des conversations créoles.",
    ],
    localColour: [
      "Le flan vanille du jour est affiché au tableau.",
      "Un groupe de collègues d'un bureau voisin vient régulièrement.",
      "Le serveur bascule naturellement entre français et anglais avec les touristes.",
    ],
    roles: [
      { role: "Barista", namePool: ["Maya", "Sam", "Léna", "Theo"], stance: "Rapide, amical, un peu pressé aux heures de pointe." },
      { role: "Client régulier", namePool: ["Noah", "Inès", "Hugo"], stance: "Déjà installé, ouvert à une courte conversation." },
    ],
  },
  {
    id: "marche-couvert",
    archetype: "market",
    titleFr: "Marché couvert",
    titleEn: "Covered market",
    setting: "Étals de vanille, fruits, épices — Saint-Pierre, lumière filtrée sous le toit.",
    image: "/images/marche.jpg",
    sensory: [
      "L'odeur de vanille et de fruits mûrs.",
      "Des voix qui négocient le prix en créole et en français.",
      "Des cartons de litchis encore humides.",
    ],
    localColour: [
      "Les gousses de vanille de l'Est sont marquées à la main.",
      "Un vendeur propose toujours de faire sentir avant d'acheter.",
      "Le week-end, des visiteurs de la côte ouest cherchent des souvenirs.",
    ],
    roles: [
      { role: "Vendeur", namePool: ["Paul", "Marie", "Jean", "Soleil"], stance: "Patient avec les touristes, direct avec les habitués." },
      { role: "Voisine d'étal", namePool: ["Rita", "Claire"], stance: "Écoute, parfois intervient pour conseiller." },
    ],
  },
  {
    id: "aeroport-run",
    archetype: "airport",
    titleFr: "Aéroport Roland Garros",
    titleEn: "Roland Garros Airport",
    setting: "Comptoir d'enregistrement, vol du soir vers Paris ou Maurice.",
    image: "/images/airport.jpg",
    sensory: [
      "Annonces en français et en anglais.",
      "Valises qui roulent sur le carrelage.",
      "Lumière froide des néons de nuit.",
    ],
    localColour: [
      "Les vols vers la métropole sont souvent pleins en période scolaire.",
      "Le personnel est habitué aux allers-retours famille.",
      "Les retards de correspondance se négocient calmement.",
    ],
    roles: [
      { role: "Agent d'enregistrement", namePool: ["Alex", "Priya", "Marc"], stance: "Procédural, poli, un peu fatigué en fin de service." },
      { role: "Voyageur à côté", namePool: ["Sofia", "Ken"], stance: "Cherche aussi une info, peut partager un renseignement." },
    ],
  },
  {
    id: "maison-creole",
    archetype: "hotel",
    titleFr: "Maison créole",
    titleEn: "Creole guesthouse",
    setting: "Réception d'une maison créole, volets ouverts sur un jardin.",
    image: "/images/atelier.jpg",
    sensory: [
      "Vent tiède dans les volets.",
      "Parfum de frangipanier dans le jardin.",
      "Carrelage frais sous les pieds.",
    ],
    localColour: [
      "Le petit-déjeuner est servi sous la varangue.",
      "On recommande souvent la plage de Grande Anse ou le marché du matin.",
      "Les chambres côté jardin sont plus calmes.",
    ],
    roles: [
      { role: "Réceptionniste", namePool: ["Élodie", "Yves", "Nadia"], stance: "Accueillant, précis sur les horaires, fier du lieu." },
    ],
  },
  {
    id: "bureau-sp",
    archetype: "office",
    titleFr: "Bureau · Saint-Pierre",
    titleEn: "Office · Saint-Pierre",
    setting: "Open space calme, lumière de fin de matinée, pause café qui s'étire.",
    image: "/images/atelier.jpg",
    sensory: [
      "Clavier et imprimante en fond.",
      "Odeur de café de la machine collective.",
      "Une réunion qui se termine dans la salle d'à côté.",
    ],
    localColour: [
      "Les équipes mélangent français et anglais selon les clients.",
      "La pause de midi est sacrée — on parle de la côte, pas seulement du travail.",
      "Un collègue en visio avec la métropole peut passer.",
    ],
    roles: [
      { role: "Collègue", namePool: ["Noah", "Léa", "Thomas", "Amina"], stance: "Accessible, un peu pressé avant une réunion." },
      { role: "Manager", namePool: ["Sarah", "David"], stance: "Direct, attend des réponses claires." },
    ],
  },
  {
    id: "campus-run",
    archetype: "campus",
    titleFr: "Campus universitaire",
    titleEn: "University campus",
    setting: "Couloir entre deux bâtiments, panneaux d'orientation, étudiants qui passent.",
    image: "/images/atelier.jpg",
    sensory: [
      "Sacs à dos qui glissent sur les épaules.",
      "Affiches de séminaires et de clubs.",
      "Cloche lointaine d'un bâtiment.",
    ],
    localColour: [
      "Beaucoup d'étudiants viennent de toute l'île et de l'océan Indien.",
      "Les groupes d'étude se forment souvent le jeudi.",
      "La bibliothèque est le point de repère principal.",
    ],
    roles: [
      { role: "Étudiant", namePool: ["Inès", "Hugo", "Maya", "Ken"], stance: "Ouvert, un peu pressé entre deux cours." },
      { role: "Bibliothécaire", namePool: ["Claire"], stance: "Précise, aide sans infantiliser." },
    ],
  },
  {
    id: "front-mer",
    archetype: "coast",
    titleFr: "Front de mer",
    titleEn: "Seafront",
    setting: "Promenade le long de la côte, vent, vagues, gens qui marchent.",
    image: "/images/reunion-coast.jpg",
    sensory: [
      "Sel dans l'air.",
      "Bruit régulier des vagues.",
      "Chaussures de sport sur le bitume chaud.",
    ],
    localColour: [
      "Les locaux marchent tôt le matin ou en fin d'après-midi.",
      "On parle souvent de la mer, des pêcheurs, du weekend.",
      "Un kiosque vend des jus et des samoussas.",
    ],
    roles: [
      { role: "Promeneur", namePool: ["Rita", "Paul", "Sofia"], stance: "Détendu, content d'échanger quelques phrases." },
      { role: "Vendeur de kiosque", namePool: ["Jean"], stance: "Rapide, sourit, habitué aux demandes simples." },
    ],
  },
  {
    id: "pharmacie",
    archetype: "clinic",
    titleFr: "Pharmacie / cabinet",
    titleEn: "Pharmacy / clinic",
    setting: "Comptoir calme, files courtes, affiches de prévention.",
    image: "/images/atelier.jpg",
    sensory: [
      "Odeur discrète de désinfectant.",
      "Sonnerie douce à l'entrée.",
      "Étagères de boîtes alignées.",
    ],
    localColour: [
      "On explique souvent les posologies en français d'abord.",
      "Les touristes demandent des crèmes solaires et anti-moustiques.",
      "Le personnel est patient avec les formulations hésitantes.",
    ],
    roles: [
      { role: "Pharmacien", namePool: ["Dr. Patel", "Anne", "Marc"], stance: "Calme, clarifie sans juger." },
    ],
  },
  {
    id: "boutique",
    archetype: "shop",
    titleFr: "Boutique",
    titleEn: "Shop",
    setting: "Petite boutique de vêtements ou d'artisanat, musique basse.",
    image: "/images/marche.jpg",
    sensory: [
      "Tissu sous les doigts.",
      "Musique légère en fond.",
      "Lumière sur les présentoirs.",
    ],
    localColour: [
      "Les tailles européennes et locales se mélangent.",
      "On peut demander un conseil sans obligation d'acheter.",
      "Les souvenirs créoles côtoient les marques importées.",
    ],
    roles: [
      { role: "Vendeur", namePool: ["Léna", "Tom", "Nadia"], stance: "Serviable, propose sans insister." },
    ],
  },
  {
    id: "table-amis",
    archetype: "social",
    titleFr: "Table entre amis",
    titleEn: "Table with friends",
    setting: "Une table, deux ou trois tasses, rien d'officiel — on se retrouve.",
    image: "/images/cafe.jpg",
    sensory: [
      "Rires d'une table voisine.",
      "Tasses qui s'entrechoquent légèrement.",
      "Lumière du soir sur les visages.",
    ],
    localColour: [
      "On parle de la semaine, du weekend, d'un projet commun.",
      "Les plans se font souvent au marché ou sur la côte.",
      "Personne ne corrige la grammaire à voix haute.",
    ],
    roles: [
      { role: "Ami", namePool: ["Noah", "Inès", "Sofia", "Ken"], stance: "Chaleureux, curieux de votre semaine." },
    ],
  },
  {
    id: "bus-taxi",
    archetype: "transit",
    titleFr: "Bus / taxi",
    titleEn: "Bus / taxi",
    setting: "File d'attente ou intérieur de véhicule, destination à confirmer.",
    image: "/images/airport.jpg",
    sensory: [
      "Moteur au ralenti.",
      "Vent par la fenêtre ouverte.",
      "Annonces ou radio en fond.",
    ],
    localColour: [
      "Les trajets côtiers passent par des villages qu'on nomme à voix haute.",
      "On confirme toujours la destination avant de monter.",
      "Les horaires peuvent être souples — mieux vaut demander.",
    ],
    roles: [
      { role: "Chauffeur", namePool: ["José", "Marie", "Alain"], stance: "Pratique, répond aux questions de trajet." },
      { role: "Passager", namePool: ["Hugo"], stance: "Peut indiquer un arrêt ou un changement." },
    ],
  },
];

/** Real-world / seasonal anchors — inject living context into rooms */
export const EVENT_ANCHORS: EventAnchor[] = [
  {
    id: "cyclone-season",
    title: "Saison cyclonique",
    kind: "seasonal",
    window: { monthStart: 11, monthEnd: 4 },
    placeBias: ["coast", "office", "cafe", "market"],
    atmosphere: "Le ciel est lourd ; on parle de la mer et des alertes météo.",
    talkHooks: [
      "Have you checked the weather for the weekend?",
      "They're talking about a depression near Madagascar.",
      "Do you have plans if the wind picks up?",
    ],
    vocabulary: ["storm", "alert", "shelter", "forecast", "coast"],
  },
  {
    id: "vanilla-harvest",
    title: "Récolte de vanille",
    kind: "seasonal",
    window: { monthStart: 6, monthEnd: 9 },
    placeBias: ["market", "cafe", "shop"],
    atmosphere: "Les gousses de l'Est arrivent au marché ; l'odeur traverse les allées.",
    talkHooks: [
      "These pods are from the east coast — would you like to smell them?",
      "Vanilla prices went up this year, didn't they?",
      "Are you looking for cooking vanilla or something for gifts?",
    ],
    vocabulary: ["pod", "harvest", "east coast", "scent", "wrap"],
  },
  {
    id: "school-holidays",
    title: "Vacances scolaires",
    kind: "seasonal",
    window: { monthStart: 7, monthEnd: 8 },
    placeBias: ["airport", "hotel", "coast", "cafe"],
    atmosphere: "Files plus longues à l'aéroport, familles en mouvement, chambres côté mer prises d'assaut.",
    talkHooks: [
      "Is this your first time on the island?",
      "The flights to Paris are full this week.",
      "Where are you staying — near the coast?",
    ],
    vocabulary: ["holiday", "booking", "flight", "family", "crowded"],
  },
  {
    id: "diwali-io",
    title: "Dipavali / lumières",
    kind: "cultural",
    window: { monthStart: 10, monthEnd: 11 },
    placeBias: ["market", "social", "shop", "cafe"],
    atmosphere: "Lumières, sucreries, visites entre familles — l'île célèbre à sa façon.",
    talkHooks: [
      "Are you celebrating this week?",
      "The lights in the neighbourhood look beautiful.",
      "Have you tried the sweets from the market?",
    ],
    vocabulary: ["lights", "celebrate", "neighbourhood", "sweet", "visit"],
  },
  {
    id: "fete-mer",
    title: "Fête de la mer",
    kind: "local",
    window: { monthStart: 5, monthEnd: 6 },
    placeBias: ["coast", "market", "cafe"],
    atmosphere: "Bateaux, stands, musique près du front de mer.",
    talkHooks: [
      "Are you going down to the seafront this weekend?",
      "The boats look busy today.",
      "Have you tried the grilled fish from the stalls?",
    ],
    vocabulary: ["seafront", "boat", "stall", "grilled", "weekend"],
  },
  {
    id: "heat-wave",
    title: "Forte chaleur",
    kind: "weather",
    window: "always",
    placeBias: ["cafe", "office", "coast", "market"],
    atmosphere: "L'air est lourd ; on cherche l'ombre et l'eau fraîche.",
    talkHooks: [
      "It's really warm today — do you want some water?",
      "Shall we sit in the shade?",
      "I might wait until the evening to walk.",
    ],
    vocabulary: ["shade", "water", "warm", "evening", "breeze"],
  },
  {
    id: "remote-meeting",
    title: "Réunion à distance",
    kind: "global",
    window: "always",
    placeBias: ["office", "cafe", "home"],
    atmosphere: "Écrans, fuseaux horaires, clients ou collègues en métropole.",
    talkHooks: [
      "How did the call with Paris go?",
      "Are you free after the meeting?",
      "Did they understand the timeline?",
    ],
    vocabulary: ["call", "timezone", "timeline", "client", "screen"],
  },
  {
    id: "new-colleague",
    title: "Nouveau collègue",
    kind: "local",
    window: "always",
    placeBias: ["office", "cafe", "social"],
    atmosphere: "Quelqu'un vient d'arriver dans l'équipe ; les présentations circulent.",
    talkHooks: [
      "Have you met the new person on the team?",
      "Where were you working before?",
      "Can I show you where the coffee is?",
    ],
    vocabulary: ["team", "introduce", "before", "coffee", "desk"],
  },
  {
    id: "market-morning",
    title: "Matin de marché",
    kind: "local",
    window: "always",
    placeBias: ["market", "cafe", "coast"],
    atmosphere: "Tôt, les étals se montent, les habitués passent avant la chaleur.",
    talkHooks: [
      "You're here early — looking for anything special?",
      "The fruit looks good this morning.",
      "Do you come every Saturday?",
    ],
    vocabulary: ["early", "fruit", "Saturday", "fresh", "regular"],
  },
  {
    id: "job-interview-week",
    title: "Semaine d'entretiens",
    kind: "global",
    window: "always",
    placeBias: ["office", "cafe", "campus"],
    atmosphere: "Quelqu'un prépare ou sort d'un entretien ; les questions tournent autour du parcours.",
    talkHooks: [
      "How did the interview go?",
      "What are you hoping to learn in this role?",
      "Do you have a question for us?",
    ],
    vocabulary: ["interview", "role", "experience", "learn", "team"],
  },
];

export const PRESSURES: PressurePattern[] = [
  {
    id: "time-short",
    label: "Peu de temps",
    description: "Vous avez deux à trois minutes avant de devoir partir.",
    timePressure: "high",
    socialRisk: "low",
  },
  {
    id: "queue-watching",
    label: "File d'attente",
    description: "D'autres personnes attendent derrière vous.",
    timePressure: "medium",
    socialRisk: "medium",
  },
  {
    id: "first-meeting",
    label: "Première rencontre",
    description: "Vous ne connaissez pas encore cette personne.",
    timePressure: "low",
    socialRisk: "medium",
  },
  {
    id: "noise",
    label: "Bruit",
    description: "Il faut se faire entendre sans crier.",
    timePressure: "low",
    socialRisk: "low",
  },
  {
    id: "stakes",
    label: "Enjeu réel",
    description: "La réponse compte — billet, rendez-vous, conseil médical.",
    timePressure: "medium",
    socialRisk: "high",
  },
  {
    id: "friendly",
    label: "Amical",
    description: "Aucune urgence ; l'échange peut s'étirer un peu.",
    timePressure: "low",
    socialRisk: "low",
  },
];

/** Beat libraries by archetypal goal — agents compose sequences from these */
export const BEAT_LIBRARY: Record<string, DialogueBeat[]> = {
  open: [
    {
      id: "greet-service",
      goal: "Ouvrir l'échange de service",
      youHint: "Saluez et indiquez ce que vous cherchez, en une ou deux phrases.",
      aiOpeners: [
        "Hi! What can I get for you today?",
        "Hello — looking for anything in particular?",
        "Good afternoon. How can I help?",
        "Welcome. Do you have a reservation?",
      ],
      recovery: ["Sorry, could you say that again?", "I mean…", "One moment, please."],
    },
    {
      id: "greet-social",
      goal: "Ouvrir une conversation sociale",
      youHint: "Répondez au salut et donnez une nouvelle courte sur votre semaine.",
      aiOpeners: [
        "It's good to see you. How has your week been?",
        "Hey — I was hoping I'd run into you. How are things?",
        "Hi! Long time. What have you been up to?",
      ],
      recovery: ["Let me think for a second.", "Sorry, could you repeat that?"],
    },
    {
      id: "greet-formal",
      goal: "Ouvrir un cadre formel",
      youHint: "Présentez-vous brièvement ou confirmez votre présence.",
      aiOpeners: [
        "Thanks for coming in. Could you tell me a little about yourself?",
        "Good morning. Passport and destination, please.",
        "Hello. Are you here for the appointment?",
      ],
      recovery: ["Sorry, could you say that again?", "I mean…"],
    },
  ],
  choose: [
    {
      id: "choose-item",
      goal: "Choisir et commander",
      youHint: "Choisissez clairement, puis posez une question si besoin.",
      aiOpeners: [
        "We have a vanilla flan, and the catch of the day. What are you in the mood for?",
        "These are from the east coast. Would you like to try one?",
        "Window or aisle? And do you have any bags to check?",
        "You're in room 12, garden side. Breakfast is from 7 to 10.",
      ],
      recovery: ["Could you repeat the options?", "I'll have…", "What do you recommend?"],
      stretch: "Ajoutez une préférence (sans / with / a bit less).",
    },
  ],
  clarify: [
    {
      id: "clarify-info",
      goal: "Clarifier une information",
      youHint: "Demandez une précision sans repasser au français.",
      aiOpeners: [
        "Boarding starts at 19:40 at gate 12. Have a good flight.",
        "Four euros for three. I can wrap them for you.",
        "The restaurant opens at 19:00. I'll have someone take your bag.",
        "It's on the second floor, left of the library.",
      ],
      recovery: ["Sorry, could you say that again?", "Where exactly?", "What time was that?"],
    },
  ],
  relance: [
    {
      id: "relance-soft",
      goal: "Relancer l'échange",
      youHint: "Posez une petite question en retour, simple.",
      aiOpeners: [
        "That sounds full. Do you have plans for the weekend?",
        "Perfect. I'll bring that over. Would you like some water?",
        "There's a study group on Thursdays if you want to join.",
        "I'd like that. Shall we meet by the market?",
      ],
      recovery: ["What about you?", "And you?", "Could you tell me more?"],
      stretch: "Proposez un lieu ou un moment concret.",
    },
  ],
  close: [
    {
      id: "close-warm",
      goal: "Clore poliment",
      youHint: "Remerciez et concluez en une phrase.",
      aiOpeners: [
        "Great — see you then.",
        "You're all set. Take care.",
        "Pleasure talking. Have a good day.",
        "I'll leave you to it. Bye for now.",
      ],
      recovery: ["Thank you.", "See you.", "Have a good one."],
    },
  ],
  pressure: [
    {
      id: "pressure-time",
      goal: "Gérer la pression du temps",
      youHint: "Répondez plus court ; une phrase claire suffit.",
      aiOpeners: [
        "I need to run soon — anything else?",
        "There's a queue forming. Shall I wrap this up?",
        "My next meeting is in five minutes. Can we keep this short?",
      ],
      recovery: ["Just one more thing…", "Quickly — …", "I'll be brief."],
    },
  ],
};

export const LEVEL_KITS: Record<
  string,
  { maxClause: number; allowStretch: boolean; rescueBias: "high" | "medium" | "low" }
> = {
  A1: { maxClause: 1, allowStretch: false, rescueBias: "high" },
  A2: { maxClause: 2, allowStretch: true, rescueBias: "high" },
  B1: { maxClause: 3, allowStretch: true, rescueBias: "medium" },
  B2: { maxClause: 4, allowStretch: true, rescueBias: "low" },
};
