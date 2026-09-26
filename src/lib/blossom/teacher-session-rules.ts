export type TeacherSessionDraft = {
  title: string;
  startsAt: string;
  durationMinutes: number;
  notes?: string | null;
};

export type TeacherSessionValidation =
  | {
      ok: true;
      title: string;
      startsAt: Date;
      durationMinutes: number;
      notes: string | null;
    }
  | {
      ok: false;
      reason:
        | "invalid-start"
        | "past-start"
        | "invalid-title"
        | "invalid-duration"
        | "invalid-notes";
    };

export function validateTeacherSessionDraft(
  input: TeacherSessionDraft,
  nowMs = Date.now(),
): TeacherSessionValidation {
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, reason: "invalid-start" };
  if (startsAt.getTime() < nowMs - 60_000) return { ok: false, reason: "past-start" };

  const title = input.title.trim();
  if (!title || title.length > 180) return { ok: false, reason: "invalid-title" };
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 15 ||
    input.durationMinutes > 180
  ) {
    return { ok: false, reason: "invalid-duration" };
  }

  const notes = input.notes?.trim() || null;
  if (notes && notes.length > 2000) return { ok: false, reason: "invalid-notes" };

  return { ok: true, title, startsAt, durationMinutes: input.durationMinutes, notes };
}
