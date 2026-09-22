import assert from "node:assert/strict";
import test from "node:test";
import { syncMutationSchema } from "./sync.api.ts";

test("sync API accepts every server-supported operation", () => {
  const mutation = {
    mutationId: "00000000-0000-4000-8000-000000000001",
    deviceId: "device-0123456789",
    operation: "tandem.report",
    entityId: "partner-1",
    payload: {
      reason: "learner_report",
    },
    createdAt: "2026-09-23T00:00:00.000Z",
  };

  const result = syncMutationSchema.safeParse(mutation);
  assert.equal(result.success, true);
});
