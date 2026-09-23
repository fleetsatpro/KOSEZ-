import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOGUE,
  EVENT_DETAILS,
  EVENTS,
  IMMERSION,
  LIBRARY,
  MISSION_BANK,
  PRONLAB_SETS,
  TANDEM_PROMPTS,
} from "./data.ts";
import {
  CAN_DO_OBJECTIVES,
  CURRICULUM_UNITS,
  curriculumResource,
} from "./learning-os.ts";
import {
  GRAMMAR_TASKS,
  LISTENING_TASKS,
  WRITING_PROMPTS,
} from "./lab-content.ts";

test("product depth floor remains above demo-scale content", () => {
  assert.ok(MISSION_BANK.length >= 10, "mission bank regressed below 10");
  assert.ok(LIBRARY.length >= 12, "library regressed below 12");
  assert.ok(PRONLAB_SETS.length >= 10, "Pron'Lab sets regressed below 10");
  assert.ok(EVENTS.length >= 9, "event catalogue regressed below 9");
  assert.ok(CATALOGUE.length >= 8, "programme catalogue regressed below 8");
  assert.ok(IMMERSION.challenges.length >= 4, "immersion challenges regressed below 4");
  assert.ok(TANDEM_PROMPTS.english.length >= 10, "English tandem prompts regressed below 10");
  assert.ok(TANDEM_PROMPTS.french.length >= 10, "French tandem prompts regressed below 10");
  assert.ok(GRAMMAR_TASKS.length >= 15, "grammar lab regressed below 15 tasks");
  assert.ok(LISTENING_TASKS.length >= 15, "listening lab regressed below 15 tasks");
  assert.ok(WRITING_PROMPTS.length >= 10, "writing lab regressed below 10 prompts");
  assert.ok(CURRICULUM_UNITS.length >= 10, "curriculum regressed below 10 units");
  assert.ok(
    CURRICULUM_UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0) >= 35,
    "curriculum regressed below 35 linked practices",
  );
  assert.ok(CAN_DO_OBJECTIVES.length >= 20, "Can-Do objective bank regressed below 20 objectives");
});

test("every published event has a real preparation brief", () => {
  for (const event of EVENTS) {
    const detail = EVENT_DETAILS[event.id];
    assert.ok(detail, event.id + " has no event detail brief");
    assert.ok(detail.purpose.length >= 40, event.id + " purpose is too thin");
    assert.ok(detail.flow.length >= 3, event.id + " flow is too thin");
    assert.ok(detail.prepare.length >= 1, event.id + " preparation is missing");
    assert.ok(detail.languageMove.length >= 10, event.id + " language move is missing");
  }
});

test("deep content ids are unique across their primary collections", () => {
  for (const [label, values] of [
    ["missions", MISSION_BANK],
    ["library", LIBRARY],
    ["events", EVENTS],
    ["catalogue", CATALOGUE],
    ["pronlab", PRONLAB_SETS],
    ["grammar", GRAMMAR_TASKS],
    ["listening", LISTENING_TASKS],
    ["writing", WRITING_PROMPTS],
  ] as const) {
    const ids = values.map((value) => value.id);
    assert.equal(new Set(ids).size, ids.length, label + " contains duplicate ids");
  }
});


test("every curriculum lesson points to a real underlying resource", () => {
  const missions = new Set(MISSION_BANK.map((item) => item.id));
  const libraries = new Set(LIBRARY.map((item) => item.id));
  const pronlab = new Set(PRONLAB_SETS.map((item) => item.id));
  const grammar = new Set(GRAMMAR_TASKS.map((item) => item.id));
  const listening = new Set(LISTENING_TASKS.map((item) => item.id));
  const writing = new Set(WRITING_PROMPTS.map((item) => item.id));

  for (const unit of CURRICULUM_UNITS) {
    for (const lesson of unit.lessons) {
      const resource = curriculumResource(lesson);
      if (resource.kind === "mission") assert.ok(missions.has(resource.id), lesson.id + " points to missing mission " + resource.id);
      if (resource.kind === "library") assert.ok(libraries.has(resource.id), lesson.id + " points to missing library item " + resource.id);
      if (resource.kind === "pronlab") assert.ok(pronlab.has(resource.id), lesson.id + " points to missing Pron'Lab set " + resource.id);
      if (resource.kind === "grammar") assert.ok(grammar.has(resource.id), lesson.id + " points to missing grammar task " + resource.id);
      if (resource.kind === "listening") assert.ok(listening.has(resource.id), lesson.id + " points to missing listening task " + resource.id);
      if (resource.kind === "writing") assert.ok(writing.has(resource.id), lesson.id + " points to missing writing prompt " + resource.id);
    }
  }
});
