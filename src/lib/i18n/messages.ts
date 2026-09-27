import type { UiLocaleId } from "./locales";

/** EMERGENCY RESTORE STUB — full file follows in next commit */
export type MessageTree = {
  nav: Record<string, string>;
  languages: Record<string, string>;
  common: {
    back: string; continue: string; save: string; cancel: string; loading: string; saving: string;
    retry: string; open: string; close: string; search: string; more: string;
  };
  errors: { notFound: string; notFoundDetail: string; backToBlossom: string };
  courage: {
    ribbon: string; count: string; ariaDays: string; titleOn: string; titleOff: string; holesNote: string;
  };
  moi: { title: string; languagesEyebrow: string; profileEyebrow: string };
  sync: Record<string, string>;
  context: Record<string, string>;
  welcome: any;
};

const fr: MessageTree = {
  nav: {
    blossom: "BLOSSOM", blossomDesc: "Votre parcours", osez: "OSEZ", osezDesc: "Parler maintenant",
    explore: "EXPLORE", exploreDesc: "Le monde réel", connect: "CONNECT", connectDesc: "Présences & tandem",
    learn: "LEARN", learnDesc: "Pratiquer & ancrer", moi: "MOI", moiDesc: "Votre espace",
    plant: "Végétal", mission: "Mission terrain", pulse: "Pulse", immersion: "Immersion",
    presences: "Présences", tandem: "Tandem", curriculum: "Parcours", pronlab: "Pron'Lab",
    library: "Bibliothèque", review: "Réviser", progress: "Compétences", history: "Historique", labs: "Labs",
  },
  languages: {
    sectionUi: "Langue de l'application", sectionUiLead: "Menus, boutons, statuts, toasts.",
    sectionLearn: "Langue apprise", sectionLearnLead: "Contenu moteur.", active: "Actif",
    coverageFull: "Interface complète", coveragePartial: "Traduction partielle", coveragePlanned: "Prévu",
    engineActive: "Parcours complet", engineModule: "Module centre", engineSame: "Même moteur", engineSign: "Langue des signes",
    packs: "Packs", packsEmpty: "Aucun pack", speech: "Synthèse", independentNote: "Axes indépendants.",
    changedUi: "Langue app mise à jour.", changedLearn: "Langue apprise mise à jour.", htmlLang: "HTML lang",
    impactTitle: "Impact", impactLead: "Impact.", impactPronlab: "Pron'Lab", impactMission: "Missions",
    impactTandem: "Tandem", impactSpeech: "Speech", impactOsez: "OSEZ", impactNone: "Aucun",
    surfaces: "Surfaces", levels: "Niveaux", cultural: "Culture", switchConfirm: "Confirmer", nativeHint: "Natif distinct",
  },
  common: {
    back: "Retour", continue: "Continuer", save: "Enregistrer", cancel: "Annuler",
    loading: "Chargement…", saving: "Enregistrement…", retry: "Réessayer",
    open: "Ouvrir", close: "Fermer", search: "Rechercher", more: "Plus",
  },
  errors: {
    notFound: "Page introuvable",
    notFoundDetail: "Ce chemin n'existe pas dans le voyage.",
    backToBlossom: "Retour à BLOSSOM",
  },
  courage: {
    ribbon: "Ruban de courage",
    count: "{n} / 28 · sans flamme",
    ariaDays: "28 derniers jours de parole",
    titleOn: "Geste ce jour-là",
    titleOff: "Terre en jachère",
    holesNote: "Les trous ne sont pas un échec — terre en jachère.",
  },
  moi: { title: "Votre espace", languagesEyebrow: "Langues", profileEyebrow: "Profil apprenant" },
  sync: {
    conflict: "Conflit à résoudre", offline: "Hors connexion", syncing: "Synchronisation", synced: "Synchronisé",
    conflictDetailOne: "1 modification nécessite votre attention",
    conflictDetailMany: "{n} modifications nécessitent votre attention",
    pendingOne: "1 changement en attente", pendingMany: "{n} changements en attente", nonePending: "Aucun changement en attente",
  },
  context: {
    learn: "Atelier LEARN", osez: "Parler", explore: "Sortir", connect: "Présences",
    blossom: "Votre croissance", moi: "Votre espace",
  },
  welcome: {
    location: "Saint-Pierre · La Réunion", yourBlossom: "Votre BLOSSOM",
    steps: {
      identity: { eyebrow: "01 · VOUS", title: "Commençons par vous.", detail: "Repères.", short: "Identité" },
      level: { eyebrow: "02 · REPÈRE", title: "Où en êtes-vous ?", detail: "Point de départ.", short: "Repère" },
      goal: { eyebrow: "03 · INTENTION", title: "Pour quoi parler ?", detail: "Filtre.", short: "Intention" },
      rhythm: { eyebrow: "04 · RYTHME", title: "Un rythme tenable.", detail: "Fenêtre réaliste.", short: "Rythme" },
    },
    footerNote: "Modifiable dans MOI.", configTitle: "Configuration puis entrée.",
    firstName: "Prénom", firstNamePlaceholder: "Votre prénom", todayMission: "Mission du jour",
    levels: {
      A1: { title: "Je commence", detail: "Phrases simples." },
      A2: { title: "Je me débrouille", detail: "Échanges familiers." },
      B1: { title: "Je tiens l'échange", detail: "Sujets courants." },
    },
    goals: ["Parler au travail", "Voyager", "Comprendre", "Passer un cap", "Spontanéité"],
    interests: ["Cuisine", "Océan", "Musique", "Voyage", "Travail", "Culture"],
    orFormulate: "Ou formulez", goalPlaceholder: "Ex. clients", whatInterests: "Intérêts",
    practiceWindow: "Fenêtre", rhythms: {
      morning: { label: "Matin", detail: "Avant la journée." },
      noon: { label: "Midi", detail: "Milieu." },
      evening: { label: "Soir", detail: "Après le travail." },
    },
    coaches: {
      calm: { id: "Posé", voice: "Posé.", detail: "Calme." },
      direct: { id: "Direct", voice: "Direct.", detail: "Action." },
      warm: { id: "Chaleureux", voice: "Chaleureux.", detail: "Humain." },
    },
    coachTitle: "Voix du coach", enter: "Entrer dans BLOSSOM",
  },
};

