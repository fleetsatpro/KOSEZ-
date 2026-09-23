import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  B1_TODAY_MISSION,
  missionForLevel,
  TODAY_MISSION,
  UPCOMING_MISSIONS,
} from "./data.ts";
import {
  EXTRA_MISSIONS,
  missionBankStats,
  selectMissionForLevel,
} from "./mission-bank.ts";

const MISSION_BANK = [
  TODAY_MISSION,
  B1_TODAY_MISSION,
  ...UPCOMING_MISSIONS,
  ...EXTRA_MISSIONS,
];

describe("mission bank", () => {
  it("has at least 20 missions", () => {
    assert.ok(MISSION_BANK.length >= 20, `got ${MISSION_BANK.length}`);
  });

  it("missionForLevel stays stable for tests", () => {
    assert.equal(missionForLevel("A2").id, "mission-today");
    assert.equal(missionForLevel("B1").id, "mission-today-b1");
  });

  it("selectMissionForLevel rotates deterministically by day", () => {
    const fallback = missionForLevel("A2");
    const a = selectMissionForLevel("A2", MISSION_BANK, fallback, {
      rotate: true,
      dayKey: "2026-09-23",
    });
    const b = selectMissionForLevel("A2", MISSION_BANK, fallback, {
      rotate: true,
      dayKey: "2026-09-23",
    });
    assert.equal(a.id, b.id);
    assert.ok(MISSION_BANK.some((m) => m.id === a.id));
  });

  it("stats report by level", () => {
    const s = missionBankStats(MISSION_BANK);
    assert.equal(s.total, MISSION_BANK.length);
    assert.ok((s.byLevel["A2"] ?? 0) >= 1);
  });
});
