import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

const ACTIVITY_EVENT_TYPES = [
  "MISSION_COMPLETED",
  "SPEAK_COMPLETED",
  "PRONLAB_COMPLETED",
  "PRONLAB_MASTERY",
  "CLASS_ATTENDED",
  "EVENT_ATTENDED",
  "REAL_WORLD_BONUS",
  "TANDEM_COMPLETED",
  "HOMEWORK_COMPLETED",
  "IMMERSION_ATTENDED",
  "PULSE_COMPLETED",
  "REVIEW_COMPLETED",
  "GRAMMAR_COMPLETED",
  "LISTENING_COMPLETED",
  "WRITING_COMPLETED",
  "DIAGNOSTIC_COMPLETED",
  "LESSON_COMPLETED",
  "CURRICULUM_EVIDENCE_RECORDED",
  "LIBRARY_COMPLETED",
] as const;

const schema = z.object({
  eventType: z.enum(ACTIVITY_EVENT_TYPES),
  sourceId: z.string().trim().max(200).nullable().optional(),
});

describe("activity.append eventType allowlist", () => {
  it("accepts known activity types", () => {
    for (const eventType of ACTIVITY_EVENT_TYPES) {
      const parsed = schema.parse({ eventType, sourceId: "x" });
      assert.equal(parsed.eventType, eventType);
    }
  });

  it("rejects forged / unknown event types", () => {
    assert.throws(() => schema.parse({ eventType: "ADMIN_GRANTED", sourceId: "x" }));
    assert.throws(() => schema.parse({ eventType: "PRONLAB_MASTERY_FAKE", sourceId: "x" }));
    assert.throws(() => schema.parse({ eventType: "", sourceId: "x" }));
    assert.throws(() => schema.parse({ eventType: "mission_completed", sourceId: "x" }));
  });
});
