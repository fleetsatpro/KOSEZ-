import type { StageId } from "./engine";
type PronlabKind = "word" | "sentence" | "phoneme" | "spontaneous";

export const PLANT_IMAGE: Record<StageId, string> = {
  seed: "/images/vanilla.jpg",
  growing: "/images/plant-growing.jpg",
  flourishing: "/images/plant-growing.jpg",
  blossoming: "/images/botanical.jpg",
  independent: "/images/botanical.jpg",
};

function dateFromToday(daysAhead: number): string {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function rangeLabelFromToday(startDays: number, endDays: number): string {
  const format = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const start = format.format(new Date(dateFromToday(startDays) + "T12:00:00Z"));
  const end = format.format(new Date(dateFromToday(endDays) + "T12:00:00Z"));
  const [startDay, ...startMonthParts] = start.split(" ");
  const [endDay, ...endMonthParts] = end.split(" ");
  const startMonth = startMonthParts.join(" ");
  const endMonth = endMonthParts.join(" ");
  return startMonth === endMonth
    ? `${startDay}–${endDay} ${endMonth}`
    : `${start} – ${end}`;
}

export type MissionScene = {
  time: string;
  atmosphere: string;
  sensoryCue: string;
  people: Array<{
    role: string;
    name: string;
    intent: string;
  }>;
  pressure: string;
  culturalNote: string;
  languageKit: Array<{
    phrase: string;
    meaning: string;
    use: string;
  }>;
  rescuePhrases: Array<{
    phrase: string;
    meaning: string;
  }>;
  conversationTurns: Array<{
    label: string;
    goal: string;
    optional?: boolean;
  }>;
  constraints: string[];
};

export type Mission = {
  id: string;
  title: string;
  prompt: string;
  context: string;
  durationMin: number;
  level: string;
  language: string;
  place: string;
  sceneImage?: string;
  supportPhrase?: string;
  successSignals?: string[];
  realWorldInstruction?: string;
  stretch?: string;
  scene?: MissionScene;
};

export const TODAY_MISSION: Mission = {
  id: "mission-today",
  title: "What do you recommend?",
  prompt:
    "Demandez à un collègue ce qu'il recommande pour le déjeuner — en anglais, sans passer par le français.",
  context:
    "Deux à quatre minutes, dans la vraie vie. L'objectif n'est pas la phrase parfaite : c'est d'oser la question.",
  durationMin: 4,
  level: "A2",
  language: "English",
  place: "Au bureau, à Saint-Pierre",
  sceneImage: "/images/atelier.jpg",
  supportPhrase: "What do you recommend?",
  successSignals: [
    "Vous ouvrez réellement la conversation.",
    "Vous utilisez la phrase travaillée au moins une fois.",
    "Vous restez dans la langue cible pendant l'échange.",
  ],
  realWorldInstruction:
    "Au déjeuner, posez réellement la question à un collègue. Une réponse courte suffit : le but est d'ouvrir l'échange.",
  stretch:
    "Après la première réponse, ajoutez une relance courte si elle vient naturellement.",
  scene: {
    time: "12:18 · pause déjeuner",
    atmosphere: "Terrasse bruyante, lumière chaude, service rapide.",
    sensoryCue: "Une machine à café souffle derrière vous ; les tables se remplissent.",
    people: [
      {
        role: "Collègue",
        name: "Noah",
        intent: "Il a déjà choisi son plat et vous laisse décider.",
      },
      {
        role: "Serveuse",
        name: "Maya",
        intent: "Elle écoute, puis attend votre commande.",
      },
    ],
    pressure:
      "Vous avez peu de temps : choisissez, posez une question, puis tenez un tour de conversation.",
    culturalNote:
      "Une recommandation n'est pas une faveur énorme : en anglais, une question courte suffit pour ouvrir l'échange.",
    languageKit: [
      {
        phrase: "What do you recommend?",
        meaning: "Qu'est-ce que vous recommandez ?",
        use: "Ouvrir la conversation.",
      },
      {
        phrase: "I'll have …",
        meaning: "Je vais prendre …",
        use: "Passer de la question à l'action.",
      },
      {
        phrase: "What about you?",
        meaning: "Et toi / et vous ?",
        use: "Renvoyer la conversation.",
      },
      {
        phrase: "Could you repeat that?",
        meaning: "Pouvez-vous répéter ?",
        use: "Récupérer sans repasser au français.",
      },
    ],
    rescuePhrases: [
      {
        phrase: "Sorry, could you say that again?",
        meaning: "Demander une répétition sans abandonner l'anglais.",
      },
      {
        phrase: "I mean …",
        meaning: "Réparer une phrase sans recommencer depuis zéro.",
      },
      {
        phrase: "Let me think for a second.",
        meaning: "Gagner une seconde sans remplir le silence.",
      },
    ],
    conversationTurns: [
      { label: "Ouvrir", goal: "Poser la question de recommandation." },
      { label: "Choisir", goal: "Dire ce que vous allez prendre." },
      { label: "Relancer", goal: "Poser une petite question en retour.", optional: true },
      { label: "Récupérer", goal: "Demander de répéter si nécessaire.", optional: true },
    ],
    constraints: [
      "Pas de traduction mot à mot.",
      "Une phrase courte vaut mieux qu'une phrase préparée.",
      "Le silence de deux secondes est autorisé.",
    ],
  },
};

export const B1_TODAY_MISSION: Mission = {
  id: "mission-today-b1",
  title: "The plan changed — find another way",
  prompt:
    "Expliquez à un collègue qu'un plan vient de changer, proposez une alternative et vérifiez que la nouvelle solution lui convient.",
  context:
    "Cinq à huit minutes. L'objectif n'est pas de réciter un texte : c'est de garder l'échange vivant quand la situation dévie.",
  durationMin: 6,
  level: "B1",
  language: "English",
  place: "Au bureau, à Saint-Pierre",
  sceneImage: "/images/atelier.jpg",
  supportPhrase: "The plan has changed. Could we… instead?",
  successSignals: [
    "Vous décrivez clairement ce qui a changé.",
    "Vous proposez une alternative avec une raison.",
    "Vous vérifiez l'accord de l'autre personne.",
    "Vous gardez une formulation coopérative même si la première solution ne fonctionne plus.",
  ],
  realWorldInstruction:
    "Imaginez un changement réel cette semaine : retard, salle indisponible, rendez-vous déplacé. Expliquez-le en anglais et proposez une alternative.",
  stretch:
    "Ajoutez une deuxième option ou reconnaissez une contrainte avant de conclure.",
  scene: {
    time: "15:42 · plan de travail bouleversé",
    atmosphere: "La salle prévue est occupée ; deux collègues attendent une solution.",
    sensoryCue: "Un couloir animé, des pas derrière la porte, un téléphone qui vibre.",
    people: [
      {
        role: "Collègue",
        name: "Noah",
        intent: "Il veut avancer sans perdre dix minutes à chercher une solution parfaite.",
      },
      {
        role: "Collègue",
        name: "Maya",
        intent: "Elle peut accepter une alternative si elle comprend le compromis.",
      },
    ],
    pressure:
      "Le groupe doit décider rapidement, mais une bonne solution doit encore laisser une place à l'autre personne.",
    culturalNote:
      "Une proposition coopérative laisse une porte ouverte : expliquer le problème puis demander « Would that work for you? » garde l'échange partagé.",
    languageKit: [
      {
        phrase: "The plan has changed.",
        meaning: "Le plan a changé.",
        use: "Poser le contexte sans longue introduction.",
      },
      {
        phrase: "Could we… instead?",
        meaning: "Est-ce qu'on pourrait plutôt… ?",
        use: "Proposer une alternative sans imposer.",
      },
      {
        phrase: "That might work, but…",
        meaning: "Ça pourrait fonctionner, mais…",
        use: "Nuancer une proposition.",
      },
      {
        phrase: "Would that work for you?",
        meaning: "Est-ce que cela vous conviendrait ?",
        use: "Vérifier l'accord.",
      },
    ],
    rescuePhrases: [
      {
        phrase: "What I mean is…",
        meaning: "Reformuler sans repartir de zéro.",
      },
      {
        phrase: "We could also try…",
        meaning: "Ouvrir une deuxième option.",
      },
      {
        phrase: "Let me make sure I understand.",
        meaning: "Vérifier une contrainte avant de conclure.",
      },
    ],
    conversationTurns: [
      { label: "Constater", goal: "Dire clairement ce qui a changé." },
      { label: "Proposer", goal: "Présenter une alternative et sa raison." },
      { label: "Nuancer", goal: "Reconnaître une contrainte ou un compromis.", optional: true },
      { label: "Vérifier", goal: "Demander si la solution convient." },
    ],
    constraints: [
      "Ne récitez pas un script complet.",
      "Une proposition utile vaut mieux qu'une liste d'options.",
      "L'autre personne doit avoir un espace explicite pour accepter ou modifier la solution.",
    ],
  },
};

export function missionForLevel(level: string): Mission {
  return level === "B1" ? B1_TODAY_MISSION : TODAY_MISSION;
}

export function missionForToday(level: string, now = new Date()): Mission {
  const bank = MISSION_BANK.filter((mission) => mission.level === level);
  if (!bank.length) return missionForLevel(level);

  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const index = Math.floor(day / 86_400_000) % bank.length;
  return bank[index]!;
}

export const MISSION_BANK: Mission[] = [
  {
    id: "mission-a1-intro",
    title: "Se présenter en trois phrases",
    prompt: "Dites votre nom, votre ville et une chose que vous aimez à une personne que vous venez de rencontrer.",
    context: "Une minute. Café, campus, travail ou voisinage.",
    durationMin: 3,
    level: "A1",
    language: "English",
    place: "Une première rencontre",
    supportPhrase: "Hi, I'm …",
    successSignals: [
      "Vous dites votre nom sans lire.",
      "Vous donnez une information sur votre lieu.",
      "Vous ajoutez une préférence simple.",
    ],
    realWorldInstruction: "Lors d'une vraie rencontre cette semaine, faites cette mini-présentation en anglais.",
    stretch: "Ajoutez une question simple sur l'autre personne.",
  },
  {
    id: "mission-a1-order",
    title: "Commander simplement",
    prompt: "Saluez, demandez une boisson et dites merci.",
    context: "Deux minutes, dans un café ou un comptoir.",
    durationMin: 2,
    level: "A1",
    language: "English",
    place: "Un café",
    supportPhrase: "I'd like a coffee, please.",
    successSignals: [
      "Vous faites votre demande.",
      "Vous utilisez please.",
      "Vous terminez avec thanks ou thank you.",
    ],
    realWorldInstruction: "À votre prochaine commande possible, utilisez une phrase anglaise simple avant de repasser à votre langue habituelle.",
    stretch: "Ajoutez une préférence : with milk / no sugar.",
  },
  {
    id: "mission-a1-way",
    title: "Demander un lieu",
    prompt: "Demandez où se trouve un lieu proche et vérifiez la réponse.",
    context: "Deux à trois minutes en ville ou sur un campus.",
    durationMin: 3,
    level: "A1",
    language: "English",
    place: "Dans la rue",
    supportPhrase: "Where is the library?",
    successSignals: [
      "Vous posez la question.",
      "Vous écoutez le repère.",
      "Vous dites thank you ou une formule équivalente.",
    ],
    realWorldInstruction: "Si une situation s'y prête, posez une question de lieu en anglais au lieu de préparer mentalement une phrase longue.",
    stretch: "Ajoutez : Is it near here?",
  },

  {
    id: "mission-recommend",
    title: "Recommander un déjeuner",
    prompt: "Recommandez un plat à une personne qui vous demande quoi choisir, puis posez une question en retour.",
    context: "Trois à cinq minutes dans un café, au travail ou pendant une vraie pause.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Un café à Saint-Pierre",
    supportPhrase: "I'd recommend …",
    successSignals: [
      "Vous faites une recommandation claire.",
      "Vous donnez une raison simple.",
      "Vous gardez l'échange ouvert avec une relance.",
    ],
    realWorldInstruction: "Quand quelqu'un vous demande conseil cette semaine, répondez en anglais avant de chercher la phrase parfaite.",
    stretch: "Ajoutez une comparaison courte avec une seconde option.",
    scene: {
      time: "12:10 · pause déjeuner",
      atmosphere: "Une terrasse animée, commandes rapides, peu de temps pour réfléchir.",
      sensoryCue: "Le café, les voix des tables voisines et les couverts couvrent parfois une partie des mots.",
      people: [{ role: "Collègue", name: "Noah", intent: "Il hésite entre deux plats et veut votre avis." }],
      pressure: "Vous devez répondre rapidement puis lui laisser de l'espace.",
      culturalNote: "Une recommandation fonctionne mieux quand elle reste concrète et personnelle.",
      languageKit: [
        { phrase: "I'd recommend …", meaning: "Je recommanderais …", use: "Faire un choix clair." },
        { phrase: "It's really good.", meaning: "C'est vraiment bon.", use: "Donner une raison simple." },
        { phrase: "What about you?", meaning: "Et toi / vous ?", use: "Relancer." },
        { phrase: "Could you repeat that?", meaning: "Pouvez-vous répéter ?", use: "Récupérer une information." },
      ],
      rescuePhrases: [
        { phrase: "Let me think for a second.", meaning: "Gagner une seconde." },
        { phrase: "I'd say …", meaning: "Je dirais …" },
      ],
      conversationTurns: [
        { label: "Écouter", goal: "Comprendre ce que l'autre hésite à choisir." },
        { label: "Recommander", goal: "Donner un choix et une raison." },
        { label: "Relancer", goal: "Renvoyer la conversation." },
      ],
      constraints: ["Une raison suffit.", "Ne traduisez pas à voix haute.", "Une réponse simple vaut mieux qu'une explication longue."],
    },
  },
  {
    id: "mission-directions",
    title: "Donner un chemin",
    prompt: "Expliquez à quelqu'un comment rejoindre un lieu proche, puis vérifiez qu'il a bien compris.",
    context: "Deux à quatre minutes près d'un arrêt de bus, d'un campus ou d'un marché.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Près du front de mer",
    supportPhrase: "Go straight, then turn left.",
    successSignals: [
      "Vous donnez deux étapes dans le bon ordre.",
      "Vous utilisez un repère concret.",
      "Vous vérifiez la compréhension.",
    ],
    realWorldInstruction: "Quand on vous demande votre chemin, donnez au moins deux étapes en anglais.",
    stretch: "Ajoutez une estimation du temps ou de la distance.",
    scene: {
      time: "09:25 · après le marché",
      atmosphere: "Une rue claire, quelques passants, un bus qui arrive derrière vous.",
      sensoryCue: "Le bruit de circulation rend les indications longues difficiles à suivre.",
      people: [{ role: "Visiteur", name: "Maya", intent: "Elle cherche un lieu qu'elle ne connaît pas." }],
      pressure: "Votre explication doit rester courte et vérifiable.",
      culturalNote: "Deux repères concrets sont souvent plus utiles qu'une description détaillée.",
      languageKit: [
        { phrase: "Go straight.", meaning: "Allez tout droit.", use: "Donner la première étape." },
        { phrase: "Turn left at …", meaning: "Tournez à gauche à …", use: "Ajouter un repère." },
        { phrase: "It's about five minutes away.", meaning: "C'est à environ cinq minutes.", use: "Donner une distance." },
        { phrase: "Does that make sense?", meaning: "C'est clair ?", use: "Vérifier." },
      ],
      rescuePhrases: [
        { phrase: "I mean the other street.", meaning: "Corriger une indication." },
        { phrase: "Sorry — let me say that again.", meaning: "Reprendre plus clairement." },
      ],
      conversationTurns: [
        { label: "Repère", goal: "Nommer le point de départ." },
        { label: "Étape 1", goal: "Donner la première direction." },
        { label: "Étape 2", goal: "Ajouter un second repère." },
        { label: "Vérifier", goal: "S'assurer que l'information est comprise." },
      ],
      constraints: ["Maximum trois étapes.", "Préférez les repères visibles.", "Pas de phrase interminable."],
    },
  },
  {
    id: "mission-repair",
    title: "Réparer après un malentendu",
    prompt: "Vous n'avez pas compris une information. Demandez de répéter, reformulez ce que vous avez compris et reprenez.",
    context: "Une conversation courte où un mot ou un chiffre vous échappe.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Un comptoir de service",
    supportPhrase: "Could you say that again?",
    successSignals: ["Vous demandez une répétition.", "Vous récupérez l'information sans repasser au français.", "Vous reformulez pour confirmer."],
    realWorldInstruction: "Cette semaine, autorisez-vous à demander une répétition en anglais au lieu de faire semblant d'avoir compris.",
    stretch: "Ajoutez : So you mean … ?",
    scene: {
      time: "17:05 · fin de journée",
      atmosphere: "Une file avance vite, la personne en face parle rapidement.",
      sensoryCue: "Vous avez entendu le lieu mais pas l'heure.",
      people: [{ role: "Employé", name: "Noah", intent: "Il veut aller vite mais peut répéter." }],
      pressure: "Ne perdez pas l'information utile en voulant paraître parfait.",
      culturalNote: "Demander une répétition est une stratégie normale de communication.",
      languageKit: [
        { phrase: "Could you say that again?", meaning: "Pouvez-vous répéter ?", use: "Demander une répétition." },
        { phrase: "What time was that?", meaning: "C'était à quelle heure ?", use: "Cibler le détail manquant." },
        { phrase: "So you mean …?", meaning: "Donc vous voulez dire … ?", use: "Vérifier." },
      ],
      rescuePhrases: [
        { phrase: "Sorry, I missed the last part.", meaning: "Dire précisément ce qui a manqué." },
        { phrase: "Could you say it more slowly?", meaning: "Demander un rythme plus lent." },
      ],
      conversationTurns: [
        { label: "Arrêt", goal: "Signaler calmement le problème." },
        { label: "Répétition", goal: "Obtenir l'information." },
        { label: "Vérification", goal: "Reformuler ce que vous avez compris." },
      ],
      constraints: ["Pas d'excuse longue.", "Un seul détail manquant à la fois.", "Reprendre la conversation après la vérification."],
    },
  },
  {
    id: "mission-choose",
    title: "Choisir sous contrainte",
    prompt: "Choisissez entre deux options, expliquez votre préférence et demandez à l'autre personne ce qu'elle préfère.",
    context: "Trois à cinq minutes : trajet, repas, activité ou horaire.",
    durationMin: 5,
    level: "A2",
    language: "English",
    place: "En préparant un week-end",
    supportPhrase: "I'd prefer … because …",
    successSignals: ["Vous choisissez clairement.", "Vous donnez une raison.", "Vous demandez la préférence de l'autre personne."],
    realWorldInstruction: "Lors d'une décision réelle, formulez votre préférence en anglais avant de revenir à la langue habituelle.",
    stretch: "Reconnaissez un avantage de l'autre option avant de conclure.",
  },
  {
    id: "mission-mediate",
    title: "Transmettre pour un tiers",
    prompt: "Expliquez à une personne absente ce qui a changé dans un programme et ce qu'elle doit faire maintenant.",
    context: "Cinq à sept minutes. Gardez uniquement les détails qui changent l'action.",
    durationMin: 6,
    level: "B1",
    language: "English",
    place: "Après une réunion",
    supportPhrase: "The important thing is …",
    successSignals: ["Vous gardez l'essentiel.", "Vous reformulez au lieu de réciter.", "Vous terminez par une action claire."],
    realWorldInstruction: "Prenez un vrai message cette semaine et transmettez son essentiel à quelqu'un avec vos propres mots.",
    stretch: "Ajoutez une nuance sur la raison du changement.",
  },
  {
    id: "mission-counterpoint",
    title: "Répondre à un autre point de vue",
    prompt: "Reconnaissez une opinion différente, puis défendez votre propre préférence avec une raison et un exemple.",
    context: "Six à huit minutes dans une discussion calme.",
    durationMin: 8,
    level: "B1",
    language: "English",
    place: "Après un cours",
    supportPhrase: "I see your point, but …",
    successSignals: ["Vous reconnaissez l'autre point de vue.", "Vous donnez votre position.", "Vous soutenez votre position avec un exemple."],
    realWorldInstruction: "Choisissez un sujet léger et testez une réponse qui commence par I see your point.",
    stretch: "Ajoutez une réserve à votre propre argument.",
  },
  {
    id: "mission-plan-change",
    title: "Le plan vient de changer",
    prompt: "Expliquez un changement, proposez une alternative et vérifiez que l'autre personne peut suivre le nouveau plan.",
    context: "Cinq à huit minutes avec une petite contrainte de temps.",
    durationMin: 7,
    level: "B1",
    language: "English",
    place: "Un espace de travail partagé",
    supportPhrase: "The plan has changed. Could we … instead?",
    successSignals: ["Vous décrivez ce qui a changé.", "Vous proposez une solution.", "Vous vérifiez l'accord."],
    realWorldInstruction: "Quand un vrai plan bouge, essayez de proposer une alternative en anglais avant de revenir à une explication plus longue.",
    stretch: "Proposez deux options et dites laquelle vous préférez.",
  },
  {
    id: "mission-invite",
    title: "Proposer une sortie",
    prompt: "Invitez quelqu'un à une activité simple, proposez un moment et adaptez la proposition si l'autre hésite.",
    context: "Trois à cinq minutes autour d'un café, d'une marche ou d'un événement.",
    durationMin: 5,
    level: "A2",
    language: "English",
    place: "Front de mer",
    supportPhrase: "Would you like to …?",
    successSignals: ["Vous faites une invitation claire.", "Vous proposez un moment.", "Vous réagissez si l'autre n'est pas disponible."],
    realWorldInstruction: "Faites une invitation simple en anglais à quelqu'un que vous connaissez.",
    stretch: "Faites une contre-proposition naturelle si le premier créneau ne convient pas.",
  },
  {
    id: "mission-delay",
    title: "Expliquer un retard",
    prompt: "Expliquez un retard, donnez une nouvelle estimation et dites ce que vous proposez pour la suite.",
    context: "Deux à quatre minutes, situation professionnelle ou quotidienne.",
    durationMin: 4,
    level: "B1",
    language: "English",
    place: "Un appel de travail",
    supportPhrase: "I'm running late because …",
    successSignals: ["Vous donnez le fait principal.", "Vous annoncez un nouveau timing.", "Vous proposez la prochaine étape."],
    realWorldInstruction: "La prochaine fois que vous êtes en retard, testez une explication en trois morceaux : fait, timing, suite.",
    stretch: "Reconnaissez l'impact du retard sur l'autre personne.",
  },
  {
    id: "mission-negotiate",
    title: "Trouver un compromis",
    prompt: "Une première proposition ne convient pas. Faites une contre-proposition qui tient compte de la contrainte de l'autre personne.",
    context: "Six à huit minutes. L'objectif est de faire bouger le plan, pas de gagner.",
    durationMin: 8,
    level: "B1",
    language: "English",
    place: "Préparer une activité",
    supportPhrase: "Could we meet halfway?",
    successSignals: ["Vous identifiez la contrainte.", "Vous faites une contre-proposition.", "Vous vérifiez si le compromis fonctionne."],
    realWorldInstruction: "Choisissez une petite décision réelle et cherchez un compromis explicite en anglais.",
    stretch: "Expliquez pourquoi votre compromis reste acceptable pour les deux personnes.",
  },
  {
    id: "mission-check-in",
    title: "Faire un check-in",
    prompt: "Arrivez, confirmez votre réservation, demandez une information utile et réagissez à la réponse.",
    context: "Trois à cinq minutes devant un comptoir d'accueil.",
    durationMin: 5,
    level: "A2",
    language: "English",
    place: "Un hôtel en fin d'après-midi",
    supportPhrase: "I have a reservation under …",
    successSignals: [
      "Vous donnez le nom ou la réservation clairement.",
      "Vous posez une question utile.",
      "Vous réagissez à la réponse sans lire un script.",
    ],
    realWorldInstruction: "Quand vous devez confirmer une réservation, essayez de faire la première demande en anglais.",
    stretch: "Demandez une précision sur l'horaire du petit-déjeuner ou le départ.",
    scene: {
      time: "16:40 · arrivée",
      atmosphere: "Le hall est calme mais deux personnes attendent derrière vous.",
      sensoryCue: "La personne à l'accueil parle vite et vous donne deux informations successives.",
      people: [{ role: "Réceptionniste", name: "Maya", intent: "Elle veut vérifier votre réservation et vous orienter." }],
      pressure: "Soyez clair avant d'ajouter des détails.",
      culturalNote: "Une demande précise facilite les échanges de service.",
      languageKit: [
        { phrase: "I have a reservation under …", meaning: "J'ai une réservation au nom de …", use: "Commencer l'accueil." },
        { phrase: "Could you tell me …?", meaning: "Pouvez-vous me dire … ?", use: "Demander une information." },
        { phrase: "So breakfast starts at seven?", meaning: "Donc le petit-déjeuner commence à sept heures ?", use: "Vérifier." },
      ],
      rescuePhrases: [
        { phrase: "Sorry, I didn't catch the last part.", meaning: "Demander de répéter précisément." },
        { phrase: "Could you show me on the map?", meaning: "Obtenir un repère visuel." },
      ],
      conversationTurns: [
        { label: "Arrivée", goal: "Présenter la réservation." },
        { label: "Information", goal: "Poser une question utile." },
        { label: "Vérification", goal: "Reformuler une information." },
      ],
      constraints: ["Une question principale.", "Une vérification.", "Pas de lecture mot à mot."],
    },
  },
  {
    id: "mission-compare",
    title: "Comparer deux options",
    prompt: "Comparez deux possibilités pour une sortie ou un trajet, puis dites clairement laquelle vous choisissez.",
    context: "Cinq à sept minutes autour d'un choix réel ou simulé.",
    durationMin: 6,
    level: "B1",
    language: "English",
    place: "Préparer un samedi",
    supportPhrase: "The first option is …, whereas the second …",
    successSignals: [
      "Vous choisissez un critère de comparaison.",
      "Vous présentez les deux options.",
      "Vous justifiez votre préférence.",
    ],
    realWorldInstruction: "Cette semaine, comparez deux options en anglais avant d'exprimer votre choix.",
    stretch: "Ajoutez un désavantage de votre option préférée.",
    scene: {
      time: "18:10 · décision rapide",
      atmosphere: "Deux amis veulent profiter du même créneau.",
      sensoryCue: "La contrainte de temps réduit l'espace pour une longue explication.",
      people: [{ role: "Ami", name: "Noah", intent: "Il veut choisir sans passer vingt minutes à discuter." }],
      pressure: "Un seul critère principal suffit pour décider.",
      culturalNote: "Une comparaison utile choisit un axe clair : temps, coût ou ambiance.",
      languageKit: [
        { phrase: "The first option is quicker.", meaning: "La première option est plus rapide.", use: "Comparer sur le temps." },
        { phrase: "Whereas the second is quieter.", meaning: "Alors que la seconde est plus calme.", use: "Introduire le contraste." },
        { phrase: "I'd go for the first one.", meaning: "Je choisirais la première.", use: "Conclure." },
      ],
      rescuePhrases: [
        { phrase: "What I mean is …", meaning: "Reformuler le critère." },
        { phrase: "Let me compare them.", meaning: "Gagner une seconde pour structurer." },
      ],
      conversationTurns: [
        { label: "Critère", goal: "Annoncer ce qui compte." },
        { label: "Option A", goal: "Donner un avantage et une limite." },
        { label: "Option B", goal: "Faire le même travail." },
        { label: "Choix", goal: "Prendre position." },
      ],
      constraints: ["Un seul critère principal.", "Une réserve autorisée.", "Conclusion explicite."],
    },
  },
  {
    id: "mission-visitor",
    title: "Accueillir un visiteur",
    prompt: "Accueillez une personne qui arrive dans votre quartier, demandez ce qu'elle cherche et adaptez une recommandation.",
    context: "Quatre à six minutes en situation sociale.",
    durationMin: 5,
    level: "A2",
    language: "English",
    place: "Dans un quartier que vous connaissez",
    supportPhrase: "What are you looking for?",
    successSignals: [
      "Vous posez une question avant de conseiller.",
      "Vous donnez une recommandation adaptée.",
      "Vous vérifiez si la proposition convient.",
    ],
    realWorldInstruction: "La prochaine fois qu'une personne vous demande conseil, commencez par comprendre son besoin en anglais.",
    stretch: "Donnez une seconde option si la première ne convient pas.",
  },
  {
    id: "mission-summarize",
    title: "Résumer un message",
    prompt: "Écoutez ou lisez une information puis transmettez à quelqu'un ce qui change pour lui, avec vos propres mots.",
    context: "Six minutes après une information de travail ou d'organisation.",
    durationMin: 6,
    level: "B1",
    language: "English",
    place: "Après un échange d'équipe",
    supportPhrase: "The main point is …",
    successSignals: [
      "Vous isolez l'information principale.",
      "Vous reformulez au lieu de recopier.",
      "Vous terminez par l'action attendue.",
    ],
    realWorldInstruction: "Prenez un message réel et expliquez son impact à une autre personne en trois morceaux : fait, conséquence, action.",
    stretch: "Ajoutez une nuance qui pourrait changer la décision.",
  },
  {
    id: "mission-apologize",
    title: "S'excuser et réparer",
    prompt: "Reconnaissez une erreur simple, dites ce que vous allez faire maintenant et vérifiez que la solution convient.",
    context: "Trois à cinq minutes dans un contexte quotidien ou professionnel.",
    durationMin: 4,
    level: "B1",
    language: "English",
    place: "Un échange après un contretemps",
    supportPhrase: "I'm sorry about that. I'll …",
    successSignals: [
      "Vous reconnaissez le problème sans vous perdre dans les excuses.",
      "Vous annoncez une action concrète.",
      "Vous vérifiez la suite avec l'autre personne.",
    ],
    realWorldInstruction: "Quand un petit contretemps survient, testez une excuse brève suivie d'une solution en anglais.",
    stretch: "Reconnaissez l'impact du problème sur l'autre personne.",
  },
  {
  {
    id: "mission-a2-clarify",
    title: "Clarifier un détail",
    prompt: "Vous avez compris l'essentiel mais pas un détail. Demandez une précision, reformulez ce que vous avez compris, puis reprenez la conversation.",
    context: "Trois à cinq minutes dans un lieu où une information précise compte vraiment.",
    durationMin: 4,
    level: "A2",
    language: "English",
    place: "Un comptoir de service",
    supportPhrase: "Could you clarify that?",
    successSignals: [
      "Vous identifiez précisément ce qui vous manque.",
      "Vous demandez une clarification sans abandonner la langue cible.",
      "Vous reformulez la réponse pour vérifier votre compréhension.",
    ],
    realWorldInstruction: "La prochaine fois qu'un détail vous échappe en anglais, demandez uniquement ce détail au lieu de demander à la personne de recommencer toute l'explication.",
    stretch: "Ajoutez une courte conséquence : So I should …, right?",
  },
    id: "mission-describe",
    title: "Décrire une expérience",
    prompt: "Racontez une expérience récente avec un début, un détail concret et votre impression personnelle.",
    context: "Six à huit minutes sans script.",
    durationMin: 7,
    level: "B1",
    language: "English",
    place: "Après une sortie",
    supportPhrase: "What stood out was …",
    successSignals: ["Vous donnez le contexte.", "Vous développez un détail.", "Vous exprimez une impression."],
    realWorldInstruction: "Racontez à une personne ce qui vous a le plus marqué récemment.",
    stretch: "Ajoutez une comparaison avec une autre expérience.",
  },
];

export function missionForId(id: string | undefined, level: string): Mission {
  const requested = id ? MISSION_BANK.find((mission) => mission.id === id) : undefined;
  if (requested && (requested.level === level || level === "B1" || requested.level === "A2")) {
    return requested;
  }
  return missionForToday(level);
}

export function missionsForLevel(level: string): Mission[] {
  return MISSION_BANK.filter((mission) => mission.level === level);
}

export const UPCOMING_MISSIONS: Mission[] = [
  {
    id: "mission-tomorrow",
    title: "Tell me about your morning",
    prompt: "Décrivez votre matin à quelqu'un, en anglais, pendant une minute.",
    context: "Un collègue, un voisin, ou un enregistrement si vous êtes seul.",
    durationMin: 3,
    level: "A2",
    language: "English",
    place: "Chez vous ou en chemin",
  },
  {
    id: "mission-day-after",
    title: "Ask for the way",
    prompt: "Demandez votre chemin sans basculer vers le français.",
    context: "Une phrase suffit. Le geste compte autant que la grammaire.",
    durationMin: 2,
    level: "A2",
    language: "English",
    place: "En ville",
  },
];

export type SpeakScenario = {
  id: string;
  title: string;
  setting: string;
  image: string;
  durationMin: number;
  level: string;
  turns: { speaker: "ai" | "you"; hint: string }[];
};

export const SCENARIOS: SpeakScenario[] = [
  {
    id: "cafe",
    title: "Café",
    setting: "Une terrasse à Saint-Pierre, fin d'après-midi.",
    image: "/images/cafe.jpg",
    durationMin: 6,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "Hi! What can I get for you today?" },
      { speaker: "you", hint: "Commandez une boisson et un plat." },
      { speaker: "ai", hint: "We have a vanilla flan, and the catch of the day. What are you in the mood for?" },
      { speaker: "you", hint: "Choisissez et posez une question." },
      { speaker: "ai", hint: "Perfect. I'll bring that over. Would you like some water?" },
    ],
  },
  {
    id: "airport",
    title: "Aéroport",
    setting: "Comptoir d'enregistrement, vol du soir.",
    image: "/images/airport.jpg",
    durationMin: 6,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "Good evening. Passport and destination, please." },
      { speaker: "you", hint: "Donnez votre destination et posez une question sur le vol." },
      { speaker: "ai", hint: "Window or aisle? And do you have any bags to check?" },
      { speaker: "you", hint: "Répondez, puis demandez l'heure d'embarquement." },
      { speaker: "ai", hint: "Boarding starts at 19:40 at gate 12. Have a good flight." },
    ],
  },
  {
    id: "interview",
    title: "Entretien",
    setting: "Un bureau calme, lumière de fin de matinée.",
    image: "/images/atelier.jpg",
    durationMin: 8,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "Thanks for coming in. Could you tell me a little about yourself?" },
      { speaker: "you", hint: "Présentez-vous en quelques phrases." },
      { speaker: "ai", hint: "What are you hoping to learn in this role?" },
      { speaker: "you", hint: "Parlez de votre objectif, simplement." },
      { speaker: "ai", hint: "That's clear. Do you have a question for us?" },
    ],
  },
  {
    id: "hotel",
    title: "Hôtel",
    setting: "Réception d'une maison créole, volets ouverts.",
    image: "/images/atelier.jpg",
    durationMin: 5,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "Welcome. Do you have a reservation?" },
      { speaker: "you", hint: "Confirmez votre nom et vos dates." },
      { speaker: "ai", hint: "You're in room 12, garden side. Breakfast is from 7 to 10." },
      { speaker: "you", hint: "Demandez l'heure du dîner ou un conseil." },
      { speaker: "ai", hint: "The restaurant opens at 19:00. I'll have someone take your bag." },
    ],
  },
  {
    id: "social",
    title: "Conversation",
    setting: "Une table, deux tasses, rien d'officiel.",
    image: "/images/cafe.jpg",
    durationMin: 7,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "It's good to see you. How has your week been?" },
      { speaker: "you", hint: "Parlez de votre semaine, sans chercher la phrase parfaite." },
      { speaker: "ai", hint: "That sounds full. Do you have plans for the weekend?" },
      { speaker: "you", hint: "Proposez quelque chose de simple." },
      { speaker: "ai", hint: "I'd like that. Shall we meet by the market?" },
    ],
  },
  {
    id: "shopping",
    title: "Marché",
    setting: "Étals de vanille, fruits, fleurs — Saint-Pierre.",
    image: "/images/marche.jpg",
    durationMin: 5,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "Hello — looking for anything in particular?" },
      { speaker: "you", hint: "Demandez des vanilles, ou un fruit de saison." },
      { speaker: "ai", hint: "These pods are from the east coast. Would you like to smell them?" },
      { speaker: "you", hint: "Acceptez, puis demandez le prix." },
      { speaker: "ai", hint: "Four euros for three. I can wrap them for you." },
    ],
  },
  {
    id: "university",
    title: "Université",
    setting: "Couloir d'un bâtiment, entre deux cours.",
    image: "/images/atelier.jpg",
    durationMin: 6,
    level: "A2",
    turns: [
      { speaker: "ai", hint: "Hi — are you looking for the seminar room?" },
      { speaker: "you", hint: "Expliquez ce que vous cherchez." },
      { speaker: "ai", hint: "It's on the second floor, left of the library. Are you new here?" },
      { speaker: "you", hint: "Répondez et posez une question en retour." },
      { speaker: "ai", hint: "There's a study group on Thursdays if you want to join." },
    ],
  },
];

