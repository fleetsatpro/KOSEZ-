import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReviewPlan } from "./review-scheduler.ts";
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
