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
  moi: {
    title: "Your space",
    languagesEyebrow: "Languages",
    profileEyebrow: "Learner profile",
  },
};

const es: MessageTree = {
  ...en,
  nav: {
    ...en.nav,
    blossomDesc: "Tu recorrido",
    osez: "HABLA",
    osezDesc: "Hablar ahora",
    explore: "EXPLORA",
    exploreDesc: "El mundo real",
    connect: "CONECTA",
    connectDesc: "Presencias y tándem",
    learn: "APRENDE",
    learnDesc: "Practicar y anclar",
    moi: "YO",
    moiDesc: "Tu espacio",
    plant: "Planta",
    mission: "Misión de campo",
    immersion: "Inmersión",
    presences: "Presencias",
    tandem: "Tándem",
    curriculum: "Itinerario",
    library: "Biblioteca",
    review: "Repasar",
    progress: "Competencias",
    history: "Historial",
  },
  languages: {
    ...en.languages,
    sectionUi: "Idioma de la aplicación",
    sectionUiLead: "Menús, botones, estados, toasts. Independiente del idioma que aprendes.",
    sectionLearn: "Idioma de aprendizaje",
    sectionLearnLead: "Contenido del motor: misiones, Pron'Lab, salas, tándem.",
    active: "Activo",
    coverageFull: "Interfaz completa",
    coveragePartial: "Traducción parcial",
    coveragePlanned: "Previsto",
    engineActive: "Itinerario completo",
    engineModule: "Módulo del centro",
    engineSame: "Mismo motor",
    engineSign: "Lengua de signos",
    packs: "Packs de contenido",
    packsEmpty: "Sin packs locales por ahora — el motor sigue disponible.",
    speech: "Síntesis / escucha",
    independentNote: "Consejo: la interfaz puede quedar en francés mientras aprendes inglés — o al revés.",
    changedUi: "Idioma de la aplicación actualizado.",
    changedLearn: "Idioma de aprendizaje actualizado.",
    htmlLang: "Atributo HTML lang",
    impactTitle: "Qué cambia de verdad",
    impactLead: "Cambiar el idioma de aprendizaje recalibra el motor de contenido.",
    impactPronlab: "Sets Pron'Lab y hojas fonema filtrados por packs",
    impactMission: "Misiones de campo y briefs en la lengua meta",
    impactTandem: "Ranking de compañeros sesgado hacia hablantes de la lengua",
    impactSpeech: "Síntesis de voz y STT en el locale de speech",
    impactOsez: "Salas OSEZ y Pulse en la lengua meta",
    impactNone: "Sin packs locales — motor genérico",
    surfaces: "Superficies afectadas",
    levels: "Niveles soportados",
    cultural: "Anclaje cultural",
    switchConfirm: "Confirmar el cambio",
    nativeHint: "Lengua materna del perfil (YO) sigue siendo distinta",
  },
  common: {
    ...en.common,
    back: "Volver",
    continue: "Continuar",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "Cargando…",
    retry: "Reintentar",
    open: "Abrir",
    close: "Cerrar",
    search: "Buscar",
    more: "Más",
  },
  moi: { title: "Tu espacio", languagesEyebrow: "Idiomas", profileEyebrow: "Perfil del aprendiz" },
};

