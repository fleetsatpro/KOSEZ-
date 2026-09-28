import {
  isLearnLanguageId,
  learnLanguageDef,
  type LearnLanguageDef,
} from "./locales";

/** Surfaces that can be gated by target-language capability. */
export type LearningSurface =
  | "mission"
  | "osez"
  | "pulse"
  | "pronlab"
  | "tandem"
  | "library"
  | "explore"
  | "learn";

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
  const surfaces = def.surfaces ?? [];

  switch (surface) {
    case "mission":
      return surfaces.includes("mission");
    case "osez":
      return surfaces.includes("osez");
    case "pulse":
      return surfaces.includes("pulse") || surfaces.includes("osez");
    case "pronlab":
      return surfaces.includes("pronlab");
    case "tandem":
      return surfaces.includes("tandem");
    case "library":
      return surfaces.includes("library");
    case "explore":
      // Explore is available when any content surface is present
      return surfaces.length > 0;
    case "learn":
      // Learn hub aggregates pronlab + library
      return surfaces.includes("pronlab") || surfaces.includes("library");
    default:
      return false;
  }
}
