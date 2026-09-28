import { getSql } from "@/lib/db";
import { isLearnLanguageId } from "@/lib/i18n/locales";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";
import { LIBRARY, PRONLAB_SETS, setsForLanguage } from "./data";
import { EXTRA_LIBRARY } from "./library-extra";
import { assertSpeakCompletedEvidence } from "./speak-activity-integrity.server";

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
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
      Number(attempt.seconds) >= 0
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

function hasCompletedMissionSession(value: unknown): boolean {
  const session = jsonObject(value);
  if (!Array.isArray(session.runs)) return false;
  return session.runs.some((runValue) => {
    const run = jsonObject(runValue);
    return (
      typeof run.id === "string" &&
      typeof run.completedAt === "string" &&
      Boolean(run.completedAt) &&
      missionRunHasReflection(run) &&
      missionRunHasMissionAttempt(run)
    );
  });
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

  const sql = getSql();
  const existing = await sql`
    SELECT value FROM learner_mission_sessions
    WHERE user_id = ${userId} AND mission_id = ${missionId}
    LIMIT 1
  `;
  const previous = existing[0] ? jsonObject(existing[0].value) : null;
  const previousActive = previous ? stringValue(previous.activeRunId) : null;
  const previousRun = previous && previousActive ? missionRunById(previous, previousActive) : null;
  const incomingRun = missionRunById(session, activeRunId);

  if (!incomingRun) {
    throw new Error("mission-active-run-missing");
  }

  if (previousRun && previousActive === activeRunId) {
    return;
  }

  if (incomingCompletedIds.has(activeRunId)) {
    if (!previousRun || !missionRunHasMissionAttempt(previousRun)) {
      throw new Error("mission-completion-without-prior-attempt");
    }
  }
}

export async function sanitizeActivityMetadata(
  userId: string,
  eventType: string,
  sourceId: string,
  metadata: Record<string, unknown> | null | undefined,
  expectedLanguageId?: string | null,
): Promise<Record<string, unknown>> {
  const safeMetadata = jsonObject(metadata);
  const sid = String(sourceId || "");

  if (eventType === "MISSION_COMPLETED") {
    return safeMetadata;
  }

  if (eventType === "DIAGNOSTIC_COMPLETED" || eventType === "DIAGNOSTIC") {
    const sql = getSql();
    const rows = await sql`
      SELECT id, status FROM diagnostic_sessions
      WHERE user_id = ${userId} AND id = ${sid} AND status = 'completed'
      LIMIT 1
    `;
    if (!rows.length) {
      throw new Error("diagnostic-not-completed-server-side");
    }
    return safeMetadata;
  }

  if (eventType === "EVENT_ATTENDED") {
    const sql = getSql();
    const rows = await sql`
      SELECT id FROM event_registrations
      WHERE user_id = ${userId} AND event_id = ${sid}
        AND status IN ('attended', 'checked_in')
      LIMIT 1
    `;
    if (!rows.length) {
      throw new Error("event-attendance-server-only");
    }
    return safeMetadata;
  }

  if (eventType === "IMMERSION_ATTENDED" || eventType === "CLASS_ATTENDED") {
    throw new Error("immersion-or-class-attendance-server-only");
  }

  if (eventType === "SPEAK_COMPLETED") {
    return assertSpeakCompletedEvidence(userId, sid, expectedLanguageId, safeMetadata);
  }

  return safeMetadata;
}
