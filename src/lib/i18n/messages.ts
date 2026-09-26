import type { UiLocaleId } from "./locales";

/** Nested message keys — keep flat-ish for autocomplete-friendly access. */
export type MessageTree = {
  nav: {
    blossom: string;
    blossomDesc: string;
    osez: string;
    osezDesc: string;
    explore: string;
    exploreDesc: string;
    connect: string;
    connectDesc: string;
    learn: string;
    learnDesc: string;
    moi: string;
    moiDesc: string;
    plant: string;
    mission: string;
    pulse: string;
    immersion: string;
    presences: string;
    tandem: string;
    curriculum: string;
    pronlab: string;
    library: string;
    review: string;
    progress: string;
    history: string;
    labs: string;
  };
  languages: {
    sectionUi: string;
    sectionUiLead: string;
    sectionLearn: string;
    sectionLearnLead: string;
    active: string;
    coverageFull: string;
    coveragePartial: string;
    coveragePlanned: string;
    engineActive: string;
    engineModule: string;
    engineSame: string;
    engineSign: string;
    packs: string;
    packsEmpty: string;
    speech: string;
    independentNote: string;
    changedUi: string;
    changedLearn: string;
    htmlLang: string;
    impactTitle: string;
    impactLead: string;
    impactPronlab: string;
    impactMission: string;
    impactTandem: string;
    impactSpeech: string;
    impactOsez: string;
    impactNone: string;
    surfaces: string;
    levels: string;
    cultural: string;
    switchConfirm: string;
    nativeHint: string;
  };
  common: {
    back: string;
    continue: string;
    save: string;
    cancel: string;
    loading: string;
    retry: string;
    open: string;
    close: string;
    search: string;
    more: string;
  };
  moi: {
    title: string;
    languagesEyebrow: string;
    profileEyebrow: string;
  };
  sync: {
    conflict: string;
    offline: string;
    syncing: string;
    synced: string;
    conflictDetailOne: string;
    conflictDetailMany: string;
    pendingOne: string;
    pendingMany: string;
    nonePending: string;
  };
  context: {
    learn: string;
    osez: string;
    explore: string;
    connect: string;
    blossom: string;
    moi: string;
  };
  welcome: {
    location: string;
    yourBlossom: string;
    steps: {
      identity: { eyebrow: string; title: string; detail: string; short: string };
      level: { eyebrow: string; title: string; detail: string; short: string };
      goal: { eyebrow: string; title: string; detail: string; short: string };
      rhythm: { eyebrow: string; title: string; detail: string; short: string };
    };
    footerNote: string;
    configTitle: string;
    firstName: string;
    firstNamePlaceholder: string;
    todayMission: string;
    levels: {
      A1: { title: string; detail: string };
      A2: { title: string; detail: string };
      B1: { title: string; detail: string };
    };
    goals: string[];
    interests: string[];
    orFormulate: string;
    goalPlaceholder: string;
    whatInterests: string;
    practiceWindow: string;
    rhythms: {
      morning: { label: string; detail: string };
      noon: { label: string; detail: string };
      evening: { label: string; detail: string };
    };
    coaches: {
      calm: { id: string; voice: string; detail: string };
      direct: { id: string; voice: string; detail: string };
      warm: { id: string; voice: string; detail: string };
    };
    coachTitle: string;
    enter: string;
  };
};

// Full content is in the artifact; using minimal valid tree so app does not break.
// The comprehensive expansion is applied next.

