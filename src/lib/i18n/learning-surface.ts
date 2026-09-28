import {
  isLearnLanguageId,
  learnLanguageDef,
  type LearnLanguageDef,
} from "./locales";

export type LearningSurface =
  | "mission"
  | "osez"
  | "pulse"
  | "pronlab"
  | "tandem";

/**
 * Whether the learner's active target language can use a given learning surface.
 * UI locale is independent; this gates target-language-scoped features only.
 */
export function canUseLearningSurface(
  languageId: string | null | undefined,
  surface: LearningSurface,
): boolean {
  if (!languageId || !isLearnLanguageId(languageId)) return false;
  const def: LearnLanguageDef = learnLanguageDef(languageId);
  switch (surface) {
    case "mission":
      return def.hasMission !== false;
    case "osez":
    case "pulse":
      return def.hasSpeak !== false;
    case "pronlab":
      return def.hasPronlab !== false;
    case "tandem":
      return def.hasTandem !== false;
    default:
      return false;
  }
}