export type EventItem = {
  id: string;
  title: string;
  blurb: string;
  date: string;
  time: string;
  place: string;
  language: string;
  spots: number;
  image: string;
  host: string;
};

export type EventDetail = {
  purpose: string;
  flow: string[];
  prepare: string[];
  languageMove: string;
};

export const EVENT_DETAILS: Record<string, EventDetail> = {
  "evt-cafe": {
    purpose: "Parler de sa semaine sans transformer la rencontre en exercice de classe.",
    flow: ["5 min · arrivée et mise en relation", "35 min · conversation guidée", "15 min · relances et réparations", "5 min · une phrase à réutiliser"],
    prepare: ["Une anecdote récente", "Une question que vous aimeriez réellement poser"],
    languageMove: "Poser une question en retour après avoir répondu.",
  },
  "evt-pronlab": {
    purpose: "Travailler un contraste sonore puis le remettre immédiatement dans une phrase utile.",
    flow: ["10 min · échauffement", "20 min · contraste ciblé", "20 min · phrases et mini-dialogues", "10 min · transfert"],
    prepare: ["Écouter une phrase-modèle avant de venir", "Apporter un mot ou un son qui résiste encore"],
    languageMove: "Passer du son isolé à une formulation naturelle.",
  },
  "evt-marche": {
    purpose: "Commander, demander un prix et récupérer une information dans un environnement animé.",
    flow: ["10 min · repérage", "20 min · commandes", "15 min · questions", "15 min · retour et trace"],
    prepare: ["Une commande que vous pourriez réellement faire", "Une formule de réparation"],
    languageMove: "Could you say that again? sans quitter l'échange.",
  },
  "evt-cote": {
    purpose: "Décrire un lieu réel avec peu de mots mais des détails choisis.",
    flow: ["10 min · marche silencieuse", "20 min · observations", "20 min · descriptions croisées", "10 min · récit court"],
    prepare: ["Choisir un lieu que vous connaissez", "Repérer trois détails sensoriels"],
    languageMove: "What stood out was … pour passer de l'objet à l'impression.",
  },
  "evt-office-clinic": {
    purpose: "Rendre une conversation professionnelle plus claire, plus courte et plus coopérative.",
    flow: ["15 min · situation", "20 min · demande", "15 min · changement de plan", "10 min · reformulation"],
    prepare: ["Un petit problème de travail", "Une alternative réaliste"],
    languageMove: "The plan has changed. Could we … instead?",
  },
  "evt-phone-practice": {
    purpose: "Tenir deux minutes au téléphone malgré les mots manqués.",
    flow: ["10 min · formules", "20 min · appels simulés", "15 min · réparations", "15 min · confirmations"],
    prepare: ["Une date", "Une heure", "Une demande simple"],
    languageMove: "So you mean …? pour confirmer l'information utile.",
  },
  "evt-writing-table": {
    purpose: "Transformer une vraie intention en message court et adapté au destinataire.",
    flow: ["10 min · intention", "20 min · premier jet", "20 min · simplification", "15 min · version finale"],
    prepare: ["Apporter un message que vous pourriez réellement envoyer", "Retirer toute information non essentielle"],
    languageMove: "Exprimer fait + action attendue + prochaine étape.",
  },
  "evt-b1-circle": {
    purpose: "Répondre à un point de vue différent sans perdre sa propre position.",
    flow: ["10 min · sujet", "20 min · positions", "20 min · contrepoints", "10 min · nuance"],
    prepare: ["Un sujet léger", "Une raison qui soutient votre préférence"],
    languageMove: "I see your point, but …",
  },
  "evt-coast-story": {
    purpose: "Raconter un moment réel à partir d'un lieu, d'un détail et d'une impression.",
    flow: ["15 min · marche", "15 min · collecte de détails", "20 min · récit", "10 min · retours"],
    prepare: ["Une histoire courte", "Un détail que vous avez remarqué récemment"],
    languageMove: "What stood out was … / The thing I remember most is …",
  },
};