const pt: MessageTree = {
  ...en,
  nav: {
    ...en.nav,
    blossomDesc: "O seu percurso",
    osez: "FALAR",
    osezDesc: "Falar agora",
    explore: "EXPLORAR",
    exploreDesc: "O mundo real",
    connect: "LIGAR",
    connectDesc: "Presenças e tandem",
    learn: "APRENDER",
    learnDesc: "Praticar e ancorar",
    moi: "EU",
    moiDesc: "O seu espaço",
    plant: "Planta",
    mission: "Missão de terreno",
    immersion: "Imersão",
    presences: "Presenças",
    curriculum: "Percurso",
    library: "Biblioteca",
    review: "Rever",
    progress: "Competências",
    history: "Histórico",
  },
  languages: {
    ...en.languages,
    sectionUi: "Idioma da aplicação",
    sectionUiLead: "Menus, botões, estados, toasts. Independente do idioma que aprende.",
    sectionLearn: "Idioma de aprendizagem",
    sectionLearnLead: "Conteúdo do motor: missões, Pron'Lab, salas, tandem.",
    active: "Ativo",
    coverageFull: "Interface completa",
    coveragePartial: "Tradução parcial",
    coveragePlanned: "Previsto",
    engineActive: "Percurso completo",
    engineModule: "Módulo do centro",
    engineSame: "Mesmo motor",
    engineSign: "Língua gestual",
    packs: "Packs de conteúdo",
    packsEmpty: "Sem packs locais por agora — o motor continua disponível.",
    speech: "Síntese / escuta",
    independentNote: "Dica: a interface pode ficar em francês enquanto aprende inglês — ou o inverso.",
    changedUi: "Idioma da aplicação atualizado.",
    changedLearn: "Idioma de aprendizagem atualizado.",
    htmlLang: "Atributo HTML lang",
    impactTitle: "O que muda de verdade",
    impactLead: "Mudar o idioma de aprendizagem recalibra o motor de conteúdo.",
    impactPronlab: "Sets Pron'Lab e folhas de fonemas filtrados por packs",
    impactMission: "Missões de terreno e briefs na língua alvo",
    impactTandem: "Ranking de parceiros enviesado para falantes da língua",
    impactSpeech: "Síntese de voz e STT no locale de speech",
    impactOsez: "Salas OSEZ e Pulse na língua alvo",
    impactNone: "Sem packs locais — motor genérico",
    surfaces: "Superfícies afectadas",
    levels: "Níveis suportados",
    cultural: "Ancoragem cultural",
    switchConfirm: "Confirmar a mudança",
    nativeHint: "Língua materna do perfil (EU) permanece distinta",
  },
  common: {
    ...en.common,
    back: "Voltar",
    continue: "Continuar",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "A carregar…",
    retry: "Tentar de novo",
    open: "Abrir",
    close: "Fechar",
    search: "Pesquisar",
    more: "Mais",
  },
  moi: { title: "O seu espaço", languagesEyebrow: "Idiomas", profileEyebrow: "Perfil do aprendiz" },
};

const de: MessageTree = {
  ...en,
  nav: {
    ...en.nav,
    blossomDesc: "Ihre Reise",
    osez: "SPRECHEN",
    osezDesc: "Jetzt sprechen",
    explore: "ERKUNDEN",
    exploreDesc: "Die reale Welt",
    connect: "VERBINDEN",
    connectDesc: "Präsenz & Tandem",
    learn: "LERNEN",
    learnDesc: "Üben & verankern",
    moi: "ICH",
    moiDesc: "Ihr Bereich",
    plant: "Pflanze",
    mission: "Feldmission",
    immersion: "Immersion",
    presences: "Präsenzen",
    curriculum: "Pfad",
    library: "Bibliothek",
    review: "Wiederholen",
    progress: "Kompetenzen",
    history: "Verlauf",
  },
  languages: {
    ...en.languages,
    sectionUi: "App-Sprache",
    sectionUiLead: "Menüs, Schaltflächen, Statuszeilen, Toasts. Unabhängig von der Lernsprache.",
    sectionLearn: "Lernsprache",
    sectionLearnLead: "Engine-Inhalt: Missionen, Pron'Lab, Räume, Tandem.",
    active: "Aktiv",
    coverageFull: "Vollständige Oberfläche",
    coveragePartial: "Teilübersetzung",
    coveragePlanned: "Geplant",
    engineActive: "Vollständiger Pfad",
    engineModule: "Zentrums-Modul",
    engineSame: "Gleiche Engine",
    engineSign: "Gebärdensprache",
    packs: "Inhaltspakete",
    packsEmpty: "Noch keine lokalen Pakete — die Engine läuft weiter.",
    speech: "Sprachausgabe / Hören",
    independentNote: "Tipp: Die Oberfläche kann Französisch bleiben, während Sie Englisch lernen — oder umgekehrt.",
    changedUi: "App-Sprache aktualisiert.",
    changedLearn: "Lernsprache aktualisiert.",
    htmlLang: "HTML-lang-Attribut",
    impactTitle: "Was sich konkret ändert",
    impactLead: "Ein Wechsel der Lernsprache kalibriert die Inhalts-Engine neu.",
    impactPronlab: "Pron'Lab-Sets und Phonem-Blätter nach Paketen gefiltert",
    impactMission: "Feldmissionen und Briefs in der Zielsprache",
    impactTandem: "Partner-Ranking zugunsten von Sprechern der Sprache",
    impactSpeech: "Sprachsynthese und STT auf dem Speech-Locale",
    impactOsez: "OSEZ-Räume und Pulse in der Zielsprache",
    impactNone: "Keine lokalen Pakete — generische Engine",
    surfaces: "Betroffene Oberflächen",
    levels: "Unterstützte Niveaus",
    cultural: "Kultureller Anker",
    switchConfirm: "Wechsel bestätigen",
    nativeHint: "Muttersprache im Profil (ICH) bleibt getrennt",
  },
  common: {
    ...en.common,
    back: "Zurück",
    continue: "Weiter",
    save: "Speichern",
    cancel: "Abbrechen",
    loading: "Laden…",
    retry: "Erneut versuchen",
    open: "Öffnen",
    close: "Schließen",
    search: "Suchen",
    more: "Mehr",
  },
  moi: { title: "Ihr Bereich", languagesEyebrow: "Sprachen", profileEyebrow: "Lernendenprofil" },
};

