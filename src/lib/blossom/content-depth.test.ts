import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOGUE,
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
