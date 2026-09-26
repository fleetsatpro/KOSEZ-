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
  };
  common: {
    back: string;
    continue: string;
    save: string;
    cancel: string;
    loading: string;
    retry: string;
    open: string;
  };
  moi: {
    title: string;
    languagesEyebrow: string;
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
    sectionUiLead:
      "Menus, boutons, statuts. Indépendante de la langue que vous apprenez.",
    sectionLearn: "Langue apprise",
    sectionLearnLead:
      "Contenu moteur : missions, Pron'Lab, rooms, tandem. Change les sets et le speech.",
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
    independentNote:
      "Astuce : l'interface peut rester en français pendant que vous apprenez l'anglais — ou l'inverse.",
    changedUi: "Langue de l'application mise à jour.",
    changedLearn: "Langue apprise mise à jour. Les sets et rooms suivent.",
    htmlLang: "Attribut HTML lang",
  },
  common: {
    back: "Retour",
    continue: "Continuer",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement…",
    retry: "Réessayer",
    open: "Ouvrir",
  },
  moi: {
    title: "Votre espace",
    languagesEyebrow: "Langues",
  },
};

const en: MessageTree = {
  nav: {
    blossom: "BLOSSOM",
    blossomDesc: "Your journey",
    osez: "SPEAK",
    osezDesc: "Speak now",
    explore: "EXPLORE",
    exploreDesc: "The real world",
    connect: "CONNECT",
    connectDesc: "Presence & tandem",
    learn: "LEARN",
    learnDesc: "Practice & anchor",
    moi: "ME",
    moiDesc: "Your space",
    plant: "Plant",
    mission: "Field mission",
    pulse: "Pulse",
    immersion: "Immersion",
    presences: "Presences",
    tandem: "Tandem",
    curriculum: "Path",
    pronlab: "Pron'Lab",
    library: "Library",
    review: "Review",
    progress: "Skills",
    history: "History",
    labs: "Labs",
  },
  languages: {
    sectionUi: "App language",
    sectionUiLead:
      "Menus, buttons, status lines. Independent from the language you learn.",
    sectionLearn: "Learning language",
    sectionLearnLead:
      "Engine content: missions, Pron'Lab, rooms, tandem. Switches sets and speech.",
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
    independentNote:
      "Tip: keep the UI in French while learning English — or the other way around.",
    changedUi: "App language updated.",
    changedLearn: "Learning language updated. Sets and rooms follow.",
    htmlLang: "HTML lang attribute",
  },
  common: {
    back: "Back",
    continue: "Continue",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading…",
    retry: "Retry",
    open: "Open",
  },
  moi: {
    title: "Your space",
    languagesEyebrow: "Languages",
  },
};

/** Partial locales fall back to English then French for missing keys via resolve. */
const es: MessageTree = {
  ...en,
  nav: { ...en.nav, moi: "YO", moiDesc: "Tu espacio", osez: "HABLA", osezDesc: "Hablar ahora" },
  languages: {
    ...en.languages,
    sectionUi: "Idioma de la aplicación",
    sectionLearn: "Idioma de aprendizaje",
    active: "Activo",
  },
  moi: { title: "Tu espacio", languagesEyebrow: "Idiomas" },
};

const pt: MessageTree = {
  ...en,
  nav: { ...en.nav, moi: "EU", moiDesc: "O seu espaço", osez: "FALAR", osezDesc: "Falar agora" },
  languages: {
    ...en.languages,
    sectionUi: "Idioma da aplicação",
    sectionLearn: "Idioma de aprendizagem",
    active: "Ativo",
  },
  moi: { title: "O seu espaço", languagesEyebrow: "Idiomas" },
};

const de: MessageTree = {
  ...en,
  nav: { ...en.nav, moi: "ICH", moiDesc: "Ihr Bereich", osez: "SPRECHEN", osezDesc: "Jetzt sprechen" },
  languages: {
    ...en.languages,
    sectionUi: "App-Sprache",
    sectionLearn: "Lernsprache",
    active: "Aktiv",
  },
  moi: { title: "Ihr Bereich", languagesEyebrow: "Sprachen" },
};

const it: MessageTree = {
  ...en,
  nav: { ...en.nav, moi: "IO", moiDesc: "Il tuo spazio", osez: "PARLA", osezDesc: "Parla ora" },
  languages: {
    ...en.languages,
    sectionUi: "Lingua dell'app",
    sectionLearn: "Lingua di studio",
    active: "Attivo",
  },
  moi: { title: "Il tuo spazio", languagesEyebrow: "Lingue" },
};

export const MESSAGES: Record<UiLocaleId, MessageTree> = {
  fr,
  en,
  es,
  pt,
  de,
  it,
};