const it: MessageTree = {
  ...en,
  nav: {
    ...en.nav,
    blossomDesc: "Il tuo percorso",
    osez: "PARLA",
    osezDesc: "Parla ora",
    explore: "ESPLORA",
    exploreDesc: "Il mondo reale",
    connect: "CONNETTI",
    connectDesc: "Presenze e tandem",
    learn: "IMPARA",
    learnDesc: "Praticare e ancorare",
    moi: "IO",
    moiDesc: "Il tuo spazio",
    plant: "Pianta",
    mission: "Missione sul campo",
    immersion: "Immersione",
    presences: "Presenze",
    curriculum: "Percorso",
    library: "Biblioteca",
    review: "Rivedere",
    progress: "Competenze",
    history: "Cronologia",
  },
  languages: {
    ...en.languages,
    sectionUi: "Lingua dell'app",
    sectionUiLead: "Menu, pulsanti, stati, toast. Indipendente dalla lingua che studi.",
    sectionLearn: "Lingua di studio",
    sectionLearnLead: "Contenuto del motore: missioni, Pron'Lab, stanze, tandem.",
    active: "Attivo",
    coverageFull: "Interfaccia completa",
    coveragePartial: "Traduzione parziale",
    coveragePlanned: "Previsto",
    engineActive: "Percorso completo",
    engineModule: "Modulo del centro",
    engineSame: "Stesso motore",
    engineSign: "Lingua dei segni",
    packs: "Pack di contenuto",
    packsEmpty: "Nessun pack locale per ora — il motore resta disponibile.",
    speech: "Sintesi / ascolto",
    independentNote: "Suggerimento: l'interfaccia può restare in francese mentre studi l'inglese — o il contrario.",
    changedUi: "Lingua dell'app aggiornata.",
    changedLearn: "Lingua di studio aggiornata.",
    htmlLang: "Attributo HTML lang",
    impactTitle: "Cosa cambia davvero",
    impactLead: "Cambiare la lingua di studio ricalibra il motore di contenuto.",
    impactPronlab: "Set Pron'Lab e foglie fonema filtrati per pack",
    impactMission: "Missioni sul campo e brief nella lingua target",
    impactTandem: "Ranking partner orientato verso parlanti della lingua",
    impactSpeech: "Sintesi vocale e STT sul locale speech",
    impactOsez: "Stanze OSEZ e Pulse nella lingua target",
    impactNone: "Nessun pack locale — motore generico",
    surfaces: "Superfici interessate",
    levels: "Livelli supportati",
    cultural: "Ancoraggio culturale",
    switchConfirm: "Conferma il cambio",
    nativeHint: "Lingua madre del profilo (IO) resta distinta",
  },
  common: {
    ...en.common,
    back: "Indietro",
    continue: "Continua",
    save: "Salva",
    cancel: "Annulla",
    loading: "Caricamento…",
    retry: "Riprova",
    open: "Apri",
    close: "Chiudi",
    search: "Cerca",
    more: "Altro",
  },
  moi: { title: "Il tuo spazio", languagesEyebrow: "Lingue", profileEyebrow: "Profilo apprendente" },
};

export const MESSAGES: Record<UiLocaleId, MessageTree> = {
  fr,
  en,
  es,
  pt,
  de,
  it,
};
