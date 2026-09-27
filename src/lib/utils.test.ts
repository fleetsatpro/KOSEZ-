import assert from "node:assert/strict";
import test from "node:test";
import { kosezEventDayFromToday, parseKosezEventDate } from "./utils.ts";

test("K’Osez event parser uses the Saint-Pierre UTC+04:00 clock", () => {
  assert.equal(
    parseKosezEventDate("2026-09-28", "00:30").toISOString(),
    "2026-09-27T20:30:00.000Z",
  );
});

test("K’Osez event day follows Réunion local midnight", () => {
  const justBeforeMidnight = new Date("2026-09-27T19:59:59.000Z");
  const justAfterMidnight = new Date("2026-09-27T20:00:01.000Z");
  assert.equal(kosezEventDayFromToday(0, justBeforeMidnight), "2026-09-27");
  assert.equal(kosezEventDayFromToday(0, justAfterMidnight), "2026-09-28");
  assert.equal(kosezEventDayFromToday(2, justAfterMidnight), "2026-09-30");
});
