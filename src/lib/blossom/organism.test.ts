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
} from "./organism.ts";

describe("organism minerals", () => {
  it("returns zeros for empty log", () => {
    const m = computeMinerals([]);
    assert.equal(m.mission, 0);
    assert.equal(m.parole, 0);
    assert.equal(m.atelier, 0);
  });

  it("keeps tandem in social rather than silently adding to parole", () => {
    const now = new Date().toISOString();
    const m = computeMinerals([
      { id: "t", type: "TANDEM_COMPLETED", createdAt: now, sourceId: "t1" },
    ]);
    assert.equal(m.parole, 0);
    assert.ok(m.social > 0);
  });

  it("counts only the declared atelier doors", () => {
    const now = new Date().toISOString();
    const m = computeMinerals([
      { id: "d", type: "DIAGNOSTIC_COMPLETED", createdAt: now },
      { id: "l", type: "LESSON_COMPLETED", createdAt: now },
    ]);
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
    assert.equal(
      growthEventForActivity(
        "CURRICULUM_EVIDENCE_RECORDED",
        "u1-l1",
        "2026-09-22T00:00:00.000Z",
      ),
      null,
    );
  });

  it("makes ties explicit instead of hiding the second need", () => {
    const next = causalNextGesture({
      at: "",
      mission: 20,
      parole: 20,
      pron: 20,
      social: 50,
      atelier: 80,
    });
    assert.deepEqual(next.tiedWith, ["mission", "parole", "pron"]);
    assert.equal(next.value, 20);
    assert.match(next.line, /Également à 20\/100/);
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
