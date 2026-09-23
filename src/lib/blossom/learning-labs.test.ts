import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticLevel, diagnosticScore } from "./learning-labs.ts";
import { GRAMMAR_TASKS, LISTENING_TASKS, WRITING_PROMPTS, evaluateWritingStructure } from "./lab-content.ts";

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


test("B1 labs are populated and distinguishable from A2 content", () => {
  const grammarB1 = GRAMMAR_TASKS.filter((task) => task.level === "B1");
  const grammarA2 = GRAMMAR_TASKS.filter((task) => task.level === "A2");
  const listeningB1 = LISTENING_TASKS.filter((task) => task.level === "B1");
  const writingB1 = WRITING_PROMPTS.filter((prompt) => prompt.level === "B1");

  assert.ok(grammarA2.length >= 5);
  assert.ok(grammarB1.length >= 5);
  assert.ok(listeningB1.length >= 5);
  assert.ok(writingB1.length >= 3);
  assert.notEqual(grammarB1[0]?.id, grammarA2[0]?.id);
  assert.notEqual(writingB1[0]?.id, WRITING_PROMPTS.find((prompt) => prompt.level === "A2")?.id);
});


test("writing structure checks are deterministic", () => {
  const prompt = WRITING_PROMPTS.find((item) => item.id === "write-b1-1")!;
  const strong = evaluateWritingStructure(
    prompt,
    "I'd recommend the coastal walk because it is more flexible for a short afternoon. The market is livelier, but it takes longer to reach, so the walk seems more practical today. However, the market could be better if we wanted a longer visit. I'd choose the walk.",
  );
  assert.equal(strong.method, "deterministic-structure-v1");
  assert.equal(strong.total, prompt.checks.length);
  assert.ok(strong.passed.length >= 3);

  const weak = evaluateWritingStructure(prompt, "I choose the walk.");
  assert.ok(weak.failed.length > 0);
  assert.ok(weak.score < strong.score);
});
