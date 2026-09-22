import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_PRONLAB_ATTEMPTS, LEARNER } from "./data.fixtures.ts";
import { LEARNER as RUNTIME_DEFAULTS } from "./data.ts";
import { buildReviewQueue, buildSkillProfile, curriculumUnitProgress, CURRICULUM_UNITS } from "./learning-os.ts";

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

test("curriculum has a connected A2 spine", () => {
  assert.equal(CURRICULUM_UNITS.length, 6);
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
