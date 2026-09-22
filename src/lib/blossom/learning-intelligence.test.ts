import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLearningIntelligence, buildWeeklyLearningBrief } from "./learning-intelligence.ts";
import { CURRICULUM_UNITS } from "./learning-os.ts";
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


test("weekly brief counts dated evidence and keeps review accuracy explicit", () => {
  const brief = buildWeeklyLearningBrief(
    [
      { id: "m1", type: "MISSION_COMPLETED", createdAt: "2026-09-20T10:00:00.000Z" },
      { id: "g1", type: "GRAMMAR_COMPLETED", createdAt: "2026-09-21T10:00:00.000Z" },
    ],
    [],
    [],
    [
      {
        id: "r1",
        taskId: "vocab:hello",
        kind: "review",
        content: "correct",
        checks: ["correct"],
        result: { correct: true },
        createdAt: "2026-09-21T11:00:00.000Z",
        updatedAt: "2026-09-21T11:00:00.000Z",
      },
      {
        id: "r2",
        taskId: "vocab:world",
        kind: "review",
        content: "again",
        checks: ["again"],
        result: { correct: false },
        createdAt: "2026-09-21T12:00:00.000Z",
        updatedAt: "2026-09-21T12:00:00.000Z",
      },
    ],
    "2026-09-22T12:00:00.000Z",
  );
  assert.equal(brief.activeDays, 3);
  assert.equal(brief.reviewsAttempted, 2);
  assert.equal(brief.reviewAccuracy, 50);
  assert.equal(brief.directEvidenceCount >= 3, true);
});


test("curriculum acknowledgements follow the lesson objectives and stay non-direct", () => {
  const lesson = CURRICULUM_UNITS[1]!.lessons.find((item) => item.id === "u2-l4")!;
  const result = buildLearningIntelligence(
    [{
      id: "lesson",
      type: "LESSON_COMPLETED",
      sourceId: lesson.id,
      createdAt: "2026-09-22T10:00:00.000Z",
    }],
    [],
    [],
    [],
    plan(),
    "2026-09-22T12:00:00.000Z",
  );
  assert.ok((result.domains.find((item) => item.domainId === "grammar")?.evidenceCount ?? 0) > 0);
  assert.equal(result.domains.find((item) => item.domainId === "grammar")?.directEvidenceCount, 0);
  assert.equal(result.domains.find((item) => item.domainId === "speaking")?.evidenceCount, 0);
});
