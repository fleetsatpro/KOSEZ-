import assert from "node:assert/strict";
import { test } from "node:test";
import { computeInfluence } from "./influence.ts";

const neutralMemory = {
  hesitation: "Aucun point confirmé",
  avoided: "Aucun",
  confidence: "Aucune",
  leoNote: "Neutre",
};

test("recent growth creates an explicit transfer consequence", () => {
  const influence = computeInfluence({
    log: [],
    attempts: [],
    allItems: [],
    growthEvents: [{
      id: "g1",
      at: new Date().toISOString(),
      kind: "flower",
      intensity: 1,
      label: "Croissance récente",
      mineral: "social",
    }],
    phonemeLeaves: [],
    missionSessions: {},
    memory: neutralMemory,
    memoryOn: false,
    languageId: "es",
  });
  assert.equal(
    influence.mission.reasons.some((reason) => reason.code === "recent-growth"),
    true,
  );
  assert.match(influence.mission.stretchOverride ?? "", /Transférez/);
});

test("tandem struggle prompt follows the selected learning language", () => {
  const base = {
    log: [],
    attempts: [{
      id: "a1",
      itemId: "x",
      score: 40,
      tip: "",
      createdAt: new Date().toISOString(),
      seconds: 2,
      metadata: { assessment: "phonetic-provider" as const },
    }],
    allItems: [{
      id: "x",
      phrase: "pan",
      hint: "",
      ipa: "/x/",
      kind: "word",
      focus: "x",
      level: "A2",
      strength: "",
      tip: "",
      model: "pan",
      problemSegment: "x",
    }],
    growthEvents: [],
    phonemeLeaves: [],
    missionSessions: {},
    memory: neutralMemory,
    memoryOn: false,
  };
  const strugglingBase = {
    ...base,
    attempts: [
      {
        ...base.attempts[0],
        score: 20,
        createdAt: new Date(Date.now() - 1000).toISOString(),
      },
      {
        ...base.attempts[0],
        id: "a2",
        score: 30,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  const es = computeInfluence({ ...strugglingBase, languageId: "es" });
  const fr = computeInfluence({ ...strugglingBase, languageId: "fr" });
  assert.match(es.tandem.openPrompt ?? "", /¿Puedes/);
  assert.match(fr.tandem.openPrompt ?? "", /Tu peux/);
});
