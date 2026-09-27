import { getSql } from "@/lib/db";
import { TANDEM_TOTAL_DURATION_SECONDS, TANDEM_CONTRACT } from "./tandem-contract";
import { isLearnLanguageId, isLearnSurfaceAvailable } from "@/lib/i18n/locales";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";
import { LIBRARY, PRONLAB_SETS, setsForLanguage } from "./data";
import { EXTRA_LIBRARY } from "./library-extra";

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function missionRunHasMissionAttempt(value: unknown): boolean {
  const run = jsonObject(value);
  if (!Array.isArray(run.attempts)) return false;
  return run.attempts.some((attemptValue) => {
    const attempt = jsonObject(attemptValue);
    return (
      attempt.kind === "mission" &&
      typeof attempt.id === "string" &&
      typeof attempt.startedAt === "string" &&
      typeof attempt.endedAt === "string" &&
      Number.isFinite(Number(attempt.seconds)) &&
      Number(attempt.seconds) > 0
    );
  });
}

function missionRunHasReflection(value: unknown): boolean {
  const reflection = jsonObject(jsonObject(value).reflection);
  return (
    typeof reflection.objectiveAchieved === "boolean" &&
    ["yes", "partly", "no"].includes(String(reflection.stayedInTargetLanguage)) &&
    [1, 2, 3, 4, 5].includes(Number(reflection.confidence)) &&
    ["hesitation", "vocabulary", "switching", "confidence", "none"].includes(String(reflection.friction))
  );
}

function missionRunById(value: unknown, runId: string): Record<string, unknown> | null {
  const session = jsonObject(value);
  if (!Array.isArray(session.runs)) return null;
  const matches = session.runs.filter((candidate) => jsonObject(candidate).id === runId);
  if (matches.length !== 1) return null;
  return jsonObject(matches[0]);
}

