const KEY = "kosez:curriculum-lesson-context";

export function setCurriculumLessonContext(lessonId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, lessonId);
  } catch {
    // Attribution is optional; durable evidence is stored separately.
  }
}

/**
 * Read without consuming. This is intentionally side-effect free because React
 * may invoke state initializers more than once in development Strict Mode.
 */
export function readCurriculumLessonContext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function clearCurriculumLessonContext(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Attribution is optional; durable evidence is stored separately.
  }
}
