import test from "node:test";
import assert from "node:assert/strict";
import { conversationKey, messageKindLabel, messagePreview } from "./communication";

test("conversation keys are symmetric for a relationship", () => {
  assert.equal(conversationKey("tandem", "b", "a"), conversationKey("tandem", "a", "b"));
  assert.notEqual(conversationKey("teacher", "a", "b"), conversationKey("tandem", "a", "b"));
});

test("message labels remain domain-specific", () => {
  assert.equal(messageKindLabel("teacher"), "Enseignant");
  assert.equal(messageKindLabel("guardian"), "Parent / tuteur");
  assert.equal(messageKindLabel("tandem"), "Tandem");
});

test("message previews collapse whitespace and cap length", () => {
  assert.equal(messagePreview("  bon   jour  "), "bon jour");
  assert.equal(messagePreview("abcdefghij", 5), "abcd…");
});