export const EVENTS: EventItem[] = [
  {
    id: "evt-cafe",
    title: "Café anglais",
    blurb: "Une heure autour d'une table, sans exercice. On parle de la semaine.",
    date: dateFromToday(2),
    time: "18:00",
    place: "Le Comptoir, Saint-Pierre",
    language: "English · A2–B1",
    spots: 8,
    image: "/images/cafe.jpg",
    host: "Léa",
  },
  {
    id: "evt-pronlab",
    title: "Atelier Pron'Lab",
    blurb: "Les voyelles qui bloquent encore. Petit groupe, beaucoup d'écoute.",
    date: dateFromToday(3),
    time: "12:30",
    place: "Maison K'Osez, Saint-Pierre",
    language: "English · A2",
    spots: 6,
    image: "/images/atelier.jpg",
    host: "Léa",
  },
  {
    id: "evt-marche",
    title: "Marché en anglais",
    blurb: "On se retrouve au marché. Commander, goûter, demander le prix.",
    date: dateFromToday(5),
    time: "09:00",
    place: "Marché couvert, Saint-Pierre",
    language: "English · A1–A2",
    spots: 12,
    image: "/images/marche.jpg",
    host: "Équipe K'Osez",
  },
  {
    id: "evt-cote",
    title: "Balade côtière",
    blurb: "Marcher le long de la côte et raconter ce que l'on voit — en anglais.",
    date: dateFromToday(7),
    time: "16:00",
    place: "Front de mer, Saint-Pierre",
    language: "English · A2+",
    spots: 10,
    image: "/images/reunion-coast.jpg",
    host: "Léa",
  },
  {
    id: "evt-office-clinic",
    title: "English au travail",
    blurb: "Une heure pour expliquer, clarifier, négocier et repartir avec une formulation plus simple.",
    date: dateFromToday(9),
    time: "18:30",
    place: "Maison K'Osez, Saint-Pierre",
    language: "English · B1",
    spots: 8,
    image: "/images/atelier.jpg",
    host: "Léa",
  },
  {
    id: "evt-phone-practice",
    title: "Téléphone sans panique",
    blurb: "Deux minutes au téléphone : demander, répéter, confirmer.",
    date: dateFromToday(11),
    time: "12:15",
    place: "En ligne · K'Osez",
    language: "English · A2–B1",
    spots: 10,
    image: "/images/cafe.jpg",
    host: "Équipe K'Osez",
  },
  {
    id: "evt-writing-table",
    title: "Table d'écriture",
    blurb: "Messages courts, recommandations, changements de programme — écrits pour agir.",
    date: dateFromToday(13),
    time: "17:30",
    place: "Maison K'Osez, Saint-Pierre",
    language: "English · A2–B1",
    spots: 8,
    image: "/images/atelier.jpg",
    host: "Léa",
  },
  {
    id: "evt-b1-circle",
    title: "Cercle B1 · points de vue",
    blurb: "Comparer, nuancer, répondre à une autre idée sans transformer l'échange en débat scolaire.",
    date: dateFromToday(16),
    time: "18:00",
    place: "Le Comptoir, Saint-Pierre",
    language: "English · B1",
    spots: 8,
    image: "/images/cafe.jpg",
    host: "Léa",
  },
  {
    id: "evt-coast-story",
    title: "Raconter la côte",
    blurb: "Une marche, trois descriptions, une histoire courte à partager.",
    date: dateFromToday(20),
    time: "16:30",
    place: "Front de mer, Saint-Pierre",
    language: "English · A2–B1",
    spots: 10,
    image: "/images/reunion-coast.jpg",
    host: "Équipe K'Osez",
  },
];

