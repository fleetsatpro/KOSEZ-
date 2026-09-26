import assert from "node:assert/strict";
import test from "node:test";
import { validateTeacherSessionDraft } from "./teacher-session-rules.ts";

const NOW = Date.parse("2026-09-26T15:00:00.000Z");

test("teacher session rules accept a future bounded session", () => {
  const result = validateTeacherSessionDraft(
    {
      title: "Conversation au marché",
      startsAt: "2026-09-27T09:00:00.000Z",
      durationMinutes: 60,
      notes: "Préparer deux questions.",
    },
    NOW,
  );
  assert.equal(result.ok, true);
});

test("teacher session rules reject past starts", () => {
  const result = validateTeacherSessionDraft(
    {
      title: "Trop tard",
      startsAt: "2026-09-26T12:00:00.000Z",
      durationMinutes: 60,
    },
    NOW,
  );
  assert.deepEqual(result, { ok: false, reason: "past-start" });
});

test("teacher session rules reject out-of-bounds duration and notes", () => {
  assert.equal(
    validateTeacherSessionDraft(
      { title: "X", startsAt: "2026-09-27T09:00:00.000Z", durationMinutes: 10 },
      NOW,
    ).ok,
    false,
  );
  assert.equal(
    validateTeacherSessionDraft(
      {
        title: "X",
        startsAt: "2026-09-27T09:00:00.000Z",
        durationMinutes: 60,
        notes: "x".repeat(2001),
      },
      NOW,
    ).ok,
    false,
  );
});

test("teacher session rules normalize title and optional notes", () => {
  const result = validateTeacherSessionDraft(
    {
      title: "  Parler  ",
      startsAt: "2026-09-27T09:00:00.000Z",
      durationMinutes: 45,
      notes: "   ",
    },
    NOW,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.title, "Parler");
    assert.equal(result.notes, null);
  }
});
