import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { join } from "node:path";

const root = process.cwd();
const storePath = join(root, "src/lib/blossom/store.ts");
const bridgePath = join(root, "src/components/blossom-sync-bridge.tsx");
const syncServerPath = join(root, "src/lib/blossom/sync.server.ts");

let store = "";
let bridge = "";
let syncServer = "";

test.before(async () => {
  [store, bridge, syncServer] = await Promise.all([
    readFile(storePath, "utf8"),
    readFile(bridgePath, "utf8"),
    readFile(syncServerPath, "utf8"),
  ]);
});

test("P0 store wiring is durable for every previously local-only command", () => {
  for (const operation of [
    "event.register", "booking.request", "tandem.report",
    "learning.submission", "vocabulary.upsert", "challenge.complete", "waitlist.request",
  ]) {
    assert.ok(store.includes('operation: "' + operation + '"'), operation + " must be emitted by the store");
    assert.ok(syncServer.includes('case "' + operation + '"'), operation + " must be handled by the server");
  }
});

test("P0 identity reset clears the entire learner-scoped replica", () => {
  for (const field of [
    "learner: NEW_LEARNER", "joinedEventIds: []", "eventRegistrationCounts: {}",
    "enrolledIds: []", "bookingStatuses: {}", "pronlabAttempts: []",
    "tandemStatus: {}", "tandemReports: {}", "homework: []", "teacherNotes: []",
    "learningSubmissions: []", "vocabulary: []", "immersionDone: []", "childWords: []",
    "waitlistIds: []", "missionSessions: {}", "backendMissionRevisions: {}",
    "growthEvents: []", "leoLetters: []",
  ]) {
    assert.ok(store.includes(field), "identity reset must clear " + field);
  }
});

test("P0 activity deduplication is type + source aware", () => {
  assert.match(store, /hasSource\\(log, sourceId, type\\)/);
  assert.match(bridge, /\\$\\{event\\.type\\}:source:\\$\\{event\\.sourceId\\}/);
});

test("P0 PronLab semantics stay language-scoped and verified-only for mastery growth", () => {
  assert.match(store, /setsForLanguage\\(get\\(\\)\\.languageId\\)\\.flatMap/);
  assert.match(store, /before\\.verifiedMastered && after\\.verifiedMastered/);
});

test("P0 bridge preserves remote PronLab evidence metadata", () => {
  assert.match(bridge, /metadata: attempt\\.metadata/);
});