export type CatalogueItem = {
  id: string;
  kind: "course" | "individual" | "group" | "immersion" | "workshop" | "event" | "pronlab";
  title: string;
  description: string;
  language: string;
  level: string;
  format: string;
  instructor: string;
  location: string;
  capacity: number;
  schedule: string;
  price: string;
  image: string;
  early?: boolean;
  companion?: boolean;
};

export const CATALOGUE: CatalogueItem[] = [
  {
    id: "cat-a2",
    kind: "course",
    title: "English A2 · Parcours du soir",
    description: "Huit semaines pour oser parler. Peu de fiches, beaucoup de situations.",
    language: "English",
    level: "A2",
    format: "Groupe, 8 personnes",
    instructor: "Léa Moreau",
    location: "Maison K'Osez, Saint-Pierre",
    capacity: 8,
    schedule: "Mardi 18:00 – 19:30",
    price: "Sur inscription",
    image: "/images/atelier.jpg",
  },
  {
    id: "cat-individual",
    kind: "individual",
    title: "Cours particulier",
    description: "Une heure avec Léa, calée sur votre semaine et votre objectif.",
    language: "English",
    level: "A2–B1",
    format: "Individuel",
    instructor: "Léa Moreau",
    location: "Maison K'Osez ou visio",
    capacity: 1,
    schedule: "Sur rendez-vous",
    price: "Sur devis",
    image: "/images/atelier.jpg",
  },
  {
    id: "cat-immersion",
    kind: "immersion",
    title: "Immersion weekend",
    description: "Samedi–dimanche autour de la langue, de la table et de la côte.",
    language: "English",
    level: "A2+",
    format: "Immersion",
    instructor: "Équipe K'Osez",
    location: "Saint-Pierre et environs",
    capacity: 10,
    schedule: rangeLabelFromToday(10, 11),
    price: "Sur inscription",
    image: "/images/reunion-coast.jpg",
  },
  {
    id: "cat-workshop",
    kind: "workshop",
    title: "Atelier prononciation",
    description: "Un après-midi sur le rythme et les sons qui restent flous.",
    language: "English",
    level: "A2",
    format: "Atelier",
    instructor: "Léa Moreau",
    location: "Maison K'Osez",
    capacity: 6,
    schedule: "Jeudi 12:30",
    price: "Inclus au parcours",
    image: "/images/vanilla.jpg",
  },
  {
    id: "cat-b1-intensive",
    kind: "group",
    title: "B1 · Parler avec nuance",
    description: "Six semaines pour comparer, expliquer un choix, résoudre un imprévu et reformuler.",
    language: "English",
    level: "B1",
    format: "Groupe, 8 personnes",
    instructor: "Léa Moreau",
    location: "Maison K'Osez, Saint-Pierre",
    capacity: 8,
    schedule: "Jeudi 18:30 – 20:00",
    price: "Sur inscription",
    image: "/images/atelier.jpg",
  },
  {
    id: "cat-pron-private",
    kind: "individual",
    title: "Pron'Lab · bilan individuel",
    description: "Une séance ciblée sur les contrastes et le rythme qui restent instables dans votre historique.",
    language: "English",
    level: "A2–B1",
    format: "Individuel · 45 min",
    instructor: "Léa Moreau",
    location: "Maison K'Osez ou visio",
    capacity: 1,
    schedule: "Sur rendez-vous",
    price: "Sur devis",
    image: "/images/vanilla.jpg",
  },
  {
    id: "cat-writing-clinic",
    kind: "workshop",
    title: "Writing Clinic",
    description: "Apporter un vrai message : le rendre plus clair, plus précis et plus adapté au destinataire.",
    language: "English",
    level: "A2–B1",
    format: "Atelier, 6 personnes",
    instructor: "Équipe K'Osez",
    location: "Maison K'Osez",
    capacity: 6,
    schedule: "Samedi 10:00 – 11:15",
    price: "Inclus au parcours",
    image: "/images/atelier.jpg",
  },
  {
    id: "cat-tandem-circle",
    kind: "group",
    title: "Tandem · cercle guidé",
    description: "Trente minutes de langue cible, trente minutes de retour : prompts, réparation et clôture structurée.",
    language: "English · Français",
    level: "A2–B1",
    format: "Petit groupe, 6 personnes",
    instructor: "Équipe K'Osez",
    location: "En ligne · K'Osez",
    capacity: 6,
    schedule: "Mercredi 19:00 – 20:00",
    price: "Selon formule",
    image: "/images/cafe.jpg",
  },
];

export type PronlabItem = {
  id: string;
  phrase: string;
  hint: string;
  ipa: string;
  kind: PronlabKind;
  focus: string;
  level: string;
  strength: string;
  tip: string;
  model: string;
  problemSegment: string;
};

export type PronlabSetDef = {
  id: string;
  title: string;
  blurb: string;
  kind: PronlabKind;
  unlockAfter?: string;
  language?: string;
  items: PronlabItem[];
};

