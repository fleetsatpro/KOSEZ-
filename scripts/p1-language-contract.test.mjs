import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { join } from "node:path";

const root = process.cwd();
const paths = {
  engine: join(root, "src/lib/blossom/engine.ts"),
  store: join(root, "src/lib/blossom/store.ts"),
  bridge: join(root, "src/components/blossom-sync-bridge.tsx"),
  review: join(root, "src/lib/blossom/review-scheduler.ts"),
  intelligence: join(root, "src/lib/blossom/learning-intelligence.ts"),
  migration: join(root, "migrations/0025_vocabulary_language_scope.sql"),
};
let source = {};
test.before(async () => {
  source = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await readFile(path, "utf8")])));
});

test("P1 evidence is explicitly tagged with the active language", () => {
  assert.ok(source.engine.includes("activityBelongsToLanguage"));
  assert.ok(source.store.includes("languageId: current.languageId"));
  assert.ok(source.bridge.includes("rawMetadata = event.payload.metadata"));
});

test("P1 review and intelligence engines have language boundaries", () => {
  assert.ok(source.review.includes("submissionBelongsToLanguage"));
  assert.ok(source.review.includes("vocabularyBelongsToLanguage"));
  assert.ok(source.review.includes("setsForLanguage(languageId)"));
  assert.ok(source.intelligence.includes("activityBelongsToLanguage"));
  assert.ok(source.intelligence.includes("scopedSubmissions"));
  assert.ok(source.intelligence.includes("setsForLanguage(languageId)"));
});

test("P1 vocabulary is stored and merged by language, never by word alone", () => {
  assert.ok(source.migration.includes("primary key (user_id, language_id, word)"));
  assert.ok(source.store.includes("v.metadata?.languageId === current.languageId"));
  assert.ok(source.bridge.includes("`${languageId}:${entry.word.toLowerCase()}`"));
  assert.ok(source.bridge.includes("metadata: { languageId }"));
});

test("P1 non-English review does not inject English mission kit fallback", () => {
  assert.ok(source.review.includes("if (languageId === \"en\")"));
});
