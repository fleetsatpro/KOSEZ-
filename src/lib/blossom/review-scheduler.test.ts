import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReviewPlan } from "./review-scheduler.ts";
import { setsForLanguage } from "./data.ts";
import type { LearningSubmission } from "./store.ts";

const iso = (daysAgo: number) => {
  const d = new Date("2026-09-22T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
};

function submission(
  id: string,
  taskId: string,
  createdAt: string,
  correct: boolean,
): LearningSubmission {
  return {
    id,
    taskId,
    kind: "review",
    content: correct ? "correct" : "again",
    checks: [correct ? "correct" : "again"],
    result: { correct },
    createdAt,
    updatedAt: createdAt,
  };
}

test("a failed review schedules the item one day later", () => {
  const first = submission("1", "vocab:recommend", iso(2), false);
  const plan = buildReviewPlan(
    [first],
    [],
    [{ word: "recommend", gloss: "recommander" }],
    "2026-09-22T12:00:00.000Z",
  );
  const item = plan.due.find((entry) => entry.sourceKey === "vocab:recommend");
  assert.ok(item);
  assert.equal(item.intervalDays, 1);
});

test("a consecutive correct review expands the interval", () => {
  const submissions = [
    submission("3", "vocab:recommend", iso(8), true),
    submission("2", "vocab:recommend", iso(4), true),
    submission("1", "vocab:recommend", iso(2), true),
  ];
  const plan = buildReviewPlan(
    submissions,
    [],
    [{ word: "recommend", gloss: "recommander" }],
    "2026-09-22T12:00:00.000Z",
  );
  const item = plan.upcoming.find((entry) => entry.sourceKey === "vocab:recommend");
  assert.ok(item);
  assert.equal(item.intervalDays, 7);
});

test("a failed review collapses the next interval to one day", () => {
  const submissions = [
    submission("2", "vocab:recommend", iso(5), true),
    submission("1", "vocab:recommend", iso(1), false),
  ];
  const plan = buildReviewPlan(
    submissions,
    [],
    [{ word: "recommend", gloss: "recommander" }],
    "2026-09-22T12:00:00.000Z",
  );
  const item = plan.due.find((entry) => entry.sourceKey === "vocab:recommend");
  assert.ok(item);
  assert.equal(item.intervalDays, 1);
});


test("review plan isolates Pron'Lab, vocabulary and review history by language", () => {
  const esItem = setsForLanguage("es").flatMap((set) => set.items)[0]!;
  const enItem = setsForLanguage("en").flatMap((set) => set.items)[0]!;
  const attempts = [
    {
      id: "es-attempt",
      itemId: esItem.id,
      score: 0,
      seconds: 4,
      tip: "",
      createdAt: "2026-09-20T10:00:00.000Z",
      metadata: {},
    },
    {
      id: "en-attempt",
      itemId: enItem.id,
      score: 0,
      seconds: 4,
      tip: "",
      createdAt: "2026-09-20T10:00:00.000Z",
      metadata: {},
    },
  ];
  const submissions: LearningSubmission[] = [
    {
      id: "es-review",
      taskId: `pron:${esItem.id}`,
      kind: "review",
      content: "again",
      checks: ["again"],
      result: { correct: false, languageId: "es" },
      createdAt: "2026-09-21T10:00:00.000Z",
      updatedAt: "2026-09-21T10:00:00.000Z",
    },
  ];
  const vocabulary = [
    { word: "hola", gloss: "bonjour", metadata: { languageId: "es" } },
    { word: "hello", gloss: "bonjour", metadata: { languageId: "en" } },
  ];

  const es = buildReviewPlan(submissions, attempts, vocabulary, "2026-09-22T12:00:00.000Z", "es");
  const en = buildReviewPlan(submissions, attempts, vocabulary, "2026-09-22T12:00:00.000Z", "en");

  assert.ok(es.due.some((item) => item.sourceKey === `pron:${esItem.id}`));
  assert.ok(!en.due.some((item) => item.sourceKey === `pron:${esItem.id}`));
  assert.ok(es.due.some((item) => item.sourceKey === "vocab:hola"));
  assert.ok(!en.due.some((item) => item.sourceKey === "vocab:hola"));
});


test("review intervals ignore another language history", () => {
  const base = new Date("2026-09-20T12:00:00.000Z").toISOString();
  const en = {
    id: "en-1",
    taskId: "vocab:bonjour",
    kind: "review" as const,
    content: "correct",
    checks: ["correct"],
    result: { correct: true, languageId: "en" },
    createdAt: base,
    updatedAt: base,
  };
  const fr = {
    id: "fr-1",
    taskId: "vocab:bonjour",
    kind: "review" as const,
    content: "again",
    checks: ["again"],
    result: { correct: false, languageId: "fr" },
    createdAt: new Date("2026-09-26T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-09-26T12:00:00.000Z").toISOString(),
  };
  const plan = buildReviewPlan(
    [en, fr],
    [],
    [{ word: "bonjour", gloss: "hello", metadata: { languageId: "fr" } }],
    new Date("2026-09-27T12:00:00.000Z").toISOString(),
    "fr",
  );
  const item = plan.due.find((entry) => entry.sourceKey === "vocab:bonjour");
  assert.ok(item);
  assert.equal(item?.lastReviewedAt, fr.createdAt);
});
