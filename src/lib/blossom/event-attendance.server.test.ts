import assert from "node:assert/strict";
import { test } from "node:test";
import { eventStartEpoch } from "./event-attendance.ts";

test("event start parsing uses Réunion's UTC+4 offset", () => {
  assert.equal(
    new Date(eventStartEpoch({ date: "2026-09-27", time: "10:30" })).toISOString(),
    "2026-09-27T06:30:00.000Z",
  );
});

test("invalid event start is rejected", () => {
  assert.throws(
    () => eventStartEpoch({ date: "not-a-date", time: "10:30" }),
    /invalid-event-start/,
  );
});
