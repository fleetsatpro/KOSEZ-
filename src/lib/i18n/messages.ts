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

const SHARE = new Set([
  "BLOSSOM", "EXPLORE", "CONNECT", "LEARN", "Pron'Lab", "Pulse", "Immersion", "Tandem",
  "Léo", "Saint-Pierre · Réunion", "Saint-Pierre · La Réunion",
]);

type TargetLocale = "es" | "pt" | "de" | "it";
const TR: Record<TargetLocale, Record<string, string>> = {
  "es": {
    "Your journey": "Tu recorrido",
    "SPEAK": "HABLAR",
    "Speak now": "Habla ahora",
    "The real world": "El mundo real",
    "Presence & tandem": "Presencia y tándem",
    "Practice & anchor": "Practicar y anclar",
    "ME": "YO",
    "Your space": "Tu espacio",
    "Plant": "Planta",
    "Field mission": "Misión de terreno",
    "Presences": "Presencias",
    "Path": "Recorrido",
    "Library": "Biblioteca",
    "Review": "Repasar",
    "Skills": "Competencias",
    "History": "Historial",
    "App language": "Idioma de la aplicación",
    "Menus, buttons, status lines, toasts. Independent from the language you learn.": "Menús, botones, estados y avisos. Independientes del idioma que aprendes.",
    "Learning language": "Idioma de aprendizaje",
    "Engine content: missions, Pron'Lab, rooms, tandem. Switches sets, speech and partner ranking.": "Contenido del motor: misiones, Pron'Lab, salas y tándem. Cambia los sets, la voz y la selección de parejas.",
    "Active": "Activo",
    "Full interface": "Interfaz completa",
    "Partial translation": "Traducción parcial",
    "Planned": "Previsto",
    "Full path": "Recorrido completo",
    "Centre module": "Módulo del centro",
    "Same engine": "Mismo motor",
    "Sign language": "Lengua de signos",
    "Content packs": "Packs de contenido",
    "No local packs yet — the engine still runs.": "Aún no hay packs locales — el motor sigue disponible.",
    "Speech / listening": "Voz / escucha",
    "Tip: the interface can stay in French while you learn English — or the reverse. The two axes are independent.": "Consejo: la interfaz puede quedarse en francés mientras aprendes inglés, o al revés. Los dos ejes son independientes.",
    "App language updated. Menus and toasts follow.": "Idioma de la aplicación actualizado. Menús y avisos siguen este idioma.",
    "Learning language updated. Pron'Lab, speech, missions and tandem ranking follow.": "Idioma de aprendizaje actualizado. Pron'Lab, voz, misiones y ranking de tándem se ajustan.",
    "HTML lang attribute": "Atributo HTML lang",
    "What actually changes": "Qué cambia de verdad",
    "Switching the learning language recalibrates the content engine. Exact impact below.": "Cambiar el idioma de aprendizaje recalibra el motor de contenido. Impacto exacto abajo.",
    "Pron'Lab sets and phoneme leaves filtered by packs": "Sets de Pron'Lab y hojas de fonemas filtrados por packs",
    "Field missions and briefs in the target language": "Misiones de terreno y briefs en el idioma objetivo",
    "Partner ranking biased toward speakers of the language": "Selección de parejas orientada a hablantes del idioma",
    "Speech synthesis and STT on the speech locale": "Síntesis de voz y STT con el locale de voz",
    "OSEZ rooms and Pulse in the target language": "Salas OSEZ y Pulse en el idioma objetivo",
    "No local packs — generic engine, centre packs if available": "Sin packs locales — motor genérico; packs del centro si existen",
    "Surfaces touched": "Superficies afectadas",
    "Supported levels": "Niveles compatibles",
    "Cultural anchor": "Anclaje cultural",
    "Confirm switch": "Confirmar cambio",
    "Profile native language (ME) stays distinct": "El idioma materno del perfil (YO) sigue siendo independiente",
    "Back": "Atrás",
    "Continue": "Continuar",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Loading…": "Cargando…",
    "Retry": "Reintentar",
    "Open": "Abrir",
    "Close": "Cerrar",
    "Search": "Buscar",
    "More": "Más",
    "Languages": "Idiomas",
    "Learner profile": "Perfil de aprendizaje",
    "Conflict to resolve": "Conflicto por resolver",
    "Offline": "Sin conexión",
    "Syncing": "Sincronizando",
    "Synced": "Sincronizado",
    "1 change needs your attention": "1 cambio requiere tu atención",
    "{n} changes need your attention": "{n} cambios requieren tu atención",
    "1 change pending": "1 cambio pendiente",
    "{n} changes pending": "{n} cambios pendientes",
    "No pending changes": "No hay cambios pendientes",
    "LEARN workshop": "Taller LEARN",
    "Speak": "Hablar",
    "Go out": "Salir",
    "Your growth": "Tu crecimiento",
    "Your BLOSSOM": "Tu BLOSSOM",
    "01 · YOU": "01 · TÚ",
    "Let's start with you.": "Empecemos por ti.",
    "A few landmarks are enough. K'Osez will use them to choose the right pressure level, situations and rhythm.": "Unos pocos puntos de referencia bastan. K'Osez los usará para elegir el nivel de presión, las situaciones y el ritmo adecuados.",
    "Identity": "Identidad",
    "02 · LEVEL": "02 · NIVEL",
    "Where are you today?": "¿Dónde estás hoy?",
    "This is not an exam. Your answer simply sets the starting point for the first practices.": "No es un examen. Tu respuesta solo fija el punto de partida de las primeras prácticas.",
    "Level": "Nivel",
    "03 · INTENTION": "03 · INTENCIÓN",
    "What do you want to speak for?": "¿Para qué quieres hablar?",
    "The goal becomes a filter for missions, Speak Rooms and the examples Léo proposes.": "El objetivo se convierte en un filtro para las misiones, las salas de Speak y los ejemplos que propone Léo.",
    "Intention": "Intención",
    "04 · RHYTHM": "04 · RITMO",
    "Set a rhythm you can keep.": "Elige un ritmo que puedas mantener.",
    "No need for an hour a day. A realistic window gives the system a better signal than an impossible ambition.": "No necesitas una hora al día. Una ventana realista da al sistema una señal mejor que una ambición imposible.",
    "Rhythm": "Ritmo",
    "Your choices stay editable in ME. The goal is to make the first practices fairer, not to lock you into a profile.": "Tus elecciones siguen siendo editables en YO. El objetivo es hacer más justas las primeras prácticas, no encerrarte en un perfil.",
    "One setup, then you enter.": "Una configuración y entras.",
    "First name": "Nombre",
    "Your first name": "Tu nombre",
    "Today's mission": "La misión de hoy",
    "I'm starting": "Estoy empezando",
    "I can greet, introduce myself and understand very simple sentences.": "Puedo saludar, presentarme y entender frases muy sencillas.",
    "I get by": "Me defiendo",
    "I can handle familiar exchanges, but I still search for my words.": "Puedo manejar intercambios cotidianos, pero todavía busco mis palabras.",
    "I can hold the exchange": "Puedo mantener el intercambio",
    "I can explain, narrate and follow up on everyday topics.": "Puedo explicar, contar y relanzar la conversación sobre temas cotidianos.",
    "Speak at work": "Hablar en el trabajo",
    "Travel with more ease": "Viajar con más soltura",
    "Understand conversations": "Entender conversaciones",
    "Level up oral skills": "Dar un salto oral",
    "Feel more spontaneous": "Sentirme más espontáneo",
    "Cooking": "Cocina",
    "Ocean": "Océano",
    "Music": "Música",
    "Travel": "Viajes",
    "Work": "Trabajo",
    "Culture": "Cultura",
    "Or phrase it your way": "O exprésalo a tu manera",
    "e.g. speak up with my clients": "p. ej., hablar con más soltura con mis clientes",
    "What interests you": "Qué te interesa",
    "Your practice window": "Tu ventana de práctica",
    "Morning": "Mañana",
    "Before the day starts.": "Antes de que empiece el día.",
    "Noon": "Mediodía",
    "A breath in the middle of the day.": "Un respiro a mitad del día.",
    "Evening": "Tarde",
    "When work pressure eases.": "Cuando baja la presión del trabajo.",
    "Calm": "Calmado",
    "Calm, precise, never infantilising.": "Calmado, preciso, nunca infantilizante.",
    "Direct": "Directo",
    "Direct, concise, action-oriented.": "Directo, conciso y orientado a la acción.",
    "More pressure, little detour.": "Más presión, pocos rodeos.",
    "Warm": "Cálido",
    "Warm, human, contextualised.": "Cálido, humano y contextualizado.",
    "Encouraging, human, highly contextualised.": "Cercano, humano y muy contextualizado.",
    "Coach voice": "Voz del coach",
    "Enter BLOSSOM": "Entrar en BLOSSOM"
  },
  "pt": {
    "Your journey": "O seu percurso",
    "SPEAK": "FALAR",
    "Speak now": "Fale agora",
    "The real world": "O mundo real",
    "Presence & tandem": "Presença e tandem",
    "Practice & anchor": "Praticar e ancorar",
    "ME": "EU",
    "Your space": "O seu espaço",
    "Plant": "Planta",
    "Field mission": "Missão de campo",
    "Presences": "Presenças",
    "Path": "Percurso",
    "Library": "Biblioteca",
    "Review": "Rever",
    "Skills": "Competências",
    "History": "Histórico",
    "App language": "Idioma da aplicação",
    "Menus, buttons, status lines, toasts. Independent from the language you learn.": "Menus, botões, estados e avisos. Independentes do idioma que aprende.",
    "Learning language": "Idioma de aprendizagem",
    "Engine content: missions, Pron'Lab, rooms, tandem. Switches sets, speech and partner ranking.": "Conteúdo do motor: missões, Pron'Lab, salas e tandem. Altera conjuntos, voz e seleção de parceiros.",
    "Active": "Ativo",
    "Full interface": "Interface completa",
    "Partial translation": "Tradução parcial",
    "Planned": "Planeado",
    "Full path": "Percurso completo",
    "Centre module": "Módulo do centro",
    "Same engine": "Mesmo motor",
    "Sign language": "Língua gestual",
    "Content packs": "Packs de conteúdo",
    "No local packs yet — the engine still runs.": "Ainda não há packs locais — o motor continua disponível.",
    "Speech / listening": "Voz / escuta",
    "Tip: the interface can stay in French while you learn English — or the reverse. The two axes are independent.": "Dica: a interface pode ficar em francês enquanto aprende inglês, ou o contrário. Os dois eixos são independentes.",
    "App language updated. Menus and toasts follow.": "Idioma da aplicação atualizado. Menus e avisos acompanham-no.",
    "Learning language updated. Pron'Lab, speech, missions and tandem ranking follow.": "Idioma de aprendizagem atualizado. Pron'Lab, voz, missões e ranking tandem acompanham a mudança.",
    "HTML lang attribute": "Atributo HTML lang",
    "What actually changes": "O que muda de facto",
    "Switching the learning language recalibrates the content engine. Exact impact below.": "Mudar o idioma de aprendizagem recalibra o motor de conteúdo. Impacto exato abaixo.",
    "Pron'Lab sets and phoneme leaves filtered by packs": "Conjuntos Pron'Lab e folhas de fonemas filtrados pelos packs",
    "Field missions and briefs in the target language": "Missões de campo e briefs no idioma-alvo",
    "Partner ranking biased toward speakers of the language": "Seleção de parceiros orientada para falantes do idioma",
    "Speech synthesis and STT on the speech locale": "Síntese de voz e STT no locale de voz",
    "OSEZ rooms and Pulse in the target language": "Salas OSEZ e Pulse no idioma-alvo",
    "No local packs — generic engine, centre packs if available": "Sem packs locais — motor genérico; packs do centro se existirem",
    "Surfaces touched": "Superfícies afetadas",
    "Supported levels": "Níveis suportados",
    "Cultural anchor": "Âncora cultural",
    "Confirm switch": "Confirmar mudança",
    "Profile native language (ME) stays distinct": "O idioma materno do perfil (EU) continua separado",
    "Back": "Voltar",
    "Continue": "Continuar",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Loading…": "A carregar…",
    "Retry": "Tentar novamente",
    "Open": "Abrir",
    "Close": "Fechar",
    "Search": "Pesquisar",
    "More": "Mais",
    "Languages": "Idiomas",
    "Learner profile": "Perfil do aprendiz",
    "Conflict to resolve": "Conflito a resolver",
    "Offline": "Offline",
    "Syncing": "A sincronizar",
    "Synced": "Sincronizado",
    "1 change needs your attention": "1 alteração requer a sua atenção",
    "{n} changes need your attention": "{n} alterações requerem a sua atenção",
    "1 change pending": "1 alteração pendente",
    "{n} changes pending": "{n} alterações pendentes",
    "No pending changes": "Sem alterações pendentes",
    "LEARN workshop": "Atelier LEARN",
    "Speak": "Falar",
    "Go out": "Sair",
    "Your growth": "O seu crescimento",
    "Your BLOSSOM": "O seu BLOSSOM",
    "01 · YOU": "01 · VOCÊ",
    "Let's start with you.": "Comecemos por si.",
    "A few landmarks are enough. K'Osez will use them to choose the right pressure level, situations and rhythm.": "Alguns pontos de referência bastam. K'Osez irá usá-los para escolher a pressão, as situações e o ritmo certos.",
    "Identity": "Identidade",
    "02 · LEVEL": "02 · NÍVEL",
    "Where are you today?": "Onde está hoje?",
    "This is not an exam. Your answer simply sets the starting point for the first practices.": "Isto não é um exame. A sua resposta apenas define o ponto de partida das primeiras práticas.",
    "Level": "Nível",
    "03 · INTENTION": "03 · INTENÇÃO",
    "What do you want to speak for?": "Para que quer falar?",
    "The goal becomes a filter for missions, Speak Rooms and the examples Léo proposes.": "O objetivo torna-se um filtro para missões, Speak Rooms e exemplos propostos por Léo.",
    "Intention": "Intenção",
    "04 · RHYTHM": "04 · RITMO",
    "Set a rhythm you can keep.": "Escolha um ritmo que consiga manter.",
    "No need for an hour a day. A realistic window gives the system a better signal than an impossible ambition.": "Não precisa de uma hora por dia. Uma janela realista dá ao sistema um sinal melhor do que uma ambição impossível.",
    "Rhythm": "Ritmo",
    "Your choices stay editable in ME. The goal is to make the first practices fairer, not to lock you into a profile.": "As suas escolhas continuam editáveis em EU. O objetivo é tornar as primeiras práticas mais justas, não prendê-lo num perfil.",
    "One setup, then you enter.": "Uma configuração e entra.",
    "First name": "Nome próprio",
    "Your first name": "O seu nome",
    "Today's mission": "Missão de hoje",
    "I'm starting": "Estou a começar",
    "I can greet, introduce myself and understand very simple sentences.": "Consigo cumprimentar, apresentar-me e compreender frases muito simples.",
    "I get by": "Desenrasco-me",
    "I can handle familiar exchanges, but I still search for my words.": "Consigo lidar com trocas familiares, mas ainda procuro as palavras.",
    "I can hold the exchange": "Consigo manter a conversa",
    "I can explain, narrate and follow up on everyday topics.": "Consigo explicar, contar e relançar sobre temas do dia a dia.",
    "Speak at work": "Falar no trabalho",
    "Travel with more ease": "Viajar com mais à-vontade",
    "Understand conversations": "Compreender conversas",
    "Level up oral skills": "Subir de nível na oralidade",
    "Feel more spontaneous": "Sentir-me mais espontâneo",
    "Cooking": "Culinária",
    "Ocean": "Oceano",
    "Music": "Música",
    "Travel": "Viagens",
    "Work": "Trabalho",
    "Culture": "Cultura",
    "Or phrase it your way": "Ou diga-o à sua maneira",
    "e.g. speak up with my clients": "ex.: falar com mais à-vontade com os meus clientes",
    "What interests you": "O que lhe interessa",
    "Your practice window": "A sua janela de prática",
    "Morning": "Manhã",
    "Before the day starts.": "Antes de o dia começar.",
    "Noon": "Meio-dia",
    "A breath in the middle of the day.": "Uma pausa no meio do dia.",
    "Evening": "Noite",
    "When work pressure eases.": "Quando a pressão do trabalho baixa.",
    "Calm": "Calmo",
    "Calm, precise, never infantilising.": "Calmo, preciso, nunca infantilizante.",
    "Direct": "Direto",
    "Direct, concise, action-oriented.": "Direto, conciso e orientado para a ação.",
    "More pressure, little detour.": "Mais pressão, poucos desvios.",
    "Warm": "Acolhedor",
    "Warm, human, contextualised.": "Acolhedor, humano e contextualizado.",
    "Encouraging, human, highly contextualised.": "Encorajador, humano e muito contextualizado.",
    "Coach voice": "Voz do coach",
    "Enter BLOSSOM": "Entrar no BLOSSOM"
  },
  "de": {
    "Your journey": "Dein Weg",
    "SPEAK": "SPRECHEN",
    "Speak now": "Jetzt sprechen",
    "The real world": "Die echte Welt",
    "Presence & tandem": "Präsenz & Tandem",
    "Practice & anchor": "Üben & verankern",
    "ME": "ICH",
    "Your space": "Dein Bereich",
    "Plant": "Pflanze",
    "Field mission": "Praxis-Mission",
    "Presences": "Begegnungen",
    "Path": "Pfad",
    "Library": "Bibliothek",
    "Review": "Wiederholen",
    "Skills": "Kompetenzen",
    "History": "Verlauf",
    "App language": "App-Sprache",
    "Menus, buttons, status lines, toasts. Independent from the language you learn.": "Menüs, Schaltflächen, Statuszeilen und Hinweise. Unabhängig von der Sprache, die du lernst.",
    "Learning language": "Lernsprache",
    "Engine content: missions, Pron'Lab, rooms, tandem. Switches sets, speech and partner ranking.": "Motorinhalte: Missionen, Pron'Lab, Räume und Tandem. Ändert Sets, Sprache und Partnerranking.",
    "Active": "Aktiv",
    "Full interface": "Vollständige Oberfläche",
    "Partial translation": "Teilübersetzung",
    "Planned": "Geplant",
    "Full path": "Vollständiger Pfad",
    "Centre module": "Zentrumsmodul",
    "Same engine": "Gleiche Engine",
    "Sign language": "Gebärdensprache",
    "Content packs": "Inhaltspakete",
    "No local packs yet — the engine still runs.": "Noch keine lokalen Pakete — die Engine läuft weiter.",
    "Speech / listening": "Sprechen / Hören",
    "Tip: the interface can stay in French while you learn English — or the reverse. The two axes are independent.": "Tipp: Die Oberfläche kann auf Französisch bleiben, während du Englisch lernst — oder umgekehrt. Beide Achsen sind unabhängig.",
    "App language updated. Menus and toasts follow.": "App-Sprache aktualisiert. Menüs und Hinweise folgen dieser Sprache.",
    "Learning language updated. Pron'Lab, speech, missions and tandem ranking follow.": "Lernsprache aktualisiert. Pron'Lab, Sprache, Missionen und Tandem-Ranking folgen.",
    "HTML lang attribute": "HTML-lang-Attribut",
    "What actually changes": "Was sich tatsächlich ändert",
    "Switching the learning language recalibrates the content engine. Exact impact below.": "Ein Wechsel der Lernsprache kalibriert die Inhalts-Engine neu. Die genaue Wirkung steht unten.",
    "Pron'Lab sets and phoneme leaves filtered by packs": "Pron'Lab-Sets und Phonem-Blätter nach Paketen gefiltert",
    "Field missions and briefs in the target language": "Praxis-Missionen und Briefings in der Zielsprache",
    "Partner ranking biased toward speakers of the language": "Partnerranking zugunsten von Sprechern der Sprache",
    "Speech synthesis and STT on the speech locale": "Sprachsynthese und STT im Sprach-Locale",
    "OSEZ rooms and Pulse in the target language": "OSEZ-Räume und Pulse in der Zielsprache",
    "No local packs — generic engine, centre packs if available": "Keine lokalen Pakete — generische Engine; Zentrumspakete, falls vorhanden",
    "Surfaces touched": "Betroffene Bereiche",
    "Supported levels": "Unterstützte Niveaus",
    "Cultural anchor": "Kulturelle Verankerung",
    "Confirm switch": "Wechsel bestätigen",
    "Profile native language (ME) stays distinct": "Die Muttersprache im Profil (ICH) bleibt getrennt",
    "Back": "Zurück",
    "Continue": "Weiter",
    "Save": "Speichern",
    "Cancel": "Abbrechen",
    "Loading…": "Wird geladen…",
    "Retry": "Erneut versuchen",
    "Open": "Öffnen",
    "Close": "Schließen",
    "Search": "Suchen",
    "More": "Mehr",
    "Languages": "Sprachen",
    "Learner profile": "Lernendenprofil",
    "Conflict to resolve": "Konflikt zu lösen",
    "Offline": "Offline",
    "Syncing": "Synchronisierung",
    "Synced": "Synchronisiert",
    "1 change needs your attention": "1 Änderung erfordert deine Aufmerksamkeit",
    "{n} changes need your attention": "{n} Änderungen erfordern deine Aufmerksamkeit",
    "1 change pending": "1 Änderung ausstehend",
    "{n} changes pending": "{n} Änderungen ausstehend",
    "No pending changes": "Keine ausstehenden Änderungen",
    "LEARN workshop": "LEARN-Werkstatt",
    "Speak": "Sprechen",
    "Go out": "Rausgehen",
    "Your growth": "Dein Wachstum",
    "Your BLOSSOM": "Dein BLOSSOM",
    "01 · YOU": "01 · DU",
    "Let's start with you.": "Beginnen wir mit dir.",
    "A few landmarks are enough. K'Osez will use them to choose the right pressure level, situations and rhythm.": "Ein paar Orientierungspunkte genügen. K'Osez nutzt sie, um Druck, Situationen und Rhythmus passend zu wählen.",
    "Identity": "Identität",
    "02 · LEVEL": "02 · NIVEAU",
    "Where are you today?": "Wo stehst du heute?",
    "This is not an exam. Your answer simply sets the starting point for the first practices.": "Das ist keine Prüfung. Deine Antwort legt nur den Ausgangspunkt für die ersten Übungen fest.",
    "Level": "Niveau",
    "03 · INTENTION": "03 · ABSICHT",
    "What do you want to speak for?": "Wofür möchtest du sprechen?",
    "The goal becomes a filter for missions, Speak Rooms and the examples Léo proposes.": "Das Ziel wird zum Filter für Missionen, Speak Rooms und die Beispiele von Léo.",
    "Intention": "Absicht",
    "04 · RHYTHM": "04 · RHYTHMUS",
    "Set a rhythm you can keep.": "Wähle einen Rhythmus, den du halten kannst.",
    "No need for an hour a day. A realistic window gives the system a better signal than an impossible ambition.": "Du brauchst keine Stunde am Tag. Ein realistisches Zeitfenster liefert dem System ein besseres Signal als ein unmögliches Vorhaben.",
    "Rhythm": "Rhythmus",
    "Your choices stay editable in ME. The goal is to make the first practices fairer, not to lock you into a profile.": "Deine Auswahl bleibt in ICH veränderbar. Ziel ist ein fairer Start, keine starre Profilbindung.",
    "One setup, then you enter.": "Einrichtung, dann geht es los.",
    "First name": "Vorname",
    "Your first name": "Dein Vorname",
    "Today's mission": "Die heutige Mission",
    "I'm starting": "Ich beginne",
    "I can greet, introduce myself and understand very simple sentences.": "Ich kann grüßen, mich vorstellen und sehr einfache Sätze verstehen.",
    "I get by": "Ich komme zurecht",
    "I can handle familiar exchanges, but I still search for my words.": "Ich kann vertraute Gespräche führen, suche aber noch nach Worten.",
    "I can hold the exchange": "Ich kann das Gespräch halten",
    "I can explain, narrate and follow up on everyday topics.": "Ich kann erklären, erzählen und bei Alltagsthemen nachfragen.",
    "Speak at work": "Bei der Arbeit sprechen",
    "Travel with more ease": "Leichter reisen",
    "Understand conversations": "Gespräche verstehen",
    "Level up oral skills": "Mündlich weiterkommen",
    "Feel more spontaneous": "Spontaner werden",
    "Cooking": "Kochen",
    "Ocean": "Ozean",
    "Music": "Musik",
    "Travel": "Reisen",
    "Work": "Arbeit",
    "Culture": "Kultur",
    "Or phrase it your way": "Oder formuliere es auf deine Weise",
    "e.g. speak up with my clients": "z. B. mit meinen Kunden sicherer sprechen",
    "What interests you": "Was interessiert dich",
    "Your practice window": "Dein Übungsfenster",
    "Morning": "Morgen",
    "Before the day starts.": "Bevor der Tag beginnt.",
    "Noon": "Mittag",
    "A breath in the middle of the day.": "Eine Pause mitten im Tag.",
    "Evening": "Abend",
    "When work pressure eases.": "Wenn der Arbeitsdruck nachlässt.",
    "Calm": "Ruhig",
    "Calm, precise, never infantilising.": "Ruhig, präzise, niemals verniedlichend.",
    "Direct": "Direkt",
    "Direct, concise, action-oriented.": "Direkt, präzise und handlungsorientiert.",
    "More pressure, little detour.": "Mehr Druck, wenig Umweg.",
    "Warm": "Warm",
    "Warm, human, contextualised.": "Warm, menschlich und kontextbezogen.",
    "Encouraging, human, highly contextualised.": "Ermutigend, menschlich und stark kontextbezogen.",
    "Coach voice": "Coach-Stimme",
    "Enter BLOSSOM": "BLOSSOM betreten"
  },
  "it": {
    "Your journey": "Il tuo percorso",
    "SPEAK": "PARLARE",
    "Speak now": "Parla ora",
    "The real world": "Il mondo reale",
    "Presence & tandem": "Presenza e tandem",
    "Practice & anchor": "Praticare e ancorare",
    "ME": "IO",
    "Your space": "Il tuo spazio",
    "Plant": "Pianta",
    "Field mission": "Missione sul campo",
    "Presences": "Presenze",
    "Path": "Percorso",
    "Library": "Biblioteca",
    "Review": "Ripassare",
    "Skills": "Competenze",
    "History": "Cronologia",
    "App language": "Lingua dell'app",
    "Menus, buttons, status lines, toasts. Independent from the language you learn.": "Menu, pulsanti, stati e notifiche. Indipendenti dalla lingua che impari.",
    "Learning language": "Lingua di apprendimento",
    "Engine content: missions, Pron'Lab, rooms, tandem. Switches sets, speech and partner ranking.": "Contenuti del motore: missioni, Pron'Lab, stanze e tandem. Cambia set, voce e selezione dei partner.",
    "Active": "Attiva",
    "Full interface": "Interfaccia completa",
    "Partial translation": "Traduzione parziale",
    "Planned": "Previsto",
    "Full path": "Percorso completo",
    "Centre module": "Modulo del centro",
    "Same engine": "Stesso motore",
    "Sign language": "Lingua dei segni",
    "Content packs": "Pacchetti di contenuti",
    "No local packs yet — the engine still runs.": "Nessun pacchetto locale per ora — il motore resta disponibile.",
    "Speech / listening": "Voce / ascolto",
    "Tip: the interface can stay in French while you learn English — or the reverse. The two axes are independent.": "Suggerimento: l'interfaccia può restare in francese mentre impari l'inglese, o viceversa. I due assi sono indipendenti.",
    "App language updated. Menus and toasts follow.": "Lingua dell'app aggiornata. Menu e notifiche seguono questa lingua.",
    "Learning language updated. Pron'Lab, speech, missions and tandem ranking follow.": "Lingua di apprendimento aggiornata. Pron'Lab, voce, missioni e ranking tandem seguono.",
    "HTML lang attribute": "Attributo HTML lang",
    "What actually changes": "Cosa cambia davvero",
    "Switching the learning language recalibrates the content engine. Exact impact below.": "Cambiare la lingua di apprendimento ricalibra il motore dei contenuti. Impatto esatto sotto.",
    "Pron'Lab sets and phoneme leaves filtered by packs": "Set Pron'Lab e foglie fonetiche filtrati dai pacchetti",
    "Field missions and briefs in the target language": "Missioni sul campo e brief nella lingua obiettivo",
    "Partner ranking biased toward speakers of the language": "Selezione dei partner orientata ai parlanti della lingua",
    "Speech synthesis and STT on the speech locale": "Sintesi vocale e STT sul locale vocale",
    "OSEZ rooms and Pulse in the target language": "Stanze OSEZ e Pulse nella lingua obiettivo",
    "No local packs — generic engine, centre packs if available": "Nessun pacchetto locale — motore generico; pacchetti del centro se disponibili",
    "Surfaces touched": "Superfici coinvolte",
    "Supported levels": "Livelli supportati",
    "Cultural anchor": "Ancoraggio culturale",
    "Confirm switch": "Conferma cambio",
    "Profile native language (ME) stays distinct": "La lingua madre del profilo (IO) resta separata",
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
    "Languages": "Lingue",
    "Learner profile": "Profilo dello studente",
    "Conflict to resolve": "Conflitto da risolvere",
    "Offline": "Offline",
    "Syncing": "Sincronizzazione",
    "Synced": "Sincronizzato",
    "1 change needs your attention": "1 modifica richiede la tua attenzione",
    "{n} changes need your attention": "{n} modifiche richiedono la tua attenzione",
    "1 change pending": "1 modifica in sospeso",
    "{n} changes pending": "{n} modifiche in sospeso",
    "No pending changes": "Nessuna modifica in sospeso",
    "LEARN workshop": "Laboratorio LEARN",
    "Speak": "Parlare",
    "Go out": "Uscire",
    "Your growth": "La tua crescita",
    "Your BLOSSOM": "Il tuo BLOSSOM",
    "01 · YOU": "01 · TU",
    "Let's start with you.": "Cominciamo da te.",
    "A few landmarks are enough. K'Osez will use them to choose the right pressure level, situations and rhythm.": "Bastano pochi riferimenti. K'Osez li userà per scegliere il livello di pressione, le situazioni e il ritmo giusti.",
    "Identity": "Identità",
    "02 · LEVEL": "02 · LIVELLO",
    "Where are you today?": "Dove sei oggi?",
    "This is not an exam. Your answer simply sets the starting point for the first practices.": "Non è un esame. La tua risposta definisce solo il punto di partenza delle prime pratiche.",
    "Level": "Livello",
    "03 · INTENTION": "03 · INTENZIONE",
    "What do you want to speak for?": "Per cosa vuoi parlare?",
    "The goal becomes a filter for missions, Speak Rooms and the examples Léo proposes.": "L'obiettivo diventa un filtro per missioni, Speak Rooms e gli esempi proposti da Léo.",
    "Intention": "Intenzione",
    "04 · RHYTHM": "04 · RITMO",
    "Set a rhythm you can keep.": "Scegli un ritmo che puoi mantenere.",
    "No need for an hour a day. A realistic window gives the system a better signal than an impossible ambition.": "Non serve un'ora al giorno. Una finestra realistica dà al sistema un segnale migliore di un'ambizione impossibile.",
    "Rhythm": "Ritmo",
    "Your choices stay editable in ME. The goal is to make the first practices fairer, not to lock you into a profile.": "Le tue scelte restano modificabili in IO. L'obiettivo è rendere più giuste le prime pratiche, non chiuderti in un profilo.",
    "One setup, then you enter.": "Una configurazione, poi entri.",
    "First name": "Nome",
    "Your first name": "Il tuo nome",
    "Today's mission": "La missione di oggi",
    "I'm starting": "Sto iniziando",
    "I can greet, introduce myself and understand very simple sentences.": "So salutare, presentarmi e capire frasi molto semplici.",
    "I get by": "Me la cavo",
    "I can handle familiar exchanges, but I still search for my words.": "So gestire scambi familiari, ma cerco ancora le parole.",
    "I can hold the exchange": "So sostenere lo scambio",
    "I can explain, narrate and follow up on everyday topics.": "So spiegare, raccontare e rilanciare su temi quotidiani.",
    "Speak at work": "Parlare al lavoro",
    "Travel with more ease": "Viaggiare con più facilità",
    "Understand conversations": "Capire le conversazioni",
    "Level up oral skills": "Fare un salto nell'orale",
    "Feel more spontaneous": "Sentirmi più spontaneo",
    "Cooking": "Cucina",
    "Ocean": "Oceano",
    "Music": "Musica",
    "Travel": "Viaggi",
    "Work": "Lavoro",
    "Culture": "Cultura",
    "Or phrase it your way": "Oppure dillo a modo tuo",
    "e.g. speak up with my clients": "es. parlare con più sicurezza con i miei clienti",
    "What interests you": "Cosa ti interessa",
    "Your practice window": "La tua finestra di pratica",
    "Morning": "Mattina",
    "Before the day starts.": "Prima che inizi la giornata.",
    "Noon": "Mezzogiorno",
    "A breath in the middle of the day.": "Una pausa a metà giornata.",
    "Evening": "Sera",
    "When work pressure eases.": "Quando cala la pressione del lavoro.",
    "Calm": "Calmo",
    "Calm, precise, never infantilising.": "Calmo, preciso, mai infantilizzante.",
    "Direct": "Diretto",
    "Direct, concise, action-oriented.": "Diretto, conciso e orientato all'azione.",
    "More pressure, little detour.": "Più pressione, pochi giri.",
    "Warm": "Caloroso",
    "Warm, human, contextualised.": "Caloroso, umano e contestualizzato.",
    "Encouraging, human, highly contextualised.": "Incoraggiante, umano e molto contestualizzato.",
    "Coach voice": "Voce del coach",
    "Enter BLOSSOM": "Entra in BLOSSOM"
  }
};

function localizeTree<T>(value: T, locale: TargetLocale): T {
  const map = TR[locale];
  if (typeof value === "string") {
    if (SHARE.has(value)) return value as T;
    const translated = map[value];
    if (translated == null) throw new Error("Missing " + locale + " translation for message: " + value);
    return translated as T;
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
