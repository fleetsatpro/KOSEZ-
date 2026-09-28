import {
  isLearnLanguageId,
  learnLanguageDef,
  type LearnLanguageDef,
} from "./locales";

export type LearningSurface =
  | "pronlab"
  | "mission"
  | "osez"
  | "tandem"
  | "library"
  | "pulse"
  | "learn"
  | "explore";

/**
 * Central gate: can this learning language use this surface?
 * UI locale is independent — only target language surfaces matter.
 */
export function canUseLearningSurface(
  languageId: string,
  surface: LearningSurface,
): boolean {
  if (!isLearnLanguageId(languageId)) return false;
  const def = learnLanguageDef(languageId);
  if (surface === "learn") {
    return def.surfaces.some(
      (s) =>
        s === "pronlab" ||
        s === "mission" ||
        s === "library" ||
        s === "pulse",
    );
  }
  if (surface === "explore") return true;
  return def.surfaces.includes(
    surface as LearnLanguageDef["surfaces"][number],
  );
}
