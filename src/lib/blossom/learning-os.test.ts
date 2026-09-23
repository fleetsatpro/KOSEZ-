import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_PRONLAB_ATTEMPTS, LEARNER } from "./data.fixtures.ts";
import {
  buildObjectiveEvidence,
  buildReviewQueue,
  CURRICULUM_RESOURCE_MAP,
  buildSkillProfile,
  curriculumUnitProgress,
  lessonDone,
  CURRICULUM_UNITS,
  nextLearningAction,
} from "./learning-os.ts";
import { LIBRARY, MISSION_BANK, PRONLAB_SETS } from "./data.ts";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS } from "./lab-content.ts";

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


test("every curriculum lesson resolves to a real learning resource", () => {
  const lessons = CURRICULUM_UNITS.flatMap((unit) => unit.lessons);
  assert.equal(Object.keys(CURRICULUM_RESOURCE_MAP).length, lessons.length);
  for (const lesson of lessons) {
    const resource = CURRICULUM_RESOURCE_MAP[lesson.id];
    assert.ok(resource, `missing resource for ${lesson.id}`);
    if (!resource) continue;
    if (resource.kind === "mission") {
      assert.ok(MISSION_BANK.some((item) => item.id === resource.id), `missing mission ${resource.id}`);
    } else if (resource.kind === "library") {
      assert.ok(LIBRARY.some((item) => item.id === resource.id), `missing library ${resource.id}`);
    } else if (resource.kind === "pronlab") {
      assert.ok(PRONLAB_SETS.some((set) => set.id === resource.id), `missing Pron'Lab set ${resource.id}`);
    } else if (resource.kind === "grammar") {
      assert.ok(GRAMMAR_TASKS.some((item) => item.id === resource.id), `missing grammar task ${resource.id}`);
    } else if (resource.kind === "listening") {
      assert.ok(LISTENING_TASKS.some((item) => item.id === resource.id), `missing listening task ${resource.id}`);
    } else if (resource.kind === "writing") {
      assert.ok(WRITING_PROMPTS.some((item) => item.id === resource.id), `missing writing prompt ${resource.id}`);
    }
  }
});


test("objective mastery needs repeated direct evidence across distinct contexts", () => {
  const base = (sourceId: string, id: string) => ({
    id,
    type: "SPEAK_COMPLETED" as const,
    sourceId,
    createdAt: "2026-09-22T10:00:00.000Z",
  });
  const same = buildObjectiveEvidence([
    base("speak-cafe-room-1", "s1"),
    base("speak-cafe-room-1", "s2"),
    base("speak-cafe-room-1", "s3"),
  ]).find((item) => item.objective.id === "a2-interact-ask")!;
  assert.equal(same.directCount, 3);
  assert.equal(same.directSourceCount, 1);
  assert.equal(same.status, "en pratique");

  const varied = buildObjectiveEvidence([
    base("speak-cafe-room-1", "s4"),
    base("speak-market-room-2", "s5"),
    base("speak-office-room-3", "s6"),
  ]).find((item) => item.objective.id === "a2-interact-ask")!;
  assert.equal(varied.directSourceCount, 3);
  assert.equal(varied.status, "ancré");
});


test("curriculum mission resources are unique so completion traces cannot collide", () => {
  const missionIds = CURRICULUM_UNITS.flatMap((unit) =>
    unit.lessons
      .map((lesson) => CURRICULUM_RESOURCE_MAP[lesson.id])
      .filter((resource): resource is { kind: "mission"; id: string } => resource?.kind === "mission")
      .map((resource) => resource.id),
  );
  assert.equal(new Set(missionIds).size, missionIds.length);
});


test("curriculum-linked evidence cannot inflate unrelated objectives", () => {
  const linked = buildObjectiveEvidence([
    {
      id: "linked-grammar",
      type: "GRAMMAR_COMPLETED",
      sourceId: "lab:grammar:grammar-question-1:2026-09-23",
      createdAt: "2026-09-23T10:00:00.000Z",
      metadata: { curriculumLessonId: "u2-l4" },
    },
  ]);
  const grammar = linked.find((item) => item.objective.id === "a2-grammar-question")!;
  const preference = linked.find((item) => item.objective.id === "a2-speak-preference")!;
  assert.equal(grammar.directCount, 1);
  assert.equal(grammar.status, "en pratique");
  assert.equal(preference.directCount, 0);
  assert.equal(preference.supportingCount, 0);
});
