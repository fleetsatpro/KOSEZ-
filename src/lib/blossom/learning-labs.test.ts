import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticLevel, isSentenceCorrect, sentenceFromTokens } from "./learning-labs.ts";

test("diagnostic remains an indicative placement band", () => {
  assert.equal(diagnosticLevel(2), "A1");
  assert.equal(diagnosticLevel(6), "A2");
  assert.equal(diagnosticLevel(8), "A2+");
  assert.equal(diagnosticLevel(10), "B1");
});

test("grammar lab accepts only the intended sentence order", () => {
  const expected = ["where", "is", "the", "seminar", "room", "?"];
  assert.equal(isSentenceCorrect(expected, expected), true);
  assert.equal(sentenceFromTokens(expected), "where is the seminar room?");
  assert.equal(isSentenceCorrect(["is", "where", "the", "seminar", "room", "?"], expected), false);
});
