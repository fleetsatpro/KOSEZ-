import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateFromTopicOffline,
  inferArchetypeFromTopic,
} from "./speak-llm.ts";

describe("speak-llm topic", () => {
  it("infers archetype from free topic", () => {
    assert.equal(inferArchetypeFromTopic("café vanille"), "cafe");
    assert.equal(inferArchetypeFromTopic("vol pour Paris"), "airport");
    assert.equal(inferArchetypeFromTopic("entretien d'embauche"), "office");
  });

  it("weaves topic into offline room", () => {
    const room = generateFromTopicOffline("commander des litchis", {
      level: "A2",
      entropy: "t1",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    assert.ok(
      room.title.toLowerCase().includes("litchis") ||
        room.protocol.some((p) => p.includes("litchis")),
    );
    assert.ok(room.turns.length >= 6);
  });
});
