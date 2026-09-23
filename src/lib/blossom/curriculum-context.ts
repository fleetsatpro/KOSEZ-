const KEY = "kosez:curriculum-lesson-context";

export function setCurriculumLessonContext(lessonId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, lessonId);
  } catch {
    // Attribution is optional; durable evidence is stored separately.
  }
}

export function takeCurriculumLessonContext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}
