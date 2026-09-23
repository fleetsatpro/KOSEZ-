import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_PRONLAB_ATTEMPTS, LEARNER } from "./data.fixtures.ts";
import {
  buildObjectiveEvidence,
  buildReviewQueue,
  buildSkillProfile,
  curriculumUnitProgress,
  lessonDone,
  CURRICULUM_UNITS,
  nextLearningAction,
} from "./learning-os.ts";

test("review queue prioritises persistent pronunciation friction", () => {
  const queue = buildReviewQueue(INITIAL_PRONLAB_ATTEMPTS, []);
  assert.equal(queue[0]?.kind, "pronunciation");
  assert.equal(queue[0]?.priority, "haute");
});

test("skill profile distinguishes evidence coverage from unmeasured skills", () => {
  const profile = buildSkillProfile(
    [
      { id: "m1", type: "MISSION_COMPLETED", createdAt: "2026-09-22T10:00:00.000Z" },
      { id: "s1", type: "SPEAK_COMPLETED", createdAt: "2026-09-22T10:05:00.000Z" },
    ],
    INITIAL_PRONLAB_ATTEMPTS,
    [{ word: "recommend", gloss: "recommander" }],
  );
  assert.ok(profile.find((x) => x.domain.id === "interaction")!.coverage > 0);
  assert.equal(profile.find((x) => x.domain.id === "writing")!.evidenceCount, 0);
});

test("curriculum has a connected A1 → B1 spine", () => {
  assert.equal(CURRICULUM_UNITS.length, 13);
  assert.equal(CURRICULUM_UNITS.slice(0, 3).every((unit) => unit.level === "A1"), true);
  assert.equal(CURRICULUM_UNITS.slice(3, 9).every((unit) => unit.level === "A2"), true);
  assert.equal(CURRICULUM_UNITS.slice(9).every((unit) => unit.level === "B1"), true);
  assert.ok(CURRICULUM_UNITS.every((unit) => unit.lessons.length >= 4));
  assert.ok(CURRICULUM_UNITS.flatMap((unit) => unit.objectives).length >= 20);
  assert.equal(new Set(CURRICULUM_UNITS.map((unit) => unit.number)).size, 13);
  assert.ok(curriculumUnitProgress(CURRICULUM_UNITS[0]!, [], [], []) >= 0);
  assert.ok(LEARNER.goal.includes("Parler"));
});


test("curriculum includes direct practice labs", () => {
  const kinds = new Set(CURRICULUM_UNITS.flatMap((unit) => unit.lessons.map((lesson) => lesson.kind)));
  assert.ok(kinds.has("grammar"));
  assert.ok(kinds.has("listening"));
  assert.ok(kinds.has("writing"));
});


test("curriculum completion requires evidence from the linked resource", () => {
  const unit = CURRICULUM_UNITS.find((item) => item.id === "a2-real-life-basics")!;
  const missionLesson = unit.lessons.find((lesson) => lesson.id === "u1-l1")!;
  const log = [
    {
      id: "mission-1",
      type: "MISSION_COMPLETED" as const,
      sourceId: "mission-recommend",
      createdAt: "2026-09-22T10:00:00.000Z",
    },
  ];
  assert.ok(curriculumUnitProgress(unit, log, [], []) > 0);
  assert.equal(
    lessonDone(missionLesson, [
      {
        id: "fake-lesson",
        type: "LESSON_COMPLETED" as const,
        sourceId: missionLesson.id,
        createdAt: "2026-09-22T10:00:00.000Z",
      },
    ]),
    false,
  );
  assert.equal(missionLesson.kind, "mission");
});


test("every curriculum lesson id is unique and every unit gained deliberate depth", () => {
  const lessons = CURRICULUM_UNITS.flatMap((unit) => unit.lessons);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  assert.ok(lessons.length >= 47);
  assert.ok(CURRICULUM_UNITS.every((unit) => unit.lessons.length >= 4));
});

test("objective evidence distinguishes direct practice from supporting signals", () => {
  const evidence = buildObjectiveEvidence([
    {
      id: "m1",
      type: "MISSION_COMPLETED",
      sourceId: "mission-visitor",
      createdAt: "2026-09-22T10:00:00.000Z",
    },
    {
      id: "s1",
      type: "SPEAK_COMPLETED",
      sourceId: "speak-cafe-room-1",
      createdAt: "2026-09-22T11:00:00.000Z",
    },
    {
      id: "r1",
      type: "REVIEW_COMPLETED",
      sourceId: "review-vocabulary-u4-recall:2026-09-23",
      createdAt: "2026-09-23T09:00:00.000Z",
    },
  ]);
  const ask = evidence.find((item) => item.objective.id === "a2-interact-ask")!;
  assert.equal(ask.directCount, 2);
  assert.equal(ask.supportingCount, 1);
  assert.equal(ask.status, "en pratique");
});

test("blind-spot intelligence points at a matching practice family", () => {
  const next = nextLearningAction([], [], []);
  assert.ok(["mission", "labs", "library", "pronlab"].includes(next.kind));
});
