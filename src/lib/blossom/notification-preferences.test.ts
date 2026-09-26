import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_KINDS,
  normalizeNotificationPreferences,
} from "./notification-preferences.ts";

test("all optional in-app notification categories default to enabled", () => {
  assert.deepEqual(
    normalizeNotificationPreferences([]),
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  assert.equal(NOTIFICATION_PREFERENCE_KINDS.length, 6);
});

test("stored values only override known optional categories", () => {
  const result = normalizeNotificationPreferences([
    { kind: "learning", enabled: false },
    { kind: "system", enabled: false },
    { kind: "bogus", enabled: false },
  ]);
  assert.equal(result.learning, false);
  assert.equal(result.communication, true);
});

test("system is intentionally outside the preference contract", () => {
  assert.equal(
    NOTIFICATION_PREFERENCE_KINDS.includes("system" as never),
    false,
  );
});