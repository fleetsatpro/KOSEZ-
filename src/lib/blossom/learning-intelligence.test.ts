import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLearningIntelligence } from "./learning-intelligence.ts";
import type { ReviewPlan } from "./review-scheduler.ts";
import type { LearningSubmission } from "./store.ts";

const plan = (overrides: Partial<ReviewPlan> = {}): ReviewPlan => ({
  due: [],
  upcoming: [],
  ...overrides,
});

const review = (correct: boolean): LearningSubmission => ({
  id: correct ? "r1" : "r0",
  taskId: "vocab:recommend",
  kind: "review",
  content: correct ? "correct" : "again",
  checks: [correct ? "correct" : "again"],
  result: { correct },
  createdAt: "2026-09-22T10:00:00.000Z",
  updatedAt: "2026-09-22T10:00:00.000Z",
});

test("intelligence prioritises an urgent scheduled review", () => {
  const result = buildLearningIntelligence(
    [],
    [],
    [],
    [],
    plan({
      due: [{
        id: "urgent",
        kind: "pronunciation",
        title: "think",
        prompt: "review",
        answer: "th",
        reason: "Friction persistante",
        priority: "haute",
        link: "pronlab",
        dueAt: "2026-09-22T10:00:00.000Z",
        intervalDays: 1,
        sourceKey: "pron:think",
        state: "due",
      }],
    }),
    "2026-09-22T12:00:00.000Z",
  );
  assert.equal(result.next.kind, "review");
  assert.equal(result.next.title, "think");
  assert.equal(result.highPriorityDue, 1);
});

test("intelligence asks for direct writing evidence when the branch is unmeasured", () => {
  const result = buildLearningIntelligence(
    [],
    [],
    [],
    [],
    plan(),
    "2026-09-22T12:00:00.000Z",
  );
  assert.equal(result.next.kind, "labs");
  assert.equal(result.next.eyebrow, "ANGLE MORT · ÉCRIT");
  assert.equal(result.domains.find((item) => item.domainId === "writing")?.signal, "unmeasured");
});

test("failed review contributes friction without fabricating proficiency", () => {
  const result = buildLearningIntelligence(
    [],
    [],
    [],
    [review(false)],
    plan(),
    "2026-09-22T12:00:00.000Z",
  );
  assert.equal(result.friction, 1);
  assert.equal(result.breadth, 33);
});
