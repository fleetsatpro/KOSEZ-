import assert from "node:assert/strict";
import test from "node:test";
import { conversationIdForRelationship } from "./communication.ts";

test("conversation identity is symmetric and type-separated", () => {
  const teacherAB = conversationIdForRelationship("teacher", "a", "b");
  const teacherBA = conversationIdForRelationship("teacher", "b", "a");
  const tandemAB = conversationIdForRelationship("tandem", "a", "b");
  assert.equal(teacherAB, teacherBA);
  assert.notEqual(teacherAB, tandemAB);
  assert.match(teacherAB, /^[0-9a-f-]{36}$/);
});
