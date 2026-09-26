/**
 * Dual language model:
 *  - uiLocale  → chrome of the app (menus, buttons, status lines)
 *  - languageId (store) → language the learner is practicing (content engine)
 *
 * These are independent. A Creole speaker can run the app in French while learning English.
 * Every field is explicit — zero ambiguity on coverage, engine readiness, packs, speech, surfaces.
 */

export type UiLocaleId = "fr" | "en" | "es" | "pt" | "de" | "it";

export type LearnLanguageId =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "it"
  | "de"
  | "cr"
  | "lsf";

export type UiLocaleDef = {
  id: UiLocaleId;
  nativeName: string;
  nameIn: Record<UiLocaleId, string>;
  bcp47: string;
  flag: string;
  dir: "ltr" | "rtl";
  coverage: "full" | "partial" | "planned";
  note: Record<UiLocaleId, string>;
};

export type LearnLanguageDef = {
  id: LearnLanguageId;
  nativeName: string;
  nameIn: Record<UiLocaleId, string>;
  bcp47: string;
  flag: string;
  engine: "active" | "module" | "same-engine" | "sign";
  contentPacks: string[];
  speechLocale: string;
  blurb: Record<UiLocaleId, string>;
  surfaces: Array<"pronlab" | "mission" | "osez" | "tandem" | "library" | "pulse">;
  levels: string[];
  culturalAnchor: Record<UiLocaleId, string>;
  switchImpact: Record<UiLocaleId, string>;
};

export const UI_LOCALES: UiLocaleDef[] = [
  {
    id: "fr",
    nativeName: "Français",
    nameIn: { fr: "Français", en: "French", es: "Francés", pt: "Francês", de: "Französisch", it: "Francese" },
    bcp47: "fr-FR",
    flag: "🇫🇷",
    dir: "ltr",
    coverage: "full",
    note: {
      fr: "Interface complète. Langue par défaut du centre Saint-Pierre.",
      en: "Full interface. Default language of the Saint-Pierre centre.",
      es: "Interfaz completa. Idioma por defecto del centro de Saint-Pierre.",
      pt: "Interface completa. Idioma padrão do centro de Saint-Pierre.",
      de: "Vollständige Oberfläche. Standardsprache des Zentrums Saint-Pierre.",
      it: "Interfaccia completa. Lingua predefinita del centro di Saint-Pierre.",
    },
  },
  {
    id: "en",
    nativeName: "English",
    nameIn: { fr: "Anglais", en: "English", es: "Inglés", pt: "Inglês", de: "Englisch", it: "Inglese" },
    bcp47: "en-GB",
    flag: "🇬🇧",
    dir: "ltr",
    coverage: "full",
    note: {
      fr: "Interface complète. Variante britannique pour la synthèse.",
      en: "Full interface. British variant for synthesis.",
      es: "Interfaz completa. Variante británica para síntesis.",
      pt: "Interface completa. Variante britânica para síntese.",
      de: "Vollständige Oberfläche. Britische Variante für Synthese.",
      it: "Interfaccia completa. Variante britannica per la sintesi.",
    },
  },
  {
    id: "es",
    nativeName: "Español",
    nameIn: { fr: "Espagnol", en: "Spanish", es: "Español", pt: "Espanhol", de: "Spanisch", it: "Spagnolo" },
    bcp47: "es-ES",
    flag: "🇪🇸",
    dir: "ltr",
    coverage: "full",
    note: {
      fr: "Interface complète. Castillan standard.",
      en: "Full interface. Standard Castilian.",
      es: "Interfaz completa. Castellano estándar.",
      pt: "Interface completa. Castelhano padrão.",
      de: "Vollständige Oberfläche. Standard-Kastilisch.",
      it: "Interfaccia completa. Castigliano standard.",
    },
  },
  {
    id: "pt",
    nativeName: "Português",
    nameIn: { fr: "Portugais", en: "Portuguese", es: "Portugués", pt: "Português", de: "Portugiesisch", it: "Portoghese" },
    bcp47: "pt-PT",
    flag: "🇵🇹",
    dir: "ltr",
    coverage: "full",
    note: {
      fr: "Interface complète. Variante européenne (Portugal).",
      en: "Full interface. European variant (Portugal).",
      es: "Interfaz completa. Variante europea (Portugal).",
      pt: "Interface completa. Variante europeia (Portugal).",
      de: "Vollständige Oberfläche. Europäische Variante (Portugal).",
      it: "Interfaccia completa. Variante europea (Portogallo).",
    },
  },
  {
    id: "de",
    nativeName: "Deutsch",
    nameIn: { fr: "Allemand", en: "German", es: "Alemán", pt: "Alemão", de: "Deutsch", it: "Tedesco" },
    bcp47: "de-DE",
    flag: "🇩🇪",
    dir: "ltr",
    coverage: "full",
    note: {
      fr: "Interface complète. Allemand standard.",
      en: "Full interface. Standard German.",
      es: "Interfaz completa. Alemán estándar.",
      pt: "Interface completa. Alemão padrão.",
      de: "Vollständige Oberfläche. Standarddeutsch.",
      it: "Interfaccia completa. Tedesco standard.",
    },
  },
  {
    id: "it",
    nativeName: "Italiano",
    nameIn: { fr: "Italien", en: "Italian", es: "Italiano", pt: "Italiano", de: "Italienisch", it: "Italiano" },
    bcp47: "it-IT",
    flag: "🇮🇹",
    dir: "ltr",
    coverage: "full",
    note: {
      fr: "Interface complète. Italien standard.",
      en: "Full interface. Standard Italian.",
      es: "Interfaz completa. Italiano estándar.",
      pt: "Interface completa. Italiano padrão.",
      de: "Vollständige Oberfläche. Standarditalienisch.",
      it: "Interfaccia completa. Italiano standard.",
    },
  },
];

