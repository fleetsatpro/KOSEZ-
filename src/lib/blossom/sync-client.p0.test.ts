import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMutation } from "./sync-client.ts";

describe("P0 sync causal clock", () => {
  it("orders immediate mutations strictly even within one millisecond", () => {
    const first = createMutation({
      operation: "activity.append",
      entityId: "support",
      payload: { eventType: "LIBRARY_COMPLETED", sourceId: "lib-market" },
    });
    const second = createMutation({
      operation: "activity.append",
      entityId: "lesson",
      payload: {
        eventType: "CURRICULUM_EVIDENCE_RECORDED",
        sourceId: "lesson-library",
      },
    });

    assert.ok(
      second.createdAt > first.createdAt,
      "dependent mutation must sort after its source mutation",
    );
  });
});
