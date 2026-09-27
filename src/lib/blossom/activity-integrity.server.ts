import { getSql } from "@/lib/db";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";

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
) {
  const sql = await getSql();
  const sid = typeof sourceId === "string" ? sourceId.trim() : "";

  if (eventType === "CURRICULUM_EVIDENCE_RECORDED") {
    await assertCurriculumEvidence(userId, sid || stringValue(metadata.lessonId), metadata);
    return;
  }

  if (eventType === "PRONLAB_MASTERY") {
    const itemId = sid.startsWith("mastery-") ? sid.slice("mastery-".length) : sid;
    if (!itemId) throw new Error("activity-mastery-missing-item");
    const rows = await sql.query(
      `select score, seconds from blossom_pronlab_attempt
       where user_id = $1 and item_id = $2
       order by created_at desc limit 12`,
      [userId, itemId],
    );
    if (!rows.length) throw new Error("activity-mastery-without-attempts");
    const verifiedHigh = rows.some(
      (row) => Number(row.score) >= 90 && Number(row.seconds) > 0,
    );
    const practiceCaptures = rows.filter((row) => Number(row.seconds) >= 8).length;
    if (!verifiedHigh && practiceCaptures < 2) {
      throw new Error("activity-mastery-insufficient-evidence");
    }
    return;
  }

  if (eventType === "TANDEM_COMPLETED") {
    const rows = await sql.query(
      `select 1 from blossom_tandem_session
       where (user_id = $1 or partner_user_id = $1)
         and status = 'completed'
         and ended_at is not null
       limit 1`,
      [userId],
    );
    if (!rows[0]) throw new Error("activity-tandem-without-session");
    return;
  }

  if (eventType === "EVENT_ATTENDED") {
    if (!sid) throw new Error("activity-event-missing-source");
    const rows = await sql.query(
      `select 1 from blossom_event_registration
       where user_id = $1 and event_id = $2 and status in ('joined', 'attended', 'checked_in')
       limit 1`,
      [userId, sid],
    );
    const attendance = await sql.query(
      `select 1 from blossom_event_attendance
       where user_id = $1 and event_id = $2 limit 1`,
      [userId, sid],
    );
    if (!rows[0] && !attendance[0]) throw new Error("activity-event-without-registration");
    return;
  }

  if (eventType === "HOMEWORK_COMPLETED") {
    if (!sid) throw new Error("activity-homework-missing-source");
    const rows = await sql.query(
      `select 1 from blossom_homework
       where learner_user_id = $1
         and (id::text = $2 or title = $2)
         and status in ('sent', 'done', 'completed', 'draft')
       limit 1`,
      [userId, sid],
    );
    if (!rows[0]) throw new Error("activity-homework-not-found");
    return;
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
  if (requiresSource.includes(eventType) && !sid) {
    throw new Error("activity-missing-source");
  }
}
