import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_PRONLAB_ATTEMPTS, LEARNER } from "./data.fixtures.ts";
import { buildReviewQueue, buildSkillProfile, curriculumUnitProgress, CURRICULUM_UNITS, lessonDone } from "./learning-os.ts";

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

test("curriculum has a connected A2 → B1 spine", () => {
  assert.equal(CURRICULUM_UNITS.length, 10);
  assert.ok(CURRICULUM_UNITS.slice(0, 6).every((unit) => unit.level === "A2"));
  assert.ok(CURRICULUM_UNITS.slice(6).every((unit) => unit.level === "B1"));
  assert.ok(CURRICULUM_UNITS.every((unit) => unit.lessons.length >= 3));
  assert.ok(CURRICULUM_UNITS.flatMap((unit) => unit.objectives).length >= 12);
  assert.ok(curriculumUnitProgress(CURRICULUM_UNITS[0]!, [], [], []) >= 0);
  assert.ok(LEARNER.goal.includes("Parler"));
});


test("curriculum includes direct practice labs", () => {
  const kinds = new Set(CURRICULUM_UNITS.flatMap((unit) => unit.lessons.map((lesson) => lesson.kind)));
  assert.ok(kinds.has("grammar"));
  assert.ok(kinds.has("listening"));
  assert.ok(kinds.has("writing"));
});


test("curriculum completion is explicit and unit-specific", () => {
  const unit = CURRICULUM_UNITS[0]!;
  const log = [
    { id: "evidence-1", type: "CURRICULUM_EVIDENCE_RECORDED" as const, sourceId: unit.lessons[0]!.id, createdAt: "2026-09-22T10:00:00.000Z" },
  ];
  assert.equal(lessonDone(unit.lessons[0]!, log), true);
  assert.equal(lessonDone(unit.lessons[1]!, log), false);
  assert.ok(curriculumUnitProgress(unit, log, [], []) > 0);
  assert.equal(
    lessonDone(unit.lessons[0]!, [
      { id: "self-report", type: "LESSON_COMPLETED" as const, sourceId: unit.lessons[0]!.id, createdAt: "2026-09-22T10:00:00.000Z" },
    ]),
    false,
  );
  assert.ok(curriculumUnitProgress(CURRICULUM_UNITS[6]!, log, [], []) < 50);
});
