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
      languageId: "es",
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
  const base: Omit<Parameters<typeof computeInfluence>[0], "languageId"> = {
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
  const strugglingBase: Omit<Parameters<typeof computeInfluence>[0], "languageId"> = {
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


test("causal influence ignores activity and growth from another learning language", () => {
  const now = new Date().toISOString();
  const foreign = computeInfluence({
    log: [{
      id: "en-1",
      type: "SPEAK_COMPLETED",
      createdAt: now,
      sourceId: "en-room",
      metadata: { languageId: "en" },
    }],
    attempts: [],
    allItems: [],
    growthEvents: [{
      id: "en-growth",
      at: now,
      kind: "flower",
      intensity: 1,
      label: "Croissance anglaise",
      mineral: "social",
      languageId: "en",
    }],
    phonemeLeaves: [],
    missionSessions: {},
    memory: neutralMemory,
    memoryOn: false,
    languageId: "es",
  });
  assert.equal(foreign.minerals.parole, 0);
  assert.equal(
    foreign.mission.reasons.some((reason) => reason.code === "recent-growth"),
    false,
  );
});


test("pending activity cannot create causal mineral pressure", () => {
  const now = new Date().toISOString();
  const result = computeInfluence({
    log: [{
      id: "pending-speak",
      type: "SPEAK_COMPLETED",
      createdAt: now,
      sourceId: "speak-pending",
      metadata: { languageId: "en", syncState: "pending" },
    }],
    attempts: [],
    allItems: [],
    growthEvents: [],
    phonemeLeaves: [],
    missionSessions: {},
    memory: neutralMemory,
    memoryOn: false,
    languageId: "en",
  });
  assert.equal(result.minerals.parole, 0);
  assert.equal(result.mission.reasons.some((reason) => reason.code === "balanced"), true);
});
