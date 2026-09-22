import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticLevel, diagnosticScore } from "./learning-labs.ts";

test("placement bands are deterministic and explicitly indicative", () => {
  assert.equal(diagnosticLevel(2), "A1");
  assert.equal(diagnosticLevel(6), "A2");
  assert.equal(diagnosticLevel(8), "A2+");
  assert.equal(diagnosticLevel(10), "B1");
});

test("placement score derives from selected answer labels", () => {
  assert.equal(
    diagnosticScore({
      interaction: "I recommend the chicken. What about you?",
      speaking: "Three short connected sentences.",
      listening: "19:40 and gate 12.",
      writing: "I will come after ten minute because traffic.",
      grammar: "Where is the seminar room?",
    }),
    9,
  );
});