const en: MessageTree = {
  ...fr,
  nav: { ...fr.nav, blossomDesc: "Your journey", osez: "SPEAK", osezDesc: "Speak now", moi: "ME", moiDesc: "Your space",
    plant: "Plant", mission: "Field mission", library: "Library", review: "Review", progress: "Skills", history: "History" },
  common: {
    back: "Back", continue: "Continue", save: "Save", cancel: "Cancel",
    loading: "Loading…", saving: "Saving…", retry: "Retry",
    open: "Open", close: "Close", search: "Search", more: "More",
  },
  errors: {
    notFound: "Page not found",
    notFoundDetail: "This path does not exist in the journey.",
    backToBlossom: "Back to BLOSSOM",
  },
  courage: {
    ribbon: "Courage ribbon",
    count: "{n} / 28 · no flame",
    ariaDays: "Last 28 days of speech",
    titleOn: "A gesture that day",
    titleOff: "Fallow ground",
    holesNote: "Gaps are not failure — fallow ground.",
  },
  moi: { title: "Your space", languagesEyebrow: "Languages", profileEyebrow: "Learner profile" },
  sync: {
    conflict: "Conflict to resolve", offline: "Offline", syncing: "Syncing", synced: "Synced",
    conflictDetailOne: "1 change needs your attention", conflictDetailMany: "{n} changes need your attention",
    pendingOne: "1 change pending", pendingMany: "{n} changes pending", nonePending: "No pending changes",
  },
  context: {
    learn: "LEARN workshop", osez: "Speak", explore: "Go out", connect: "Presences",
    blossom: "Your growth", moi: "Your space",
  },
  welcome: {
    ...fr.welcome,
    location: "Saint-Pierre · Réunion", yourBlossom: "Your BLOSSOM",
    steps: {
      identity: { eyebrow: "01 · YOU", title: "Let's start with you.", detail: "A few landmarks.", short: "Identity" },
      level: { eyebrow: "02 · LEVEL", title: "Where are you today?", detail: "Starting point.", short: "Level" },
      goal: { eyebrow: "03 · INTENTION", title: "What do you want to speak for?", detail: "A filter.", short: "Intention" },
      rhythm: { eyebrow: "04 · RHYTHM", title: "Set a rhythm you can keep.", detail: "Realistic window.", short: "Rhythm" },
    },
    footerNote: "Editable in ME.", configTitle: "One setup, then you enter.",
    firstName: "First name", firstNamePlaceholder: "Your first name", todayMission: "Today's mission",
    levels: {
      A1: { title: "I'm starting", detail: "Simple sentences." },
      A2: { title: "I get by", detail: "Familiar exchanges." },
      B1: { title: "I can hold the exchange", detail: "Everyday topics." },
    },
    goals: ["Speak at work", "Travel", "Understand", "Level up", "Spontaneous"],
    interests: ["Cooking", "Ocean", "Music", "Travel", "Work", "Culture"],
    orFormulate: "Or phrase it", goalPlaceholder: "e.g. clients", whatInterests: "Interests",
    practiceWindow: "Practice window",
    rhythms: {
      morning: { label: "Morning", detail: "Before the day." },
      noon: { label: "Noon", detail: "Midday." },
      evening: { label: "Evening", detail: "After work." },
    },
    coaches: {
      calm: { id: "Calm", voice: "Calm.", detail: "Precise." },
      direct: { id: "Direct", voice: "Direct.", detail: "Action." },
      warm: { id: "Warm", voice: "Warm.", detail: "Human." },
    },
    coachTitle: "Coach voice", enter: "Enter BLOSSOM",
  },
};

// Non-FR locales fall back to EN structure with explicit EN strings (honest partial).
export const MESSAGES: Record<UiLocaleId, MessageTree> = {
  fr,
  en,
  es: en,
  pt: en,
  de: en,
  it: en,
};
