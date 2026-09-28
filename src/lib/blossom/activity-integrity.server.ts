import { getSql } from "@/lib/db";
import { isLearnLanguageId } from "@/lib/i18n/locales";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";
import { LIBRARY, PRONLAB_SETS, setsForLanguage } from "./data";
import { EXTRA_LIBRARY } from "./library-extra";
import { assertSpeakCompletedEvidence } from "./speak-activity-integrity.server";

export type IntegrityResult =
  | { ok: true }
  | { ok: false; reason: string; code?: string };

/**
 * Server-authoritative gates for durable activity evidence.
 * Never trust client-only claims for SPEAK_COMPLETED, DIAGNOSTIC, EVENT_ATTENDED.
 */
export async function assertActivityEvidence(
  userId: string,
  eventType: string,
  sourceId: string,
  metadata: Record<string, unknown> | null | undefined,
): Promise<IntegrityResult> {
  if (eventType === "SPEAK_COMPLETED") {
    return assertSpeakCompletedEvidence(userId, sourceId, metadata);
  }

  if (eventType === "DIAGNOSTIC_COMPLETED" || eventType === "DIAGNOSTIC") {
    // Diagnostic must have been started and completed server-side.
    const sql = getSql();
    const rows = await sql`
      SELECT id, status, completed_at
      FROM diagnostic_sessions
      WHERE user_id = ${userId}
        AND id = ${sourceId}
        AND status = 'completed'
      LIMIT 1
    `;
    if (!rows.length) {
      return { ok: false, reason: "diagnostic session not found or not completed", code: "DIAGNOSTIC_GATE" };
    }
    return { ok: true };
  }

  if (eventType === "EVENT_ATTENDED") {
    const sql = getSql();
    const rows = await sql`
      SELECT id, status
      FROM event_registrations
      WHERE user_id = ${userId}
        AND event_id = ${sourceId}
        AND status IN ('attended', 'checked_in')
      LIMIT 1
    `;
    if (!rows.length) {
      return { ok: false, reason: "event attendance not verified", code: "EVENT_ATTENDANCE_GATE" };
    }
    return { ok: true };
  }

  // Default: allow other activity types (missions, pulse, etc. have their own paths)
  return { ok: true };
}
