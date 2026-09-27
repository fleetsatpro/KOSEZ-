import { getSql } from "@/lib/db";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";
import { PRONLAB_SETS, setsForLanguage } from "./data";

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function hasCompletedMissionSession(value: unknown): boolean {
  const session = jsonObject(value);
  const runs = Array.isArray(session.runs) ? session.runs : [];
  return runs.some((runValue) => {
    const run = jsonObject(runValue);
    if (typeof run.completedAt !== "string" || !run.completedAt) return false;
    if (!run.reflection || typeof run.reflection !== "object") return false;
    const attempts = Array.isArray(run.attempts) ? run.attempts : [];
    return attempts.some((attemptValue) => {
      const attempt = jsonObject(attemptValue);
      return attempt.kind === "mission";
    });
  });
}

/** Server-authoritative allowlist — mirrors ActivityType in engine.ts. */
export const ACTIVITY_EVENT_TYPES = [
  "MISSION_COMPLETED",
  "SPEAK_COMPLETED",
  "PRONLAB_COMPLETED",
  "PRONLAB_MASTERY",
  "CLASS_ATTENDED",
  "EVENT_ATTENDED",
  "REAL_WORLD_BONUS",
  "TANDEM_COMPLETED",
  "HOMEWORK_COMPLETED",
  "IMMERSION_ATTENDED",
  "PULSE_COMPLETED",
  "REVIEW_COMPLETED",
  "GRAMMAR_COMPLETED",
  "LISTENING_COMPLETED",
  "WRITING_COMPLETED",
  "DIAGNOSTIC_COMPLETED",
  "LESSON_COMPLETED",
  "CURRICULUM_EVIDENCE_RECORDED",
  "LIBRARY_COMPLETED",
] as const;

export type AllowedActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function assertCurriculumEvidence(
  userId: string,
  lessonId: string,
  metadata: Record<string, unknown>,
) {
  const lesson = CURRICULUM_UNITS.flatMap((unit) => unit.lessons).find((item) => item.id === lessonId);
  if (!lesson) throw new Error("curriculum-lesson-unknown");
  const supportId = stringValue(metadata.supportId);
  if (!supportId) throw new Error("curriculum-evidence-missing-support");

  const sql = await getSql();
  const checks: Record<LessonKind, () => Promise<boolean>> = {
    mission: async () => Boolean((await sql.query("select 1 from blossom_activity_event where user_id = $1 and event_type = 'MISSION_COMPLETED' and source_id = $2 limit 1", [userId, supportId]))[0]),
    speak: async () => Boolean((await sql.query("select 1 from blossom_activity_event where user_id = $1 and event_type = 'SPEAK_COMPLETED' and source_id = $2 limit 1", [userId, supportId]))[0]),
    pronlab: async () => Boolean((await sql.query("select 1 from blossom_pronlab_attempt where user_id = $1 and item_id = $2 limit 1", [userId, supportId]))[0]),
    review: async () => Boolean((await sql.query("select 1 from blossom_activity_event where user_id = $1 and event_type = 'REVIEW_COMPLETED' and source_id = $2 limit 1", [userId, supportId]))[0]),
    grammar: async () => Boolean((await sql.query("select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = 'grammar' limit 1", [userId, supportId]))[0]),
    listening: async () => Boolean((await sql.query("select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = 'listening' limit 1", [userId, supportId]))[0]),
    writing: async () => Boolean((await sql.query("select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = 'writing' limit 1", [userId, supportId]))[0]),
    library: async () => Boolean((await sql.query(
      "select 1 from blossom_activity_event where user_id = $1 and event_type = 'LIBRARY_COMPLETED' and source_id = $2 limit 1",
      [userId, supportId],
    ))[0]),
  };

  if (lesson.taskId && supportId !== lesson.taskId) {
    throw new Error("curriculum-evidence-wrong-task");
  }

  if (!(await checks[lesson.kind]())) throw new Error("curriculum-evidence-without-support");
}

/**
 * Integrity gate for activity.append.
 * Unknown event types are rejected via zod enum of ACTIVITY_EVENT_TYPES.
 * Privileged types require prior server-side evidence.
 */