export const PRONLAB_SETS: PronlabSetDef[] = [
  {
    id: "set-a1-basics",
    title: "Premiers mots, premiers sons",
    blurb: "Saluer, se présenter et rendre les premières phrases compréhensibles.",
    kind: "sentence",
    items: [
      {
        id: "a1-p1",
        phrase: "Hi, I'm Sam.",
        hint: "Gardez Hi court et faites entendre I'm comme un seul geste.",
        ipa: "/haɪ aɪm sæm/",
        kind: "sentence",
        focus: "I'm",
        level: "A1",
        strength: "La présentation tient en un souffle.",
        tip: "Ne découpez pas I'm en plusieurs mots.",
        model: "Hi, I'm Sam.",
        problemSegment: "I'm",
      },
      {
        id: "a1-p2",
        phrase: "Nice to meet you.",
        hint: "Meet porte la partie importante de la phrase.",
        ipa: "/naɪs tə miːt juː/",
        kind: "sentence",
        focus: "meet",
        level: "A1",
        strength: "La formule est immédiatement reconnaissable.",
        tip: "Gardez to léger.",
        model: "Nice to meet you.",
        problemSegment: "meet",
      },
      {
        id: "a1-p3",
        phrase: "Where is the café?",
        hint: "Where est le premier repère ; café ferme la question.",
        ipa: "/weə ɪz ðə kæˈfeɪ/",
        kind: "sentence",
        focus: "where",
        level: "A1",
        strength: "La question garde une intention claire.",
        tip: "Faites entendre where sans ajouter une syllabe.",
        model: "Where is the café?",
        problemSegment: "where",
      },
      {
        id: "a1-p4",
        phrase: "I'd like a coffee, please.",
        hint: "I'd like peut devenir une seule unité rythmique.",
        ipa: "/aɪd laɪk ə ˈkɒfi pliːz/",
        kind: "sentence",
        focus: "I'd like",
        level: "A1",
        strength: "La demande reste polie et directe.",
        tip: "Please est léger ; coffee porte le choix.",
        model: "I'd like a coffee, please.",
        problemSegment: "I'd like",
      },
    ],
  },

  {
    id: "set-midi",
    title: "Set du midi",
    blurb: "Cinq phrases du quotidien. Le rythme avant la copie.",
    kind: "sentence",
    items: [
      {
        id: "pl-1",
        phrase: "Could I have the bill, please?",
        hint: "Le « could » est doux. Ne forcez pas le L final de bill.",
        ipa: "/kʊd aɪ hæv ðə bɪl pliːz/",
        kind: "sentence",
        focus: "could / bill",
        level: "A2",
        strength: "La demande tient jusqu'au bout.",
        tip: "Relâchez le L de bill — le mot se ferme plus tôt qu'en français.",
        model: "Could I have the bill, please?",
        problemSegment: "bill",
      },
      {
        id: "pl-2",
        phrase: "What do you recommend?",
        hint: "L'accent tombe sur -mend. Le « what » reste court.",
        ipa: "/wɒt də ju ˌrekəˈmend/",
        kind: "sentence",
        focus: "recommend",
        level: "A2",
        strength: "La question est claire.",
        tip: "Poussez l'accent sur -mend, pas sur re-.",
        model: "What do you recommend?",
        problemSegment: "recommend",
      },
      {
        id: "pl-3",
        phrase: "I'm looking for the station.",
        hint: "Looking : la voyelle de look, pas de « ou » français.",
        ipa: "/aɪm ˈlʊkɪŋ fɔː ðə ˈsteɪʃn/",
        kind: "sentence",
        focus: "looking /ʊ/",
        level: "A2",
        strength: "L'intention se lit tout de suite.",
        tip: "Look : lèvres relâchées, voyelle courte. Pas « louking ».",
        model: "I'm looking for the station.",
        problemSegment: "looking",
      },
      {
        id: "pl-4",
        phrase: "Nice to meet you.",
        hint: "Meet est long. You se relâche, presque « yə ».",
        ipa: "/naɪs tə miːt ju/",
        kind: "sentence",
        focus: "meet",
        level: "A2",
        strength: "Le contact est simple, c'est assez.",
        tip: "Allongez meet. You n'a pas besoin d'être parfait.",
        model: "Nice to meet you.",
        problemSegment: "meet",
      },
      {
        id: "pl-5",
        phrase: "Could you repeat that?",
        hint: "Repeat : l'accent sur -peat. That reste léger.",
        ipa: "/kʊd ju rɪˈpiːt ðæt/",
        kind: "sentence",
        focus: "repeat + th",
        level: "A2",
        strength: "Vous demandez sans vous excuser.",
        tip: "That : la langue touche, un souffle. Pas un D français.",
        model: "Could you repeat that?",
        problemSegment: "that",
      },
    ],
  },
  {
    id: "set-th",
    title: "Les TH qui bloquent",
    blurb: "Le son que le français n'a pas. D'abord isolé, puis dans le mot.",
    kind: "phoneme",
    items: [
      {
        id: "th-1",
        phrase: "think",
        hint: "Langue entre les dents, souffle sans voix.",
        ipa: "/θɪŋk/",
        kind: "phoneme",
        focus: "θ",
        level: "A2",
        strength: "Le geste est là.",
        tip: "Pas un S, pas un F. Un souffle à travers la langue.",
        model: "think",
        problemSegment: "th",
      },
      {
        id: "th-2",
        phrase: "this",
        hint: "Même place, mais la voix est là — ça vibre.",
        ipa: "/ðɪs/",
        kind: "phoneme",
        focus: "ð",
        level: "A2",
        strength: "Vous distinguez déjà think et this.",
        tip: "This vibre. Think ne vibre pas.",
        model: "this",
        problemSegment: "th",
      },
      {
        id: "th-3",
        phrase: "the other one",
        hint: "Deux ð dans la même respiration.",
        ipa: "/ði ˈʌðə wʌn/",
        kind: "word",
        focus: "ð · ð",
        level: "A2",
        strength: "La liaison tient.",
        tip: "Other : le TH est au milieu, ne le remplacez pas par un D.",
        model: "the other one",
        problemSegment: "other",
      },
      {
        id: "th-4",
        phrase: "three thirty",
        hint: "θ + θ. Les chiffres trahissent toujours le son.",
        ipa: "/θriː ˈθɜːti/",
        kind: "word",
        focus: "θ",
        level: "A2",
        strength: "Le nombre passe.",
        tip: "Three n'est pas « tree ». Le souffle d'abord.",
        model: "three thirty",
        problemSegment: "three",
      },
    ],
  },
  {
    id: "set-vowels",
    title: "Voyelles qui trahissent",
    blurb: "Look, ship, cat — trois voyelles, trois malentendus.",
    kind: "phoneme",
    unlockAfter: "set-th",
    items: [
      {
        id: "v-1",
        phrase: "look / Luke",
        hint: "Look est court. Luke est long. La durée fait le mot.",
        ipa: "/lʊk/ · /luːk/",
        kind: "phoneme",
        focus: "ʊ vs uː",
        level: "A2",
        strength: "Vous entendez la durée.",
        tip: "Look : mâchoire presque fermée, très court.",
        model: "look",
        problemSegment: "look",
      },
      {
        id: "v-2",
        phrase: "ship / sheep",
        hint: "I court contre iː long. Un seul trait de durée.",
        ipa: "/ʃɪp/ · /ʃiːp/",
        kind: "phoneme",
        focus: "ɪ vs iː",
        level: "A2",
        strength: "Le contraste est audible.",
        tip: "Ship : voyelle courte, presque fermée. Sheep s'allonge.",
        model: "ship",
        problemSegment: "ship",
      },
      {
        id: "v-3",
        phrase: "cat / cut",
        hint: "æ ouvert contre ʌ plus central.",
        ipa: "/kæt/ · /kʌt/",
        kind: "phoneme",
        focus: "æ vs ʌ",
        level: "A2",
        strength: "Les deux mots ne se recouvrent plus.",
        tip: "Cat : mâchoire plus ouverte qu'en français.",
        model: "cat",
        problemSegment: "cat",
      },
      {
        id: "v-4",
        phrase: "I walked to the market.",
        hint: "Walked : le -ed est /t/, pas une syllabe de plus.",
        ipa: "/aɪ wɔːkt tə ðə ˈmɑːkɪt/",
        kind: "sentence",
        focus: "walked /t/",
        level: "A2",
        strength: "La phrase avance d'un seul souffle.",
        tip: "Walked se ferme sur /t/. Pas « walkèd ».",
        model: "I walked to the market.",
        problemSegment: "walked",
      },
    ],
  },
  {
    id: "set-free",
    title: "Parole libre",
    blurb: "Soixante secondes sur hier. Pas de script. Le set s'ouvre après les voyelles.",
    kind: "spontaneous",
    unlockAfter: "set-vowels",
    items: [
      {
        id: "sp-1",
        phrase: "Tell me about yesterday.",
        hint: "Une minute. Trois faits suffisent. Pas de liste grammaticale.",
        ipa: "",
        kind: "spontaneous",
        focus: "spontané",
        level: "A2",
        strength: "Vous avez tenu la minute.",
        tip: "Gardez I'll have / I went / I saw. Évitez de retraduire phrase par phrase.",
        model: "Yesterday I walked to the market, then I had lunch.",
        problemSegment: "Yesterday",
      },
      {
        id: "sp-2",
        phrase: "What do you recommend around here?",
        hint: "Posez la question, puis tenez deux relances.",
        ipa: "",
        kind: "spontaneous",
        focus: "interaction",
        level: "A2",
        strength: "La question ouvre vraiment l'échange.",
        tip: "Après la réponse, relancez : « And for the evening? »",
        model: "What do you recommend around here?",
        problemSegment: "recommend",
      },
    ],
  },
  {
    id: "set-b1-rhythm",
    title: "B1 · rythme et intention",
    blurb: "Accent de mot, groupes de souffle et intonation : faire entendre une idée, pas seulement les mots.",
    kind: "sentence",
    unlockAfter: "set-free",
    items: [
      {
        id: "b1-rhythm-1",
        phrase: "I would probably choose the earlier train.",
        hint: "Faites entendre la préférence : probably et earlier restent légers, choose porte le cœur du message.",
        ipa: "/aɪ wʊd ˈprɒbəbli tʃuːz ði ˈɜːliə treɪn/",
        kind: "sentence",
        focus: "sentence stress",
        level: "B1",
        strength: "L'idée principale ressort sans marteler chaque mot.",
        tip: "L'accent tombe surtout sur choose et earlier ; les petits mots se réduisent.",
        model: "I would probably choose the earlier train.",
        problemSegment: "choose / earlier",
      },
      {
        id: "b1-rhythm-2",
        phrase: "I enjoyed it, although the final part felt rushed.",
        hint: "Ne donnez pas le même poids aux deux parties. L'intonation doit signaler le contraste.",
        ipa: "/aɪ ɪnˈdʒɔɪd ɪt ɔːlˈðəʊ ðə ˈfaɪnl pɑːt felt rʌʃt/",
        kind: "sentence",
        focus: "contraste / intonation",
        level: "B1",
        strength: "Le contraste devient audible, pas seulement grammatical.",
        tip: "Gardez une chute légère après enjoyed it, puis relancez sur although.",
        model: "I enjoyed it, although the final part felt rushed.",
        problemSegment: "although",
      },
      {
        id: "b1-rhythm-3",
        phrase: "Could we move the meeting to Friday afternoon?",
        hint: "La demande est polie : ne transformez pas could en mot le plus fort.",
        ipa: "/kʊd wiː muːv ðə ˈmiːtɪŋ tə ˈfraɪdeɪ ˌɑːftəˈnuːn/",
        kind: "sentence",
        focus: "réduction + demande",
        level: "B1",
        strength: "La demande reste naturelle et coopérative.",
        tip: "Move et Friday portent davantage l'information que could we.",
        model: "Could we move the meeting to Friday afternoon?",
        problemSegment: "Could we",
      },
      {
        id: "b1-rhythm-4",
        phrase: "That might work, but we should check the timing first.",
        hint: "Marquez la réserve : might work puis but crée un virage prosodique.",
        ipa: "/ðæt maɪt wɜːk bət wiː ʃʊd tʃek ðə ˈtaɪmɪŋ fɜːst/",
        kind: "sentence",
        focus: "modalisation",
        level: "B1",
        strength: "La prudence est audible dans la voix.",
        tip: "Might work doit rester moins affirmatif que a strong yes.",
        model: "That might work, but we should check the timing first.",
        problemSegment: "might",
      },
      {
        id: "b1-rhythm-5",
        phrase: "What I mean is that we need a simpler option.",
        hint: "Utilisez what I mean is comme une réparation fluide, puis portez l'idée sur simpler option.",
        ipa: "/wɒt aɪ miːn ɪz ðæt wi niːd ə ˈsɪmplə ˈɒpʃn/",
        kind: "sentence",
        focus: "repair + focus",
        level: "B1",
        strength: "Vous corrigez votre trajectoire sans repartir de zéro.",
        tip: "Après la micro-pause, donnez le poids à simpler option.",
        model: "What I mean is that we need a simpler option.",
        problemSegment: "What I mean",
      },
    ],
  },
  {
    id: "set-es",
    title: "Mesa y mercado",
    blurb: "Cinq phrases A2 — le même moteur, l'espagnol du quotidien.",
    kind: "sentence",
    language: "es",
    items: [
      {
        id: "es-1",
        phrase: "La cuenta, por favor.",
        hint: "Cuenta : le ue est un diphtongue, pas « é ».",
        ipa: "/la ˈkwenta por faˈβor/",
        kind: "sentence",
        focus: "cuenta",
        level: "A2",
        strength: "La demande est nette.",
        tip: "Por favor reste léger. La charge est sur cuenta.",
        model: "La cuenta, por favor.",
        problemSegment: "cuenta",
      },
      {
        id: "es-2",
        phrase: "¿Qué recomienda?",
        hint: "Recomienda : l'accent sur -mien-.",
        ipa: "/ke rekoˈmjenda/",
        kind: "sentence",
        focus: "recomienda",
        level: "A2",
        strength: "La question ouvre vraiment.",
        tip: "Qué est court. Ne l'allongez pas.",
        model: "¿Qué recomienda?",
        problemSegment: "recomienda",
      },
      {
        id: "es-3",
        phrase: "Voy a tomar el pescado.",
        hint: "Tomar, pas « coger ». Le voyage tient dans voy.",
        ipa: "/boi a toˈmar el pesˈkaðo/",
        kind: "sentence",
        focus: "voy a tomar",
        level: "A2",
        strength: "Vous commandez sans traduire.",
        tip: "Voy à deux sons. Pas « vouaille ».",
        model: "Voy a tomar el pescado.",
        problemSegment: "Voy",
      },
    ],
  },
  {
    id: "set-lsf",
    title: "LSF · table et marché",
    blurb: "Quatre signes du quotidien. Le modèle est une description, pas une voix.",
    kind: "word",
    language: "lsf",
    items: [
      {
        id: "lsf-1",
        phrase: "Bonjour",
        hint: "Main ouverte, bout des doigts au menton, s'éloigne en avant.",
        ipa: "",
        kind: "word",
        focus: "salut",
        level: "A1",
        strength: "Le contact est posé.",
        tip: "Le mouvement part du menton, pas de la tempe.",
        model: "Menton → avant, paume vers l'interlocuteur.",
        problemSegment: "menton",
      },
      {
        id: "lsf-2",
        phrase: "Merci",
        hint: "Bout des doigts au menton, paume vers soi, s'ouvre vers l'autre.",
        ipa: "",
        kind: "word",
        focus: "merci",
        level: "A1",
        strength: "Le remerciement se lit.",
        tip: "Même zone que Bonjour ; la paume change le sens.",
        model: "Menton, paume vers soi, ouverture vers l'autre.",
        problemSegment: "paume",
      },
      {
        id: "lsf-3",
        phrase: "Marché",
        hint: "Deux mains en alternance, comme peser ou proposer un étal.",
        ipa: "",
        kind: "word",
        focus: "lieu",
        level: "A1",
        strength: "Le lieu est identifiable.",
        tip: "Le rythme des deux mains fait le marché, pas un seul geste figé.",
        model: "Deux mains, alternance légère, hauteur de poitrine.",
        problemSegment: "mains",
      },
      {
        id: "lsf-4",
        phrase: "Je m'appelle…",
        hint: "Index vers soi, puis épeler ou signe-nom.",
        ipa: "",
        kind: "sentence",
        focus: "identité",
        level: "A1",
        strength: "Vous vous nommez sans détour.",
        tip: "L'index vers soi d'abord. Le nom ensuite, posément.",
        model: "Index poitrine, puis le nom.",
        problemSegment: "Je",
      },
    ],
  },
  {
    id: "set-connected",
    title: "Parler en chaîne",
    blurb: "Réduire les petits mots, garder le rythme et relier une phrase à la suivante.",
    kind: "sentence",
    unlockAfter: "set-vowels",
    items: [
      {
        id: "conn-1",
        phrase: "Could you give me a minute?",
        hint: "Could you se lie sans accent dur sur could.",
        ipa: "/kəd juː ɡɪv mi ə ˈmɪnɪt/",
        kind: "sentence",
        focus: "could you",
        level: "A2",
        strength: "La demande reste fluide.",
        tip: "Ne séparez pas chaque mot. L'ensemble doit couler.",
        model: "Could you give me a minute?",
        problemSegment: "Could you",
      },
      {
        id: "conn-2",
        phrase: "I need to check first.",
        hint: "Need to peut se réduire en parole naturelle.",
        ipa: "/aɪ niːd tə tʃek fɜːst/",
        kind: "sentence",
        focus: "need to",
        level: "A2",
        strength: "L'intention est directe.",
        tip: "Le to devient léger ; check porte l'information.",
        model: "I need to check first.",
        problemSegment: "need to",
      },
      {
        id: "conn-3",
        phrase: "What are you doing later?",
        hint: "What are you peut former un seul bloc rythmique.",
        ipa: "/wɒt ə juː ˈduːɪŋ ˈleɪtə/",
        kind: "sentence",
        focus: "what are you",
        level: "A2",
        strength: "La question garde son mouvement.",
        tip: "Réduisez are sans avaler you.",
        model: "What are you doing later?",
        problemSegment: "what are you",
      },
      {
        id: "conn-4",
        phrase: "I was going to call you.",
        hint: "Was going to doit rester une seule intention, pas quatre blocs.",
        ipa: "/aɪ wəz ˈɡəʊɪŋ tə kɔːl juː/",
        kind: "sentence",
        focus: "was going to",
        level: "A2",
        strength: "Le passé projeté reste naturel.",
        tip: "Faites de call le point fort de la phrase.",
        model: "I was going to call you.",
        problemSegment: "was going to",
      },
    ],
  },
  {
    id: "set-service",
    title: "B1 · service et précision",
    blurb: "Demandes polies, réserves et précision quand un échange professionnel devient plus dense.",
    kind: "sentence",
    unlockAfter: "set-connected",
    items: [
      {
        id: "srv-1",
        phrase: "Would it be possible to move the appointment?",
        hint: "La demande doit rester polie sans devenir molle.",
        ipa: "/wʊd ɪt bi ˈpɒsəbl tə muːv ði əˈpɔɪntmənt/",
        kind: "sentence",
        focus: "would it be possible",
        level: "B1",
        strength: "La demande garde une vraie intention.",
        tip: "Move et appointment portent l'information.",
        model: "Would it be possible to move the appointment?",
        problemSegment: "possible",
      },
      {
        id: "srv-2",
        phrase: "I appreciate the offer, but we need more time.",
        hint: "Le but est de faire entendre l'ouverture puis la réserve.",
        ipa: "/aɪ əˈpriːʃieɪt ði ˈɒfə bət wiː niːd mɔː taɪm/",
        kind: "sentence",
        focus: "contraste",
        level: "B1",
        strength: "Le refus n'efface pas la relation.",
        tip: "Appuyez davantage sur more time que sur but.",
        model: "I appreciate the offer, but we need more time.",
        problemSegment: "more time",
      },
      {
        id: "srv-3",
        phrase: "Could you clarify what you mean by that?",
        hint: "Clarify garde l'accent principal ; mean reste clair.",
        ipa: "/kəd juː ˈklærɪfaɪ wɒt juː miːn baɪ ðæt/",
        kind: "sentence",
        focus: "clarification",
        level: "B1",
        strength: "La demande reste collaborative.",
        tip: "Ne rendez pas that plus fort que clarify.",
        model: "Could you clarify what you mean by that?",
        problemSegment: "clarify",
      },
      {
        id: "srv-4",
        phrase: "As long as we finish by five, that should work.",
        hint: "Faites entendre la condition avant la conclusion.",
        ipa: "/əz lɒŋ əz wiː ˈfɪnɪʃ baɪ faɪv ðæt ʃʊd wɜːk/",
        kind: "sentence",
        focus: "condition",
        level: "B1",
        strength: "La condition devient immédiatement compréhensible.",
        tip: "Finish by five porte la contrainte.",
        model: "As long as we finish by five, that should work.",
        problemSegment: "finish by five",
      },
    ],
  },
  {
    id: "set-b1-live",
    title: "B1 · parole spontanée",
    blurb: "Choisir, nuancer et réparer sans modèle de phrase visible.",
    kind: "spontaneous",
    unlockAfter: "set-service",
    items: [
      {
        id: "live-1",
        phrase: "Give your view on a recent decision.",
        hint: "Parlez trente à soixante secondes, avec une raison et un exemple.",
        ipa: "",
        kind: "spontaneous",
        focus: "opinion",
        level: "B1",
        strength: "Votre idée devient compréhensible même sans script.",
        tip: "Une raison concrète vaut mieux que trois arguments vagues.",
        model: "I think it was useful because…",
        problemSegment: "because",
      },
      {
        id: "live-2",
        phrase: "Compare two ways of spending an afternoon.",
        hint: "Faites entendre un critère de comparaison.",
        ipa: "",
        kind: "spontaneous",
        focus: "comparison",
        level: "B1",
        strength: "La comparaison a un axe clair.",
        tip: "Annoncez d'abord le critère : time, cost or atmosphere.",
        model: "The market is livelier, whereas the coast is quieter.",
        problemSegment: "whereas",
      },
      {
        id: "live-3",
        phrase: "Solve a small problem without starting again.",
        hint: "Décrivez, proposez, vérifiez. La réparation fait partie de la réussite.",
        ipa: "",
        kind: "spontaneous",
        focus: "repair",
        level: "B1",
        strength: "Vous maintenez le fil malgré l'imprévu.",
        tip: "What I mean is… est une réparation, pas un échec.",
        model: "What I mean is that we need another option.",
        problemSegment: "What I mean is",
      },
    ],
  },
  {
    id: "set-pt-starter",
    title: "Português · premiers gestes",
    blurb: "Saluer, demander, choisir : quatre phrases pour commencer à agir.",
    kind: "sentence",
    language: "pt",
    items: [
      { id: "pt-1", phrase: "Bom dia.", hint: "Gardez les deux mots légers et naturels.", ipa: "/bõ ˈdi.a/", kind: "sentence", focus: "salutation", level: "A1", strength: "Le contact est immédiat.", tip: "Le premier mot reste court ; ne forcez pas le m final.", model: "Bom dia.", problemSegment: "dia" },
      { id: "pt-2", phrase: "Quanto custa?", hint: "Question courte pour demander un prix.", ipa: "/ˈkwɐ̃tu ˈkuʃtɐ/", kind: "sentence", focus: "question", level: "A1", strength: "La demande est claire.", tip: "Gardez custa bref et net.", model: "Quanto custa?", problemSegment: "Quanto" },
      { id: "pt-3", phrase: "Eu gostaria de um café.", hint: "Le groupe verbal doit rester fluide.", ipa: "/ew ɡɔʃtɐˈɾiɐ dɨ ũ kɐˈfɛ/", kind: "sentence", focus: "demande polie", level: "A2", strength: "La demande reste simple.", tip: "Ne donnez pas le même poids à chaque mot.", model: "Eu gostaria de um café.", problemSegment: "gostaria" },
      { id: "pt-4", phrase: "Pode repetir, por favor?", hint: "Le but est de réparer sans abandonner.", ipa: "/ˈpɔdɨ ʁɨpɨˈtiɾ puɾ fɐˈvoɾ/", kind: "sentence", focus: "repair", level: "A2", strength: "Vous récupérez l'échange.", tip: "Répéter doucement suffit ; la vitesse n'est pas l'objectif.", model: "Pode repetir, por favor?", problemSegment: "repetir" },
    ],
  },
  {
    id: "set-it-starter",
    title: "Italiano · premiers gestes",
    blurb: "Entrer dans l'échange, choisir, demander et réparer.",
    kind: "sentence",
    language: "it",
    items: [
      { id: "it-1", phrase: "Buongiorno.", hint: "Une salutation simple, posée.", ipa: "/bwonˈdʒorno/", kind: "sentence", focus: "salutation", level: "A1", strength: "Le contact est net.", tip: "Gardez la première partie liée.", model: "Buongiorno.", problemSegment: "giorno" },
      { id: "it-2", phrase: "Quanto costa?", hint: "La question reste courte.", ipa: "/ˈkwanto ˈkɔsta/", kind: "sentence", focus: "question", level: "A1", strength: "Le prix est demandé sans détour.", tip: "Costa porte le mouvement final.", model: "Quanto costa?", problemSegment: "costa" },
      { id: "it-3", phrase: "Vorrei un caffè, per favore.", hint: "Vorrei ouvre une demande polie.", ipa: "/vorˈrɛi un kafˈfɛ per faˈvoːre/", kind: "sentence", focus: "demande polie", level: "A2", strength: "La demande est naturelle.", tip: "Laissez la phrase avancer vers caffè.", model: "Vorrei un caffè, per favore.", problemSegment: "vorrei" },
      { id: "it-4", phrase: "Può ripetere, per favore?", hint: "Utilisez la répétition comme stratégie normale.", ipa: "/pwɔ ripeˈtere per faˈvoːre/", kind: "sentence", focus: "repair", level: "A2", strength: "Vous gardez le fil.", tip: "Ripetere reçoit l'accent principal.", model: "Può ripetere, per favore?", problemSegment: "ripetere" },
    ],
  },
  {
    id: "set-de-starter",
    title: "Deutsch · premiers gestes",
    blurb: "Saluer, demander un prix, choisir et demander de répéter.",
    kind: "sentence",
    language: "de",
    items: [
      { id: "de-1", phrase: "Guten Morgen.", hint: "Deux mots, une seule ouverture.", ipa: "/ˈɡuːtn̩ ˈmɔʁɡn̩/", kind: "sentence", focus: "salutation", level: "A1", strength: "Le contact est direct.", tip: "Guten reste léger devant Morgen.", model: "Guten Morgen.", problemSegment: "Guten" },
      { id: "de-2", phrase: "Wie viel kostet das?", hint: "Gardez die Frage structurée et courte.", ipa: "/viː fiːl ˈkɔstət das/", kind: "sentence", focus: "question", level: "A1", strength: "La question arrive entière.", tip: "Wie viel forme un groupe, puis kostet.", model: "Wie viel kostet das?", problemSegment: "Wie viel" },
      { id: "de-3", phrase: "Ich hätte gern einen Kaffee.", hint: "Hätte gern exprime une demande polie.", ipa: "/ɪç ˈhɛtə ɡɛʁn̩ ˈaɪnən ˈkafeː/", kind: "sentence", focus: "demande polie", level: "A2", strength: "La demande garde une forme naturelle.", tip: "Hätte gern reste lié.", model: "Ich hätte gern einen Kaffee.", problemSegment: "hätte gern" },
      { id: "de-4", phrase: "Können Sie das bitte wiederholen?", hint: "Demander de répéter fait partie de la conversation.", ipa: "/ˈkœnən ziː das ˈbɪtə ˌviːdɐˈhoːlən/", kind: "sentence", focus: "repair", level: "A2", strength: "Vous réparez sans vous excuser longuement.", tip: "Wiederholen porte le poids final.", model: "Können Sie das bitte wiederholen?", problemSegment: "wiederholen" },
    ],
  },
];

