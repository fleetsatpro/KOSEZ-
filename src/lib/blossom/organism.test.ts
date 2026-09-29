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
  MINERAL_DEFINITIONS,
  MINERAL_ORDER,
  mineralForActivity,
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

it("causal gesture resolves supported child door before filtering", () => {
  const gesture = causalNextGesture(
    { at: new Date().toISOString(), pron: 20, parole: 0, mission: 30, social: 40, atelier: 50 },
    new Set(["/osez/pulse"]),
  );
  assert.equal(gesture.mineral, "parole");
  assert.equal(gesture.door, "/osez/pulse");
});


it("pending activity does not nourish organism minerals", () => {
  const pending: ActivityEvent = {
    id: "pending-mineral",
    type: "MISSION_COMPLETED",
    createdAt: new Date().toISOString(),
    sourceId: "pending",
    metadata: { syncState: "pending" },
  };
  const confirmed: ActivityEvent = {
    ...pending,
    id: "confirmed-mineral",
    metadata: undefined,
  };
  assert.equal(computeMinerals([pending]).mission, 0);
  assert.ok(computeMinerals([confirmed]).mission > 0);
});


describe("canonical mineral contract", () => {
  it("maps every nourishing activity type to exactly one mineral", () => {
    const seen = new Map<string, string>();
    for (const key of MINERAL_ORDER) {
      for (const type of MINERAL_DEFINITIONS[key].writtenBy) {
        assert.equal(seen.has(type), false, type + " is assigned to more than one mineral");
        seen.set(type, key);
      }
    }
    assert.equal(mineralForActivity("PULSE_COMPLETED"), "parole");
    assert.equal(mineralForActivity("DIAGNOSTIC_COMPLETED"), null);
    assert.equal(mineralForActivity("LESSON_COMPLETED"), null);
  });

  it("keeps the causal next-door basis explicit and tie-aware", () => {
    const next = causalNextGesture({
      at: "",
      mission: 10,
      parole: 10,
      pron: 40,
      social: 60,
      atelier: 80,
    });
    assert.equal(next.mineral, "mission");
    assert.deepEqual(next.tiedWith, ["mission", "parole"]);
    assert.match(next.basis, /10\/100/);
    assert.match(next.basis, /14 jours/);
    assert.equal(next.value, 10);
  });

  it("treats Pulse as parole rather than an unassigned generic trace", () => {
    const pulse = growthEventForActivity(
      "PULSE_COMPLETED",
      "pulse-session-test",
      "2026-09-29T00:00:00.000Z",
    );
    assert.equal(pulse?.mineral, "parole");
    assert.equal(pulse?.kind, "stem");
  });

  it("does not count diagnostic placement as atelier nourishment", () => {
    const diagnostic = computeMinerals([
      {
        id: "diag",
        type: "DIAGNOSTIC_COMPLETED",
        createdAt: new Date().toISOString(),
        sourceId: "diagnostic",
      },
    ]);
    assert.equal(diagnostic.atelier, 0);
  });
});
