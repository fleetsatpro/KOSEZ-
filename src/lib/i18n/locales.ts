/**
 * Dual language model:
 *  - uiLocale  → chrome of the app (menus, buttons, status lines)
 *  - languageId (store) → language the learner is practicing (content engine)
 *
 * These are independent. A Creole speaker can run the app in French while learning English.
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
  /** Native name of the locale */
  nativeName: string;
  /** Name shown in the other common UI languages */
  nameIn: Record<UiLocaleId, string>;
  /** BCP 47 for <html lang> and speechSynthesis */
  bcp47: string;
  /** Short flag emoji (decorative, never the only cue) */
  flag: string;
  /** Direction */
  dir: "ltr" | "rtl";
  /** Completeness of the UI dictionary */
  coverage: "full" | "partial" | "planned";
  /** Notes for the settings screen */
  note: Record<UiLocaleId, string>;
};

export type LearnLanguageDef = {
  id: LearnLanguageId;
  nativeName: string;
  nameIn: Record<UiLocaleId, string>;
  bcp47: string;
  flag: string;
  /** Engine readiness for content (sets, missions, rooms) */
  engine: "active" | "module" | "same-engine" | "sign";
  /** Which Pron'Lab / content packs ship */
  contentPacks: string[];
  /** Speech synthesis / STT hint */
  speechLocale: string;
  blurb: Record<UiLocaleId, string>;
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
      es: "Interfaz completa. Idioma por defecto del centro.",
      pt: "Interface completa. Idioma padrão do centro.",
      de: "Vollständige Oberfläche. Standardsprache des Zentrums.",
      it: "Interfaccia completa. Lingua predefinita del centro.",
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
      fr: "Interface complète. Utile si vous préférez naviguer en anglais.",
      en: "Full interface. Use if you prefer navigating in English.",
      es: "Interfaz completa.",
      pt: "Interface completa.",
      de: "Vollständige Oberfläche.",
      it: "Interfaccia completa.",
    },
  },
  {
    id: "es",
    nativeName: "Español",
    nameIn: { fr: "Espagnol", en: "Spanish", es: "Español", pt: "Espanhol", de: "Spanisch", it: "Spagnolo" },
    bcp47: "es-ES",
    flag: "🇪🇸",
    dir: "ltr",
    coverage: "partial",
    note: {
      fr: "Navigation principale traduite. Certains textes longs restent en français.",
      en: "Main navigation translated. Some long copy may still be French.",
      es: "Navegación principal traducida. Algunos textos largos pueden quedar en francés.",
      pt: "Navegação principal traduzida.",
      de: "Hauptnavigation übersetzt.",
      it: "Navigazione principale tradotta.",
    },
  },
  {
    id: "pt",
    nativeName: "Português",
    nameIn: { fr: "Portugais", en: "Portuguese", es: "Portugués", pt: "Português", de: "Portugiesisch", it: "Portoghese" },
    bcp47: "pt-PT",
    flag: "🇵🇹",
    dir: "ltr",
    coverage: "partial",
    note: {
      fr: "Navigation principale traduite. Textes longs encore partiels.",
      en: "Main navigation translated. Long copy still partial.",
      es: "Navegación principal traducida.",
      pt: "Navegação principal traduzida. Textos longos ainda parciais.",
      de: "Hauptnavigation übersetzt.",
      it: "Navigazione principale tradotta.",
    },
  },
  {
    id: "de",
    nativeName: "Deutsch",
    nameIn: { fr: "Allemand", en: "German", es: "Alemán", pt: "Alemão", de: "Deutsch", it: "Tedesco" },
    bcp47: "de-DE",
    flag: "🇩🇪",
    dir: "ltr",
    coverage: "partial",
    note: {
      fr: "Navigation principale traduite.",
      en: "Main navigation translated.",
      es: "Navegación principal traducida.",
      pt: "Navegação principal traduzida.",
      de: "Hauptnavigation übersetzt. Längere Texte teils noch auf Französisch.",
      it: "Navigazione principale tradotta.",
    },
  },
  {
    id: "it",
    nativeName: "Italiano",
    nameIn: { fr: "Italien", en: "Italian", es: "Italiano", pt: "Italiano", de: "Italienisch", it: "Italiano" },
    bcp47: "it-IT",
    flag: "🇮🇹",
    dir: "ltr",
    coverage: "partial",
    note: {
      fr: "Navigation principale traduite.",
      en: "Main navigation translated.",
      es: "Navegación principal traducida.",
      pt: "Navegação principal traduzida.",
      de: "Hauptnavigation übersetzt.",
      it: "Navigazione principale tradotta. Testi lunghi ancora parziali.",
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
    blurb: {
      fr: "Parcours principal BLOSSOM — missions, Pron'Lab, rooms, tandem.",
      en: "Primary BLOSSOM path — missions, Pron'Lab, rooms, tandem.",
      es: "Ruta principal BLOSSOM.",
      pt: "Percurso principal BLOSSOM.",
      de: "Hauptpfad BLOSSOM.",
      it: "Percorso principale BLOSSOM.",
    },
  },
  {
    id: "fr",
    nativeName: "Français",
    nameIn: { fr: "Français", en: "French", es: "Francés", pt: "Francês", de: "Französisch", it: "Francese" },
    bcp47: "fr-FR",
    flag: "🇫🇷",
    engine: "same-engine",
    contentPacks: ["tandem-fr"],
    speechLocale: "fr-FR",
    blurb: {
      fr: "Même moteur de pratique — contenu en expansion au centre.",
      en: "Same practice engine — content expanding at the centre.",
      es: "Mismo motor de práctica.",
      pt: "Mesmo motor de prática.",
      de: "Dieselbe Übungs-Engine.",
      it: "Stesso motore di pratica.",
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
    blurb: {
      fr: "Même moteur, sets Pron'Lab disponibles selon le centre.",
      en: "Same engine; Pron'Lab sets available per centre.",
      es: "Mismo motor; sets Pron'Lab según el centro.",
      pt: "Mesmo motor.",
      de: "Dieselbe Engine.",
      it: "Stesso motore.",
    },
  },
  {
    id: "pt",
    nativeName: "Português",
    nameIn: { fr: "Portugais", en: "Portuguese", es: "Portugués", pt: "Português", de: "Portugiesisch", it: "Portoghese" },
    bcp47: "pt-PT",
    flag: "🇵🇹",
    engine: "same-engine",
    contentPacks: [],
    speechLocale: "pt-PT",
    blurb: {
      fr: "Même moteur de pratique, autre langue.",
      en: "Same practice engine, different language.",
      es: "Mismo motor, otro idioma.",
      pt: "Mesmo motor de prática, outra língua.",
      de: "Dieselbe Engine, andere Sprache.",
      it: "Stesso motore, altra lingua.",
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
    blurb: {
      fr: "Module ancré dans le territoire — selon disponibilité du centre.",
      en: "Territory-anchored module — subject to centre availability.",
      es: "Módulo anclado al territorio.",
      pt: "Módulo ancorado no território.",
      de: "Territorial verankertes Modul.",
      it: "Modulo ancorato al territorio.",
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
    blurb: {
      fr: "Module en langue des signes, selon disponibilité du centre.",
      en: "Sign-language module, subject to centre availability.",
      es: "Módulo en lengua de signos.",
      pt: "Módulo em língua gestual.",
      de: "Gebärdensprach-Modul.",
      it: "Modulo in lingua dei segni.",
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
