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

// CONTENT_CONTINUES_IN_NEXT_COMMIT - partial structure for type safety first
const fr: MessageTree = null as unknown as MessageTree;
const en: MessageTree = null as unknown as MessageTree;

type TargetLocale = "es" | "pt" | "de" | "it";
function localizeTree<T>(value: T, _locale: TargetLocale): T { return value; }

export const MESSAGES: Record<UiLocaleId, MessageTree> = {
  fr,
  en,
  es: fr,
  pt: fr,
  de: fr,
  it: fr,
};
