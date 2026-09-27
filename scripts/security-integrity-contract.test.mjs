import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const sync = read("src/lib/blossom/sync.server.ts");
const integrity = read("src/lib/blossom/activity-integrity.server.ts");
const bootstrap = read("src/lib/auth/admin-bootstrap.ts");
const gate = read("src/lib/auth/gate-session.server.ts");
const auth = read("src/lib/auth/server.ts");
const rateLimit = read("src/lib/blossom/rate-limit.server.ts");
const preview = read("src/lib/auth/preview.ts");
const api = read("src/lib/blossom/api.ts");
const speakServer = read("src/lib/blossom/speak-server.server.ts");
const pwa = read("server/middleware/grok-pwa.ts");

test("activity mutations are enum-gated and pass through server integrity checks", () => {
  assert.match(sync, /eventType: z\.enum\(ACTIVITY_EVENT_TYPES\)/);
  assert.match(sync, /await assertActivityAppend\(/);
  assert.match(integrity, /activity-mastery-server-only/);
  assert.match(integrity, /activity-event-without-attendance/);
  assert.match(integrity, /activity-pronlab-without-attempt/);
  assert.match(integrity, /tandem-session-/);
  assert.match(integrity, /activity-language-mismatch/);
  assert.match(sync, /activeLanguageId/);
  assert.match(sync, /targetLanguage: z\.enum/);
  assert.match(sync, /mission-completion-without-prior-session/);
  assert.match(sync, /assertMissionSessionMutation/);
  assert.match(api, /z\.enum\(ACTIVITY_EVENT_TYPES\)/);
  assert.match(api, /await assertActivityAppend\(/);
  assert.match(api, /await assertMissionSessionMutation\(/);
  assert.match(integrity, /activity-library-unknown-source/);
  assert.match(integrity, /activity-pulse-unknown-source/);
  assert.match(integrity, /activity-review-invalid-source/);
  assert.match(integrity, /activity-legacy-reward-server-only/);
  assert.match(integrity, /mission-completion-adds-unrelated-run/);
  assert.match(speakServer, /speak\.room/);
  assert.doesNotMatch(speakServer, /userWindows/);
  assert.doesNotMatch(speakServer, /function assertRateLimit\(userId: string\)/);
  assert.match(pwa, /withSecurityHeaders\(result, event\)/);
});

test("authenticated abuse surfaces use the distributed Postgres limiter", () => {
  assert.match(sync, /enforceRateLimit\(userId, "sync\.batch"/);
  assert.match(rateLimit, /on conflict \(user_id, bucket_key\) do update/);
  assert.match(rateLimit, /hit_count < \$4/);
  assert.match(read("src/lib/blossom/messaging.server.ts"), /communication\.send/);
  assert.match(read("src/lib/blossom/messaging.server.ts"), /communication\.report/);
  assert.match(read("src/lib/blossom/safety.server.ts"), /safety\.tandem-report/);
  assert.match(read("src/lib/blossom/speech-server.server.ts"), /speech\.transcribe/);
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
