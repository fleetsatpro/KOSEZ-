import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const sync = read("src/lib/blossom/sync.server.ts");
const integrity = read("src/lib/blossom/activity-integrity.server.ts");
const bootstrap = read("src/lib/auth/admin-bootstrap.ts");
const gate = read("src/lib/auth/gate-session.server.ts");
const auth = read("src/lib/auth/server.ts");
const rateLimit = read("src/lib/blossom/rate-limit.server.ts");

test("activity mutations are enum-gated and pass through server integrity checks", () => {
  assert.match(sync, /eventType: z\.enum\(ACTIVITY_EVENT_TYPES\)/);
  assert.match(sync, /await assertActivityAppend\(/);
  assert.match(integrity, /activity-mastery-server-only/);
  assert.match(integrity, /activity-event-without-attendance/);
  assert.match(integrity, /activity-pronlab-without-attempt/);
  assert.match(integrity, /tandem-session-/);
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
});

test("the custom rate-limit error is explicit 429", () => {
  assert.match(rateLimit, /readonly status = 429/);
});
