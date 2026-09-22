import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_LOG, INITIAL_PRONLAB_ATTEMPTS, LEARNER, TANDEM_PARTNERS, planAllows, setsForLanguage } from "./data.ts";
import {
  cafeMemoryHint,
  countByType,
  hasSource,
  journeySnapshot,
  personaliseMission,
  pointsFromLog,
  pronlabFlags,
  resolveMemory,
  stageFromPoints,
  summarisePronlabItem,
  tandemMatchScore,
} from "./engine.ts";

test("seeded log is Growing at 42 points with 8 missions and 1 speak", () => {
  const snap = journeySnapshot(INITIAL_LOG);
  assert.equal(pointsFromLog(INITIAL_LOG), 42);
  assert.equal(snap.stage.id, "growing");
  assert.equal(snap.points, 42);
  assert.equal(snap.remaining, 18);
  assert.equal(snap.missions.current, 8);
  assert.equal(snap.missions.required, 8);
  assert.equal(snap.speak.current, 1);
  assert.equal(snap.speak.required, 2);
  assert.equal(snap.pronlab.current, 0);
  assert.equal(snap.pronlab.required, 1);
});

test("stage thresholds", () => {
  assert.equal(stageFromPoints(0).id, "seed");
  assert.equal(stageFromPoints(15).id, "seed");
  assert.equal(stageFromPoints(16).id, "growing");
  assert.equal(stageFromPoints(59).id, "growing");
  assert.equal(stageFromPoints(60).id, "flourishing");
  assert.equal(stageFromPoints(100).id, "blossoming");
  assert.equal(stageFromPoints(150).id, "independent");
});

test("duplicate source detection", () => {
  assert.equal(hasSource(INITIAL_LOG, "m-hist-1"), true);
  assert.equal(hasSource(INITIAL_LOG, "mission-today"), false);
});

test("inactivity does not invent points", () => {
  assert.equal(countByType([], "MISSION_COMPLETED"), 0);
  assert.equal(pointsFromLog([]), 0);
});

test("pronlab mastery: three consecutive >= 75", () => {
  const attempts = [
    { id: "1", itemId: "x", score: 76, tip: "", createdAt: "", seconds: 2 },
    { id: "2", itemId: "x", score: 80, tip: "", createdAt: "", seconds: 2 },
    { id: "3", itemId: "x", score: 84, tip: "", createdAt: "", seconds: 2 },
  ];
  const sum = summarisePronlabItem("x", attempts);
  assert.equal(sum.mastered, true);
  assert.equal(sum.attemptCount, 3);
  assert.equal(sum.bestScore, 84);
});

test("pronlab mastery: best >= 90", () => {
  const attempts = [
    { id: "1", itemId: "x", score: 91, tip: "", createdAt: "", seconds: 2 },
  ];
  assert.equal(summarisePronlabItem("x", attempts).mastered, true);
});

test("pronlab flags: best < 60 after 2 attempts", () => {
  const flags = pronlabFlags(INITIAL_PRONLAB_ATTEMPTS, ["th-1", "pl-1"]);
  assert.equal(flags.length, 1);
  assert.equal(flags[0]?.itemId, "th-1");
  assert.equal(summarisePronlabItem("pl-1", INITIAL_PRONLAB_ATTEMPTS).struggling, false);
});

test("tandem matching ranks language direction and shared interests", () => {
  const me = {
    speaks: "Français",
    wants: "English",
    level: "A2",
    interests: LEARNER.interests,
    window: LEARNER.practiceWindow,
  };
  const noah = TANDEM_PARTNERS.find((p) => p.id === "noah")!;
  const maya = TANDEM_PARTNERS.find((p) => p.id === "maya")!;
  assert.ok(tandemMatchScore(me, noah) > tandemMatchScore(me, maya));
  assert.ok(tandemMatchScore(me, noah) >= 60);
});

test("homework and tandem feed the same point table", () => {
  assert.equal(
    pointsFromLog([
      {
        id: "t",
        type: "TANDEM_COMPLETED",
        createdAt: "",
        sourceId: "tandem-noah",
      },
    ]),
    10,
  );
  assert.equal(
    pointsFromLog([
      {
        id: "h",
        type: "HOMEWORK_COMPLETED",
        createdAt: "",
        sourceId: "hw-1",
      },
    ]),
    4,
  );
});

test("personaliseMission preserves the real mission and adds evidence when enabled", () => {
  const base = {
    title: "What do you recommend?",
    prompt: "Demandez.",
    context: "Deux minutes.",
  };
  const memory = {
    hesitation: "TH",
    avoided: "à reprendre à voix haute",
    confidence: "les compétences déjà observées",
    leoNote: "Note.",
  };
  const off = personaliseMission(base, memory, false);
  assert.deepEqual(off, { ...base, leo: null });
  const on = personaliseMission(base, memory, true);
  assert.equal(on.title, base.title);
  assert.equal(on.prompt, base.prompt);
  assert.ok(on.context.includes("TH"));
  assert.equal(on.leo, "Note.");
});

test("resolveMemory shifts after TH mastery", () => {
  const base = {
    hesitation: "Les TH",
    avoided: "I'll have",
    confidence: "Commander",
    leoNote: "Les TH bloquent encore.",
  };
  const cold = resolveMemory([], base);
  assert.equal(cold.hesitation, "Les TH");
  const hot = resolveMemory(
    [
      { id: "1", itemId: "th-1", score: 91, tip: "", createdAt: "", seconds: 2 },
      { id: "2", itemId: "th-2", score: 92, tip: "", createdAt: "", seconds: 2 },
      { id: "3", itemId: "th-3", score: 90, tip: "", createdAt: "", seconds: 2 },
    ],
    base,
  );
  assert.ok(hot.leoNote.includes("TH tiennent"));
});

test("cafeMemoryHint only rewrites the order turn", () => {
  assert.equal(
    cafeMemoryHint("Commandez une boisson.", "you", true),
    "Commandez avec « I'll have », pas « I want ».",
  );
  assert.equal(cafeMemoryHint("Hi!", "ai", true), "Hi!");
  assert.equal(
    cafeMemoryHint("Commandez une boisson.", "you", false),
    "Commandez une boisson.",
  );
});

test("planAllows: digital is core-only; premium and centre open tandem and memory", () => {
  assert.equal(planAllows("digital", "core"), true);
  assert.equal(planAllows("digital", "tandem"), false);
  assert.equal(planAllows("digital", "memory"), false);
  assert.equal(planAllows("digital", "library"), false);
  assert.equal(planAllows("premium", "tandem"), true);
  assert.equal(planAllows("centre", "immersionEarly"), true);
});

test("setsForLanguage keeps English as default and isolates LSF", () => {
  const en = setsForLanguage("en");
  const lsf = setsForLanguage("lsf");
  assert.ok(en.length >= 3);
  assert.ok(en.every((s) => (s.language ?? "en") === "en"));
  assert.ok(lsf.every((s) => s.language === "lsf"));
});
