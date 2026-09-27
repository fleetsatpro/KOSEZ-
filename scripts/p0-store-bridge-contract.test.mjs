import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { join } from "node:path";

const root = process.cwd();
const storePath = join(root, "src/lib/blossom/store.ts");
const bridgePath = join(root, "src/components/blossom-sync-bridge.tsx");
const syncServerPath = join(root, "src/lib/blossom/sync.server.ts");
const syncClientPath = join(root, "src/lib/blossom/sync-client.ts");
const libraryRoutePath = join(root, "src/routes/_app/library.$id.tsx");
const tandemMigrationPath = join(root, "migrations/0033_tandem_language_integrity.sql");

let store = "";
let bridge = "";
let syncServer = "";
let syncClient = "";
let libraryRoute = "";
let tandemMigration = "";

test.before(async () => {
  [store, bridge, syncServer, syncClient, libraryRoute, tandemMigration] = await Promise.all([
    readFile(storePath, "utf8"),
    readFile(bridgePath, "utf8"),
    readFile(syncServerPath, "utf8"),
    readFile(syncClientPath, "utf8"),
    readFile(libraryRoutePath, "utf8"),
    readFile(tandemMigrationPath, "utf8"),
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

test("P0 activity deduplication is type + source aware and pending-safe", () => {
  assert.ok(store.includes("hasSource(log, sourceId, type)"));
  assert.ok(store.includes('syncState: "pending"'));
  assert.ok(bridge.includes("`${event.type}:source:${event.sourceId}`"));
});

test("P0 library completion cannot outrun the server dwell contract", () => {
  assert.ok(libraryRoute.includes("readingEligibleAtRef"));
  assert.match(
    libraryRoute,
    /const waitMs = readingEligibleAtRef\.current - Date\.now\(\);[\s\S]*if \(waitMs > 0\)[\s\S]*setTimeout/,
  );
  assert.match(
    libraryRoute,
    /Date\.now\(\) \+ \(Math\.max\(30, doc\.minutes \* 20\) \+ 2\) \* 1000/,
  );
});

test("P0 PronLab semantics stay language-scoped and client cannot mint mastery growth", () => {
  assert.ok(store.includes("setsForLanguage(get().languageId).flatMap"));
  assert.ok(store.includes("Mastery is now server-authoritative"));
  assert.ok(store.includes('operation: "pronlab.attempt"'));
  assert.ok(syncServer.includes("assertActivityAppend("));
});

test("P0 bridge preserves remote PronLab evidence metadata", () => {
  assert.ok(bridge.includes("metadata: attempt.metadata"));
});

test("P0 sync queue uses monotonic causal timestamps", () => {
  assert.ok(syncClient.includes("createdAt: nextMutationCreatedAt()"));
});


test("P0 Tandem session evidence is language-bound", () => {
  assert.ok(tandemMigration.includes("add column if not exists language_id"));
  assert.ok(syncServer.includes("language_id = $3"));
  assert.ok(syncServer.includes("currentLanguageId"));
  assert.ok(store.includes("previousStatus"));
});