export const PRONLAB_SET: PronlabItem[] = PRONLAB_SETS[0]!.items;

export function allPronlabItems(): PronlabItem[] {
  return PRONLAB_SETS.flatMap((s) => s.items);
}

export function findPronlabItem(id: string) {
  return allPronlabItems().find((item) => item.id === id);
}

export function findPronlabSet(id: string) {
  return PRONLAB_SETS.find((s) => s.id === id);
}

export function setsForLanguage(languageId: string) {
  return PRONLAB_SETS.filter((set) => (set.language ?? "en") === languageId);
}

export const TANDEM_PROMPTS = {
  english: [
    "What did you eat this week that was worth recommending?",
    "Describe the sea near you in three sentences.",
    "Tell me about a song you keep returning to.",
    "What does a good lunch look like at your work?",
    "What is one small habit that makes your week easier?",
    "Tell me about a place you would show to a visitor.",
    "What is something you changed your mind about recently?",
    "Compare two ways of spending a free afternoon.",
    "Describe a problem you solved recently.",
    "What makes a conversation feel comfortable for you?",
  ],
  french: [
    "Racontez votre quartier à quelqu'un qui arrive demain.",
    "Quel plat de l'île expliqueriez-vous à un visiteur ?",
    "Parlez d'une personne qui vous a fait progresser.",
    "Qu'est-ce que vous faites le dimanche, simplement ?",
    "Quelle habitude rend votre semaine plus facile ?",
    "Quel endroit montreriez-vous à quelqu'un qui découvre l'île ?",
    "Parlez d'une idée que vous avez récemment changée.",
    "Comparez deux façons de passer un après-midi libre.",
    "Racontez un problème que vous avez réussi à résoudre.",
    "Qu'est-ce qui rend une conversation agréable pour vous ?",
  ],
};

