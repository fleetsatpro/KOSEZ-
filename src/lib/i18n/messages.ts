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
    coachTitle: string;
    coaches: {
      calm: { label: string; detail: string };
      direct: { label: string; detail: string };
      warm: { label: string; detail: string };
    };
    enter: string;
  };
  errors: {
    notFound: string;
    notFoundDetail: string;
    backToBlossom: string;
  };
  courage: {
    ribbon: string;
    count: string;
    ariaDays: string;
    titleOn: string;
    titleOff: string;
    holesNote: string;
  };
};

const fr: MessageTree = {
  nav: {
    blossom: "BLOSSOM",
    blossomDesc: "Votre plante, votre focus",
    osez: "OSEZ",
    osezDesc: "Parler maintenant",
    explore: "EXPLORE",
    exploreDesc: "Rencontres & immersions",
    connect: "CONNECT",
    connectDesc: "Présence partagée",
    learn: "LEARN",
    learnDesc: "Curriculum & Pron'Lab",
    moi: "MOI",
    moiDesc: "Identité & plan",
    plant: "Plante",
    mission: "Mission",
    pulse: "Pulse",
    immersion: "Immersion",
    presences: "Présences",
    tandem: "Tandem",
    curriculum: "Parcours",
    pronlab: "Pron'Lab",
    library: "Bibliothèque",
    review: "Révision",
    progress: "Progression",
    history: "Historique",
    labs: "Labos",
  },
  languages: {
    sectionUi: "Langue de l'app",
    sectionUiLead: "Menus, boutons, statuts. Indépendant de la langue pratiquée.",
    sectionLearn: "Langue à apprendre",
    sectionLearnLead: "Contenu Pron'Lab, missions, OSEZ, reconnaissance.",
    active: "Actif",
    coverageFull: "Complet",
    coveragePartial: "Partiel",
    coveragePlanned: "Prévu",
    engineActive: "Moteur actif",
    engineModule: "Module",
    engineSame: "Même moteur",
    engineSign: "Langue des signes",
    packs: "Packs",
    packsEmpty: "Aucun pack",
    speech: "Parole",
    independentNote: "Les deux choix sont indépendants.",
    changedUi: "Langue de l'app mise à jour",
    changedLearn: "Langue d'apprentissage mise à jour",
    htmlLang: "html lang",
    impactTitle: "Impact",
    impactLead: "Ce que change ce choix.",
    impactPronlab: "Pron'Lab cible cette langue",
    impactMission: "Missions reformulées",
    impactTandem: "Tandem biaisé vers cette langue",
    impactSpeech: "Reconnaissance",
    impactOsez: "OSEZ dans cette langue",
    impactNone: "Pas d'impact direct",
    surfaces: "Surfaces",
    levels: "Niveaux",
    cultural: "Ancrage",
    switchConfirm: "Confirmer",
    nativeHint: "Nom natif affiché",
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
    profileEyebrow: "Profil",
  },
  sync: {
    conflict: "Conflit de sync",
    offline: "Hors ligne",
    syncing: "Synchronisation…",
    synced: "À jour",
    conflictDetailOne: "1 conflit",
    conflictDetailMany: "{n} conflits",
    pendingOne: "1 en attente",
    pendingMany: "{n} en attente",
    nonePending: "Rien en attente",
  },
  context: {
    learn: "Apprendre",
    osez: "Oser",
    explore: "Explorer",
    connect: "Connecter",
    blossom: "BLOSSOM",
    moi: "MOI",
  },
  welcome: {
    location: "Saint-Pierre · La Réunion",
    yourBlossom: "Votre BLOSSOM",
    steps: {
      identity: { eyebrow: "01 · VOUS", title: "Commençons par vous.", detail: "Quelques repères suffisent.", short: "Identité" },
      level: { eyebrow: "02 · REPÈRE", title: "Où en êtes-vous ?", detail: "Ce n'est pas un examen.", short: "Repère" },
      goal: { eyebrow: "03 · INTENTION", title: "Pour quoi parler ?", detail: "Le but filtre les missions.", short: "Intention" },
      rhythm: { eyebrow: "04 · RYTHME", title: "Un rythme tenable.", detail: "Une fenêtre réaliste.", short: "Rythme" },
    },
    footerNote: "Modifiable dans MOI.",
    configTitle: "Une configuration, puis vous entrez.",
    firstName: "Prénom",
    firstNamePlaceholder: "Votre prénom",
    todayMission: "La mission d'aujourd'hui",
    levels: {
      A1: { title: "Je commence", detail: "Saluer, me présenter." },
      A2: { title: "Je me débrouille", detail: "Échanges familiers." },
      B1: { title: "Je tiens l'échange", detail: "Expliquer, raconter." },
    },
    goals: ["Parler au travail", "Voyager", "Comprendre", "Passer un cap", "Être spontané"],
    interests: ["Cuisine", "Océan", "Musique", "Voyage", "Travail", "Culture"],
    orFormulate: "Ou formulez-le",
    goalPlaceholder: "Ex. : clients",
    whatInterests: "Ce qui vous intéresse",
    practiceWindow: "Fenêtre de pratique",
    rhythms: {
      morning: { label: "Matin", detail: "Avant la journée" },
      noon: { label: "Midi", detail: "Une respiration" },
      evening: { label: "Soir", detail: "Après le travail" },
    },
    coachTitle: "Voix du coach",
    coaches: {
      calm: { label: "Posé", detail: "Calme et précis" },
      direct: { label: "Direct", detail: "Franc et clair" },
      warm: { label: "Chaleureux", detail: "Encourageant" },
    },
    enter: "Entrer dans BLOSSOM",
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
};

const en: MessageTree = {
  nav: {
    blossom: "BLOSSOM",
    blossomDesc: "Your plant, your focus",
    osez: "OSEZ",
    osezDesc: "Speak now",
    explore: "EXPLORE",
    exploreDesc: "Encounters & immersions",
    connect: "CONNECT",
    connectDesc: "Shared presence",
    learn: "LEARN",
    learnDesc: "Curriculum & Pron'Lab",
    moi: "ME",
    moiDesc: "Identity & plan",
    plant: "Plant",
    mission: "Mission",
    pulse: "Pulse",
    immersion: "Immersion",
    presences: "Presences",
    tandem: "Tandem",
    curriculum: "Path",
    pronlab: "Pron'Lab",
    library: "Library",
    review: "Review",
    progress: "Progress",
    history: "History",
    labs: "Labs",
  },
  languages: {
    sectionUi: "App language",
    sectionUiLead: "Menus, buttons, status. Independent of the language you learn.",
    sectionLearn: "Language to learn",
    sectionLearnLead: "Pron'Lab, missions, OSEZ, recognition.",
    active: "Active",
    coverageFull: "Full",
    coveragePartial: "Partial",
    coveragePlanned: "Planned",
    engineActive: "Active engine",
    engineModule: "Module",
    engineSame: "Same engine",
    engineSign: "Sign language",
    packs: "Packs",
    packsEmpty: "No packs",
    speech: "Speech",
    independentNote: "The two choices are independent.",
    changedUi: "App language updated",
    changedLearn: "Learning language updated",
    htmlLang: "html lang",
    impactTitle: "Impact",
    impactLead: "What this choice changes.",
    impactPronlab: "Pron'Lab targets this language",
    impactMission: "Missions rephrased",
    impactTandem: "Tandem biased to this language",
    impactSpeech: "Recognition",
    impactOsez: "OSEZ in this language",
    impactNone: "No direct impact",
    surfaces: "Surfaces",
    levels: "Levels",
    cultural: "Anchor",
    switchConfirm: "Confirm",
    nativeHint: "Native name shown",
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
  moi: {
    title: "Your space",
    languagesEyebrow: "Languages",
    profileEyebrow: "Profile",
  },
  sync: {
    conflict: "Sync conflict",
    offline: "Offline",
    syncing: "Syncing…",
    synced: "Up to date",
    conflictDetailOne: "1 conflict",
    conflictDetailMany: "{n} conflicts",
    pendingOne: "1 pending",
    pendingMany: "{n} pending",
    nonePending: "Nothing pending",
  },
  context: {
    learn: "Learn",
    osez: "Dare",
    explore: "Explore",
    connect: "Connect",
    blossom: "BLOSSOM",
    moi: "ME",
  },
  welcome: {
    location: "Saint-Pierre · La Réunion",
    yourBlossom: "Your BLOSSOM",
    steps: {
      identity: { eyebrow: "01 · YOU", title: "Let's start with you.", detail: "A few anchors are enough.", short: "Identity" },
      level: { eyebrow: "02 · LEVEL", title: "Where are you today?", detail: "Not an exam.", short: "Level" },
      goal: { eyebrow: "03 · GOAL", title: "Why do you want to speak?", detail: "Goal filters missions.", short: "Goal" },
      rhythm: { eyebrow: "04 · RHYTHM", title: "A sustainable rhythm.", detail: "A realistic window.", short: "Rhythm" },
    },
    footerNote: "Editable in ME.",
    configTitle: "One setup, then you enter.",
    firstName: "First name",
    firstNamePlaceholder: "Your first name",
    todayMission: "Today's mission",
    levels: {
      A1: { title: "I'm starting", detail: "Greet, introduce myself." },
      A2: { title: "I get by", detail: "Familiar exchanges." },
      B1: { title: "I hold the exchange", detail: "Explain, narrate." },
    },
    goals: ["Speak at work", "Travel", "Understand", "Level up", "Be spontaneous"],
    interests: ["Cooking", "Ocean", "Music", "Travel", "Work", "Culture"],
    orFormulate: "Or phrase it your way",
    goalPlaceholder: "E.g. clients",
    whatInterests: "What interests you",
    practiceWindow: "Practice window",
    rhythms: {
      morning: { label: "Morning", detail: "Before the day" },
      noon: { label: "Noon", detail: "A breath" },
      evening: { label: "Evening", detail: "After work" },
    },
    coachTitle: "Coach voice",
    coaches: {
      calm: { label: "Calm", detail: "Steady and precise" },
      direct: { label: "Direct", detail: "Clear and frank" },
      warm: { label: "Warm", detail: "Encouraging" },
    },
    enter: "Enter BLOSSOM",
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
};

type TargetLocale = "es" | "pt" | "de" | "it";

const SHARE = new Set<string>([
  "BLOSSOM", "OSEZ", "EXPLORE", "CONNECT", "LEARN", "MOI", "ME", "Pulse", "Pron'Lab", "Tandem",
]);

const TR: Record<TargetLocale, Record<string, string>> = {
  es: {
    "Your plant, your focus": "Tu planta, tu foco",
    "Speak now": "Habla ahora",
    "Encounters & immersions": "Encuentros e inmersiones",
    "Shared presence": "Presencia compartida",
    "Curriculum & Pron'Lab": "Currículo y Pron'Lab",
    "Identity & plan": "Identidad y plan",
    "Plant": "Planta",
    "Mission": "Misión",
    "Immersion": "Inmersión",
    "Presences": "Presencias",
    "Path": "Recorrido",
    "Library": "Biblioteca",
    "Review": "Repasar",
    "Progress": "Progreso",
    "History": "Historial",
    "Labs": "Laboratorios",
    "Back": "Volver",
    "Continue": "Continuar",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Loading…": "Cargando…",
    "Retry": "Reintentar",
    "Open": "Abrir",
    "Close": "Cerrar",
    "Search": "Buscar",
    "More": "Más",
    "Your space": "Tu espacio",
    "Languages": "Idiomas",
    "Profile": "Perfil",
    "Sync conflict": "Conflicto de sync",
    "Offline": "Sin conexión",
    "Syncing…": "Sincronizando…",
    "Up to date": "Al día",
    "Learn": "Aprender",
    "Dare": "Atreverse",
    "Explore": "Explorar",
    "Connect": "Conectar",
    "App language": "Idioma de la app",
    "Language to learn": "Idioma a aprender",
    "Active": "Activo",
    "Full": "Completo",
    "Partial": "Parcial",
    "Planned": "Previsto",
    "Impact": "Impacto",
    "First name": "Nombre",
    "Page not found": "Página no encontrada",
    "This path does not exist in the journey.": "Este camino no existe en el viaje.",
    "Back to BLOSSOM": "Volver a BLOSSOM",
    "Courage ribbon": "Cinta de coraje",
    "{n} / 28 · no flame": "{n} / 28 · sin llama",
    "Last 28 days of speech": "Últimos 28 días de habla",
    "A gesture that day": "Un gesto ese día",
    "Fallow ground": "Tierra en barbecho",
    "Gaps are not failure — fallow ground.": "Los huecos no son un fracaso — tierra en barbecho.",
  },
  pt: {
    "Your plant, your focus": "A sua planta, o seu foco",
    "Speak now": "Fale agora",
    "Encounters & immersions": "Encontros e imersões",
    "Shared presence": "Presença partilhada",
    "Curriculum & Pron'Lab": "Currículo e Pron'Lab",
    "Identity & plan": "Identidade e plano",
    "Plant": "Planta",
    "Mission": "Missão",
    "Immersion": "Imersão",
    "Presences": "Presenças",
    "Path": "Percurso",
    "Library": "Biblioteca",
    "Review": "Rever",
    "Progress": "Progresso",
    "History": "Histórico",
    "Labs": "Laboratórios",
    "Back": "Voltar",
    "Continue": "Continuar",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Loading…": "A carregar…",
    "Retry": "Tentar de novo",
    "Open": "Abrir",
    "Close": "Fechar",
    "Search": "Pesquisar",
    "More": "Mais",
    "Your space": "O seu espaço",
    "Languages": "Idiomas",
    "Profile": "Perfil",
    "Sync conflict": "Conflito de sync",
    "Offline": "Offline",
    "Syncing…": "A sincronizar…",
    "Up to date": "Atualizado",
    "Learn": "Aprender",
    "Dare": "Ousar",
    "Explore": "Explorar",
    "Connect": "Ligar",
    "App language": "Idioma da app",
    "Language to learn": "Idioma a aprender",
    "Active": "Ativo",
    "Full": "Completo",
    "Partial": "Parcial",
    "Planned": "Planeado",
    "Impact": "Impacto",
    "First name": "Nome",
    "Page not found": "Página não encontrada",
    "This path does not exist in the journey.": "Este caminho não existe na viagem.",
    "Back to BLOSSOM": "Voltar ao BLOSSOM",
    "Courage ribbon": "Fita de coragem",
    "{n} / 28 · no flame": "{n} / 28 · sem chama",
    "Last 28 days of speech": "Últimos 28 dias de fala",
    "A gesture that day": "Um gesto nesse dia",
    "Fallow ground": "Terra em pousio",
    "Gaps are not failure — fallow ground.": "Os buracos não são um fracasso — terra em pousio.",
  },
  de: {
    "Your plant, your focus": "Deine Pflanze, dein Fokus",
    "Speak now": "Jetzt sprechen",
    "Encounters & immersions": "Begegnungen & Immersionen",
    "Shared presence": "Geteilte Präsenz",
    "Curriculum & Pron'Lab": "Lehrplan & Pron'Lab",
    "Identity & plan": "Identität & Plan",
    "Plant": "Pflanze",
    "Mission": "Mission",
    "Immersion": "Immersion",
    "Presences": "Präsenzen",
    "Path": "Pfad",
    "Library": "Bibliothek",
    "Review": "Wiederholen",
    "Progress": "Fortschritt",
    "History": "Verlauf",
    "Labs": "Labore",
    "Back": "Zurück",
    "Continue": "Weiter",
    "Save": "Speichern",
    "Cancel": "Abbrechen",
    "Loading…": "Laden…",
    "Retry": "Erneut",
    "Open": "Öffnen",
    "Close": "Schließen",
    "Search": "Suchen",
    "More": "Mehr",
    "Your space": "Dein Raum",
    "Languages": "Sprachen",
    "Profile": "Profil",
    "Sync conflict": "Sync-Konflikt",
    "Offline": "Offline",
    "Syncing…": "Synchronisiere…",
    "Up to date": "Aktuell",
    "Learn": "Lernen",
    "Dare": "Wagen",
    "Explore": "Erkunden",
    "Connect": "Verbinden",
    "App language": "App-Sprache",
    "Language to learn": "Lernsprache",
    "Active": "Aktiv",
    "Full": "Voll",
    "Partial": "Teilweise",
    "Planned": "Geplant",
    "Impact": "Wirkung",
    "First name": "Vorname",
    "Page not found": "Seite nicht gefunden",
    "This path does not exist in the journey.": "Dieser Pfad existiert auf der Reise nicht.",
    "Back to BLOSSOM": "Zurück zu BLOSSOM",
    "Courage ribbon": "Mutband",
    "{n} / 28 · no flame": "{n} / 28 · ohne Flamme",
    "Last 28 days of speech": "Letzte 28 Tage des Sprechens",
    "A gesture that day": "Eine Geste an diesem Tag",
    "Fallow ground": "Brache",
    "Gaps are not failure — fallow ground.": "Lücken sind kein Versagen — Brache.",
  },
  it: {
    "Your plant, your focus": "La tua pianta, il tuo focus",
    "Speak now": "Parla ora",
    "Encounters & immersions": "Incontri e immersioni",
    "Shared presence": "Presenza condivisa",
    "Curriculum & Pron'Lab": "Curriculum e Pron'Lab",
    "Identity & plan": "Identità e piano",
    "Plant": "Pianta",
    "Mission": "Missione",
    "Immersion": "Immersione",
    "Presences": "Presenze",
    "Path": "Percorso",
    "Library": "Biblioteca",
    "Review": "Ripasso",
    "Progress": "Progresso",
    "History": "Cronologia",
    "Labs": "Laboratori",
    "Back": "Indietro",
    "Continue": "Continua",
    "Save": "Salva",
    "Cancel": "Annulla",
    "Loading…": "Caricamento…",
    "Retry": "Riprova",
    "Open": "Apri",
    "Close": "Chiudi",
    "Search": "Cerca",
    "More": "Altro",
    "Your space": "Il tuo spazio",
    "Languages": "Lingue",
    "Profile": "Profilo",
    "Sync conflict": "Conflitto di sync",
    "Offline": "Offline",
    "Syncing…": "Sincronizzazione…",
    "Up to date": "Aggiornato",
    "Learn": "Impara",
    "Dare": "Osa",
    "Explore": "Esplora",
    "Connect": "Connetti",
    "App language": "Lingua dell'app",
    "Language to learn": "Lingua da imparare",
    "Active": "Attivo",
    "Full": "Completo",
    "Partial": "Parziale",
    "Planned": "Pianificato",
    "Impact": "Impatto",
    "First name": "Nome",
    "Page not found": "Pagina non trovata",
    "This path does not exist in the journey.": "Questo percorso non esiste nel viaggio.",
    "Back to BLOSSOM": "Torna a BLOSSOM",
    "Courage ribbon": "Nastro del coraggio",
    "{n} / 28 · no flame": "{n} / 28 · senza fiamma",
    "Last 28 days of speech": "Ultimi 28 giorni di parola",
    "A gesture that day": "Un gesto quel giorno",
    "Fallow ground": "Terra a riposo",
    "Gaps are not failure — fallow ground.": "I buchi non sono un fallimento — terra a riposo.",
  },
};

function localizeTree<T>(value: T, locale: TargetLocale): T {
  const map = TR[locale];
  if (typeof value === "string") {
    if (SHARE.has(value)) return value as T;
    const translated = map[value];
    if (translated != null) return translated as T;
    return ("[" + locale + "] " + value) as T;
  }
  if (Array.isArray(value)) return value.map((item) => localizeTree(item, locale)) as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) result[key] = localizeTree(child, locale);
    return result as T;
  }
  return value;
}

export const MESSAGES: Record<UiLocaleId, MessageTree> = {
  fr,
  en,
  es: localizeTree(en, "es"),
  pt: localizeTree(en, "pt"),
  de: localizeTree(en, "de"),
  it: localizeTree(en, "it"),
};
