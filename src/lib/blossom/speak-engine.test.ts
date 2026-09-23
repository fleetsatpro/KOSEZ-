import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adaptLivingRoomAfterTranscript,
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


it("gives B1 rooms a genuine stretch beat", () => {
  const room = generateLivingRoom({
    archetype: "office",
    level: "B1",
    entropy: "b1-stretch",
    now: new Date("2026-09-22T12:00:00Z"),
  });
  const goals = room.turns.map((turn) => turn.goal);
  assert.ok(
    goals.some((goal) =>
      /Comparer|Nuancer|Résoudre/.test(goal),
    ),
  );
  assert.ok(room.turns.some((turn) => Boolean(turn.stretch)));
});


it("changes the next AI turn when a real transcript supplies a response signal", () => {
  const room = generateLivingRoom({
    archetype: "office",
    level: "B1",
    entropy: "response-aware",
    now: new Date("2026-09-22T12:00:00Z"),
  });
  const nextAi = room.turns.find((turn) => turn.speaker === "ai" && turn.line)?.line;
  const adapted = adaptLivingRoomAfterTranscript(
    room,
    3,
    "I would prefer the later option because I have a meeting first.",
  );
  const adaptedAi = adapted.turns.find((turn) => turn.speaker === "ai" && turn.line)?.line;
  assert.ok(nextAi);
  assert.ok(adaptedAi);
  assert.notEqual(adaptedAi, nextAi);
});

it("does not branch without usable transcript evidence", () => {
  const room = generateLivingRoom({
    archetype: "cafe",
    level: "A2",
    entropy: "response-empty",
    now: new Date("2026-09-22T12:00:00Z"),
  });
  assert.deepEqual(adaptLivingRoomAfterTranscript(room, 1, ""), room);
  assert.deepEqual(adaptLivingRoomAfterTranscript(room, 1, "ok"), room);
});
