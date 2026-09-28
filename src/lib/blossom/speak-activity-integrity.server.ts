import { getSql } from "@/lib/db";

/**
 * Server-authoritative SPEAK_COMPLETED gate.
 * Only a completed blossom_speak_session row may mint growth evidence.
 */
export async function assertSpeakCompletedEvidence(
  userId: string,
  sourceId: string,
  expectedLanguageId: string,
  safeMetadata: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const sid = sourceId.trim();
  if (
    !/^speak-session-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sid,
    )
  ) {
    throw new Error("activity-speak-invalid-session-source");
  }
  const sessionId = sid.slice("speak-session-".length);
  const sql = await getSql();
  const completed = await sql.query(
    `select room_id, language_id, duration_seconds, ended_at
     from blossom_speak_session
     where id = $1::uuid
       and user_id = $2
       and status = 'completed'
       and duration_seconds is not null
       and ended_at is not null
     limit 1`,
    [sessionId, userId],
  );
  if (!completed[0]) throw new Error("activity-speak-without-session");
  const sessionLanguage = String(completed[0].language_id ?? "")
    .trim()
    .toLowerCase();
  if (sessionLanguage && sessionLanguage !== expectedLanguageId) {
    throw new Error("activity-speak-language-mismatch");
  }
  const durationSeconds = Number(completed[0].duration_seconds);
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 1 ||
    durationSeconds > 7200
  ) {
    throw new Error("activity-speak-invalid-server-duration");
  }
  return {
    ...safeMetadata,
    speakSessionId: sessionId,
    roomId: String(completed[0].room_id),
    languageId: sessionLanguage || expectedLanguageId,
    seconds: durationSeconds,
    durationSeconds,
    minutes: Math.max(1, Math.floor(durationSeconds / 60)),
  };
}