export async function assertActivityAppend(
  userId: string,
  eventType: AllowedActivityEventType,
  sourceId: string | null | undefined,
  metadata: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const sql = await getSql();
  const sid = typeof sourceId === "string" ? sourceId.trim() : "";

  const profile = await sql.query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const expectedLanguageId = String(profile[0]?.target_language ?? "en");
  const claimedLanguageId = metadata.languageId;
  if (typeof claimedLanguageId !== "string" || claimedLanguageId !== expectedLanguageId) {
    throw new Error("activity-language-mismatch");
  }
  const safeMetadata = { ...metadata, languageId: expectedLanguageId };

  if (eventType === "CURRICULUM_EVIDENCE_RECORDED") {
    await assertCurriculumEvidence(userId, sid || stringValue(metadata.lessonId), metadata);
    return safeMetadata;
  }

  if (eventType === "PRONLAB_MASTERY") {
    // No client mutation can certify mastery. A real mastery verdict must be
    // produced by a server-authoritative assessment path.
    throw new Error("activity-mastery-server-only");
  }

  if (eventType === "MISSION_COMPLETED") {
    if (!sid) throw new Error("activity-mission-missing-source");
    const rows = await sql.query(
      "select session from blossom_mission_session where user_id = $1 and mission_id = $2 limit 1",
      [userId, sid],
    );
    if (!rows[0] || !hasCompletedMissionSession(rows[0].session)) {
      throw new Error("activity-mission-without-completed-session");
    }
    return;
  }

  if (eventType === "PRONLAB_COMPLETED") {
    if (!sid) throw new Error("activity-pronlab-missing-source");
    if (sid.startsWith("pron-touch-")) {
      const itemId = sid.slice("pron-touch-".length);
      const activeItemIds = new Set(
        setsForLanguage(expectedLanguageId).flatMap((setDef) => setDef.items.map((item) => item.id)),
      );
      if (!activeItemIds.has(itemId)) throw new Error("activity-pronlab-language-mismatch");
      const rows = await sql.query(
        "select 1 from blossom_pronlab_attempt where user_id = $1 and item_id = $2 limit 1",
        [userId, itemId],
      );
      if (!rows[0]) throw new Error("activity-pronlab-without-attempt");
      return safeMetadata;
    }
    if (sid.startsWith("pronlab-set-")) {
      const setId = sid.slice("pronlab-set-".length);
      const setDef = PRONLAB_SETS.find((set) => set.id === setId);
      if (!setDef || !setsForLanguage(expectedLanguageId).some((set) => set.id === setId)) {
        throw new Error("activity-pronlab-set-language-mismatch");
      }
      const missing = await sql.query(
        "select item_id from blossom_pronlab_attempt where user_id = $1 and item_id = any($2::text[])",
        [userId, setDef.items.map((item) => item.id)],
      );
      if (missing.length !== setDef.items.length) throw new Error("activity-pronlab-set-without-attempts");
      return safeMetadata;
    }
    throw new Error("activity-pronlab-invalid-source");
  }

  if (eventType === "TANDEM_COMPLETED") {
    const sessionId = sid.startsWith("tandem-session-") ? sid.slice("tandem-session-".length) : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      throw new Error("activity-tandem-invalid-session-source");
    }
    const rows = await sql.query(
      "select 1 from blossom_tandem_session where id = $1::uuid and (user_id = $2 or partner_user_id = $2) and status = 'completed' and ended_at is not null limit 1",
      [sessionId, userId],
    );
    if (!rows[0]) throw new Error("activity-tandem-without-session");
    return safeMetadata;
  }

  if (eventType === "IMMERSION_ATTENDED") {
    if (!sid) throw new Error("activity-immersion-missing-source");
    const rows = await sql.query(
      "select 1 from blossom_challenge_completion where user_id = $1 and challenge_id = $2 limit 1",
      [userId, sid],
    );
    if (!rows[0]) throw new Error("activity-immersion-without-challenge");
    return safeMetadata;
  }

  if (eventType === "EVENT_ATTENDED") {
    if (!sid) throw new Error("activity-event-missing-source");
    const attendance = await sql.query(
      "select 1 from blossom_event_attendance where user_id = $1 and event_id = $2 limit 1",
      [userId, sid],
    );
    if (!attendance[0]) throw new Error("activity-event-without-attendance");
    return safeMetadata;
  }

  if (eventType === "HOMEWORK_COMPLETED") {
    if (!sid) throw new Error("activity-homework-missing-source");
    const rows = await sql.query(
      "select 1 from blossom_homework where learner_user_id = $1 and id::text = $2 and status = 'done' limit 1",
      [userId, sid],
    );
    if (!rows[0]) throw new Error("activity-homework-not-completed");
    return safeMetadata;
  }

  const requiresSource: AllowedActivityEventType[] = [
    "MISSION_COMPLETED",
    "SPEAK_COMPLETED",
    "PRONLAB_COMPLETED",
    "REVIEW_COMPLETED",
    "GRAMMAR_COMPLETED",
    "LISTENING_COMPLETED",
    "WRITING_COMPLETED",
    "LIBRARY_COMPLETED",
    "CLASS_ATTENDED",
    "IMMERSION_ATTENDED",
    "PULSE_COMPLETED",
    "DIAGNOSTIC_COMPLETED",
    "LESSON_COMPLETED",
    "REAL_WORLD_BONUS",
  ];
  if (eventType === "REVIEW_COMPLETED") {
    const rows = await sql.query(
      "select 1 from blossom_learning_submission where user_id = $1 and kind = 'review' and created_at >= current_date limit 1",
      [userId],
    );
    if (!rows[0]) throw new Error("activity-review-without-submission");
    return safeMetadata;
  }

  if (requiresSource.includes(eventType) && !sid) {
    throw new Error("activity-missing-source");
  }

  if (eventType === "GRAMMAR_COMPLETED" || eventType === "LISTENING_COMPLETED" || eventType === "WRITING_COMPLETED") {
    const kind = eventType.startsWith("GRAMMAR") ? "grammar" : eventType.startsWith("LISTENING") ? "listening" : "writing";
    const rows = await sql.query(
      "select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = $3 limit 1",
      [userId, sid, kind],
    );
    if (!rows[0]) throw new Error("activity-learning-without-submission");
  }

  if (eventType === "CLASS_ATTENDED") {
    throw new Error("activity-class-attendance-server-only");
  }

  if (eventType === "SPEAK_COMPLETED") {
    throw new Error("activity-speak-completion-server-only");
  }

  return safeMetadata;
}
