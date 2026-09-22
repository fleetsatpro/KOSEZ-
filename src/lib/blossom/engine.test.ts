import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_LOG, INITIAL_PRONLAB_ATTEMPTS, LEARNER, planAllows, setsForLanguage } from "./data.fixtures.ts";
import { planAllows, setsForLanguage } from "./data.ts";
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
  const noah = {
    id: "noah",
    name: "Noah",
    city: "Saint-Pierre",
    speaks: "English",
    speaksLevel: "C1",
    wants: "Français",
    wantsLevel: "A2",
    interests: ["Cuisine", "Océan"],
    window: "12:00 – 13:00",
    goal: "Parler français à table.",
    initials: "N",
    avatar: null,
  };
  const maya = {
    id: "maya",
    name: "Maya",
    city: "Saint-Denis",
    speaks: "English",
    speaksLevel: "B2",
    wants: "Français",
    wantsLevel: "A2",
    interests: ["Voyage"],
    window: "09:00 – 10:00",
    goal: "Tenir une conversation.",
    initials: "M",
    avatar: null,
  };
  assert.ok(tandemMatchScore(me, noah) >= 60);
  assert.ok(tandemMatchScore(me, noah) > tandemMatchScore(me, maya));
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

test("resolveMemory ignores untrusted captures and derives from trusted evidence", () => {
  const base = {
    hesitation: "Aucun point de friction confirmé",
    avoided: "Aucune structure évitée confirmée",
    confidence: "Aucune compétence encore assez documentée",
    leoNote: "Memoire neutre.",
  };
  assert.deepEqual(resolveMemory([], base), base);
  assert.deepEqual(
    resolveMemory([
      {
        id: "capture",
        itemId: "th-1",
        score: 99,
        tip: "",
        createdAt: "",
        seconds: 2,
        metadata: { assessment: "capture-only" },
      },
    ], base),
    base,
  );
  const observed = resolveMemory([
    {
      id: "real-1",
      itemId: "th-1",
      score: 58,
      tip: "",
      createdAt: "",
      seconds: 2,
      metadata: { assessment: "phonetic-provider" },
    },
    {
      id: "real-2",
      itemId: "th-2",
      score: 88,
      tip: "",
      createdAt: "",
      seconds: 2,
      metadata: { assessment: "phonetic-provider" },
    },
  ], base);
  assert.ok(observed.hesitation.includes("th-1"));
  assert.ok(observed.confidence.includes("th-2"));
  assert.ok(observed.leoNote.includes("consolider"));
});
test("cafeMemoryHint preserves the authored turn guidance", () => {
  assert.equal(cafeMemoryHint("Commandez une boisson.", "you", true), "Commandez une boisson.");
  assert.equal(cafeMemoryHint("Hi!", "ai", true), "Hi!");
  assert.equal(cafeMemoryHint("Choisissez une boisson.", "you", false), "Choisissez une boisson.");
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
