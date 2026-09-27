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
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    continue: string;
    back: string;
    close: string;
    error: string;
    success: string;
    retry: string;
  };
  languages: {
    title: string;
    uiTitle: string;
    learnTitle: string;
    uiNote: string;
    learnNote: string;
    coverage: string;
    engine: string;
    packs: string;
    active: string;
    switchImpact: string;
  };
  moi: {
    title: string;
    identity: string;
    plan: string;
    languages: string;
  };
  courage: {
    title: string;
    low: string;
    mid: string;
    high: string;
  };
  errors: {
    notFound: string;
    generic: string;
  };
  welcome: {
    title: string;
    subtitle: string;
    cta: string;
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
  },
  common: {
    loading: "Chargement…",
    save: "Enregistrer",
    cancel: "Annuler",
    continue: "Continuer",
    back: "Retour",
    close: "Fermer",
    error: "Erreur",
    success: "Succès",
    retry: "Réessayer",
  },
  languages: {
    title: "Langues",
    uiTitle: "Langue de l'interface",
    learnTitle: "Langue à apprendre",
    uiNote: "Change les menus, boutons et textes de l'app. Indépendant de la langue pratiquée.",
    learnNote: "Change le contenu Pron'Lab, missions, OSEZ et le moteur de reconnaissance.",
    coverage: "Couverture",
    engine: "Moteur",
    packs: "Packs",
    active: "Actif",
    switchImpact: "Impact du changement",
  },
  moi: {
    title: "MOI",
    identity: "Identité",
    plan: "Plan",
    languages: "Langues",
  },
  courage: {
    title: "Courage",
    low: "Un pas à la fois",
    mid: "Vous avancez",
    high: "Vous osez vraiment",
  },
  errors: {
    notFound: "Page introuvable",
    generic: "Une erreur est survenue",
  },
  welcome: {
    title: "Votre langue. Votre voyage. Votre BLOSSOM.",
    subtitle: "Un geste utile à la fois.",
    cta: "Entrer dans BLOSSOM",
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
  },
  common: {
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    close: "Close",
    error: "Error",
    success: "Success",
    retry: "Retry",
  },
  languages: {
    title: "Languages",
    uiTitle: "App language",
    learnTitle: "Language to learn",
    uiNote: "Changes menus, buttons and app chrome. Independent of the language you practice.",
    learnNote: "Changes Pron'Lab content, missions, OSEZ and the recognition engine.",
    coverage: "Coverage",
    engine: "Engine",
    packs: "Packs",
    active: "Active",
    switchImpact: "Switch impact",
  },
  moi: {
    title: "ME",
    identity: "Identity",
    plan: "Plan",
    languages: "Languages",
  },
  courage: {
    title: "Courage",
    low: "One step at a time",
    mid: "You are moving",
    high: "You really dare",
  },
  errors: {
    notFound: "Page not found",
    generic: "Something went wrong",
  },
  welcome: {
    title: "Your language. Your journey. Your BLOSSOM.",
    subtitle: "One useful gesture at a time.",
    cta: "Enter BLOSSOM",
  },
};

type TargetLocale = "es" | "pt" | "de" | "it";

