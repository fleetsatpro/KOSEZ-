import assert from "node:assert/strict";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ActivityEvent } from "./engine.ts";
import {
  computeMinerals,
  courageDaysFromLog,
  courageRibbon,
  growthEventForActivity,
  organismStatusLine,
  causalNextGesture,
  pushGrowthEvent,
  weekKey,
  MINERAL_DOORS,
  MINERAL_ORDER,
  MINERAL_WINDOW_DAYS,
} from "./organism.ts";

describe("organism minerals", () => {
  it("returns zeros for empty log", () => {
    const m = computeMinerals([]);
    assert.equal(m.mission, 0);
    assert.equal(m.parole, 0);
    assert.equal(m.atelier, 0);
  });

  it("increases mission mineral after mission events", () => {
    const log: ActivityEvent[] = [
      {
        id: "1",
        type: "MISSION_COMPLETED",
        createdAt: new Date().toISOString(),
        sourceId: "m1",
      },
      {
        id: "2",
        type: "MISSION_COMPLETED",
        createdAt: new Date().toISOString(),
        sourceId: "m2",
      },
    ];
    const m = computeMinerals(log);
    assert.ok(m.mission > 0);
  });
});

describe("growth events", () => {
  it("maps mission to root", () => {
    const g = growthEventForActivity(
      "MISSION_COMPLETED",
      "m1",
      "2026-01-01T00:00:00.000Z",
    );
    assert.equal(g?.kind, "root");
  });

  it("maps library completion to flower", () => {
    const g = growthEventForActivity(
      "LIBRARY_COMPLETED",
      "lib-1",
      "2026-01-01T00:00:00.000Z",
    );
    assert.equal(g?.kind, "flower");
    assert.ok((g?.intensity ?? 0) > 0.5);
  });


  it("maps learning evidence to atelier mineral", () => {
    const grammar = growthEventForActivity(
      "GRAMMAR_COMPLETED",
      "grammar-session",
      "2026-09-22T00:00:00.000Z",
    );
    const tandem = growthEventForActivity(
      "TANDEM_COMPLETED",
      "tandem-session",
      "2026-09-22T00:00:00.000Z",
    );
    assert.equal(grammar?.mineral, "atelier");
    assert.equal(tandem?.mineral, "social");
    assert.equal(tandem?.kind, "flower");
    const curriculum = growthEventForActivity(
      "CURRICULUM_EVIDENCE_RECORDED",
      "u1-l1",
      "2026-09-22T00:00:00.000Z",
    );
    assert.equal(curriculum?.mineral, "atelier");
    assert.equal(curriculum?.kind, "mineral");
  });

  it("keeps tandem exclusively on the social mineral", () => {
    const m = computeMinerals([{
      id: "t1",
      type: "TANDEM_COMPLETED",
      createdAt: new Date().toISOString(),
      sourceId: "tandem-1",
    }]);
    assert.equal(m.social > 0, true);
    assert.equal(m.parole, 0);
  });
  it("counts curriculum evidence as atelier nourishment", () => {
    const m = computeMinerals([{
      id: "e1",
      type: "CURRICULUM_EVIDENCE_RECORDED",
      createdAt: new Date().toISOString(),
      sourceId: "u1-l1",
    }]);
    assert.ok(m.atelier > 0);
  });

  it("uses a single shared door contract for all five minerals", () => {
    assert.deepEqual(MINERAL_ORDER, ["mission", "parole", "social", "atelier", "pron"]);
    for (const key of MINERAL_ORDER) {
      assert.equal(MINERAL_DOORS[key].key, key);
      assert.ok(MINERAL_DOORS[key].door);
      assert.ok(MINERAL_DOORS[key].action);
      assert.ok(MINERAL_DOORS[key].proof);
    }
  });

  it("makes tie-breaking visible instead of hiding it", () => {
    const next = causalNextGesture({ at: "", mission: 5, parole: 5, pron: 40, social: 40, atelier: 40 });
    assert.equal(next.value, 5);
    assert.deepEqual(next.tied, ["mission", "parole"]);
    assert.equal(next.alternate?.mineral, "parole");
    assert.match(next.line, /égalité/i);
  });

  it("uses a concrete first door for a brand-new organism", () => {
    const next = causalNextGesture({ at: "", mission: 0, parole: 0, pron: 0, social: 0, atelier: 0 });
    assert.equal(next.mineral, "mission");
    assert.equal(next.door, "/mission");
  });

  it("keeps the mineral window explicit", () => {
    assert.equal(MINERAL_WINDOW_DAYS, 14);
  });
  it("routes the weakest atelier mineral to Learn labs", () => {
    const next = causalNextGesture({
      at: "",
      mission: 80,
      parole: 80,
      pron: 80,
      social: 80,
      atelier: 5,
    });
    assert.equal(next.mineral, "atelier");
    assert.equal(next.door, "/learn/labs");
  });

  it("caps event list", () => {
    const events = Array.from({ length: 35 }, (_, i) => ({
      id: `e${i}`,
      at: "2026-01-01T00:00:00.000Z",
      kind: "mineral" as const,
      intensity: 0.2,
      label: "x",
    }));
    const next = pushGrowthEvent(events, {
      id: "new",
      at: "2026-01-02T00:00:00.000Z",
      kind: "root",
      intensity: 1,
      label: "n",
    });
    assert.equal(next.length, 30);
    assert.equal(next[0]?.id, "new");
  });
});

describe("courage ribbon", () => {
  it("marks spoken days", () => {
    const today = new Date().toISOString().slice(0, 10);
    const days = courageDaysFromLog([
      {
        id: "1",
        type: "SPEAK_COMPLETED",
        createdAt: `${today}T12:00:00.000Z`,
      },
    ]);
    const ribbon = courageRibbon(days);
    assert.equal(ribbon.length, 28);
    assert.equal(ribbon[27], true);
  });
});

describe("status line", () => {
  it("flags low pron", () => {
    const line = organismStatusLine({
      at: "",
      mission: 80,
      parole: 80,
      pron: 10,
      social: 50,
      atelier: 80,
    });
    assert.match(line, /son/i);
  });
});

describe("weekKey", () => {
  it("returns ISO-like week", () => {
    assert.match(weekKey(new Date("2026-09-22")), /^2026-W\d{2}$/);
  });
});
