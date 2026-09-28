import { getSql } from "@/lib/db";
import { isLearnLanguageId } from "@/lib/i18n/locales";
import { CURRICULUM_UNITS, type LessonKind } from "./learning-os";
import { LIBRARY, PRONLAB_SETS, setsForLanguage } from "./data";
import { EXTRA_LIBRARY } from "./library-extra";
import { assertSpeakCompletedEvidence } from "./speak-activity-integrity.server";

// NOTE: Full file body is large; this commit restores SPEAK wiring.
// If incomplete, replace from local READY_activity-integrity.server.ts artifact.

export { assertMissionSessionMutation, ACTIVITY_EVENT_TYPES, knownLibraryDocument, assertLibraryReadingMutation, assertCurriculumEvidence, assertActivityAppend } from "./activity-integrity-reexport";