const SHARE = new Set<string>([
  "BLOSSOM", "OSEZ", "EXPLORE", "CONNECT", "LEARN", "MOI", "ME", "Pulse", "Pron'Lab",
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
    "Loading…": "Cargando…",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Continue": "Continuar",
    "Back": "Volver",
    "Close": "Cerrar",
    "Error": "Error",
    "Success": "Éxito",
    "Retry": "Reintentar",
    "Languages": "Idiomas",
    "App language": "Idioma de la app",
    "Language to learn": "Idioma a aprender",
    "Changes menus, buttons and app chrome. Independent of the language you practice.": "Cambia menús, botones y la interfaz. Independiente del idioma que practicas.",
    "Changes Pron'Lab content, missions, OSEZ and the recognition engine.": "Cambia el contenido de Pron'Lab, misiones, OSEZ y el motor de reconocimiento.",
    "Coverage": "Cobertura",
    "Engine": "Motor",
    "Packs": "Paquetes",
    "Active": "Activo",
    "Switch impact": "Impacto del cambio",
    "Identity": "Identidad",
    "Plan": "Plan",
    "Courage": "Coraje",
    "One step at a time": "Un paso a la vez",
    "You are moving": "Estás avanzando",
    "You really dare": "Realmente te atreves",
    "Page not found": "Página no encontrada",
    "Something went wrong": "Algo salió mal",
    "Your language. Your journey. Your BLOSSOM.": "Tu idioma. Tu viaje. Tu BLOSSOM.",
    "One useful gesture at a time.": "Un gesto útil a la vez.",
    "Enter BLOSSOM": "Entrar en BLOSSOM",
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
    "Loading…": "A carregar…",
    "Save": "Guardar",
    "Cancel": "Cancelar",
    "Continue": "Continuar",
    "Back": "Voltar",
    "Close": "Fechar",
    "Error": "Erro",
    "Success": "Sucesso",
    "Retry": "Tentar de novo",
    "Languages": "Idiomas",
    "App language": "Idioma da app",
    "Language to learn": "Idioma a aprender",
    "Changes menus, buttons and app chrome. Independent of the language you practice.": "Muda menus, botões e a interface. Independente do idioma que pratica.",
    "Changes Pron'Lab content, missions, OSEZ and the recognition engine.": "Muda o conteúdo do Pron'Lab, missões, OSEZ e o motor de reconhecimento.",
    "Coverage": "Cobertura",
    "Engine": "Motor",
    "Packs": "Pacotes",
    "Active": "Ativo",
    "Switch impact": "Impacto da mudança",
    "Identity": "Identidade",
    "Plan": "Plano",
    "Courage": "Coragem",
    "One step at a time": "Um passo de cada vez",
    "You are moving": "Está a avançar",
    "You really dare": "Realmente ousa",
    "Page not found": "Página não encontrada",
    "Something went wrong": "Algo correu mal",
    "Your language. Your journey. Your BLOSSOM.": "A sua língua. A sua viagem. O seu BLOSSOM.",
    "One useful gesture at a time.": "Um gesto útil de cada vez.",
    "Enter BLOSSOM": "Entrar no BLOSSOM",
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
    "Loading…": "Laden…",
    "Save": "Speichern",
    "Cancel": "Abbrechen",
    "Continue": "Weiter",
    "Back": "Zurück",
    "Close": "Schließen",
    "Error": "Fehler",
    "Success": "Erfolg",
    "Retry": "Erneut versuchen",
    "Languages": "Sprachen",
    "App language": "App-Sprache",
    "Language to learn": "Lernsprache",
    "Changes menus, buttons and app chrome. Independent of the language you practice.": "Ändert Menüs, Buttons und die App-Oberfläche. Unabhängig von der Übungssprache.",
    "Changes Pron'Lab content, missions, OSEZ and the recognition engine.": "Ändert Pron'Lab-Inhalte, Missionen, OSEZ und die Erkennungs-Engine.",
    "Coverage": "Abdeckung",
    "Engine": "Engine",
    "Packs": "Pakete",
    "Active": "Aktiv",
    "Switch impact": "Wechsel-Auswirkung",
    "Identity": "Identität",
    "Plan": "Plan",
    "Courage": "Mut",
    "One step at a time": "Ein Schritt nach dem anderen",
    "You are moving": "Du kommst voran",
    "You really dare": "Du wagst wirklich",
    "Page not found": "Seite nicht gefunden",
    "Something went wrong": "Etwas ist schiefgelaufen",
    "Your language. Your journey. Your BLOSSOM.": "Deine Sprache. Deine Reise. Dein BLOSSOM.",
    "One useful gesture at a time.": "Eine nützliche Geste nach der anderen.",
    "Enter BLOSSOM": "BLOSSOM betreten",
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
    "Loading…": "Caricamento…",
    "Save": "Salva",
    "Cancel": "Annulla",
    "Continue": "Continua",
    "Back": "Indietro",
    "Close": "Chiudi",
    "Error": "Errore",
    "Success": "Successo",
    "Retry": "Riprova",
    "Languages": "Lingue",
    "App language": "Lingua dell'app",
    "Language to learn": "Lingua da imparare",
    "Changes menus, buttons and app chrome. Independent of the language you practice.": "Cambia menu, pulsanti e interfaccia. Indipendente dalla lingua che pratichi.",
    "Changes Pron'Lab content, missions, OSEZ and the recognition engine.": "Cambia contenuti Pron'Lab, missioni, OSEZ e motore di riconoscimento.",
    "Coverage": "Copertura",
    "Engine": "Motore",
    "Packs": "Pacchetti",
    "Active": "Attivo",
    "Switch impact": "Impatto del cambio",
    "Identity": "Identità",
    "Plan": "Piano",
    "Courage": "Coraggio",
    "One step at a time": "Un passo alla volta",
    "You are moving": "Stai avanzando",
    "You really dare": "Osi davvero",
    "Page not found": "Pagina non trovata",
    "Something went wrong": "Qualcosa è andato storto",
    "Your language. Your journey. Your BLOSSOM.": "La tua lingua. Il tuo viaggio. Il tuo BLOSSOM.",
    "One useful gesture at a time.": "Un gesto utile alla volta.",
    "Enter BLOSSOM": "Entra in BLOSSOM",
  },
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