function missionAttemptIds(value: unknown): Set<string> {
  const run = jsonObject(value);
  if (!Array.isArray(run.attempts)) return new Set();
  return new Set(
    run.attempts
      .map((candidate) => jsonObject(candidate).id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
}

/**
 * Validate mission session writes at the same trust boundary regardless of
 * whether the caller arrives through offline sync or the legacy direct server
 * function. A client may persist an in-progress run, but a completion transition
 * must be backed by an existing active server run with prior execution evidence.
 */
export async function assertMissionSessionMutation(
  userId: string,
  missionId: string,
  value: unknown,
): Promise<void> {
  const session = jsonObject(value);
  if (stringValue(session.missionId) !== missionId) {
    throw new Error("mission-session-id-mismatch");
  }
  const profile = await (await getSql()).query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const expectedLanguageId = isLearnLanguageId(String(profile[0]?.target_language ?? ""))
    ? String(profile[0].target_language)
    : "en";
  const sessionLanguageId = stringValue(session.languageId, "en");
  if (sessionLanguageId !== expectedLanguageId) {
    throw new Error("mission-session-language-mismatch");
  }
  const activeRunId = stringValue(session.activeRunId);
  const runs = Array.isArray(session.runs) ? session.runs : [];
  const incomingCompletedIds = new Set(
    runs
      .map((candidate) => jsonObject(candidate))
      .filter((run) => typeof run.completedAt === "string" && Boolean(run.completedAt))
      .map((run) => run.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  if (!activeRunId) {
    if (incomingCompletedIds.size > 0) {
      throw new Error("mission-completion-without-active-run");
    }
    return;
  }

  const incomingRun = missionRunById(value, activeRunId);
  if (!incomingRun) throw new Error("mission-session-invalid-active-run");

  const sql = await getSql();
  const currentRows = await sql.query(
    "select session from blossom_mission_session where user_id = $1 and mission_id = $2 limit 1",
    [userId, missionId],
  );
  if (!currentRows[0]) {
    if (typeof incomingRun.completedAt === "string" && incomingRun.completedAt) {
      throw new Error("mission-completion-without-prior-session");
    }
    return;
  }

  const currentSession = jsonObject(currentRows[0].session);
  const currentRun = missionRunById(currentRows[0].session, activeRunId);
  if (!currentRun) {
    if (typeof incomingRun.completedAt === "string" && incomingRun.completedAt) {
      throw new Error("mission-completion-without-prior-run");
    }
    return;
  }

  const currentRuns = Array.isArray(currentSession.runs) ? currentSession.runs : [];
  const currentCompletedIds = new Set(
    currentRuns
      .map((candidate) => jsonObject(candidate))
      .filter((run) => typeof run.completedAt === "string" && Boolean(run.completedAt))
      .map((run) => run.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  for (const completedId of incomingCompletedIds) {
    if (!currentCompletedIds.has(completedId) && completedId !== activeRunId) {
      throw new Error("mission-completion-adds-unrelated-run");
    }
  }

  const incomingCompleted = typeof incomingRun.completedAt === "string" && Boolean(incomingRun.completedAt);
  const currentCompleted = typeof currentRun.completedAt === "string" && Boolean(currentRun.completedAt);

  if (incomingCompleted) {
    if (currentCompleted) throw new Error("mission-completion-already-recorded");
    if (!missionRunHasMissionAttempt(currentRun)) {
      throw new Error("mission-completion-without-prior-attempt");
    }
    if (!missionRunHasReflection(currentRun)) {
      throw new Error("mission-completion-without-prior-reflection");
    }
    if (!missionRunHasMissionAttempt(incomingRun) || !missionRunHasReflection(incomingRun)) {
      throw new Error("mission-completion-missing-evidence");
    }
    const currentAttemptIds = missionAttemptIds(currentRun);
    const incomingAttemptIds = missionAttemptIds(incomingRun);
    for (const id of currentAttemptIds) {
      if (!incomingAttemptIds.has(id)) throw new Error("mission-completion-drops-evidence");
    }
    if (typeof incomingRun.completedAt !== "string" || !Number.isFinite(Date.parse(incomingRun.completedAt))) {
      throw new Error("mission-completion-invalid-time");
    }
  } else if (currentCompleted) {
    const currentActiveRunId = stringValue(currentSession.activeRunId);
    if (currentActiveRunId === activeRunId) {
      throw new Error("mission-completion-reversal");
    }
  }
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

export function knownLibraryDocument(documentId: string) {
  return [...LIBRARY, ...EXTRA_LIBRARY].find((item) => item.id === documentId) ?? null;
}

function libraryLanguageId(language: string): string {
  const normalized = language.trim().toLowerCase();
  return normalized === "english" ? "en"
    : normalized === "french" ? "fr"
      : normalized === "spanish" ? "es"
        : normalized === "portuguese" ? "pt"
          : normalized === "italian" ? "it"
            : normalized === "german" ? "de"
              : normalized === "lsf" ? "lsf"
                : normalized === "creole" ? "cr"
                  : "";
}

export async function assertLibraryReadingMutation(
  userId: string,
  documentId: string,
  action: "start" | "complete",
  mutationCreatedAt: string,
): Promise<void> {
  const document = knownLibraryDocument(documentId);
  if (!document) throw new Error("library-document-unknown");
  const profile = await (await getSql()).query(
    "select target_language from blossom_profile where user_id = $1 limit 1",
    [userId],
  );
  const languageId = isLearnLanguageId(String(profile[0]?.target_language ?? "")) ? String(profile[0].target_language) : "en";
  if (libraryLanguageId(document.language) !== languageId) {
    throw new Error("library-language-mismatch");
  }
  const sql = await getSql();
  if (!Number.isFinite(Date.parse(mutationCreatedAt))) {
    throw new Error("library-invalid-mutation-time");
  }

  // The client timestamp is only a schema/format check. It is never used as
  // evidence of elapsed reading time: otherwise an attacker can backdate
  // library.start and manufacture an arbitrarily old session.
  if (action === "start") {
    await sql.query(
      `insert into blossom_library_reading (user_id, document_id, started_at)
       values ($1, $2, current_timestamp)
       on conflict (user_id, document_id) do nothing`,
      [userId, documentId],
    );
    return;
  }

  const rows = await sql.query(
    "select started_at, completed_at from blossom_library_reading where user_id = $1 and document_id = $2 limit 1",
    [userId, documentId],
  );
  if (!rows[0]) throw new Error("library-completion-without-start");
  if (rows[0].completed_at) return;
  const startedAt = new Date(String(rows[0].started_at)).getTime();
  const completedAt = Date.now();
  const minimumSeconds = Math.max(30, Number(document.minutes) * 20);
  if (!Number.isFinite(startedAt) || completedAt - startedAt < minimumSeconds * 1000) {
    throw new Error("library-reading-too-fast");
  }
  await sql.query(
    "update blossom_library_reading set completed_at = current_timestamp where user_id = $1 and document_id = $2 and completed_at is null",
    [userId, documentId],
  );
}


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
  const rawLanguageId = String(profile[0]?.target_language ?? "en");
  const expectedLanguageId = isLearnLanguageId(rawLanguageId) ? rawLanguageId : "en";
  const claimedLanguageId = metadata.languageId;
  if (typeof claimedLanguageId !== "string" || claimedLanguageId !== expectedLanguageId) {
    throw new Error("activity-language-mismatch");
  }
  const safeMetadata = {
    ...metadata,
    languageId: expectedLanguageId,
    syncState: "confirmed" as const,
  };

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
    if (!/^mission-session-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sid)) {
      throw new Error("activity-mission-invalid-session-source");
    }
    const serverSessionId = sid.slice("mission-session-".length);
    const serverRun = await sql.query(
      `select mission_id, run_id, duration_seconds, ended_at
       from blossom_mission_run_session
       where id = $1::uuid and user_id = $2 and status = 'completed' and duration_seconds is not null and ended_at is not null
       limit 1`,
      [serverSessionId, userId],
    );
    if (!serverRun[0]) throw new Error("activity-mission-without-server-session");
    const missionDurationSeconds = Number(serverRun[0].duration_seconds ?? 0);
    if (!Number.isFinite(missionDurationSeconds) || missionDurationSeconds < 60) {
      throw new Error("activity-mission-insufficient-duration");
    }
    const missionId = String(serverRun[0].mission_id);
    const missionRows = await sql.query(
      "select session from blossom_mission_session where user_id = $1 and mission_id = $2 limit 1",
      [userId, missionId],
    );
    if (!missionRows[0]) throw new Error("activity-mission-without-completed-session");
    const localRun = missionRunById(missionRows[0].session, String(serverRun[0].run_id));
    if (!localRun || typeof localRun.completedAt !== "string" || !localRun.completedAt || !missionRunHasMissionAttempt(localRun) || !missionRunHasReflection(localRun)) {
      throw new Error("activity-mission-without-matched-run");
    }
    const completedAtMs = Date.parse(String(localRun.completedAt));
    const serverEndedAtMs = Date.parse(String(serverRun[0].ended_at));
    if (!Number.isFinite(completedAtMs) || !Number.isFinite(serverEndedAtMs)) {
      throw new Error("activity-mission-invalid-completion-time");
    }
    return {
      ...safeMetadata,
      missionId,
      runId: String(serverRun[0].run_id),
      serverSessionId,
      durationSeconds: Math.max(0, Number(serverRun[0].duration_seconds ?? 0)),
    };
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
      "select user_id, partner_user_id, started_at, ended_at, language_id, partner_language_id from blossom_tandem_session where id = $1::uuid and (user_id = $2 or partner_user_id = $2) and status = 'completed' and ended_at is not null limit 1",
      [sessionId, userId],
    );
    if (!rows[0]) throw new Error("activity-tandem-without-session");
    const isInitiator = String(rows[0].user_id) === userId;
    const sessionLanguageId = isInitiator
      ? String(rows[0].language_id ?? "en")
      : String(rows[0].partner_language_id ?? "en");
    if (sessionLanguageId !== expectedLanguageId) {
      throw new Error("activity-tandem-language-mismatch");
    }
    const durationSeconds = Math.floor(
      (new Date(String(rows[0].ended_at)).getTime() - new Date(String(rows[0].started_at)).getTime()) / 1000,
    );
    const prompts = await sql.query(
      `select user_id, count(*)::integer as count
       from blossom_tandem_prompt_log
       where session_id = $1::uuid
       group by user_id`,
      [sessionId],
    );
    const distinctParticipants = prompts.length;
    const totalPrompts = prompts.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    if (!Number.isFinite(durationSeconds) || durationSeconds < TANDEM_TOTAL_DURATION_SECONDS || distinctParticipants < TANDEM_CONTRACT.minParticipants || totalPrompts < TANDEM_CONTRACT.minPrompts) {
      throw new Error("activity-tandem-insufficient-evidence");
    }
    return {
      ...safeMetadata,
      sessionId,
      minutes: Math.max(1, Math.floor(durationSeconds / 60)),
      durationSeconds,
    };
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

  if (eventType === "PULSE_COMPLETED") {
    if (!/^pulse-session-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sid)) {
      throw new Error("activity-pulse-invalid-session-source");
    }

    // Reward-bearing Pulse activity is bound to one server-created session.
    // The client-provided dare id and seconds are never trusted as evidence.
    const sessionId = sid.slice("pulse-session-".length);
    const completed = await sql.query(
      `select dare_id, duration_seconds, ended_at
       from blossom_pulse_session
       where id = $1::uuid
         and user_id = $2
         and status = 'completed'
         and duration_seconds is not null
         and ended_at is not null
       limit 1`,
      [sessionId, userId],
    );
    if (!completed[0]) throw new Error("activity-pulse-without-session");

    const dareId = String(completed[0].dare_id);
    if (dareId !== "pulse-local" && dareId !== "pulse-terrain" && dareId !== "pulse-social" && !dareId.startsWith("pulse-struggle-")) {
      throw new Error("activity-pulse-unknown-source");
    }
    if (dareId.startsWith("pulse-struggle-")) {
      const itemId = dareId.slice("pulse-struggle-".length);
      const activeItemIds = new Set(
        setsForLanguage(expectedLanguageId).flatMap((setDef) => setDef.items.map((item) => item.id)),
      );
      if (!activeItemIds.has(itemId)) throw new Error("activity-pulse-language-mismatch");
      const attempt = await sql.query(
        "select 1 from blossom_pronlab_attempt where user_id = $1 and item_id = $2 limit 1",
        [userId, itemId],
      );
      if (!attempt[0]) throw new Error("activity-pulse-without-pronlab-evidence");
    }

    const durationSeconds = Number(completed[0].duration_seconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 3600) {
      throw new Error("activity-pulse-invalid-server-duration");
    }
    return {
      ...safeMetadata,
      pulseSessionId: sessionId,
      dareId,
      seconds: durationSeconds,
      durationSeconds,
      minutes: Math.max(1, Math.floor(durationSeconds / 60)),
    };
  }

  if (eventType === "LIBRARY_COMPLETED") {
    if (!sid) throw new Error("activity-library-missing-source");
    const known = knownLibraryDocument(sid);
    if (!known) throw new Error("activity-library-unknown-source");
    if (libraryLanguageId(known.language) !== expectedLanguageId) {
      throw new Error("activity-library-language-mismatch");
    }
    const completed = await sql.query(
      "select 1 from blossom_library_reading where user_id = $1 and document_id = $2 and completed_at is not null limit 1",
      [userId, sid],
    );
    if (!completed[0]) throw new Error("activity-library-without-reading");
    return safeMetadata;
  }

  if (eventType === "DIAGNOSTIC_COMPLETED") {
    // Placement/diagnostic outcomes are privileged learner-state mutations.
    // There is no client-backed diagnostic evidence table in the current product,
    // so an activity append cannot be allowed to manufacture this reward.
    throw new Error("activity-diagnostic-server-only");
  }

  if (eventType === "REAL_WORLD_BONUS" || eventType === "LESSON_COMPLETED") {
    throw new Error("activity-legacy-reward-server-only");
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
    "LESSON_COMPLETED",
    "REAL_WORLD_BONUS",
  ];
  if (eventType === "REVIEW_COMPLETED") {
    if (!/^review-\d{4}-\d{2}-\d{2}$/.test(sid)) {
      throw new Error("activity-review-invalid-source");
    }
    const rows = await sql.query(
      "select 1 from blossom_learning_submission where user_id = $1 and kind = 'review' and created_at >= current_date and coalesce(result->>'languageId', '') = $2 limit 1",
      [userId, expectedLanguageId],
    );
    if (!rows[0]) throw new Error("activity-review-without-submission");
    return safeMetadata;
  }

  if (requiresSource.includes(eventType) && !sid) {
    throw new Error("activity-missing-source");
  }

  if (eventType === "GRAMMAR_COMPLETED" || eventType === "LISTENING_COMPLETED" || eventType === "WRITING_COMPLETED") {
    if (!isLearnSurfaceAvailable(expectedLanguageId, "labs")) {
      throw new Error("activity-learning-surface-unavailable");
    }
    const kind = eventType.startsWith("GRAMMAR") ? "grammar" : eventType.startsWith("LISTENING") ? "listening" : "writing";
    const match = new RegExp("^lab:" + kind + ":([^:]+):\\d{4}-\\d{2}-\\d{2}$").exec(sid);
    if (!match?.[1]) throw new Error("activity-learning-invalid-source");
    const taskId = match[1];
    const rows = await sql.query(
      "select 1 from blossom_learning_submission where user_id = $1 and task_id = $2 and kind = $3 and coalesce(result->>'languageId', '') = $4 limit 1",
      [userId, taskId, kind, expectedLanguageId],
    );
    if (!rows[0]) throw new Error("activity-learning-without-submission");
  }

  if (eventType === "CLASS_ATTENDED") {
    throw new Error("activity-class-attendance-server-only");
  }

  if (eventType === "SPEAK_COMPLETED") {
    if (!/^speak-session-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sid)) {
      throw new Error("activity-speak-invalid-session-source");
    }
    const sessionId = sid.slice("speak-session-".length);
    const rows = await sql.query(
      `select room_id, language_id, status, duration_seconds, evidence_seconds, turn_count, ended_at
       from blossom_speak_session
       where id = $1::uuid and user_id = $2 and status = 'completed'
         and duration_seconds is not null and ended_at is not null
       limit 1`,
      [sessionId, userId],
    );
    if (!rows[0]) throw new Error("activity-speak-without-session");
    if (String(rows[0].language_id) !== expectedLanguageId) {
      throw new Error("activity-speak-language-mismatch");
    }
    const durationSeconds = Number(rows[0].duration_seconds ?? 0);
    const evidenceSeconds = Number(rows[0].evidence_seconds ?? 0);
    const turnCount = Number(rows[0].turn_count ?? 0);
    if (
      !Number.isFinite(durationSeconds) ||
      durationSeconds < 1 ||
      durationSeconds > 3600 ||
      !Number.isFinite(evidenceSeconds) ||
      evidenceSeconds < 1 ||
      !Number.isFinite(turnCount) ||
      turnCount < 1
    ) {
      throw new Error("activity-speak-insufficient-evidence");
    }
    return {
      ...safeMetadata,
      speakSessionId: sessionId,
      roomId: String(rows[0].room_id),
      durationSeconds,
      evidenceSeconds,
      turnCount,
    };
  }

  return safeMetadata;
}
