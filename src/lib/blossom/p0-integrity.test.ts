import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasSource,
  journeySnapshot,
  stageFromLog,
  stageFromPoints,
  type ActivityEvent,
} from "./engine.ts";
import { computeMinerals, courageDaysFromLog } from "./organism.ts";

describe("P0 identity of activity events", () => {
  it("hasSource is type-aware so MISSION and CURRICULUM can share sourceId", () => {
    const log: ActivityEvent[] = [
      {
        id: "1",
        type: "MISSION_COMPLETED",
        createdAt: "2026-01-01T00:00:00.000Z",
        sourceId: "shared-x",
      },
      {
        id: "2",
        type: "CURRICULUM_EVIDENCE_RECORDED",
        createdAt: "2026-01-01T00:01:00.000Z",
        sourceId: "shared-x",
      },
    ];
    assert.equal(hasSource(log, "shared-x", "MISSION_COMPLETED"), true);
    assert.equal(hasSource(log, "shared-x", "CURRICULUM_EVIDENCE_RECORDED"), true);
    assert.equal(hasSource(log, "shared-x", "SPEAK_COMPLETED"), false);
    assert.equal(hasSource(log, "shared-x"), true);
  });
});

describe("P0 stage gates", () => {
  it("stageFromLog does not advance past seed without mission requirements", () => {
    const log: ActivityEvent[] = Array.from({ length: 20 }, (_, i) => ({
      id: `lib-${i}`,
      type: "LIBRARY_COMPLETED" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      sourceId: `lib-${i}`,
    }));
    const byPoints = stageFromPoints(
      log.reduce((s) => s + 2, 0),
    );
    assert.equal(byPoints.id, "growing");
    assert.equal(stageFromLog(log).id, "seed");
  });

  it("journeySnapshot exposes stage clamped by requirements", () => {
    const log: ActivityEvent[] = [
      {
        id: "m1",
        type: "MISSION_COMPLETED",
        createdAt: "2026-01-01T00:00:00.000Z",
        sourceId: "m1",
      },
      {
        id: "m2",
        type: "MISSION_COMPLETED",
        createdAt: "2026-01-01T00:00:00.000Z",
        sourceId: "m2",
      },
    ];
    const snap = journeySnapshot(log);
    assert.equal(snap.stage.id, "seed");
    assert.equal(snap.missions.current, 2);
  });
});

describe("P0 organism semantics", () => {
  it("parole ignores TANDEM_COMPLETED", () => {
    const log: ActivityEvent[] = [
      {
        id: "t1",
        type: "TANDEM_COMPLETED",
        createdAt: new Date().toISOString(),
        sourceId: "t1",
      },
    ];
    const m = computeMinerals(log);
    assert.equal(m.parole, 0);
    assert.ok(m.social > 0);
  });

  it("courage days only count SPEAK_COMPLETED", () => {
    const day = "2026-03-15T12:00:00.000Z";
    const log: ActivityEvent[] = [
      { id: "1", type: "MISSION_COMPLETED", createdAt: day, sourceId: "m" },
      { id: "2", type: "TANDEM_COMPLETED", createdAt: day, sourceId: "t" },
      { id: "3", type: "SPEAK_COMPLETED", createdAt: day, sourceId: "s" },
    ];
    const days = courageDaysFromLog(log);
    assert.deepEqual(days, ["2026-03-15"]);
  });
});