export const TEACHER_TAGS = [
  "Prononciation",
  "Grammaire",
  "Participation",
  "Volume de parole",
  "Missions manquées",
  "Confiance",
] as const;

export const LEARNER_MEMORY = {
  hesitation: "Aucun point de friction confirmé",
  avoided: "Aucune structure évitée confirmée",
  confidence: "Aucune compétence encore assez documentée",
  leoNote:
    "Votre mémoire de pratique se construit à partir de vos traces réelles. Léo précisera ses repères au fur et à mesure.",
};

export type LibraryDoc = {
  id: string;
  title: string;
  blurb: string;
  language: string;
  level: string;
  minutes: number;
  image: string;
  body: string;
  comprehension?: Array<{
    prompt: string;
    choices: string[];
    answer: string;
    explanation: string;
  }>;
  transferPrompt?: string;
};

export const LIBRARY: LibraryDoc[] = [
  {
    id: "lib-market",
    title: "At the covered market",
    blurb: "Vanilla, fruit, a short exchange. A2, à voix haute.",
    language: "English",
    level: "A2",
    minutes: 4,
    image: "/images/marche.jpg",
    body: "The covered market in Saint-Pierre opens early. You can smell vanilla and fresh fruit before you see the stalls. A woman offers you three dark pods. How much is this? Four euros, she says. You take them, thank her, and walk toward the ocean.",
    comprehension: [{"prompt":"Pourquoi le personnage demande-t-il le prix ?","choices":["Pour choisir entre deux hôtels","Parce qu'il regarde des gousses de vanille","Parce qu'il cherche un billet de bus"],"answer":"Parce qu'il regarde des gousses de vanille","explanation":"Le texte situe l'échange devant un étal de vanille."},{"prompt":"Qu'est-ce que le personnage fait après l'achat ?","choices":["Il retourne au bureau","Il remercie la vendeuse et marche vers l'océan.","Il monte dans un bus."],"answer":"Il remercie la vendeuse et marche vers l'océan.","explanation":"La dernière phrase suit l'achat : remerciement puis marche vers l'océan."},{"prompt":"Quelle question pourriez-vous réellement poser au marché après cette lecture ?","choices":["How much is this?","Where is my passport?","Why is the hotel closed?"],"answer":"How much is this?","explanation":"La question correspond directement à une interaction utile dans la scène du marché."}],
    transferPrompt: "Réutilisez une phrase du texte pour demander quelque chose à un vendeur cette semaine.",
  },
  {
    id: "lib-coast",
    title: "The south coast at dusk",
    blurb: "Volcanic rock, warm light, few words — the ones that stay.",
    language: "English",
    level: "A2",
    minutes: 3,
    image: "/images/reunion-coast.jpg",
    body: "Black rock meets the Indian Ocean. The light is warm and slow. You sit for a minute and try to name what you see: the cliff, a fishing boat, the sky. You do not need a long sentence. Three true words are enough.",
    comprehension: [{"prompt":"Quels éléments le personnage essaie-t-il de nommer ?","choices":["Un avion et une gare","Une falaise, un bateau de pêche et le ciel","Un hôtel et un restaurant"],"answer":"Une falaise, un bateau de pêche et le ciel","explanation":"Le texte propose trois éléments concrets à observer."},{"prompt":"Quelle attitude est encouragée ?","choices":["Produire un long discours","Nommer quelques éléments vrais et simples","Traduire chaque mot avant de parler"],"answer":"Nommer quelques éléments vrais et simples","explanation":"L'objectif est de commencer petit et précis."},{"prompt":"Quelle phrase conviendrait pour prolonger l'activité ?","choices":["I can see a fishing boat.","I need a room key.","Where is gate twelve?"],"answer":"I can see a fishing boat.","explanation":"Cette phrase reprend directement l'observation de la côte."}],
    transferPrompt: "Décrivez un lieu réel en trois phrases courtes sans chercher de vocabulaire compliqué.",
  },
  {
    id: "lib-bus-stop",
    title: "At the bus stop",
    blurb: "A short question, a missed connection, a calm recovery.",
    language: "English",
    level: "A2",
    minutes: 4,
    image: "/images/reunion-coast.jpg",
    body: "The bus is late and you need to check the route. You ask another passenger where the next bus goes. They answer quickly. You miss one word, smile, and ask them to repeat it. The conversation lasts less than a minute, but you get what you need.",
    comprehension: [{"prompt":"Quel est le problème initial ?","choices":["Le bus est en retard.","Le marché est fermé.","Le billet est trop cher."],"answer":"Le bus est en retard.","explanation":"Le texte commence par un retard qui oblige à vérifier l'itinéraire."},{"prompt":"Comment le personnage récupère-t-il un mot qu'il n'a pas compris ?","choices":["Il quitte la conversation.","Il demande de répéter.","Il change de langue immédiatement."],"answer":"Il demande de répéter.","explanation":"La réparation fait partie de l'objectif de la lecture."},{"prompt":"Quelle est la finalité de l'échange ?","choices":["Obtenir une promotion","Obtenir l'information utile pour le trajet","Apprendre toute la grammaire du futur"],"answer":"Obtenir l'information utile pour le trajet","explanation":"La conversation est courte mais fonctionnelle."}],
    transferPrompt: "La prochaine fois qu'un détail vous échappe, utilisez une formule de réparation au lieu de faire semblant.",
  },
  {
    id: "lib-workday",
    title: "One small thing at work",
    blurb: "Explain a delay without over-explaining.",
    language: "English",
    level: "A2+",
    minutes: 4,
    image: "/images/atelier.jpg",
    body: "You promised a colleague a document before lunch. It is not ready yet. You explain why, give a new time, and ask whether that works. The goal is simple: be clear enough that the other person knows what happens next.",
    comprehension: [{"prompt":"Qu'est-ce qui n'est pas prêt ?","choices":["Le document.","Le déjeuner.","La salle."],"answer":"Le document.","explanation":"Le personnage avait promis un document avant midi."},{"prompt":"Que doit-il ajouter à son explication ?","choices":["Une nouvelle heure réaliste.","Une histoire très longue.","Une excuse sans solution."],"answer":"Une nouvelle heure réaliste.","explanation":"Le but est que l'autre personne sache ce qui se passera ensuite."},{"prompt":"Quelle formulation est la plus utile ?","choices":["It isn't ready yet. I'll send it at three.","Maybe someday.","I don't know."],"answer":"It isn't ready yet. I'll send it at three.","explanation":"Elle combine problème et prochaine étape."}],
    transferPrompt: "Expliquez un petit retard réel avec : fait + nouvel horaire + question de confirmation.",
  },
  {
    id: "lib-weekend",
    title: "A Sunday plan",
    blurb: "Suggest, negotiate, and keep the conversation moving.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/reunion-coast.jpg",
    body: "You want to walk by the coast on Sunday morning. A friend prefers a late start. You suggest ten thirty, explain why, and offer coffee afterwards. No perfect sentence is required; the plan only needs to become clear enough for both people.",
    comprehension: [{"prompt":"Sur quoi les deux personnes ne sont-elles pas d'accord ?","choices":["Le lieu du marché","L'heure du départ","Le prix du café"],"answer":"L'heure du départ","explanation":"L'une veut partir plus tôt, l'autre préfère commencer plus tard."},{"prompt":"Quelle stratégie rend la proposition coopérative ?","choices":["Imposer dix heures.","Proposer dix heures trente et expliquer pourquoi.","Annuler sans discuter."],"answer":"Proposer dix heures trente et expliquer pourquoi.","explanation":"La proposition prend en compte la contrainte de l'autre."},{"prompt":"Qu'est-ce que l'exemple montre surtout ?","choices":["Une décision se construit par négociation simple.","Il faut parler parfaitement.","Il faut éviter toute préférence personnelle."],"answer":"Une décision se construit par négociation simple.","explanation":"La langue sert ici à rendre un plan acceptable pour les deux personnes."}],
    transferPrompt: "Négociez une petite décision réelle en donnant une proposition et une alternative.",
  },
  {
    id: "lib-guest",
    title: "A visitor arrives",
    blurb: "Welcome someone and give two useful recommendations.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/vanilla.jpg",
    body: "A visitor arrives in Saint-Pierre for the first time. You welcome them, ask what they enjoy, and recommend one place to eat and one place to walk. They ask you which one you prefer. Give a real answer, not a memorised one.",
    comprehension: [{"prompt":"Que fait le personnage avant de recommander un lieu ?","choices":["Il demande ce que le visiteur aime.","Il lui donne une carte sans parler.","Il réserve un hôtel."],"answer":"Il demande ce que le visiteur aime.","explanation":"La recommandation est adaptée aux préférences de la personne."},{"prompt":"Combien de recommandations sont demandées ?","choices":["Une","Deux","Cinq"],"answer":"Deux","explanation":"Le texte propose un lieu pour manger et un lieu pour marcher."},{"prompt":"Pourquoi donner une préférence personnelle ensuite ?","choices":["Pour rendre la réponse plus authentique.","Pour éviter de répondre.","Pour changer complètement de sujet."],"answer":"Pour rendre la réponse plus authentique.","explanation":"Le visiteur demande laquelle vous préférez réellement."}],
    transferPrompt: "Imaginez accueillir un visiteur. Donnez une recommandation de nourriture et une de promenade.",
  },
  {
    id: "lib-repair",
    title: "When something goes wrong",
    blurb: "Stay calm, describe the problem, ask for a solution.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/cafe.jpg",
    body: "Something you ordered is wrong. You explain the problem without blaming anyone, say what you expected, and ask what can be done. The useful language is practical: enough detail to solve the situation, no speech required.",
    comprehension: [{"prompt":"Quel est le bon ordre d'une réparation ?","choices":["Blâmer, partir, revenir.","Décrire le problème, expliquer l'impact, demander une solution.","Changer de sujet."],"answer":"Décrire le problème, expliquer l'impact, demander une solution.","explanation":"Le texte organise la communication autour de la résolution."},{"prompt":"Quel ton est recommandé ?","choices":["Accusateur","Clair et calme","Très long et défensif"],"answer":"Clair et calme","explanation":"Le but est d'obtenir une solution, pas de gagner un conflit."},{"prompt":"Quelle phrase aide à ouvrir la solution ?","choices":["Could you check it today?","You are wrong.","Forget it."],"answer":"Could you check it today?","explanation":"Elle transforme le problème en demande concrète."}],
    transferPrompt: "Choisissez un petit problème réel et formulez une demande de solution en anglais.",
  },
  {
    id: "lib-airport",
    title: "A delayed flight",
    blurb: "Check a gate, explain a delay, keep the exchange moving.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/airport.jpg",
    body: "The departure board changes just before you reach the gate. Your flight is delayed by forty minutes. You ask a staff member whether the boarding gate will stay the same, listen for the answer, and repeat the key detail to your travel partner. The useful skill is not knowing every airport word; it is recovering the one piece of information that changes your next action.",
    comprehension: [
      {
        prompt: "What changes first?",
        choices: ["The destination", "The departure timing", "The passenger's name"],
        answer: "The departure timing",
        explanation: "The flight is delayed by forty minutes."
      },
      {
        prompt: "Why does the reader ask about the gate?",
        choices: ["To buy food", "To know whether the next action changes", "To change the destination"],
        answer: "To know whether the next action changes",
        explanation: "The reader needs to know whether the gate remains the same."
      },
      {
        prompt: "What happens after the answer?",
        choices: ["The detail is repeated to a travel partner.", "The reader leaves the airport.", "The reader starts a new booking."],
        answer: "The detail is repeated to a travel partner.",
        explanation: "The final sentence shows the information being transmitted to someone else."
      }
    ],
    transferPrompt: "Imagine a real delay. State the change, ask one useful question, then repeat the answer to someone else.",
  },
  {
    id: "lib-phone-call",
    title: "A two-minute phone call",
    blurb: "The line is imperfect. Ask, confirm, and leave with one clear next step.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/cafe.jpg",
    body: "You call a small office to change an appointment. The person answers quickly and gives you two possible times. You miss the first option, ask them to repeat it, then choose the second. Before hanging up, you repeat the date and time so both people leave with the same plan.",
    comprehension: [
      {
        prompt: "What is the purpose of the call?",
        choices: ["To cancel a flight", "To change an appointment", "To order lunch"],
        answer: "To change an appointment",
        explanation: "The call is specifically about moving an appointment."
      },
      {
        prompt: "What does the caller do after missing an option?",
        choices: ["Pretend to understand", "Ask for a repetition", "End the call"],
        answer: "Ask for a repetition",
        explanation: "Repair keeps the conversation functional."
      },
      {
        prompt: "Why does the caller repeat the final details?",
        choices: ["To fill silence", "To make sure both people have the same plan", "To sound formal"],
        answer: "To make sure both people have the same plan",
        explanation: "The repeated date and time confirm the shared understanding."
      }
    ],
    transferPrompt: "Practise one confirmation sentence you could use on a real phone call: date + time + action.",
  },
  {
    id: "lib-hotel",
    title: "A small problem at the hotel",
    blurb: "Describe a problem, explain the impact, ask for a realistic fix.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/atelier.jpg",
    body: "Your room is clean, but the key card stops working after dinner. You return to reception and explain the problem. The receptionist asks for your room number, checks the system, and offers a new card. You confirm that the new card works before returning upstairs.",
    comprehension: [
      {
        prompt: "What is wrong with the room?",
        choices: ["It is dirty", "The key card has stopped working", "There is no bed"],
        answer: "The key card has stopped working",
        explanation: "The problem is the access card, not the room itself."
      },
      {
        prompt: "What information does reception need?",
        choices: ["The room number", "The weather", "The guest's lunch order"],
        answer: "The room number",
        explanation: "The receptionist checks the system using the room number."
      },
      {
        prompt: "What does the guest do before leaving reception?",
        choices: ["Books another hotel", "Checks that the new card works", "Asks for a taxi"],
        answer: "Checks that the new card works",
        explanation: "The guest confirms the solution before returning upstairs."
      }
    ],
    transferPrompt: "Choose a harmless real-life problem and describe it with: what happened + impact + requested fix.",
  },
  {
    id: "lib-neighborhood",
    title: "Showing someone your neighborhood",
    blurb: "Describe what matters, not everything you can see.",
    language: "English",
    level: "A2",
    minutes: 4,
    image: "/images/reunion-coast.jpg",
    body: "A friend is visiting your neighborhood for the first time. You show them the nearest market, a quiet place to sit, and the easiest route to the seafront. They ask which place you prefer. You answer with one reason and leave the rest for later.",
    comprehension: [
      {
        prompt: "Which three things does the visitor get?",
        choices: ["A market, a quiet place, and a route", "A hotel, an airport, and a bus", "Only a restaurant"],
        answer: "A market, a quiet place, and a route",
        explanation: "Those are the three practical points in the text."
      },
      {
        prompt: "What does the friend ask at the end?",
        choices: ["How much is lunch?", "Which place the speaker prefers", "When the airport opens"],
        answer: "Which place the speaker prefers",
        explanation: "The final question asks for a personal preference."
      },
      {
        prompt: "What does the speaker avoid?",
        choices: ["Giving any recommendation", "Explaining every possible detail", "Using a place name"],
        answer: "Explaining every possible detail",
        explanation: "The text models concise, useful guidance."
      }
    ],
    transferPrompt: "Describe your own area in three useful points, then say which one you prefer.",
  },
  {
    id: "lib-meeting",
    title: "Before the meeting starts",
    blurb: "Check one detail, make one small request, get the room ready.",
    language: "English",
    level: "B1",
    minutes: 5,
    image: "/images/atelier.jpg",
    body: "Ten minutes before a meeting, you notice that the room is missing one chair and the screen is not connected. You ask a colleague to find a chair while you check the cable. When the connection still fails, you suggest using the shared document instead. The meeting starts on time because the group solves the problem rather than discussing it for too long.",
    comprehension: [
      {
        prompt: "What is missing?",
        choices: ["A chair and a working screen connection", "The meeting topic", "A calendar invitation"],
        answer: "A chair and a working screen connection",
        explanation: "Both practical problems are identified before the meeting."
      },
      {
        prompt: "What does the group do when the cable still fails?",
        choices: ["Cancel the meeting", "Use the shared document", "Wait for an hour"],
        answer: "Use the shared document",
        explanation: "They switch to a workable alternative."
      },
      {
        prompt: "Why does the meeting start on time?",
        choices: ["Nobody notices the problem", "The group chooses solutions quickly", "The room repairs itself"],
        answer: "The group chooses solutions quickly",
        explanation: "The final sentence directly connects the timing to practical problem-solving."
      }
    ],
    transferPrompt: "Describe one small problem before a meeting and give a clear alternative.",
  },

];