const fr: MessageTree = {
  nav: {
    blossom: "BLOSSOM",
    blossomDesc: "Votre parcours",
    osez: "OSEZ",
    osezDesc: "Parler maintenant",
    explore: "EXPLORE",
    exploreDesc: "Le monde réel",
    connect: "CONNECT",
    connectDesc: "Présences & tandem",
    learn: "LEARN",
    learnDesc: "Pratiquer & ancrer",
    moi: "MOI",
    moiDesc: "Votre espace",
    plant: "Végétal",
    mission: "Mission terrain",
    pulse: "Pulse",
    immersion: "Immersion",
    presences: "Présences",
    tandem: "Tandem",
    curriculum: "Parcours",
    pronlab: "Pron'Lab",
    library: "Bibliothèque",
    review: "Réviser",
    progress: "Compétences",
    history: "Historique",
    labs: "Labs",
  },
  languages: {
    sectionUi: "Langue de l'application",
    sectionUiLead: "Menus, boutons, statuts, toasts. Indépendante de la langue que vous apprenez.",
    sectionLearn: "Langue apprise",
    sectionLearnLead: "Contenu moteur : missions, Pron'Lab, rooms, tandem. Change les sets, le speech et le ranking partenaires.",
    active: "Actif",
    coverageFull: "Interface complète",
    coveragePartial: "Traduction partielle",
    coveragePlanned: "Prévu",
    engineActive: "Parcours complet",
    engineModule: "Module centre",
    engineSame: "Même moteur",
    engineSign: "Langue des signes",
    packs: "Packs de contenu",
    packsEmpty: "Aucun pack local pour l'instant — le moteur reste disponible.",
    speech: "Synthèse / écoute",
    independentNote: "Astuce : l'interface peut rester en français pendant que vous apprenez l'anglais — ou l'inverse. Les deux axes sont indépendants.",
    changedUi: "Langue de l'application mise à jour. Menus et toasts suivent.",
    changedLearn: "Langue apprise mise à jour. Pron'Lab, speech, missions et ranking tandem suivent.",
    htmlLang: "Attribut HTML lang",
    impactTitle: "Ce qui change concrètement",
    impactLead: "Changer la langue apprise recalibre le moteur de contenu. Voici l'impact exact.",
    impactPronlab: "Sets Pron'Lab et feuilles phonèmes filtrés par packs",
    impactMission: "Missions terrain et briefs dans la langue cible",
    impactTandem: "Ranking partenaires biaisé vers locuteurs de la langue",
    impactSpeech: "Synthèse vocale et STT sur le locale speech",
    impactOsez: "Rooms OSEZ et Pulse dans la langue cible",
    impactNone: "Aucun pack local — moteur générique, packs centre si disponibles",
    surfaces: "Surfaces touchées",
    levels: "Niveaux supportés",
    cultural: "Ancrage culturel",
    switchConfirm: "Confirmer le changement",
    nativeHint: "Langue maternelle du profil (MOI) reste distincte",
  },
  common: {
    back: "Retour",
    continue: "Continuer",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement…",
    retry: "Réessayer",
    open: "Ouvrir",
    close: "Fermer",
    search: "Rechercher",
    more: "Plus",
  },
  moi: {
    title: "Votre espace",
    languagesEyebrow: "Langues",
    profileEyebrow: "Profil apprenant",
  },
  sync: {
    conflict: "Conflit à résoudre",
    offline: "Hors connexion",
    syncing: "Synchronisation",
    synced: "Synchronisé",
    conflictDetailOne: "1 modification nécessite votre attention",
    conflictDetailMany: "{n} modifications nécessitent votre attention",
    pendingOne: "1 changement en attente",
    pendingMany: "{n} changements en attente",
    nonePending: "Aucun changement en attente",
  },
  context: {
    learn: "Atelier LEARN",
    osez: "Parler",
    explore: "Sortir",
    connect: "Présences",
    blossom: "Votre croissance",
    moi: "Votre espace",
  },
  welcome: {
    location: "Saint-Pierre · La Réunion",
    yourBlossom: "Votre BLOSSOM",
    steps: {
      identity: {
        eyebrow: "01 · VOUS",
        title: "Commençons par vous.",
        detail: "Quelques repères suffisent. K'Osez s'en servira pour choisir le bon niveau de pression, les bonnes situations et le bon rythme.",
        short: "Identité",
      },
      level: {
        eyebrow: "02 · REPÈRE",
        title: "Où en êtes-vous aujourd'hui ?",
        detail: "Ce n'est pas un examen. Votre réponse détermine simplement le point de départ des premières pratiques.",
        short: "Repère",
      },
      goal: {
        eyebrow: "03 · INTENTION",
        title: "Pour quoi voulez-vous parler ?",
        detail: "Le but devient un filtre pour les missions, les Speak Rooms et les exemples proposés par Léo.",
        short: "Intention",
      },
      rhythm: {
        eyebrow: "04 · RYTHME",
        title: "Installez un rythme que vous pourrez tenir.",
        detail: "Pas besoin d'une heure par jour. Une fenêtre réaliste donne au système un meilleur signal qu'une ambition impossible.",
        short: "Rythme",
      },
    },
    footerNote: "Vos choix restent modifiables dans MOI. L'objectif est de rendre les premières pratiques plus justes, pas de vous enfermer dans un profil.",
    configTitle: "Une configuration, puis vous entrez.",
    firstName: "Prénom",
    firstNamePlaceholder: "Votre prénom",
    todayMission: "La mission d'aujourd'hui",
    levels: {
      A1: { title: "Je commence", detail: "Je peux saluer, me présenter et comprendre des phrases très simples." },
      A2: { title: "Je me débrouille", detail: "Je peux gérer des échanges familiers, mais je cherche encore mes mots." },
      B1: { title: "Je peux tenir l'échange", detail: "Je peux expliquer, raconter et relancer sur des sujets courants." },
    },
    goals: [
      "Parler au travail",
      "Voyager avec plus d'aisance",
      "Comprendre les conversations",
      "Passer un cap à l'oral",
      "Me sentir plus spontané",
    ],
    interests: ["Cuisine", "Océan", "Musique", "Voyage", "Travail", "Culture"],
    orFormulate: "Ou formulez-le à votre manière",
    goalPlaceholder: "Ex. : prendre la parole avec mes clients",
    whatInterests: "Ce qui vous intéresse",
    practiceWindow: "Votre fenêtre de pratique",
    rhythms: {
      morning: { label: "Matin", detail: "Avant que la journée commence." },
      noon: { label: "Midi", detail: "Une respiration au milieu de la journée." },
      evening: { label: "Soir", detail: "Quand le rythme professionnel retombe." },
    },
    coaches: {
      calm: { id: "Posé", voice: "Posé, précis, jamais infantilisant.", detail: "Calme, précis, jamais infantilisant." },
      direct: { id: "Direct", voice: "Direct, concis, orienté action.", detail: "Plus de pression, peu de détour." },
      warm: { id: "Chaleureux", voice: "Chaleureux, humain, contextualisé.", detail: "Encourageant, humain, très contextualisé." },
    },
    coachTitle: "Voix du coach",
    enter: "Entrer dans BLOSSOM",
  },
};

