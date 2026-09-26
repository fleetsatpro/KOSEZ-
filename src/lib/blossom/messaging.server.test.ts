import assert from "node:assert/strict";
import test from "node:test";
import { deterministicConversationId } from "./messaging.server.ts";

test("conversation identity is symmetric and type-separated", () => {
  const teacherAB = deterministicConversationId("teacher", "a", "b");
  const teacherBA = deterministicConversationId("teacher", "b", "a");
  const tandemAB = deterministicConversationId("tandem", "a", "b");
  assert.equal(teacherAB, teacherBA);
  assert.notEqual(teacherAB, tandemAB);
  assert.match(teacherAB, /^[0-9a-f-]{36}$/);
});