export const LIBRARY_GLOSS: Record<string, string> = {
  covered: "couvert, fermé",
  market: "marché",
  vanilla: "vanille",
  fruit: "fruit",
  stalls: "étals",
  pods: "gousses",
  ocean: "océan",
  cliff: "falaise",
  fishing: "pêche",
  boat: "bateau",
  catch: "prise, poisson du jour",
  flan: "flan",
  recommend: "recommander",
  lunch: "déjeuner",
  remember: "se souvenir",
  smell: "sentir",
  early: "tôt",
  dusk: "crépuscule",
  rock: "roche",
  route: "itinéraire",
  passenger: "passager",
  delay: "retard",
  document: "document",
  negotiate: "négocier",
  visitor: "visiteur",
  solution: "solution",
  departure: "départ",
  gate: "porte d'embarquement",
  delayed: "retardé",
  appointment: "rendez-vous",
  receptionist: "réceptionniste",
  card: "carte",
  neighborhood: "quartier",
  harbour: "port",
  compromise: "compromis",
  constraint: "contrainte",
  screen: "écran",
  cable: "câble",
};

export type ImmersionChallenge = {
  id: string;
  title: string;
  place: string;
  action: string;
  languageCue: string;
  stretch: string;
};

export const IMMERSION = {
  id: "imm-sep",
  title: "Immersion weekend",
  dates: rangeLabelFromToday(10, 11),
  place: "Saint-Pierre et la côte",
  packing: [
    "Une tenue de marche",
    "Un carnet",
    "De quoi enregistrer 60 s",
    "Crème solaire",
    "Écouteurs pour le retour audio",
    "Une petite carte du quartier",
  ],
  itinerary: [
    { when: "Samedi 9:00", what: "Arrivée, café anglais, tour de table.", goal: "Se présenter et poser une question en retour." },
    { when: "Samedi 10:30", what: "Marche vers le marché. Repérer trois lieux.", goal: "Donner des indications courtes." },
    { when: "Samedi 12:30", what: "Marché. Commander sans basculer.", goal: "Demander, choisir, clarifier." },
    { when: "Samedi 16:00", what: "Côte. Décrire ce que l'on voit.", goal: "Produire trois phrases reliées." },
    { when: "Samedi 18:30", what: "Débrief en petit groupe.", goal: "Raconter un moment et une difficulté." },
    { when: "Dimanche 9:30", what: "Atelier Pron'Lab, puis transfert.", goal: "Transformer un son travaillé en phrase utile." },
  ],
  fieldKit: [
    { phrase: "What do you recommend?", use: "Ouvrir un choix dans un lieu réel." },
    { phrase: "Could you say that again?", use: "Récupérer un détail sans changer de langue." },
    { phrase: "What stood out was …", use: "Décrire ce qui vous a marqué." },
    { phrase: "Would that work for you?", use: "Vérifier une proposition." },
    { phrase: "I mean …", use: "Réparer une phrase en gardant le fil." },
  ],
  participants: [] as string[],
  challenges: [
    {
      id: "ch-market",
      title: "Commander + relancer",
      place: "Marché couvert",
      action: "Demandez une recommandation, choisissez un produit et posez une question en retour.",
      languageCue: "I'd recommend … / What about you?",
      stretch: "Demandez une précision sur l'origine ou le prix.",
    },
    {
      id: "ch-directions",
      title: "Donner un chemin",
      place: "Entre le marché et le front de mer",
      action: "Donnez deux étapes et un repère visible à quelqu'un qui cherche un lieu.",
      languageCue: "Go straight … / Turn left at …",
      stretch: "Ajoutez une estimation du temps.",
    },
    {
      id: "ch-coast",
      title: "Décrire la côte",
      place: "Front de mer",
      action: "Décrivez trois éléments visibles et ajoutez une impression personnelle.",
      languageCue: "I can see … / What stands out is …",
      stretch: "Comparez ce lieu à un autre endroit que vous connaissez.",
    },
    {
      id: "ch-repair",
      title: "Réparer en direct",
      place: "N'importe quel échange",
      action: "Demandez de répéter une information que vous n'avez pas comprise puis reformulez-la.",
      languageCue: "Could you say that again? / So you mean …?",
      stretch: "Expliquez quel détail vous aviez manqué.",
    },
  ] as ImmersionChallenge[],
  story:
    "Deux jours. Un marché, une côte, une table. Vos gestes deviennent des traces situées ; le débrief rassemble ce que vous avez réellement rencontré.",
};



export type PlanId = "centre" | "digital" | "premium";

export const PLANS: Array<{
  id: PlanId;
  name: string;
  price: string;
  blurb: string;
  perks: string[];
}> = [
  {
    id: "centre",
    name: "Centre",
    price: "Inclus au parcours",
    blurb: "Saint-Pierre. Le voyage entier, en salle et dehors.",
    perks: ["Missions, Speak, Pron'Lab", "Cours et événements", "Immersion du centre"],
  },
  {
    id: "digital",
    name: "K'Osez Digital",
    price: "9,99 € / mois",
    blurb: "Le voyage depuis n'importe où. Le centre reste le hub physique.",
    perks: ["Missions", "Speak Rooms", "Pron'Lab", "Événements en ligne"],
  },
  {
    id: "premium",
    name: "K'Osez Premium",
    price: "19,99 € / mois",
    blurb: "Mémoire Léo, tandem prioritaire, bibliothèque, immersions en avant-première.",
    perks: ["Tout Digital", "Mémoire Léo", "Tandem prioritaire", "Bibliothèque", "Immersions anticipées"],
  },
];

export const LANGUAGE_MODULES = [
  { id: "en", name: "English", status: "actif" },
  { id: "cr", name: "Créole réunionnais", status: "module centre" },
  { id: "es", name: "Español", status: "même moteur" },
  { id: "pt", name: "Português", status: "starter A1–A2" },
  { id: "it", name: "Italiano", status: "starter A1–A2" },
  { id: "de", name: "Deutsch", status: "starter A1–A2" },
  { id: "lsf", name: "LSF", status: "même moteur" },
];

export const MARKETPLACE = [
  {
    id: "imm-sep",
    title: "Immersion weekend",
    dates: rangeLabelFromToday(10, 11),
    place: "Saint-Pierre et la côte",
    spots: 10,
    price: "Inclus au centre",
    image: "/images/reunion-coast.jpg",
    early: false,
    companion: true,
    blurb: "Marché, côte, table. Le plant s'en souvient.",
  },
  {
    id: "imm-east",
    title: "Est · vanille et table",
    dates: rangeLabelFromToday(18, 20),
    place: "Sainte-Anne",
    spots: 8,
    price: "Liste d'attente",
    image: "/images/vanilla.jpg",
    early: true,
    companion: false,
    blurb: "Trois jours autour des gousses, sans basculer.",
  },
  {
    id: "imm-maurice",
    title: "Partenaire · Maurice",
    dates: rangeLabelFromToday(46, 48),
    place: "Pointe d'Esny",
    spots: 12,
    price: "Sur devis",
    image: "/images/cafe.jpg",
    early: true,
    companion: false,
    blurb: "Un partenaire, le même moteur BLOSSOM. Le hub reste Saint-Pierre.",
  },
] as const;

export type PlanFeature =
  | "tandem"
  | "library"
  | "memory"
  | "immersionEarly"
  | "core";

export function planAllows(plan: PlanId, feature: PlanFeature): boolean {
  if (feature === "core") return true;
  if (plan === "centre" || plan === "premium") return true;
  return false;
}

export function attendanceProof(input: {
  missions: number;
  speak: number;
  pronlab: number;
  tandem: number;
}) {
  return {
    id: "att-regularite",
    title: "Attestation de régularité",
    ready: input.missions >= 8 && input.speak >= 1,
    lines: [
      `${input.missions} missions`,
      `${input.speak} session${input.speak > 1 ? "s" : ""} Speak`,
      `${input.pronlab} set${input.pronlab > 1 ? "s" : ""} Pron'Lab`,
      `${input.tandem} tandem${input.tandem > 1 ? "s" : ""}`,
    ],
    note: "Une preuve de présence, pas un diplôme. Le centre signe quand le cycle est clos.",
  };
}