export const LEARN_LANGUAGES: LearnLanguageDef[] = [
  {
    id: "en",
    nativeName: "English",
    nameIn: { fr: "Anglais", en: "English", es: "Inglés", pt: "Inglês", de: "Englisch", it: "Inglese" },
    bcp47: "en-GB",
    flag: "🇬🇧",
    engine: "active",
    contentPacks: ["missions-a2", "missions-b1", "pronlab-en", "speak-rooms", "tandem-en"],
    speechLocale: "en-GB",
    surfaces: ["pronlab", "mission", "osez", "tandem", "library", "pulse"],
    levels: ["A1", "A2", "B1", "B2"],
    culturalAnchor: {
      fr: "Parcours principal du centre — anglais international, ancré Réunion.",
      en: "Centre primary path — international English, Réunion-anchored.",
      es: "Ruta principal del centro — inglés internacional, anclado en Reunión.",
      pt: "Percurso principal do centro — inglês internacional, ancorado em Reunião.",
      de: "Hauptpfad des Zentrums — internationales Englisch, auf Réunion verankert.",
      it: "Percorso principale del centro — inglese internazionale, ancorato a Réunion.",
    },
    switchImpact: {
      fr: "Active les packs missions A2/B1, Pron'Lab EN, rooms OSEZ et ranking tandem EN.",
      en: "Activates mission packs A2/B1, Pron'Lab EN, OSEZ rooms and tandem ranking EN.",
      es: "Activa packs de misiones A2/B1, Pron'Lab EN, salas OSEZ y ranking tándem EN.",
      pt: "Ativa packs de missões A2/B1, Pron'Lab EN, salas OSEZ e ranking tandem EN.",
      de: "Aktiviert Missions-Pakete A2/B1, Pron'Lab EN, OSEZ-Räume und Tandem-Ranking EN.",
      it: "Attiva pack missioni A2/B1, Pron'Lab EN, stanze OSEZ e ranking tandem EN.",
    },
    blurb: {
      fr: "Parcours principal BLOSSOM — missions, Pron'Lab, rooms, tandem.",
      en: "Primary BLOSSOM path — missions, Pron'Lab, rooms, tandem.",
      es: "Ruta principal BLOSSOM — misiones, Pron'Lab, salas, tándem.",
      pt: "Percurso principal BLOSSOM — missões, Pron'Lab, salas, tandem.",
      de: "Hauptpfad BLOSSOM — Missionen, Pron'Lab, Räume, Tandem.",
      it: "Percorso principale BLOSSOM — missioni, Pron'Lab, stanze, tandem.",
    },
  },
  {
    id: "fr",
    nativeName: "Français",
    nameIn: { fr: "Français", en: "French", es: "Francés", pt: "Francês", de: "Französisch", it: "Francese" },
    bcp47: "fr-FR",
    flag: "🇫🇷",
    engine: "same-engine",
    contentPacks: ["missions-fr", "pronlab-fr", "speak-rooms-fr"],
    speechLocale: "fr-FR",
    surfaces: ["pronlab", "mission", "osez", "pulse"],
    levels: ["A1", "A2", "B1"],
    culturalAnchor: {
      fr: "Français langue cible — packs centre et phonèmes FR.",
      en: "French as target — centre packs and FR phonemes.",
      es: "Francés como meta — packs del centro y fonemas FR.",
      pt: "Francês como alvo — packs do centro e fonemas FR.",
      de: "Französisch als Ziel — Zentrumspakete und FR-Phoneme.",
      it: "Francese come target — pack del centro e fonemi FR.",
    },
    switchImpact: {
      fr: "Active Pron'Lab FR, missions FR et rooms FR. Tandem reste multi-langue.",
      en: "Activates Pron'Lab FR, missions FR and rooms FR. Tandem stays multi-language.",
      es: "Activa Pron'Lab FR, misiones FR y salas FR. El tándem sigue multilingüe.",
      pt: "Ativa Pron'Lab FR, missões FR e salas FR. O tandem permanece multilingue.",
      de: "Aktiviert Pron'Lab FR, Missionen FR und Räume FR. Tandem bleibt mehrsprachig.",
      it: "Attiva Pron'Lab FR, missioni FR e stanze FR. Il tandem resta multilingue.",
    },
    blurb: {
      fr: "Même moteur de pratique, packs français du centre.",
      en: "Same practice engine, centre French packs.",
      es: "Mismo motor, packs franceses del centro.",
      pt: "Mesmo motor, packs franceses do centro.",
      de: "Gleiche Übungs-Engine, französische Zentrumspakete.",
      it: "Stesso motore, pack francesi del centro.",
    },
  },
  {
    id: "es",
    nativeName: "Español",
    nameIn: { fr: "Espagnol", en: "Spanish", es: "Español", pt: "Espanhol", de: "Spanisch", it: "Spagnolo" },
    bcp47: "es-ES",
    flag: "🇪🇸",
    engine: "same-engine",
    contentPacks: ["pronlab-es"],
    speechLocale: "es-ES",
    surfaces: ["pronlab", "pulse"],
    levels: ["A1", "A2"],
    culturalAnchor: {
      fr: "Espagnol — packs phonèmes ES, missions génériques.",
      en: "Spanish — ES phoneme packs, generic missions.",
      es: "Español — packs de fonemas ES, misiones genéricas.",
      pt: "Espanhol — packs de fonemas ES, missões genéricas.",
      de: "Spanisch — ES-Phonem-Pakete, generische Missionen.",
      it: "Spagnolo — pack fonemi ES, missioni generiche.",
    },
    switchImpact: {
      fr: "Active Pron'Lab ES. Missions et tandem en mode générique.",
      en: "Activates Pron'Lab ES. Missions and tandem in generic mode.",
      es: "Activa Pron'Lab ES. Misiones y tándem en modo genérico.",
      pt: "Ativa Pron'Lab ES. Missões e tandem em modo genérico.",
      de: "Aktiviert Pron'Lab ES. Missionen und Tandem im generischen Modus.",
      it: "Attiva Pron'Lab ES. Missioni e tandem in modalità generica.",
    },
    blurb: {
      fr: "Même moteur de pratique, autre langue.",
      en: "Same practice engine, different language.",
      es: "Mismo motor de práctica, otro idioma.",
      pt: "Mesmo motor de prática, outra língua.",
      de: "Dieselbe Übungs-Engine, andere Sprache.",
      it: "Stesso motore di pratica, altra lingua.",
    },
  },
  {
    id: "pt",
    nativeName: "Português",
    nameIn: { fr: "Portugais", en: "Portuguese", es: "Portugués", pt: "Português", de: "Portugiesisch", it: "Portoghese" },
    bcp47: "pt-PT",
    flag: "🇵🇹",
    engine: "same-engine",
    contentPacks: ["pronlab-pt"],
    speechLocale: "pt-PT",
    surfaces: ["pronlab", "pulse"],
    levels: ["A1", "A2"],
    culturalAnchor: {
      fr: "Portugais européen — packs phonèmes PT.",
      en: "European Portuguese — PT phoneme packs.",
      es: "Portugués europeo — packs de fonemas PT.",
      pt: "Português europeu — packs de fonemas PT.",
      de: "Europäisches Portugiesisch — PT-Phonem-Pakete.",
      it: "Portoghese europeo — pack fonemi PT.",
    },
    switchImpact: {
      fr: "Active Pron'Lab PT. Missions et tandem en mode générique.",
      en: "Activates Pron'Lab PT. Missions and tandem in generic mode.",
      es: "Activa Pron'Lab PT. Misiones y tándem en modo genérico.",
      pt: "Ativa Pron'Lab PT. Missões e tandem em modo genérico.",
      de: "Aktiviert Pron'Lab PT. Missionen und Tandem im generischen Modus.",
      it: "Attiva Pron'Lab PT. Missioni e tandem in modalità generica.",
    },
    blurb: {
      fr: "Même moteur de pratique, autre langue.",
      en: "Same practice engine, different language.",
      es: "Mismo motor de práctica, otro idioma.",
      pt: "Mesmo motor de prática, outra língua.",
      de: "Dieselbe Übungs-Engine, andere Sprache.",
      it: "Stesso motore di pratica, altra lingua.",
    },
  },
  {
    id: "it",
    nativeName: "Italiano",
    nameIn: { fr: "Italien", en: "Italian", es: "Italiano", pt: "Italiano", de: "Italienisch", it: "Italiano" },
    bcp47: "it-IT",
    flag: "🇮🇹",
    engine: "same-engine",
    contentPacks: [],
    speechLocale: "it-IT",
    surfaces: ["pulse"],
    levels: ["A1"],
    culturalAnchor: {
      fr: "Italien — moteur générique, packs à venir.",
      en: "Italian — generic engine, packs forthcoming.",
      es: "Italiano — motor genérico, packs por venir.",
      pt: "Italiano — motor genérico, packs a vir.",
      de: "Italienisch — generische Engine, Pakete folgen.",
      it: "Italiano — motore generico, pack in arrivo.",
    },
    switchImpact: {
      fr: "Speech IT actif. Packs locaux absents — moteur générique.",
      en: "IT speech active. No local packs — generic engine.",
      es: "Speech IT activo. Sin packs locales — motor genérico.",
      pt: "Speech IT ativo. Sem packs locais — motor genérico.",
      de: "IT-Sprache aktiv. Keine lokalen Pakete — generische Engine.",
      it: "Speech IT attivo. Nessun pack locale — motore generico.",
    },
    blurb: {
      fr: "Même moteur de pratique, autre langue.",
      en: "Same practice engine, different language.",
      es: "Mismo motor, otro idioma.",
      pt: "Mesmo motor, outra língua.",
      de: "Dieselbe Engine, andere Sprache.",
      it: "Stesso motore di pratica, altra lingua.",
    },
  },
  {
    id: "de",
    nativeName: "Deutsch",
    nameIn: { fr: "Allemand", en: "German", es: "Alemán", pt: "Alemão", de: "Deutsch", it: "Tedesco" },
    bcp47: "de-DE",
    flag: "🇩🇪",
    engine: "same-engine",
    contentPacks: [],
    speechLocale: "de-DE",
    surfaces: ["pulse"],
    levels: ["A1"],
    culturalAnchor: {
      fr: "Allemand — moteur générique, packs à venir.",
      en: "German — generic engine, packs forthcoming.",
      es: "Alemán — motor genérico, packs por venir.",
      pt: "Alemão — motor genérico, packs a vir.",
      de: "Deutsch — generische Engine, Pakete folgen.",
      it: "Tedesco — motore generico, pack in arrivo.",
    },
    switchImpact: {
      fr: "Speech DE actif. Packs locaux absents — moteur générique.",
      en: "DE speech active. No local packs — generic engine.",
      es: "Speech DE activo. Sin packs locales — motor genérico.",
      pt: "Speech DE ativo. Sem packs locais — motor genérico.",
      de: "DE-Sprache aktiv. Keine lokalen Pakete — generische Engine.",
      it: "Speech DE attivo. Nessun pack locale — motore generico.",
    },
    blurb: {
      fr: "Même moteur de pratique, autre langue.",
      en: "Same practice engine, different language.",
      es: "Mismo motor, otro idioma.",
      pt: "Mesmo motor, outra língua.",
      de: "Dieselbe Übungs-Engine, andere Sprache.",
      it: "Stesso motore, altra lingua.",
    },
  },
  {
    id: "cr",
    nativeName: "Créole réunionnais",
    nameIn: {
      fr: "Créole réunionnais",
      en: "Reunionese Creole",
      es: "Criollo de Reunión",
      pt: "Crioulo de Reunião",
      de: "Réunion-Kreol",
      it: "Creolo riunionese",
    },
    bcp47: "rcf",
    flag: "🇷🇪",
    engine: "module",
    contentPacks: ["centre-creole"],
    speechLocale: "fr-FR",
    surfaces: ["mission", "library"],
    levels: ["A1", "A2"],
    culturalAnchor: {
      fr: "Module ancré dans le territoire — selon disponibilité du centre Saint-Pierre.",
      en: "Territory-anchored module — subject to Saint-Pierre centre availability.",
      es: "Módulo anclado al territorio — según disponibilidad del centro.",
      pt: "Módulo ancorado no território — conforme disponibilidade do centro.",
      de: "Territorial verankertes Modul — je nach Verfügbarkeit des Zentrums.",
      it: "Modulo ancorato al territorio — secondo disponibilità del centro.",
    },
    switchImpact: {
      fr: "Active le module centre créole. Speech via FR. Missions territoriales.",
      en: "Activates centre Creole module. Speech via FR. Territorial missions.",
      es: "Activa el módulo criollo del centro. Speech vía FR. Misiones territoriales.",
      pt: "Ativa o módulo crioulo do centro. Speech via FR. Missões territoriais.",
      de: "Aktiviert das Kreol-Modul des Zentrums. Sprache über FR. Territoriale Missionen.",
      it: "Attiva il modulo creolo del centro. Speech via FR. Missioni territoriali.",
    },
    blurb: {
      fr: "Module ancré dans le territoire — selon disponibilité du centre.",
      en: "Territory-anchored module — subject to centre availability.",
      es: "Módulo anclado al territorio — según disponibilidad del centro.",
      pt: "Módulo ancorado no território — conforme disponibilidade do centro.",
      de: "Territorial verankertes Modul — je nach Verfügbarkeit des Zentrums.",
      it: "Modulo ancorato al territorio — secondo disponibilità del centro.",
    },
  },
  {
    id: "lsf",
    nativeName: "LSF",
    nameIn: {
      fr: "Langue des signes française",
      en: "French Sign Language",
      es: "Lengua de signos francesa",
      pt: "Língua gestual francesa",
      de: "Französische Gebärdensprache",
      it: "Lingua dei segni francese",
    },
    bcp47: "fr-FR",
    flag: "🤟",
    engine: "sign",
    contentPacks: ["pronlab-lsf"],
    speechLocale: "fr-FR",
    surfaces: ["pronlab", "library"],
    levels: ["A1"],
    culturalAnchor: {
      fr: "Module LSF — selon disponibilité du centre et des formateurs.",
      en: "LSF module — subject to centre and instructor availability.",
      es: "Módulo LSF — según disponibilidad del centro y formadores.",
      pt: "Módulo LSF — conforme disponibilidade do centro e formadores.",
      de: "LSF-Modul — je nach Verfügbarkeit von Zentrum und Lehrkräften.",
      it: "Modulo LSF — secondo disponibilità del centro e formatori.",
    },
    switchImpact: {
      fr: "Active Pron'Lab LSF (visuel). Pas de speech audio. Mode signe.",
      en: "Activates Pron'Lab LSF (visual). No audio speech. Sign mode.",
      es: "Activa Pron'Lab LSF (visual). Sin speech de audio. Modo signos.",
      pt: "Ativa Pron'Lab LSF (visual). Sem speech de áudio. Modo gestual.",
      de: "Aktiviert Pron'Lab LSF (visuell). Keine Audio-Sprache. Gebärdenmodus.",
      it: "Attiva Pron'Lab LSF (visivo). Nessuno speech audio. Modalità segni.",
    },
    blurb: {
      fr: "Module en langue des signes, selon disponibilité du centre.",
      en: "Sign-language module, subject to centre availability.",
      es: "Módulo en lengua de signos, según disponibilidad del centro.",
      pt: "Módulo em língua gestual, conforme disponibilidade do centro.",
      de: "Gebärdensprach-Modul, je nach Verfügbarkeit des Zentrums.",
      it: "Modulo in lingua dei segni, secondo disponibilità del centro.",
    },
  },
];

export function uiLocaleDef(id: string): UiLocaleDef {
  return UI_LOCALES.find((l) => l.id === id) ?? UI_LOCALES[0]!;
}

export function learnLanguageDef(id: string): LearnLanguageDef {
  return LEARN_LANGUAGES.find((l) => l.id === id) ?? LEARN_LANGUAGES[0]!;
}

export function isUiLocaleId(id: string): id is UiLocaleId {
  return UI_LOCALES.some((l) => l.id === id);
}

export function isLearnLanguageId(id: string): id is LearnLanguageId {
  return LEARN_LANGUAGES.some((l) => l.id === id);
}
