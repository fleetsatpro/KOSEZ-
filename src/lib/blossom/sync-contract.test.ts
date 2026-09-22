import assert from "node:assert/strict";
import test from "node:test";
import { SYNC_OPERATIONS, type SyncOperation } from "./sync-types.ts";

test("sync operation contract includes tandem reports", () => {
  const expected: SyncOperation[] = [
    "profile.upsert",
    "activity.append",
    "mission.save",
    "pronlab.attempt",
    "vocabulary.upsert",
    "event.register",
    "challenge.complete",
    "tandem.status",
    "tandem.report",
    "learning.submission",
    "booking.request",
    "waitlist.request",
    "analytics.record",
    "teacher.note",
    "teacher.homework",
    "homework.complete",
  ];

  assert.deepEqual([...SYNC_OPERATIONS], expected);
  assert.ok(SYNC_OPERATIONS.includes("tandem.report"));
});
