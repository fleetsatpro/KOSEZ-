import assert from "node:assert/strict";
import { test } from "node:test";
import { causalTimestampIsAtLeast, normalizeMutationTime } from "./sync-causality.ts";

test("preserves a valid past mutation timestamp", () => {
  const value = normalizeMutationTime(
    "2026-09-20T12:00:00.000Z",
    Date.parse("2026-09-22T12:00:00.000Z"),
  );
  assert.equal(value, "2026-09-20T12:00:00.000Z");
});

test("clamps future mutation timestamps to a small skew window", () => {
  const value = normalizeMutationTime(
    "2026-09-23T12:00:00.000Z",
    Date.parse("2026-09-22T12:00:00.000Z"),
  );
  assert.equal(value, "2026-09-22T12:05:00.000Z");
});

test("invalid timestamps are rejected from causal ordering", () => {
  assert.equal(normalizeMutationTime("not-a-date", Date.now()), null);
});

test("causal comparison is monotonic", () => {
  assert.equal(
    causalTimestampIsAtLeast("2026-09-22T12:01:00.000Z", "2026-09-22T12:00:00.000Z"),
    true,
  );
  assert.equal(
    causalTimestampIsAtLeast("2026-09-22T11:59:00.000Z", "2026-09-22T12:00:00.000Z"),
    false,
  );
});
