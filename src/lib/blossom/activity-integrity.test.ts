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

describe("speak session source contract", () => {
  const speakSessionSource =
    /^speak-session-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it("accepts server speak-session UUID sources", () => {
    assert.equal(
      speakSessionSource.test("speak-session-550e8400-e29b-41d4-a716-446655440000"),
      true,
    );
  });

  it("rejects client-forged speak-room sources", () => {
    assert.equal(speakSessionSource.test("speak-cafe-hist"), false);
    assert.equal(speakSessionSource.test("speak-room-1"), false);
    assert.equal(speakSessionSource.test("speak-session-not-a-uuid"), false);
  });
});
