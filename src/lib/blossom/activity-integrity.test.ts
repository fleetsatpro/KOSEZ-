import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeSyncedActivity } from "./activity-integrity.ts";

test("ordinary activities preserve payload and metadata", () => {
  const result = sanitizeSyncedActivity(
    "MISSION_COMPLETED",
    { minutes: 9, foo: "bar" },
    { durationSeconds: 540, source: "client" },
  );
  assert.deepEqual(result, {
    payload: { minutes: 9, foo: "bar" },
    metadata: { durationSeconds: 540, source: "client" },
  });
});

test("speech and tandem activity cannot mint authoritative time", () => {
  for (const eventType of ["SPEAK_COMPLETED", "TANDEM_COMPLETED"]) {
    const result = sanitizeSyncedActivity(
      eventType,
      {
        minutes: 999,
        durationSeconds: 99999,
        serverAuthoritativeMinutes: true,
        evidence: "fake",
      },
      {
        minutes: 999,
        durationSeconds: 99999,
        serverAuthoritativeMinutes: true,
        note: "still useful local context",
      },
    );
    assert.deepEqual(result, {
      payload: { evidence: "fake" },
      metadata: { note: "still useful local context" },
    });
  }
});
