import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const sync = read("src/lib/blossom/sync.server.ts");
const syncTypes = read("src/lib/blossom/sync-types.ts");
const integrity = read("src/lib/blossom/activity-integrity.server.ts");
const bootstrap = read("src/lib/auth/admin-bootstrap.ts");
const gate = read("src/lib/auth/gate-session.server.ts");
const auth = read("src/lib/auth/server.ts");
const rateLimit = read("src/lib/blossom/rate-limit.server.ts");
const preview = read("src/lib/auth/preview.ts");
const api = read("src/lib/blossom/api.ts");
const workspaces = read("src/lib/blossom/workspaces.server.ts");
const tandem = read("src/lib/blossom/tandem.server.ts");
const booking = read("src/lib/blossom/booking.server.ts");
const activities = read("src/lib/blossom/activities.server.ts");
const sessionsFile = read("src/lib/blossom/sessions.server.ts");
const safety = read("src/lib/blossom/safety.server.ts");
const messaging = read("src/lib/blossom/messaging.server.ts");
const domainApi = read("src/lib/blossom/domain.api.ts");
const speakServer = read("src/lib/blossom/speak-server.server.ts");
const pwa = read("server/middleware/grok-pwa.ts");

test("activity mutations are enum-gated and pass through server integrity checks", () => {
  assert.match(sync, /eventType: z\.enum\(ACTIVITY_EVENT_TYPES\)/);
  assert.match(sync, /await assertActivityAppend\(/);
  assert.match(integrity, /activity-mastery-server-only/);
  assert.match(integrity, /activity-diagnostic-server-only/);
  assert.match(integrity, /activity-tandem-insufficient-evidence/);
  assert.match(read("src/lib/blossom/backend.server.ts"), /where blossom_learning_submission\.user_id = excluded\.user_id/);
  assert.match(activities, /where blossom_learning_submission\.user_id = excluded\.user_id/);
  assert.match(integrity, /activity-event-without-attendance/);
  assert.match(integrity, /activity-pronlab-without-attempt/);
  assert.match(integrity, /tandem-session-/);
  assert.match(integrity, /activity-language-mismatch/);
  assert.match(sync, /activeLanguageId/);
  assert.match(sync, /targetLanguage: z\.enum/);
  assert.match(integrity, /mission-completion-without-prior-session/);
  assert.match(sync, /assertMissionSessionMutation/);
  assert.match(sync, /mutation\.deviceId !== deviceId/);
  assert.match(sync, /MAX_FUTURE_MUTATION_SKEW_MS/);
  assert.match(sync, /invalid-mutation-time/);
  assert.match(sync, /insert into blossom_sync_device/);
  assert.match(api, /z\.enum\(ACTIVITY_EVENT_TYPES\)/);
  assert.match(api, /await assertActivityAppend\(/);
  assert.match(api, /await assertMissionSessionMutation\(/);
  assert.match(api, /enforceRateLimit\(context\.userId, "activity\.append"/);
  assert.match(api, /enforceRateLimit\(context\.userId, "mission\.save"/);
  assert.match(api, /enforceRateLimit\(context\.userId, "profile\.upsert"/);
  assert.match(integrity, /activity-library-unknown-source/);
  assert.match(integrity, /activity-library-without-reading/);
  assert.match(integrity, /library-reading-too-fast/);
  assert.match(integrity, /assertLibraryReadingMutation/);
  assert.match(syncTypes, /"library.start"/);
  assert.match(syncTypes, /"library.complete"/);
  assert.match(sync, /case "library.start"/);
  assert.match(sync, /case "library.complete"/);
  assert.match(sync, /review-pron-without-attempt/);
  assert.match(sync, /review-vocab-without-word/);
  assert.match(sync, /unknown-review-source/);
  assert.match(integrity, /activity-pulse-unknown-source/);
  assert.match(integrity, /activity-review-invalid-source/);
  assert.match(integrity, /activity-legacy-reward-server-only/);
  assert.match(integrity, /mission-completion-adds-unrelated-run/);
  assert.match(speakServer, /speak\.room/);
  assert.doesNotMatch(speakServer, /userWindows/);
  assert.doesNotMatch(speakServer, /function assertRateLimit\(userId: string\)/);
  assert.match(pwa, /withSecurityHeaders\(result, event\)/);
  assert.match(safety, /tandem_connection mine/);
  assert.match(safety, /mine\.status = 'accepted'/);
  assert.match(safety, /Vous ne pouvez signaler qu'un tandem réciproquement accepté/);
  assert.match(messaging, /communication\.list/);
  assert.match(messaging, /order by c\.updated_at desc limit 100/);
  assert.match(messaging, /await assertConversationAccess\(userId, conversationId\)/);
  assert.match(booking, /commerce\.booking-request/);
  assert.match(booking, /commerce\.waitlist-request/);
  assert.match(activities, /learning\.pronlab-attempt/);
  assert.match(activities, /learning\.vocabulary-upsert/);
  assert.match(tandem, /tandem\.status/);
  assert.match(activities, /event\.register/);
  assert.match(activities, /immersion\.challenge-complete/);
  assert.match(activities, /teacher\.homework-save/);
  assert.match(activities, /teacher\.note-save/);
  assert.match(activities, /homework\.complete/);
  assert.match(activities, /learning\.submission/);
  assert.match(booking, /admin\.booking-update/);
  assert.match(tandem, /communication\.connect-peers/);
  assert.match(tandem, /tandem\.candidates/);
  assert.ok(tandem.includes("order by display_name asc\n    limit 100"));
  assert.match(workspaces, /m\.role <> 'learner'/);
  assert.match(workspaces, /g\.teacher_user_id = \$2/);
  assert.match(sync, /updated_at < current_timestamp - interval '5 minutes'/);
  assert.match(sessionsFile, /duration_seconds = greatest/);
  assert.match(sessionsFile, /durationSeconds: Math\.max/);
  assert.match(integrity, /activity-pulse-without-session/);
  assert.match(integrity, /activity-pulse-invalid-server-duration/);
  assert.match(integrity, /activity-mission-invalid-session-source/);
  assert.match(integrity, /activity-mission-without-server-session/);
  assert.match(integrity, /activity-mission-without-matched-run/);
  assert.match(integrity, /mission-session-/);
  assert.match(integrity, /activity-pulse-invalid-session-source/);
  assert.match(integrity, /pulse-session-/);
  assert.match(integrity, /from blossom_pulse_session/);
  assert.match(sessionsFile, /validSpeakRoomId/);
  assert.match(sessionsFile, /validSpeakLanguageId/);
  assert.match(sessionsFile, /language_id/);
  assert.match(domainApi, /languageId: z\.string/);
  assert.match(domainApi, /startSpeakSession\(context\.userId, data\.roomId, data\.languageId\)/);
  assert.match(read("migrations/0032_speak_session_integrity.sql"), /language_id text not null/);
  assert.match(sessionsFile, /pulse\.start-session/);
  assert.match(sessionsFile, /pulse\.end-session/);
  assert.match(sessionsFile, /mission\.start-session/);
  assert.match(sessionsFile, /mission\.end-session/);
  assert.match(domainApi, /startMissionRunSessionOnServer/);
  assert.match(domainApi, /endMissionRunSessionOnServer/);
  assert.match(read("migrations/0030_pulse_session_integrity.sql"), /blossom_activity_pulse_session_uidx/);
  assert.match(read("migrations/0031_mission_run_session_integrity.sql"), /blossom_mission_run_session_active_uidx/);
  assert.match(read("migrations/0031_mission_run_session_integrity.sql"), /blossom_activity_mission_session_uidx/);
  assert.match(read("migrations/0029_tandem_session_integrity.sql"), /create unique index if not exists blossom_tandem_session_active_pair_uidx/);
  assert.match(read("migrations/0029_tandem_session_integrity.sql"), /alter table blossom_tandem_session/);
  assert.match(read("migrations/0030_pulse_session_integrity.sql"), /create table if not exists blossom_pulse_session/);
  assert.match(read("migrations/0030_pulse_session_integrity.sql"), /create unique index if not exists blossom_pulse_session_active_user_uidx/);
  assert.match(domainApi, /ensureBootstrapAdmin\(context\.userId, identity\.email, identity\.emailVerified\)/);
});

test("authenticated abuse surfaces use the distributed Postgres limiter", () => {
  assert.match(sync, /enforceRateLimit\(userId, "sync\.batch"/);
  assert.match(rateLimit, /on conflict \(user_id, bucket_key\) do update/);
  assert.match(rateLimit, /hit_count < \$4/);
  assert.match(read("src/lib/blossom/messaging.server.ts"), /communication\.send/);
  assert.match(read("src/lib/blossom/messaging.server.ts"), /communication\.report/);
  assert.match(read("src/lib/blossom/safety.server.ts"), /safety\.tandem-report/);
  assert.match(read("src/lib/blossom/speech-server.server.ts"), /speech\.transcribe/);
  assert.match(tandem, /tandem\.end-session/);
});

test("Better Auth uses persistent rate limiting and stronger password floor", () => {
  assert.match(auth, /storage: "database"/);
  assert.match(auth, /minPasswordLength: 12/);
  assert.match(auth, /"\/sign-in\/email": \{ window: 10, max: 5 \}/);
});

test("production admin bootstrap fails closed and session material is never logged", () => {
  assert.match(bootstrap, /if \(hasRealDatabase\(\)\) return \[\];/);
  assert.doesNotMatch(gate, /cookiePreview/);
  assert.match(preview, /GROK_PREVIEW_CLIENT_SECRET/);
  assert.doesNotMatch(preview, /PREVIEW_CLIENT_SECRET\\s*=\\s*["']/);
});

test("the custom rate-limit error is explicit 429", () => {
  assert.match(rateLimit, /readonly status = 429/);
});

test("concurrency and cancellation contracts cannot regress", () => {
  assert.match(
    sessionsFile,
    /export async function startMissionRunSession[\s\S]*select id, mission_id, run_id from blossom_mission_run_session/,
  );
  assert.match(
    sessionsFile,
    /export async function endMissionRunSession[\s\S]*set status = \$3,[\s\S]*\[sessionId, userId, status\]/,
  );
  assert.match(
    sessionsFile,
    /export async function endMissionRunSession[\s\S]*status in \('completed', 'cancelled'\)/,
  );
  assert.match(
    tandem,
    /export async function setTandemStatus[\s\S]*with mine as \([\s\S]*insert into blossom_tandem_connection[\s\S]*reciprocal as \(/,
  );
  assert.doesNotMatch(sync, /Promise\.race\(\[\s*applyMutation\(/);
  assert.doesNotMatch(sync, /SYNC_TIMEOUT_MS/);
});

test("mission reward requires a completed server run session", () => {
  const theatre = read("src/components/app/mission-theatre-experience.tsx");
  assert.match(
    theatre,
    /endMissionRunSessionOnServer[\s\S]*ended\.missionId !== todayMission\.id \|\| ended\.status !== "completed"/,
  );
  assert.match(theatre, /rewardSourceId = `mission-session-\${ended\.id}`;/);
});

test("late-unmount mission cleanup never completes a reward session", () => {
  const theatre = read("src/components/app/mission-theatre-experience.tsx");
  assert.match(
    theatre,
    /if \(!mountedRef\.current\)[\s\S]*endMissionRunSessionOnServer\(\{[\s\S]*status: "cancelled"/,
  );
});

test("Pulse and Tandem terminal session closures are idempotent and reward only completed sessions", () => {
  assert.match(
    sessionsFile,
    /export async function endPulseSession[\s\S]*status in \('completed', 'cancelled'\)/,
  );
  assert.match(
    tandem,
    /export async function endTandemSession[\s\S]*status in \('completed', 'cancelled'\)/,
  );
  const pulse = read("src/routes/_app/osez.pulse.tsx");
  assert.match(
    pulse,
    /endPulseSessionOnServer[\s\S]*closure\.status !== "completed"/,
  );
  const tandemPage = read("src/routes/_app/tandem.$id.tsx");
  assert.match(
    tandemPage,
    /endTandemSessionOnServer[\s\S]*closure\.status !== "completed"/,
  );
});