import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateLivingRoom,
  generateRoomCatalog,
  reshuffleRoom,
} from "./speak-engine.ts";

describe("speak-engine swarm", () => {
  it("generates a living room with turns, cast, and protocol", () => {
    const room = generateLivingRoom({
      archetype: "cafe",
      level: "A2",
      firstName: "Camille",
      entropy: "test-1",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    assert.ok(room.id.startsWith("room-"));
    assert.ok(room.turns.length >= 6);
    assert.ok(room.cast.name.length > 0);
    assert.ok(room.protocol.length >= 3);
    assert.ok(room.kit.length >= 3);
    assert.equal(room.level, "A2");
    const speakers = new Set(room.turns.map((t) => t.speaker));
    assert.ok(speakers.has("ai") && speakers.has("you"));
  });

  it("is deterministic for the same seed inputs", () => {
    const a = generateLivingRoom({
      archetype: "market",
      entropy: "same",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    const b = generateLivingRoom({
      archetype: "market",
      entropy: "same",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    assert.equal(a.seed, b.seed);
    assert.equal(a.title, b.title);
    assert.equal(a.turns.length, b.turns.length);
    assert.equal(a.turns[0]?.line, b.turns[0]?.line);
  });

  it("changes when entropy changes", () => {
    const a = generateLivingRoom({
      archetype: "airport",
      entropy: "a",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    const b = generateLivingRoom({
      archetype: "airport",
      entropy: "b",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    assert.notEqual(a.seed, b.seed);
  });

  it("catalog returns one room per archetype", () => {
    const catalog = generateRoomCatalog({
      entropy: "catalog-test",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    assert.ok(catalog.length >= 8);
    const arch = new Set(catalog.map((r) => r.place.archetype));
    assert.ok(arch.has("cafe"));
    assert.ok(arch.has("market"));
  });

  it("reshuffle produces a new seed", () => {
    const a = generateLivingRoom({
      archetype: "coast",
      entropy: "r0",
      now: new Date("2026-09-22T12:00:00Z"),
    });
    const b = reshuffleRoom(a, {
      level: "A2",
      entropy: "force",
    });
    assert.notEqual(a.seed, b.seed);
    assert.equal(b.place.archetype, "coast");
  });
});
