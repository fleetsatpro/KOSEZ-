import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  focusMissionForLevel,
  missionBankStats,
  missionForLevel,
  MISSION_BANK,
} from "./data.ts";

describe("mission bank", () => {
  it("has at least 20 missions", () => {
    assert.ok(MISSION_BANK.length >= 20, `got ${MISSION_BANK.length}`);
  });

  it("missionForLevel stays stable for tests", () => {
    assert.equal(missionForLevel("A2").id, "mission-today");
    assert.equal(missionForLevel("B1").id, "mission-today-b1");
  });

  it("focusMissionForLevel rotates deterministically by day", () => {
    const a = focusMissionForLevel("A2", { rotate: true, dayKey: "2026-09-23" });
    const b = focusMissionForLevel("A2", { rotate: true, dayKey: "2026-09-23" });
    const c = focusMissionForLevel("A2", { rotate: true, dayKey: "2026-09-24" });
    assert.equal(a.id, b.id);
    assert.ok(MISSION_BANK.some((m) => m.id === a.id));
    assert.ok(MISSION_BANK.some((m) => m.id === c.id));
  });

  it("stats report by level", () => {
    const s = missionBankStats();
    assert.equal(s.total, MISSION_BANK.length);
    assert.ok((s.byLevel["A2"] ?? 0) >= 1);
  });
});