const en: MessageTree = {
  ...fr,
  nav: {
    ...fr.nav,
    blossomDesc: "Your journey",
    osez: "SPEAK",
    osezDesc: "Speak now",
    exploreDesc: "The real world",
    connectDesc: "Presence & tandem",
    learnDesc: "Practice & anchor",
    moi: "ME",
    moiDesc: "Your space",
    plant: "Plant",
    mission: "Field mission",
    immersion: "Immersion",
    presences: "Presences",
    curriculum: "Path",
    library: "Library",
    review: "Review",
    progress: "Skills",
    history: "History",
  },
  languages: {
    ...fr.languages,
    sectionUi: "App language",
    sectionUiLead: "Menus, buttons, status lines, toasts. Independent from the language you learn.",
    sectionLearn: "Learning language",
    sectionLearnLead: "Engine content: missions, Pron'Lab, rooms, tandem. Switches sets, speech and partner ranking.",
    active: "Active",
    coverageFull: "Full interface",
    coveragePartial: "Partial translation",
    coveragePlanned: "Planned",
    engineActive: "Full path",
    engineModule: "Centre module",
    engineSame: "Same engine",
    engineSign: "Sign language",
    packs: "Content packs",
    packsEmpty: "No local packs yet — the engine still runs.",
    speech: "Speech / listening",
    independentNote: "Tip: the interface can stay in French while you learn English — or the reverse. The two axes are independent.",
    changedUi: "App language updated. Menus and toasts follow.",
    changedLearn: "Learning language updated. Pron'Lab, speech, missions and tandem ranking follow.",
    htmlLang: "HTML lang attribute",
    impactTitle: "What actually changes",
    impactLead: "Switching the learning language recalibrates the content engine. Exact impact below.",
    impactPronlab: "Pron'Lab sets and phoneme leaves filtered by packs",
    impactMission: "Field missions and briefs in the target language",
    impactTandem: "Partner ranking biased toward speakers of the language",
    impactSpeech: "Speech synthesis and STT on the speech locale",
    impactOsez: "OSEZ rooms and Pulse in the target language",
    impactNone: "No local packs — generic engine, centre packs if available",
    surfaces: "Surfaces touched",
    levels: "Supported levels",
    cultural: "Cultural anchor",
    switchConfirm: "Confirm switch",
    nativeHint: "Profile native language (ME) stays distinct",
  },
  common: {
    back: "Back",
    continue: "Continue",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading…",
    retry: "Retry",
    open: "Open",
    close: "Close",
    search: "Search",
    more: "More",
  },
  moi: { title: "Your space", languagesEyebrow: "Languages", profileEyebrow: "Learner profile" },
  sync: {
    conflict: "Conflict to resolve",
    offline: "Offline",
    syncing: "Syncing",
    synced: "Synced",
    conflictDetailOne: "1 change needs your attention",
    conflictDetailMany: "{n} changes need your attention",
    pendingOne: "1 change pending",
    pendingMany: "{n} changes pending",
    nonePending: "No pending changes",
  },
  context: {
    learn: "LEARN workshop",
    osez: "Speak",
    explore: "Go out",
    connect: "Presences",
    blossom: "Your growth",
    moi: "Your space",
  },
  welcome: {
    ...fr.welcome,
    location: "Saint-Pierre · Réunion",
    yourBlossom: "Your BLOSSOM",
    steps: {
      identity: { eyebrow: "01 · YOU", title: "Let's start with you.", detail: "A few landmarks are enough. K'Osez will use them to choose the right pressure level, situations and rhythm.", short: "Identity" },
      level: { eyebrow: "02 · LEVEL", title: "Where are you today?", detail: "This is not an exam. Your answer simply sets the starting point for the first practices.", short: "Level" },
      goal: { eyebrow: "03 · INTENTION", title: "What do you want to speak for?", detail: "The goal becomes a filter for missions, Speak Rooms and the examples Léo proposes.", short: "Intention" },
      rhythm: { eyebrow: "04 · RHYTHM", title: "Set a rhythm you can keep.", detail: "No need for an hour a day. A realistic window gives the system a better signal than an impossible ambition.", short: "Rhythm" },
    },
    footerNote: "Your choices stay editable in ME. The goal is to make the first practices fairer, not to lock you into a profile.",
    configTitle: "One setup, then you enter.",
    firstName: "First name",
    firstNamePlaceholder: "Your first name",
    todayMission: "Today's mission",
    levels: {
      A1: { title: "I'm starting", detail: "I can greet, introduce myself and understand very simple sentences." },
      A2: { title: "I get by", detail: "I can handle familiar exchanges, but I still search for my words." },
      B1: { title: "I can hold the exchange", detail: "I can explain, narrate and follow up on everyday topics." },
    },
    goals: ["Speak at work", "Travel with more ease", "Understand conversations", "Level up oral skills", "Feel more spontaneous"],
    interests: ["Cooking", "Ocean", "Music", "Travel", "Work", "Culture"],
    orFormulate: "Or phrase it your way",
    goalPlaceholder: "e.g. speak up with my clients",
    whatInterests: "What interests you",
    practiceWindow: "Your practice window",
    rhythms: {
      morning: { label: "Morning", detail: "Before the day starts." },
      noon: { label: "Noon", detail: "A breath in the middle of the day." },
      evening: { label: "Evening", detail: "When work pressure eases." },
    },
    coaches: {
      calm: { id: "Calm", voice: "Calm, precise, never infantilising.", detail: "Calm, precise, never infantilising." },
      direct: { id: "Direct", voice: "Direct, concise, action-oriented.", detail: "More pressure, little detour." },
      warm: { id: "Warm", voice: "Warm, human, contextualised.", detail: "Encouraging, human, highly contextualised." },
    },
    coachTitle: "Coach voice",
    enter: "Enter BLOSSOM",
  },
};

const es = { ...en } as MessageTree;
const pt = { ...en } as MessageTree;
const de = { ...en } as MessageTree;
const it = { ...en } as MessageTree;

export const MESSAGES: Record<UiLocaleId, MessageTree> = {
  fr,
  en,
  es,
  pt,
  de,
  it,
};
